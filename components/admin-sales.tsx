"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  Check,
  CircleDollarSign,
  Download,
  FileText,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type {
  PendingSaleDocument,
  SaleDocumentType,
  Vehicle,
  VehicleSale,
  VehicleSaleDocument,
  VehicleSaleForm,
} from "@/lib/types";

const MAX_DOCUMENT_SIZE = 15 * 1024 * 1024;

const documentTypeLabel: Record<SaleDocumentType, string> = {
  nota_venta: "Nota de venta",
  autofact: "Informe Autofact",
  contrato_compraventa: "Contrato de compraventa",
  otro: "Otro documento",
};

const chileDate = (value = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Santiago",
  }).format(value);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);

const formatSaleDate = (value: string) =>
  new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Santiago",
  }).format(new Date(value));

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const stockDaysAtSale = (vehicle: Vehicle | undefined, sale: VehicleSale) => {
  if (!vehicle?.inventory_entry_date) return null;
  const entryDate = Date.parse(`${vehicle.inventory_entry_date.slice(0, 10)}T00:00:00Z`);
  const soldDate = Date.parse(`${chileDate(new Date(sale.sold_at))}T00:00:00Z`);
  return Math.max(0, Math.floor((soldDate - entryDate) / 86400000));
};

const createForm = (vehicleId: string, vehicles: Vehicle[], sales: VehicleSale[]): VehicleSaleForm => {
  const existingSale = sales.find((sale) => sale.vehicle_id === vehicleId);
  const vehicle = vehicles.find((item) => item.id === vehicleId);
  return {
    vehicle_id: vehicleId,
    sold_at: existingSale ? chileDate(new Date(existingSale.sold_at)) : chileDate(),
    final_sale_price_clp: String(existingSale?.final_sale_price_clp ?? vehicle?.sale_price_clp ?? ""),
    buyer_name: existingSale?.buyer_name ?? "",
    buyer_phone: existingSale?.buyer_phone ?? "",
    notes: existingSale?.notes ?? "",
  };
};

type AdminSalesProps = {
  vehicles: Vehicle[];
  sales: VehicleSale[];
  documents: VehicleSaleDocument[];
  initialVehicleId?: string | null;
  onCloseRequested: () => void;
  onSave: (form: VehicleSaleForm, documents: PendingSaleDocument[]) => Promise<boolean>;
  onOpenDocument: (document: VehicleSaleDocument) => Promise<void>;
  onDeleteDocument: (document: VehicleSaleDocument) => Promise<void>;
};

