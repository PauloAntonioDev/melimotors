"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Fuel,
  Gauge,
  KeyRound,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { demoVehicles, vehicleImage } from "@/lib/demo-data";
import { publicStorageUrl, supabase } from "@/lib/supabase";
import type { Vehicle } from "@/lib/types";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);

const formatMileage = (value: number) => new Intl.NumberFormat("es-CL").format(value);

const readableFuel = (value: string) =>
  ({ benzina: "Bencina", diesel: "Diésel", hybrid: "Híbrido", electric: "Eléctrico" }[
    value
  ] ?? value);

const readableTransmission = (value: string) =>
  ({ automatic: "Automática", manual: "Manual", cvt: "CVT" }[value] ?? value);

function calculatePayment(price: number, downPayment: number, annualRate: number, months: number) {
  const principal = Math.max(price - downPayment, 0);
  if (!principal) return 0;
  const monthlyRate = annualRate / 100 / 12;
  if (!monthlyRate) return principal / months;
  const factor = Math.pow(1 + monthlyRate, months);
  return principal * ((monthlyRate * factor) / (factor - 1));
}

export default function VehicleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(
    demoVehicles.find((item) => item.slug === slug) ?? demoVehicles[0],
  );
  const [activeImage, setActiveImage] = useState(0);
  const [downPayment, setDownPayment] = useState(30);
  const [annualRate, setAnnualRate] = useState(12);
  const [months, setMonths] = useState(36);
  const [lead, setLead] = useState({ name: "", phone: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase || !slug) return;
    void supabase
      .from("public_vehicle_catalog")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setVehicle({
            ...data,
            cover_url: publicStorageUrl(data.cover_storage_path),
          } as Vehicle);
        }
      });
  }, [slug]);

  const payment = useMemo(() => {
    if (!vehicle) return 0;
    return calculatePayment(vehicle.sale_price_clp, vehicle.sale_price_clp * (downPayment / 100), annualRate, months);
  }, [annualRate, downPayment, months, vehicle]);

  if (!vehicle) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f7f9fc] text-[#071a33]">Vehículo no encontrado.</main>;
  }

  const image = vehicleImage(vehicle);
  const isReserved = vehicle.status === "reservado";
  const whatsappMessage = encodeURIComponent(`Hola, me interesa el ${vehicle.brand} ${vehicle.model} ${vehicle.model_year} (${vehicle.stock_code}).`);

  async function handleLeadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentVehicle = vehicle;
    if (!currentVehicle) return;
    setSubmitting(true);
    if (supabase && !currentVehicle.id.startsWith("demo-")) {
      await supabase.from("leads").insert({
        vehicle_id: currentVehicle.id,
        source: "vehicle_detail",
        name: lead.name,
        phone: lead.phone,
        email: lead.email || null,
        message: lead.message || null,
      });
    }
    setSubmitting(false);
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#071a33]">
      <header className="border-b border-[#d9e4ef] bg-[#071a33] text-white">
        <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Volver a Melimotors">
            <img src="/melimotors-logo.png" alt="Melimotors" className="h-10 w-[132px] object-contain object-left" />
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-white/75 transition hover:text-white"><ArrowLeft size={16} aria-hidden="true" /> Volver al inventario</Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1240px] px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-7 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#f0b44d]">
          <span>{vehicle.stock_code}</span><span className="text-[#b9c8d6]">/</span><span>{isReserved ? "Reservado" : "Disponible"}</span>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <div>
            <div className="relative overflow-hidden rounded-[22px] bg-[#dbe6f0] shadow-[0_18px_60px_rgba(31,35,31,0.1)]">
              <img src={image} alt={`${vehicle.brand} ${vehicle.model}`} className="aspect-[4/3] h-full w-full object-cover" />
              <button onClick={() => setActiveImage(Math.max(0, activeImage - 1))} disabled={activeImage === 0} aria-label="Imagen anterior" className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#17324f] shadow-sm disabled:opacity-35"><ChevronLeft size={20} aria-hidden="true" /></button>
              <button onClick={() => setActiveImage(Math.min(2, activeImage + 1))} disabled={activeImage === 2} aria-label="Imagen siguiente" className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#17324f] shadow-sm disabled:opacity-35"><ChevronRight size={20} aria-hidden="true" /></button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[0, 1, 2].map((item) => (
                <button key={item} onClick={() => setActiveImage(item)} className={`overflow-hidden rounded-[12px] border-2 bg-[#dbe6f0] ${activeImage === item ? "border-[#176bff]" : "border-transparent"}`} aria-label={`Ver imagen ${item + 1}`}>
                  <img src={image} alt="" className="aspect-[4/3] h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-[#d9e4ef] bg-white p-6 shadow-[0_14px_40px_rgba(31,35,31,0.05)] sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#176bff]">{vehicle.model_year} · {readableFuel(vehicle.fuel_type)}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#071a33] sm:text-5xl">{vehicle.brand} {vehicle.model}</h1>
            <p className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-[#071a33]">{formatCurrency(vehicle.sale_price_clp)}</p>
            <p className="mt-2 text-sm text-[#7c8b9a]">Precio publicado en CLP</p>
            <div className="mt-7 grid grid-cols-2 gap-3 border-y border-[#e0e9f2] py-5 text-sm text-[#5c7082]">
              <span className="flex items-center gap-2"><Gauge size={17} aria-hidden="true" /> {formatMileage(vehicle.mileage_km)} km</span>
              <span className="flex items-center gap-2"><KeyRound size={17} aria-hidden="true" /> {readableTransmission(vehicle.transmission)}</span>
              <span className="flex items-center gap-2"><Fuel size={17} aria-hidden="true" /> {readableFuel(vehicle.fuel_type)}</span>
              <span className="flex items-center gap-2"><ShieldCheck size={17} aria-hidden="true" /> Revisado</span>
            </div>
            <p className="mt-6 text-[15px] leading-7 text-[#5c7082]">{vehicle.description}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href={`https://wa.me/56900000000?text=${whatsappMessage}`} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-[#0b8a9e] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#086a7d]"><MessageCircle size={17} aria-hidden="true" /> Consultar por WhatsApp</a>
              <a href="#consulta" className="inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] border border-[#b8c9da] px-5 py-3.5 text-sm font-semibold text-[#17324f] transition hover:bg-[#f5f9fd]"><ArrowRight size={17} aria-hidden="true" /> Dejar mis datos</a>
            </div>
          </div>
        </div>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_0.85fr]" aria-label="Financiamiento y consulta">
          <div className="rounded-[22px] border border-[#d9e4ef] bg-[#eaf4ff] p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#176bff]">Simulador referencial</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">¿Cómo quedaría tu cuota?</h2></div>
              <span className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#5c7082]">Sin aprobación bancaria</span>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              <label className="block text-sm font-medium text-[#526054]">Pie <span className="font-semibold text-[#071a33]">{downPayment}%</span><input type="range" min="0" max="70" step="5" value={downPayment} onChange={(event) => setDownPayment(Number(event.target.value))} className="mt-4 w-full accent-[#176bff]" /></label>
              <label className="block text-sm font-medium text-[#526054]">Tasa anual <span className="font-semibold text-[#071a33]">{annualRate}%</span><input type="range" min="0" max="24" step="0.5" value={annualRate} onChange={(event) => setAnnualRate(Number(event.target.value))} className="mt-4 w-full accent-[#176bff]" /></label>
              <label className="block text-sm font-medium text-[#526054]">Plazo<select value={months} onChange={(event) => setMonths(Number(event.target.value))} className="mt-2 h-11 w-full rounded-[10px] border border-[#b9d0e8] bg-white px-3 text-sm text-[#14334f] outline-none focus:border-[#176bff]"><option value={12}>12 meses</option><option value={24}>24 meses</option><option value={36}>36 meses</option><option value={48}>48 meses</option><option value={60}>60 meses</option></select></label>
            </div>
            <div className="mt-8 flex flex-col gap-2 border-t border-[#b9d0e8] pt-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm text-[#5c7082]">Cuota mensual estimada</p><p className="mt-1 text-4xl font-semibold tracking-[-0.06em] text-[#071a33]">{formatCurrency(payment)}</p></div><p className="text-xs text-[#6c7c8d]">Pie de {formatCurrency(vehicle.sale_price_clp * downPayment / 100)} · {months} cuotas</p></div>
          </div>

          <div id="consulta" className="scroll-mt-8 rounded-[22px] border border-[#d9e4ef] bg-white p-6 shadow-[0_14px_40px_rgba(31,35,31,0.05)] sm:p-8">
            {submitted ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center text-center"><CheckCircle2 size={38} className="text-[#0b8a9e]" aria-hidden="true" /><h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">Recibimos tus datos.</h2><p className="mt-3 max-w-[320px] text-sm leading-6 text-[#5c7082]">Te contactaremos para coordinar los siguientes pasos de tu {vehicle.brand} {vehicle.model}.</p><Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-[10px] border border-[#b8c9da] px-5 py-3 text-sm font-semibold text-[#17324f]">Ver más vehículos <ArrowRight size={16} aria-hidden="true" /></Link></div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="space-y-4">
                <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#176bff]">Hablemos</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Quiero saber más</h2><p className="mt-2 text-sm leading-6 text-[#5c7082]">Déjanos tu información y te respondemos directamente.</p></div>
                <label className="block text-sm font-medium text-[#17324f]">Nombre<input required value={lead.name} onChange={(event) => setLead({ ...lead, name: event.target.value })} className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-[#ffffff] px-3 text-sm outline-none focus:border-[#176bff]" /></label>
                <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-[#17324f]">Teléfono<input required value={lead.phone} onChange={(event) => setLead({ ...lead, phone: event.target.value })} className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-[#ffffff] px-3 text-sm outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium text-[#17324f]">Correo <span className="font-normal text-[#8a9baa]">(opcional)</span><input type="email" value={lead.email} onChange={(event) => setLead({ ...lead, email: event.target.value })} className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-[#ffffff] px-3 text-sm outline-none focus:border-[#176bff]" /></label></div>
                <label className="block text-sm font-medium text-[#17324f]">Mensaje <span className="font-normal text-[#8a9baa]">(opcional)</span><textarea value={lead.message} onChange={(event) => setLead({ ...lead, message: event.target.value })} placeholder="¿Qué te gustaría saber?" className="mt-2 min-h-[92px] w-full resize-y rounded-[10px] border border-[#d9e4ef] bg-[#ffffff] px-3 py-2.5 text-sm outline-none focus:border-[#176bff]" /></label>
                <button disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#176bff] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#0d52d6] disabled:cursor-wait disabled:opacity-60">{submitting ? "Enviando..." : "Enviar consulta"} <ArrowRight size={17} aria-hidden="true" /></button>
                <p className="flex items-center gap-2 text-xs leading-5 text-[#7c8b9a]"><Phone size={14} aria-hidden="true" /> También puedes escribirnos al WhatsApp de Melimotors.</p>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
