"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ClipboardList,
  ImagePlus,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { chileRegions, communesForRegion } from "@/lib/chile-locations";
import type {
  ProposalStatus,
  VehicleProposal,
  VehicleProposalForm,
} from "@/lib/types";

const emptyProposal: VehicleProposalForm = {
  source: "whatsapp",
  acquisition_type: "consignacion",
  seller_name: "",
  seller_phone: "",
  seller_email: "",
  region: "",
  location: "",
  vehicle_plate: "",
  vehicle_brand: "",
  vehicle_model: "",
  vehicle_year: "",
  vehicle_mileage_km: "0",
  expected_price_clp: "0",
  business_purchase_price_min_clp: "",
  business_purchase_price_max_clp: "",
  market_sale_price_min_clp: "",
  market_sale_price_max_clp: "",
  sellability_score: "0",
  campaign_name: "",
  campaign_code: "",
  vehicle_description: "",
  conversation_summary: "",
  internal_notes: "",
};

const statusLabel: Record<ProposalStatus, string> = {
  nueva: "Nueva",
  en_revision: "En revisión",
  contactada: "Contactada",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  archivada: "Archivada",
};

const sourceLabel: Record<VehicleProposalForm["source"], string> = {
  whatsapp: "WhatsApp",
  presencial: "Presencial",
  referido: "Referido",
  otro: "Otro",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);

const formatPriceRange = (minimum?: number | null, maximum?: number | null) =>
  minimum === null ||
  minimum === undefined ||
  maximum === null ||
  maximum === undefined
    ? "Sin evaluar"
    : `${formatCurrency(minimum)} a ${formatCurrency(maximum)}`;

const potentialMargin = (proposal: VehicleProposal) => {
  const {
    business_purchase_price_min_clp: purchaseMin,
    business_purchase_price_max_clp: purchaseMax,
    market_sale_price_min_clp: saleMin,
    market_sale_price_max_clp: saleMax,
  } = proposal;
  if (
    purchaseMin == null ||
    purchaseMax == null ||
    saleMin == null ||
    saleMax == null
  )
    return null;
  const minimum = saleMin - purchaseMax;
  const maximum = saleMax - purchaseMin;
  return {
    minimum,
    maximum,
    minimumPct: saleMin > 0 ? (minimum / saleMin) * 100 : null,
    maximumPct: saleMax > 0 ? (maximum / saleMax) * 100 : null,
  };
};

const formatPotentialMargin = (proposal: VehicleProposal) => {
  const margin = potentialMargin(proposal);
  if (!margin) return "Pendiente";
  return margin.minimum === margin.maximum
    ? formatCurrency(margin.minimum)
    : `${formatCurrency(margin.minimum)} a ${formatCurrency(margin.maximum)}`;
};

const formatPotentialMarginPct = (proposal: VehicleProposal) => {
  const margin = potentialMargin(proposal);
  if (!margin || margin.minimumPct == null || margin.maximumPct == null)
    return "Completa ambos rangos";
  return `${margin.minimumPct.toLocaleString("es-CL", { maximumFractionDigits: 1 })}% a ${margin.maximumPct.toLocaleString("es-CL", { maximumFractionDigits: 1 })}%`;
};

const potentialMarginTone = (proposal: VehicleProposal) => {
  const margin = potentialMargin(proposal);
  if (!margin) return "text-[#8a9baa]";
  if (margin.maximum < 0) return "text-[#b73a3a]";
  if (margin.minimum < 0) return "text-[#9a6a1e]";
  return "text-[#08734e]";
};

const normalizeWhatsapp = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("56")
    ? `+${digits}`
    : `+56${digits.replace(/^0/, "")}`;
};

