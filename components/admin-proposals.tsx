"use client";

import { FormEvent, useMemo, useState } from "react";
import { Check, ChevronDown, ClipboardList, MessageCircle, Plus, X } from "lucide-react";
import type { ProposalStatus, VehicleProposal, VehicleProposalForm } from "@/lib/types";

const emptyProposal: VehicleProposalForm = {
  source: "whatsapp",
  acquisition_type: "consignacion",
  seller_name: "",
  seller_phone: "",
  seller_email: "",
  vehicle_plate: "",
  vehicle_brand: "",
  vehicle_model: "",
  vehicle_year: "",
  vehicle_mileage_km: "0",
  expected_price_clp: "0",
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

const statusTone: Record<ProposalStatus, string> = {
  nueva: "bg-[#eaf4ff] text-[#176bff]",
  en_revision: "bg-[#fff4d8] text-[#9a6a1e]",
  contactada: "bg-[#e7f4f1] text-[#0b746c]",
  aceptada: "bg-[#dff7ed] text-[#08734e]",
  rechazada: "bg-[#fff0e9] text-[#c33c3c]",
  archivada: "bg-[#edf1f5] text-[#6c7c8d]",
};

type AdminProposalsProps = {
  proposals: VehicleProposal[];
  onCreate: (form: VehicleProposalForm) => Promise<boolean>;
  onStatusChange: (id: string, status: ProposalStatus) => Promise<void>;
};

export default function AdminProposals({ proposals, onCreate, onStatusChange }: AdminProposalsProps) {
  const [form, setForm] = useState<VehicleProposalForm>(emptyProposal);
  const [filter, setFilter] = useState<ProposalStatus | "todas">("todas");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const visibleProposals = useMemo(
    () => filter === "todas" ? proposals : proposals.filter((proposal) => proposal.status === filter),
    [filter, proposals],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const saved = await onCreate(form);
    setSaving(false);
    if (saved) {
      setForm(emptyProposal);
      setShowCreate(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#176bff]">WhatsApp y captación</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">Propuestas de vehículos</h2>
          <p className="mt-2 max-w-[620px] text-sm leading-6 text-[#6c7c8d]">Registra las ofertas que recibes y ordénalas antes de convertirlas en inventario.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#176bff] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0d52d6]"><Plus size={17} aria-hidden="true" /> Nueva propuesta</button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-[#6c7c8d]"><ClipboardList size={17} aria-hidden="true" /> {visibleProposals.length} propuestas visibles</div>
        <label className="relative block w-full sm:w-[220px]"><span className="sr-only">Filtrar propuestas por estado</span><select value={filter} onChange={(event) => setFilter(event.target.value as ProposalStatus | "todas")} className="h-10 w-full appearance-none rounded-[9px] border border-[#d9e4ef] bg-white px-3 pr-8 text-sm font-semibold text-[#51687d] outline-none focus:border-[#176bff]"><option value="todas">Todos los estados</option>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8b9a]" aria-hidden="true" /></label>
      </div>

      <div className="mt-5 space-y-3">
        {visibleProposals.length ? visibleProposals.map((proposal) => <article key={proposal.id} className="rounded-[16px] border border-[#d9e4ef] bg-white p-5 shadow-[0_10px_25px_rgba(31,35,31,0.04)]">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-[#16334f]">{proposal.vehicle_brand} {proposal.vehicle_model}</h3><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${statusTone[proposal.status]}`}>{statusLabel[proposal.status]}</span><span className="rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[11px] font-semibold text-[#6c7c8d]">{sourceLabel[proposal.source as VehicleProposalForm["source"]] ?? proposal.source}</span></div>
              <p className="mt-2 text-sm text-[#51687d]">{proposal.seller_name} · {proposal.seller_phone}{proposal.vehicle_plate ? ` · Patente ${proposal.vehicle_plate}` : ""}</p>
              <p className="mt-1 text-xs text-[#8a9baa]">{proposal.vehicle_year || "Año pendiente"} · {proposal.vehicle_mileage_km.toLocaleString("es-CL")} km · {proposal.acquisition_type === "consignacion" ? "Consignación" : "Compra directa"}</p>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-1 lg:items-end"><span className="text-xs text-[#8a9baa]">Espera recibir</span><strong className="text-lg text-[#071a33]">{proposal.expected_price_clp ? formatCurrency(proposal.expected_price_clp) : "Sin monto"}</strong><span className="text-xs text-[#8a9baa]">{new Date(proposal.created_at).toLocaleDateString("es-CL")}</span></div>
          </div>
          <div className="mt-4 grid gap-4 border-t border-[#edf3f8] pt-4 lg:grid-cols-[1fr_220px]">
            <div className="space-y-2 text-sm leading-6 text-[#51687d]"><p>{proposal.conversation_summary || proposal.vehicle_description || "Sin resumen agregado."}</p>{proposal.internal_notes && <p className="rounded-[9px] bg-[#f7f9fc] px-3 py-2 text-xs text-[#6c7c8d]"><strong>Nota interna:</strong> {proposal.internal_notes}</p>}<a href={`https://wa.me/${proposal.seller_phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0b746c] hover:underline"><MessageCircle size={14} aria-hidden="true" /> Abrir WhatsApp</a></div>
            <label className="relative block"><span className="sr-only">Cambiar estado de propuesta</span><select value={proposal.status} onChange={(event) => void onStatusChange(proposal.id, event.target.value as ProposalStatus)} className="h-10 w-full appearance-none rounded-[9px] border border-[#d9e4ef] bg-white px-3 pr-8 text-sm font-semibold text-[#51687d] outline-none focus:border-[#176bff]">{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8b9a]" aria-hidden="true" /></label>
          </div>
        </article>) : <div className="rounded-[16px] border border-dashed border-[#d9e4ef] bg-white p-12 text-center"><ClipboardList size={28} className="mx-auto text-[#b8c9da]" aria-hidden="true" /><p className="mt-3 text-sm font-semibold text-[#51687d]">No hay propuestas con este filtro.</p><p className="mt-1 text-xs text-[#8a9baa]">Agrega la primera propuesta recibida por WhatsApp.</p></div>}
      </div>

      {showCreate && <div className="fixed inset-0 z-30 flex items-end justify-center bg-[#071a33]/45 p-0 backdrop-blur-sm sm:items-center sm:p-5"><div className="max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-t-[22px] bg-[#f7f9fc] p-6 shadow-[0_24px_100px_rgba(0,0,0,0.28)] sm:rounded-[22px] sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#176bff]">Captación</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">Registrar propuesta</h2></div><button onClick={() => setShowCreate(false)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d9e4ef] bg-white text-[#5c7082]" aria-label="Cerrar formulario"><X size={17} aria-hidden="true" /></button></div><form onSubmit={handleSubmit} className="mt-7 space-y-5"><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Nombre de la persona<input required value={form.seller_name} onChange={(event) => setForm({ ...form, seller_name: event.target.value })} placeholder="Nombre y apellido" className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium">Teléfono WhatsApp<input required value={form.seller_phone} onChange={(event) => setForm({ ...form, seller_phone: event.target.value })} placeholder="+56 9..." className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium">Correo electrónico<input type="email" value={form.seller_email} onChange={(event) => setForm({ ...form, seller_email: event.target.value })} placeholder="Opcional" className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium">Origen<select value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value as VehicleProposalForm["source"] })} className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]"><option value="whatsapp">WhatsApp</option><option value="presencial">Presencial</option><option value="referido">Referido</option><option value="otro">Otro</option></select></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Modalidad<select value={form.acquisition_type} onChange={(event) => setForm({ ...form, acquisition_type: event.target.value as VehicleProposalForm["acquisition_type"] })} className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]"><option value="consignacion">Consignación</option><option value="compra_directa">Compra directa</option></select></label><label className="block text-sm font-medium">Patente<input value={form.vehicle_plate} onChange={(event) => setForm({ ...form, vehicle_plate: event.target.value.toUpperCase() })} placeholder="Opcional" className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium">Marca<input required value={form.vehicle_brand} onChange={(event) => setForm({ ...form, vehicle_brand: event.target.value })} placeholder="Toyota" className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium">Modelo<input required value={form.vehicle_model} onChange={(event) => setForm({ ...form, vehicle_model: event.target.value })} placeholder="Corolla XEI" className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium">Año<input type="number" min="1900" max="2100" value={form.vehicle_year} onChange={(event) => setForm({ ...form, vehicle_year: event.target.value })} placeholder="Opcional" className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium">Kilometraje<input type="number" min="0" value={form.vehicle_mileage_km} onChange={(event) => setForm({ ...form, vehicle_mileage_km: event.target.value })} className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium sm:col-span-2">Precio que espera recibir<input type="number" min="0" value={form.expected_price_clp} onChange={(event) => setForm({ ...form, expected_price_clp: event.target.value })} placeholder="0 si aún no lo informa" className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label></div><label className="block text-sm font-medium">Resumen de la conversación<textarea value={form.conversation_summary} onChange={(event) => setForm({ ...form, conversation_summary: event.target.value })} placeholder="Qué ofrece, condiciones, disponibilidad y próximos pasos" className="mt-2 min-h-[84px] w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium">Notas internas<textarea value={form.internal_notes} onChange={(event) => setForm({ ...form, internal_notes: event.target.value })} placeholder="Evaluación, costos pendientes o seguimiento" className="mt-2 min-h-[70px] w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium">Descripción del vehículo<textarea value={form.vehicle_description} onChange={(event) => setForm({ ...form, vehicle_description: event.target.value })} placeholder="Equipamiento, estado, mantenciones u otros datos" className="mt-2 min-h-[70px] w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#176bff]" /></label><div className="flex flex-col-reverse gap-3 border-t border-[#d9e4ef] pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={() => setShowCreate(false)} className="rounded-[10px] border border-[#b8c9da] px-5 py-3 text-sm font-semibold text-[#51687d]">Cancelar</button><button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#176bff] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? "Guardando..." : "Guardar propuesta"} <Check size={17} aria-hidden="true" /></button></div></form></div></div>}
    </div>
  );
}