export default function AdminSales({
  vehicles,
  sales,
  documents,
  initialVehicleId,
  onCloseRequested,
  onSave,
  onOpenDocument,
  onDeleteDocument,
}: AdminSalesProps) {
  const availableVehicles = useMemo(
    () => vehicles.filter((vehicle) => vehicle.status !== "archivado" && !sales.some((sale) => sale.vehicle_id === vehicle.id)),
    [sales, vehicles],
  );
  const firstVehicleId = initialVehicleId ?? availableVehicles[0]?.id ?? "";
  const [form, setForm] = useState<VehicleSaleForm>(() => createForm(firstVehicleId, vehicles, sales));
  const [showForm, setShowForm] = useState(Boolean(initialVehicleId));
  const [saving, setSaving] = useState(false);
  const [documentType, setDocumentType] = useState<SaleDocumentType>("nota_venta");
  const [pendingDocuments, setPendingDocuments] = useState<PendingSaleDocument[]>([]);
  const [documentError, setDocumentError] = useState("");

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === form.vehicle_id);
  const editingSale = sales.some((sale) => sale.vehicle_id === form.vehicle_id);
  const existingDocuments = documents.filter((document) => document.vehicle_id === form.vehicle_id);
  const finalPrice = Number(form.final_sale_price_clp || 0);
  const commissionAmount = selectedVehicle?.acquisition_type === "consignacion"
    ? Math.round((finalPrice * (selectedVehicle.commission_pct ?? 0)) / 100)
    : 0;
  const estimatedProfit = selectedVehicle?.acquisition_type === "consignacion"
    ? commissionAmount - (selectedVehicle.cost_total_clp ?? 0)
    : finalPrice - (selectedVehicle?.cost_total_clp ?? 0);
  const clientProceeds = selectedVehicle?.acquisition_type === "consignacion" ? finalPrice - commissionAmount : null;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.final_sale_price_clp, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.dealer_profit_clp, 0);

  function resetDocuments() {
    setPendingDocuments([]);
    setDocumentType("nota_venta");
    setDocumentError("");
  }

  function openForm(vehicleId?: string) {
    const nextVehicleId = vehicleId ?? availableVehicles[0]?.id ?? "";
    setForm(createForm(nextVehicleId, vehicles, sales));
    resetDocuments();
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    resetDocuments();
    onCloseRequested();
  }

  function handleVehicleChange(vehicleId: string) {
    setForm(createForm(vehicleId, vehicles, sales));
    resetDocuments();
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    const validExtensions = /\.(pdf|jpe?g|png|webp|docx?)$/i;
    const invalidFile = selectedFiles.find(
      (file) => file.size === 0 || file.size > MAX_DOCUMENT_SIZE || !validExtensions.test(file.name),
    );

    if (invalidFile) {
      setDocumentError(`${invalidFile.name}: usa PDF, imagen o Word de hasta 15 MB.`);
      event.target.value = "";
      return;
    }

    setPendingDocuments((current) => [
      ...current,
      ...selectedFiles.map((file) => ({
        id: crypto.randomUUID(),
        document_type: documentType,
        file,
      })),
    ]);
    setDocumentError("");
    event.target.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const saved = await onSave(form, pendingDocuments);
    setSaving(false);
    if (saved) closeForm();
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#176bff]">Cierres comerciales</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">Ventas realizadas</h2>
          <p className="mt-2 text-sm leading-6 text-[#6c7c8d]">Precio final, resultado real, documentos y tiempo en stock.</p>
        </div>
        <button disabled={!availableVehicles.length} onClick={() => openForm()} className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#176bff] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0d52d6] disabled:cursor-not-allowed disabled:opacity-50">
          <Plus size={17} aria-hidden="true" /> Registrar venta
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[12px] border border-[#d9e4ef] bg-white p-5"><div className="flex items-center justify-between text-sm text-[#6c7c8d]"><span>Vehículos vendidos</span><ReceiptText size={18} className="text-[#176bff]" /></div><p className="mt-4 text-2xl font-semibold text-[#071a33]">{sales.length}</p></div>
        <div className="rounded-[12px] border border-[#d9e4ef] bg-white p-5"><div className="flex items-center justify-between text-sm text-[#6c7c8d]"><span>Total vendido</span><CircleDollarSign size={18} className="text-[#0b8a9e]" /></div><p className="mt-4 text-2xl font-semibold text-[#071a33]">{formatCurrency(totalRevenue)}</p></div>
        <div className="rounded-[12px] border border-[#d9e4ef] bg-white p-5"><div className="flex items-center justify-between text-sm text-[#6c7c8d]"><span>Ganancia real</span><BadgeDollarSign size={18} className="text-[#0b8a9e]" /></div><p className={`mt-4 text-2xl font-semibold ${totalProfit < 0 ? "text-[#c33c3c]" : "text-[#071a33]"}`}>{formatCurrency(totalProfit)}</p></div>
      </div>

      <div className="mt-6 space-y-3">
        {sales.length ? sales.map((sale) => {
          const vehicle = vehicles.find((item) => item.id === sale.vehicle_id);
          const stockDays = stockDaysAtSale(vehicle, sale);
          const documentCount = documents.filter((document) => document.vehicle_id === sale.vehicle_id).length;
          return (
            <article key={sale.vehicle_id} className="grid gap-4 rounded-[14px] border border-[#d9e4ef] bg-white p-5 md:grid-cols-[1.3fr_0.8fr_0.8fr_auto] md:items-center">
              <div>
                <p className="font-semibold text-[#16334f]">{vehicle ? `${vehicle.brand} ${vehicle.model}` : "Vehículo"}</p>
                <p className="mt-1 text-sm text-[#6c7c8d]">{vehicle?.stock_code ?? "Sin patente"} · Vendido {formatSaleDate(sale.sold_at)}</p>
                <p className="mt-1 text-xs text-[#8a9baa]">{stockDays === null ? "Fecha de ingreso no disponible" : `${stockDays} días en stock`}{sale.buyer_name ? ` · ${sale.buyer_name}` : ""} · {documentCount} {documentCount === 1 ? "documento" : "documentos"}</p>
              </div>
              <div><p className="text-xs text-[#8a9baa]">Precio final</p><p className="mt-1 font-semibold text-[#071a33]">{formatCurrency(sale.final_sale_price_clp)}</p></div>
              <div><p className="text-xs text-[#8a9baa]">Ganancia real</p><p className={`mt-1 font-semibold ${sale.dealer_profit_clp < 0 ? "text-[#c33c3c]" : "text-[#0b746c]"}`}>{formatCurrency(sale.dealer_profit_clp)}</p></div>
              <button onClick={() => openForm(sale.vehicle_id)} className="inline-flex h-10 items-center justify-center gap-2 rounded-[9px] border border-[#b8c9da] px-3 text-sm font-semibold text-[#51687d]"><Pencil size={15} aria-hidden="true" /> Editar</button>
            </article>
          );
        }) : <div className="rounded-[14px] border border-dashed border-[#c6d5e4] bg-white p-12 text-center"><ReceiptText size={28} className="mx-auto text-[#b8c9da]" /><p className="mt-3 text-sm font-semibold text-[#51687d]">Todavía no hay ventas registradas.</p></div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-[#071a33]/45 p-0 backdrop-blur-sm sm:items-center sm:p-5">
          <div className="max-h-[92vh] w-full max-w-[680px] overflow-y-auto rounded-t-[22px] bg-[#f7f9fc] p-6 shadow-[0_24px_100px_rgba(0,0,0,0.28)] sm:rounded-[22px] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#176bff]">Ventas</p><h2 className="mt-2 text-2xl font-semibold">{editingSale ? "Editar venta" : "Registrar venta"}</h2></div>
              <button onClick={closeForm} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d9e4ef] bg-white text-[#5c7082]" aria-label="Cerrar formulario"><X size={17} /></button>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <label className="block text-sm font-medium">Vehículo
                <select required disabled={editingSale} value={form.vehicle_id} onChange={(event) => handleVehicleChange(event.target.value)} className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff] disabled:bg-[#edf2f7]">
                  <option value="">Selecciona un vehículo</option>
                  {(editingSale ? vehicles.filter((vehicle) => vehicle.id === form.vehicle_id) : availableVehicles).map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.stock_code} · {vehicle.brand} {vehicle.model}</option>)}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">Fecha de venta<input required type="date" max={chileDate()} value={form.sold_at} onChange={(event) => setForm({ ...form, sold_at: event.target.value })} className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label>
                <label className="block text-sm font-medium">Precio final de venta<input required type="number" min="1" value={form.final_sale_price_clp} onChange={(event) => setForm({ ...form, final_sale_price_clp: event.target.value })} className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label>
                <label className="block text-sm font-medium">Nombre del comprador<input value={form.buyer_name} onChange={(event) => setForm({ ...form, buyer_name: event.target.value })} placeholder="Opcional" className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label>
                <label className="block text-sm font-medium">Teléfono del comprador<input value={form.buyer_phone} onChange={(event) => setForm({ ...form, buyer_phone: event.target.value })} placeholder="Opcional" className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label>
              </div>

              {selectedVehicle && <div className="grid gap-3 rounded-[10px] border border-[#b9d0e8] bg-[#eaf4ff] p-4 text-sm sm:grid-cols-3"><div><p className="text-[#5c7082]">Costos internos</p><p className="mt-1 font-semibold">{formatCurrency(selectedVehicle.cost_total_clp ?? 0)}</p></div><div><p className="text-[#5c7082]">Ganancia real</p><p className={`mt-1 font-semibold ${estimatedProfit < 0 ? "text-[#c33c3c]" : "text-[#0b746c]"}`}>{formatCurrency(estimatedProfit)}</p></div><div><p className="text-[#5c7082]">{clientProceeds === null ? "Modalidad" : "Cliente recibe"}</p><p className="mt-1 font-semibold">{clientProceeds === null ? "Compra directa" : formatCurrency(clientProceeds)}</p></div></div>}

              <label className="block text-sm font-medium">Notas de la venta<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Forma de pago, entrega u otros antecedentes" className="mt-2 min-h-[86px] w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#176bff]" /></label>

              <section className="border-t border-[#d9e4ef] pt-5">
                <div className="flex items-center gap-2"><FileText size={18} className="text-[#176bff]" aria-hidden="true" /><h3 className="text-sm font-semibold text-[#16334f]">Documentos de la venta</h3></div>
                <p className="mt-1 text-xs text-[#788a9b]">PDF, imagen o Word · máximo 15 MB por archivo.</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <select value={documentType} onChange={(event) => setDocumentType(event.target.value as SaleDocumentType)} className="h-11 rounded-[9px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" aria-label="Tipo de documento">
                    {Object.entries(documentTypeLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[9px] bg-[#16334f] px-4 text-sm font-semibold text-white transition hover:bg-[#0c253d]">
                    <Upload size={16} aria-hidden="true" /> Adjuntar
                    <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,application/pdf,image/*" onChange={handleFiles} className="sr-only" />
                  </label>
                </div>

                {documentError && <p className="mt-2 text-xs font-medium text-[#c33c3c]">{documentError}</p>}

                {(existingDocuments.length > 0 || pendingDocuments.length > 0) && (
                  <div className="mt-4 space-y-2">
                    {existingDocuments.map((document) => (
                      <div key={document.id} className="flex min-w-0 items-center gap-3 rounded-[9px] border border-[#d9e4ef] bg-white p-3">
                        <FileText size={18} className="shrink-0 text-[#176bff]" aria-hidden="true" />
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-[#16334f]">{document.file_name}</p><p className="text-xs text-[#8a9baa]">{documentTypeLabel[document.document_type]} · {formatFileSize(document.file_size_bytes)}</p></div>
                        <button type="button" onClick={() => void onOpenDocument(document)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[#c8d6e4] text-[#51687d]" aria-label={`Abrir ${document.file_name}`} title="Abrir documento"><Download size={15} /></button>
                        <button type="button" onClick={() => void onDeleteDocument(document)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[#efc6c6] text-[#b73a3a]" aria-label={`Eliminar ${document.file_name}`} title="Eliminar documento"><Trash2 size={15} /></button>
                      </div>
                    ))}
                    {pendingDocuments.map((document) => (
                      <div key={document.id} className="flex min-w-0 items-center gap-3 rounded-[9px] border border-[#b9d0e8] bg-[#eaf4ff] p-3">
                        <FileText size={18} className="shrink-0 text-[#176bff]" aria-hidden="true" />
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-[#16334f]">{document.file.name}</p><p className="text-xs text-[#68819a]">{documentTypeLabel[document.document_type]} · {formatFileSize(document.file.size)} · Pendiente</p></div>
                        <button type="button" onClick={() => setPendingDocuments((current) => current.filter((item) => item.id !== document.id))} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[#b9d0e8] text-[#51687d]" aria-label={`Quitar ${document.file.name}`} title="Quitar archivo"><X size={15} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="flex flex-col-reverse gap-3 border-t border-[#d9e4ef] pt-5 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeForm} className="rounded-[10px] border border-[#b8c9da] px-5 py-3 text-sm font-semibold text-[#51687d]">Cancelar</button>
                <button disabled={saving || !form.vehicle_id} className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#176bff] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? "Guardando..." : "Guardar venta"} <Check size={17} /></button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