const statusTone: Record<ProposalStatus, string> = {
  nueva: "bg-[#eaf4ff] text-[#176bff]",
  en_revision: "bg-[#fff4d8] text-[#9a6a1e]",
  contactada: "bg-[#e7f4f1] text-[#0b746c]",
  aceptada: "bg-[#dff7ed] text-[#08734e]",
  rechazada: "bg-[#fff0e9] text-[#c33c3c]",
  archivada: "bg-[#edf1f5] text-[#6c7c8d]",
};

const proposalToForm = (proposal: VehicleProposal): VehicleProposalForm => ({
  source: proposal.source as VehicleProposalForm["source"],
  acquisition_type: proposal.acquisition_type,
  seller_name: proposal.seller_name,
  seller_phone: proposal.seller_phone,
  seller_email: proposal.seller_email ?? "",
  region: proposal.region,
  location: proposal.location,
  vehicle_plate: proposal.vehicle_plate ?? "",
  vehicle_brand: proposal.vehicle_brand,
  vehicle_model: proposal.vehicle_model,
  vehicle_year: proposal.vehicle_year ? String(proposal.vehicle_year) : "",
  vehicle_mileage_km: String(proposal.vehicle_mileage_km),
  expected_price_clp: String(proposal.expected_price_clp),
  business_purchase_price_min_clp:
    proposal.business_purchase_price_min_clp == null
      ? ""
      : String(proposal.business_purchase_price_min_clp),
  business_purchase_price_max_clp:
    proposal.business_purchase_price_max_clp == null
      ? ""
      : String(proposal.business_purchase_price_max_clp),
  market_sale_price_min_clp:
    proposal.market_sale_price_min_clp == null
      ? ""
      : String(proposal.market_sale_price_min_clp),
  market_sale_price_max_clp:
    proposal.market_sale_price_max_clp == null
      ? ""
      : String(proposal.market_sale_price_max_clp),
  sellability_score: String(proposal.sellability_score),
  campaign_name: proposal.campaign_name ?? "",
  campaign_code: proposal.campaign_code ?? "",
  vehicle_description: proposal.vehicle_description ?? "",
  conversation_summary: proposal.conversation_summary ?? "",
  internal_notes: proposal.internal_notes ?? "",
});

type AdminProposalsProps = {
  proposals: VehicleProposal[];
  onSave: (
    form: VehicleProposalForm,
    imageFile: File | null,
    proposalId?: string | null,
  ) => Promise<boolean>;
  onDelete: (proposal: VehicleProposal) => Promise<void>;
  onStatusChange: (id: string, status: ProposalStatus) => Promise<void>;
};

export default function AdminProposals({
  proposals,
  onSave,
  onDelete,
  onStatusChange,
}: AdminProposalsProps) {
  const [form, setForm] = useState<VehicleProposalForm>(emptyProposal);
  const [filter, setFilter] = useState<ProposalStatus | "todas">("todas");
  const [showCreate, setShowCreate] = useState(false);
  const [editingProposalId, setEditingProposalId] = useState<string | null>(
    null,
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const availableCommunes = communesForRegion(form.region);

  const visibleProposals = useMemo(
    () =>
      filter === "todas"
        ? proposals
        : proposals.filter((proposal) => proposal.status === filter),
    [filter, proposals],
  );
  const editingProposal = proposals.find(
    (proposal) => proposal.id === editingProposalId,
  );
  const imagePreview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );
  const visibleImagePreview =
    imagePreview ?? editingProposal?.image_url ?? null;
  const formMargin = useMemo(() => {
    const values = [
      form.business_purchase_price_min_clp,
      form.business_purchase_price_max_clp,
      form.market_sale_price_min_clp,
      form.market_sale_price_max_clp,
    ];
    if (values.some((value) => value.trim() === "")) return null;
    const [purchaseMin, purchaseMax, saleMin, saleMax] = values.map(Number);
    if ([purchaseMin, purchaseMax, saleMin, saleMax].some(Number.isNaN)) return null;
    return {
      minimum: saleMin - purchaseMax,
      maximum: saleMax - purchaseMin,
    };
  }, [
    form.business_purchase_price_min_clp,
    form.business_purchase_price_max_clp,
    form.market_sale_price_min_clp,
    form.market_sale_price_max_clp,
  ]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function openCreate() {
    setEditingProposalId(null);
    setForm(emptyProposal);
    setImageFile(null);
    setShowCreate(true);
  }

  function openEdit(proposal: VehicleProposal) {
    setEditingProposalId(proposal.id);
    setForm(proposalToForm(proposal));
    setImageFile(null);
    setShowCreate(true);
  }

  function closeForm() {
    setShowCreate(false);
    setEditingProposalId(null);
    setForm(emptyProposal);
    setImageFile(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const saved = await onSave(form, imageFile, editingProposalId);
    setSaving(false);
    if (saved) {
      closeForm();
    }
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#176bff]">
            WhatsApp y captación
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">
            Propuestas de vehículos
          </h2>
          <p className="mt-2 max-w-[620px] text-sm leading-6 text-[#6c7c8d]">
            Registra las ofertas que recibes y ordénalas antes de convertirlas
            en inventario.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-[9px] bg-[#176bff] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0d52d6]"
        >
          <Plus size={17} aria-hidden="true" /> Nueva propuesta
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-[#6c7c8d]">
          <ClipboardList size={17} aria-hidden="true" />{" "}
          {visibleProposals.length} propuestas visibles
        </div>
        <label className="relative block w-full sm:w-[220px]">
          <span className="sr-only">Filtrar propuestas por estado</span>
          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value as ProposalStatus | "todas")
            }
            className="h-10 w-full appearance-none rounded-[9px] border border-[#d9e4ef] bg-white px-3 pr-8 text-sm font-semibold text-[#51687d] outline-none focus:border-[#176bff]"
          >
            <option value="todas">Todos los estados</option>
            {Object.entries(statusLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8b9a]"
            aria-hidden="true"
          />
        </label>
      </div>

      <div className="mt-5 space-y-3">
        {visibleProposals.length ? (
          visibleProposals.map((proposal) => (
            <article
              key={proposal.id}
              className="rounded-[10px] border border-[#d9e4ef] bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-[#d9e4ef] bg-[#f1f5f9] bg-cover bg-center text-[#9aabbb]"
                  style={
                    proposal.image_url
                      ? {
                          backgroundImage: `url(${JSON.stringify(proposal.image_url)})`,
                        }
                      : undefined
                  }
                  role={proposal.image_url ? "img" : undefined}
                  aria-label={
                    proposal.image_url
                      ? `Foto de ${proposal.vehicle_brand} ${proposal.vehicle_model}`
                      : undefined
                  }
                >
                  {!proposal.image_url && (
                    <ImagePlus size={20} aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-[#16334f]">
                          {proposal.vehicle_brand} {proposal.vehicle_model}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${statusTone[proposal.status]}`}
                        >
                          {statusLabel[proposal.status]}
                        </span>
                        <span className="rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[11px] font-semibold text-[#6c7c8d]">
                          {sourceLabel[
                            proposal.source as VehicleProposalForm["source"]
                          ] ?? proposal.source}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[#51687d]">
                        {proposal.seller_name} · ID WhatsApp{" "}
                        {proposal.whatsapp_id}
                        {proposal.vehicle_plate
                          ? ` · Patente ${proposal.vehicle_plate}`
                          : ""}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-[#6c7c8d]">
                        <MapPin size={13} aria-hidden="true" />{" "}
                        {proposal.location} · {proposal.region}
                      </p>
                      <p className="mt-1 text-xs text-[#8a9baa]">
                        {proposal.vehicle_year || "Año pendiente"} ·{" "}
                        {proposal.vehicle_mileage_km.toLocaleString("es-CL")} km
                        ·{" "}
                        {proposal.acquisition_type === "consignacion"
                          ? "Consignación"
                          : "Compra directa"}
                      </p>
                      {(proposal.campaign_name || proposal.campaign_code) && (
                        <p className="mt-2 inline-flex items-center rounded-[6px] bg-[#eaf4ff] px-2.5 py-1 text-xs font-semibold text-[#176bff]">
                          Campaña {proposal.campaign_name || "Sin nombre"}
                          {proposal.campaign_code
                            ? ` · ${proposal.campaign_code}`
                            : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-start gap-1 lg:items-end">
                      <span className="text-xs text-[#8a9baa]">
                        Espera recibir
                      </span>
                      <strong className="text-lg text-[#071a33]">
                        {proposal.expected_price_clp
                          ? formatCurrency(proposal.expected_price_clp)
                          : "Sin monto"}
                      </strong>
                      <span className="text-xs text-[#8a9baa]">
                        {new Date(proposal.created_at).toLocaleDateString(
                          "es-CL",
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 grid gap-3 border-y border-[#edf3f8] py-3 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-xs text-[#8a9baa]">Compra para negocio</p>
                  <p className="mt-1 text-sm font-semibold text-[#16334f]">
                    {formatPriceRange(
                      proposal.business_purchase_price_min_clp,
                      proposal.business_purchase_price_max_clp,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#8a9baa]">Venta de mercado</p>
                  <p className="mt-1 text-sm font-semibold text-[#16334f]">
                    {formatPriceRange(
                      proposal.market_sale_price_min_clp,
                      proposal.market_sale_price_max_clp,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#8a9baa]">Margen potencial</p>
                  <p
                    className={`mt-1 text-sm font-semibold ${potentialMarginTone(proposal)}`}
                  >
                    {formatPotentialMargin(proposal)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#8a9baa]">
                    {formatPotentialMarginPct(proposal)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#8a9baa]">Vendibilidad</p>
                  <p className="mt-1 text-sm font-semibold text-[#176bff]">
                    {Number(proposal.sellability_score).toLocaleString("es-CL")}{" "}
                    / 5
                  </p>
                </div>
              </div>
              <div className="mt-3 border-t border-[#edf3f8] pt-3">
                <p className="line-clamp-2 text-sm leading-5 text-[#51687d]">
                  {proposal.conversation_summary ||
                    proposal.vehicle_description ||
                    "Sin resumen agregado."}
                </p>
                {proposal.internal_notes && (
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#6c7c8d]">
                    <strong>Nota interna:</strong> {proposal.internal_notes}
                  </p>
                )}
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label className="relative block w-full sm:w-[210px]">
                    <span className="sr-only">Cambiar estado de propuesta</span>
                    <select
                      value={proposal.status}
                      onChange={(event) =>
                        void onStatusChange(
                          proposal.id,
                          event.target.value as ProposalStatus,
                        )
                      }
                      className="h-9 w-full appearance-none rounded-[8px] border border-[#d9e4ef] bg-white px-3 pr-8 text-xs font-semibold text-[#51687d] outline-none focus:border-[#176bff]"
                    >
                      {Object.entries(statusLabel).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={13}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8b9a]"
                      aria-hidden="true"
                    />
                  </label>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/${proposal.whatsapp_id.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#b8ddd7] text-[#0b746c] transition hover:bg-[#e7f4f1]"
                      aria-label={`Abrir WhatsApp de ${proposal.seller_name}`}
                      title="Abrir WhatsApp"
                    >
                      <MessageCircle size={16} aria-hidden="true" />
                    </a>
                    <button
                      type="button"
                      onClick={() => openEdit(proposal)}
                      className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#b8c9da] text-[#51687d]"
                      aria-label={`Editar propuesta de ${proposal.seller_name}`}
                      title="Editar propuesta"
                    >
                      <Pencil size={15} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDelete(proposal)}
                      className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#efc6c6] text-[#b73a3a]"
                      aria-label={`Eliminar propuesta de ${proposal.seller_name}`}
                      title="Eliminar propuesta"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[16px] border border-dashed border-[#d9e4ef] bg-white p-12 text-center">
            <ClipboardList
              size={28}
              className="mx-auto text-[#b8c9da]"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm font-semibold text-[#51687d]">
              No hay propuestas con este filtro.
            </p>
            <p className="mt-1 text-xs text-[#8a9baa]">
              Agrega la primera propuesta recibida por WhatsApp.
            </p>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-[#071a33]/45 p-0 backdrop-blur-sm sm:items-center sm:p-5">
          <div className="max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-t-[22px] bg-[#f7f9fc] p-6 shadow-[0_24px_100px_rgba(0,0,0,0.28)] sm:rounded-[22px] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#176bff]">
                  Captación
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">
                  {editingProposalId
                    ? "Editar propuesta"
                    : "Registrar propuesta"}
                </h2>
              </div>
              <button
                onClick={closeForm}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d9e4ef] bg-white text-[#5c7082]"
                aria-label="Cerrar formulario"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <section className="flex items-center gap-4 rounded-[10px] border border-[#d9e4ef] bg-white p-3">
                <div
                  className="flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[#edf2f7] bg-cover bg-center text-[#9aabbb]"
                  style={
                    visibleImagePreview
                      ? {
                          backgroundImage: `url(${JSON.stringify(visibleImagePreview)})`,
                        }
                      : undefined
                  }
                >
                  {!visibleImagePreview && (
                    <ImagePlus size={24} aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#16334f]">
                    Foto del vehículo
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#7c8b9a]">
                    JPG, PNG o WebP. Máximo 5 MB.
                  </p>
                  <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-[8px] border border-[#b8c9da] px-3 py-2 text-xs font-bold text-[#51687d] transition hover:bg-[#f1f5f9]">
                    <ImagePlus size={15} aria-hidden="true" />
                    {visibleImagePreview ? "Cambiar foto" : "Agregar foto"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(event) =>
                        setImageFile(event.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                  {imageFile && (
                    <p className="mt-1.5 truncate text-[11px] text-[#8a9baa]">
                      {imageFile.name}
                    </p>
                  )}
                </div>
              </section>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Nombre de la persona
                  <input
                    required
                    value={form.seller_name}
                    onChange={(event) =>
                      setForm({ ...form, seller_name: event.target.value })
                    }
                    placeholder="Nombre y apellido"
                    className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Teléfono WhatsApp
                  <input
                    required
                    value={form.seller_phone}
                    onChange={(event) =>
                      setForm({ ...form, seller_phone: event.target.value })
                    }
                    placeholder="+56 9..."
                    className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]"
                  />
                  <span className="mt-1.5 block text-xs font-normal text-[#8a9baa]">
                    {form.seller_phone
                      ? `ID: ${normalizeWhatsapp(form.seller_phone)}`
                      : "Se guardará con código +56"}
                  </span>
                </label>
                <label className="block text-sm font-medium">
                  Correo electrónico
                  <input
                    type="email"
                    value={form.seller_email}
                    onChange={(event) =>
                      setForm({ ...form, seller_email: event.target.value })
                    }
                    placeholder="Opcional"
                    className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Origen
                  <select
                    value={form.source}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        source: event.target
                          .value as VehicleProposalForm["source"],
                      })
                    }
                    className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="presencial">Presencial</option>
                    <option value="referido">Referido</option>
                    <option value="otro">Otro</option>
                  </select>
                </label>
                <label className="block text-sm font-medium">
                  Región
                  <select
                    required
                    value={form.region}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        region: event.target.value,
                        location: "",
                      })
                    }
                    className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]"
                  >
                    <option value="">Selecciona una región</option>
                    {chileRegions.map((region) => (
                      <option key={region.name} value={region.name}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium">
                  Ciudad o comuna
                  <select
                    required
                    disabled={!form.region}
                    value={form.location}
                    onChange={(event) =>
                      setForm({ ...form, location: event.target.value })
                    }
                    className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff] disabled:cursor-not-allowed disabled:bg-[#edf2f7]"
                  >
                    <option value="">
                      {form.region
                        ? "Selecciona una ciudad o comuna"
                        : "Primero selecciona una región"}
                    </option>
                    {availableCommunes.map((commune) => (
                      <option key={commune} value={commune}>
                        {commune}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-4 border-y border-[#d9e4ef] py-5 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Campaña publicitaria
                  <input
                    value={form.campaign_name}
                    maxLength={120}
                    onChange={(event) =>
                      setForm({ ...form, campaign_name: event.target.value })
                    }
                    placeholder="Ej. Meta Talca septiembre"
                    className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Código de campaña
                  <input
                    value={form.campaign_code}
                    required={Boolean(form.campaign_name.trim())}
                    maxLength={32}
                    pattern="[A-Za-z0-9]*"
                    onChange={(event) =>
                      setForm({
                        ...form,
                        campaign_code: event.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, ""),
                      })
                    }
                    placeholder="Ej. META2026TALCA"
                    className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm font-semibold uppercase outline-none focus:border-[#176bff]"
                  />
                  <span className="mt-1.5 block text-xs font-normal text-[#8a9baa]">
                    Solo letras y números, máximo 32 caracteres.
                  </span>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Modalidad
                  <select
                    value={form.acquisition_type}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        acquisition_type: event.target
                          .value as VehicleProposalForm["acquisition_type"],
                      })
                    }
                    className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]"
                  >
                    <option value="consignacion">Consignación</option>
                    <option value="compra_directa">Compra directa</option>
                  </select>
                </label>
                <label className="block text-sm font-medium">
                  Patente
                  <input
                    value={form.vehicle_plate}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        vehicle_plate: event.target.value.toUpperCase(),
                      })
                    }
                    placeholder="Opcional"
                    className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Marca
                  <input
                    required
                    value={form.vehicle_brand}
                    onChange={(event) =>
                      setForm({ ...form, vehicle_brand: event.target.value })
                    }
                    placeholder="Toyota"
                    className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Modelo
                  <input
                    required
                    value={form.vehicle_model}
                    onChange={(event) =>
                      setForm({ ...form, vehicle_model: event.target.value })
                    }
                    placeholder="Corolla XEI"
                    className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Año
                  <input
                    type="number"
                    min="1900"
                    max="2100"
                    value={form.vehicle_year}
                    onChange={(event) =>
                      setForm({ ...form, vehicle_year: event.target.value })
                    }
                    placeholder="Opcional"
                    className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Kilometraje
                  <input
                    type="number"
                    min="0"
                    value={form.vehicle_mileage_km}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        vehicle_mileage_km: event.target.value,
                      })
                    }
                    className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]"
                  />
                </label>
                <label className="block text-sm font-medium sm:col-span-2">
                  Precio que espera recibir
                  <input
                    type="number"
                    min="0"
                    value={form.expected_price_clp}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        expected_price_clp: event.target.value,
                      })
                    }
                    placeholder="0 si aún no lo informa"
                    className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]"
                  />
                </label>
              </div>
              <section className="rounded-[10px] border border-[#b9d0e8] bg-[#eaf4ff] p-4">
                <h3 className="text-sm font-semibold text-[#16334f]">
                  Evaluación comercial
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium">
                    Compra negocio desde
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required={Boolean(form.business_purchase_price_max_clp)}
                      value={form.business_purchase_price_min_clp}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          business_purchase_price_min_clp: event.target.value,
                        })
                      }
                      placeholder="Opcional"
                      className="mt-2 h-11 w-full rounded-[9px] border border-[#b9d0e8] bg-white px-3 text-sm outline-none focus:border-[#176bff]"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Compra negocio hasta
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required={Boolean(form.business_purchase_price_min_clp)}
                      value={form.business_purchase_price_max_clp}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          business_purchase_price_max_clp: event.target.value,
                        })
                      }
                      placeholder="Opcional"
                      className="mt-2 h-11 w-full rounded-[9px] border border-[#b9d0e8] bg-white px-3 text-sm outline-none focus:border-[#176bff]"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Venta mercado desde
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required={Boolean(form.market_sale_price_max_clp)}
                      value={form.market_sale_price_min_clp}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          market_sale_price_min_clp: event.target.value,
                        })
                      }
                      placeholder="Opcional"
                      className="mt-2 h-11 w-full rounded-[9px] border border-[#b9d0e8] bg-white px-3 text-sm outline-none focus:border-[#176bff]"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Venta mercado hasta
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required={Boolean(form.market_sale_price_min_clp)}
                      value={form.market_sale_price_max_clp}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          market_sale_price_max_clp: event.target.value,
                        })
                      }
                      placeholder="Opcional"
                      className="mt-2 h-11 w-full rounded-[9px] border border-[#b9d0e8] bg-white px-3 text-sm outline-none focus:border-[#176bff]"
                    />
                  </label>
                  <div className="rounded-[9px] border border-[#b9d0e8] bg-white p-3 sm:col-span-2">
                    <p className="text-xs text-[#6c7c8d]">Margen potencial</p>
                    <p
                      className={`mt-1 text-base font-semibold ${formMargin && formMargin.maximum < 0 ? "text-[#b73a3a]" : formMargin && formMargin.minimum < 0 ? "text-[#9a6a1e]" : "text-[#08734e]"}`}
                    >
                      {formMargin
                        ? formMargin.minimum === formMargin.maximum
                          ? formatCurrency(formMargin.minimum)
                          : `${formatCurrency(formMargin.minimum)} a ${formatCurrency(formMargin.maximum)}`
                        : "Completa los rangos de compra y venta"}
                    </p>
                    <p className="mt-1 text-[11px] text-[#8a9baa]">
                      Venta de mercado menos compra para negocio.
                    </p>
                  </div>
                  <label className="block text-sm font-medium sm:col-span-2">
                    Nivel de vendibilidad
                    <select
                      value={form.sellability_score}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          sellability_score: event.target.value,
                        })
                      }
                      className="mt-2 h-11 w-full rounded-[9px] border border-[#b9d0e8] bg-white px-3 text-sm outline-none focus:border-[#176bff]"
                    >
                      {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(
                        (score) => (
                          <option key={score} value={score}>
                            {score.toLocaleString("es-CL")} / 5
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                </div>
              </section>
              <label className="block text-sm font-medium">
                Resumen de la conversación
                <textarea
                  value={form.conversation_summary}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      conversation_summary: event.target.value,
                    })
                  }
                  placeholder="Qué ofrece, condiciones, disponibilidad y próximos pasos"
                  className="mt-2 min-h-[84px] w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#176bff]"
                />
              </label>
              <label className="block text-sm font-medium">
                Notas internas
                <textarea
                  value={form.internal_notes}
                  onChange={(event) =>
                    setForm({ ...form, internal_notes: event.target.value })
                  }
                  placeholder="Evaluación, costos pendientes o seguimiento"
                  className="mt-2 min-h-[70px] w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#176bff]"
                />
              </label>
              <label className="block text-sm font-medium">
                Descripción del vehículo
                <textarea
                  value={form.vehicle_description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      vehicle_description: event.target.value,
                    })
                  }
                  placeholder="Equipamiento, estado, mantenciones u otros datos"
                  className="mt-2 min-h-[70px] w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#176bff]"
                />
              </label>
              <div className="flex flex-col-reverse gap-3 border-t border-[#d9e4ef] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-[10px] border border-[#b8c9da] px-5 py-3 text-sm font-semibold text-[#51687d]"
                >
                  Cancelar
                </button>
                <button
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#176bff] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {saving
                    ? "Guardando..."
                    : editingProposalId
                      ? "Guardar cambios"
                      : "Guardar propuesta"}{" "}
                  <Check size={17} aria-hidden="true" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
