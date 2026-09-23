"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, Check, ImagePlus, MessageCircle, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";

type RequestType = "consignacion" | "compra_directa";

const initialForm = {
  name: "",
  phone: "",
  email: "",
  city: "Talca",
  brand: "",
  model: "",
  year: "",
  mileage: "",
  plate: "",
  expectedPrice: "",
  description: "",
};

export default function SellPage() {
  const [requestType, setRequestType] = useState<RequestType>("consignacion");
  const [form, setForm] = useState(initialForm);
  const [photoNames, setPhotoNames] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const requestLabel = requestType === "consignacion" ? "Consignación virtual" : "Compra directa";
    const message = [
      `SOLICITUD DE ${requestLabel.toUpperCase()}`,
      `Ciudad: ${form.city}`,
      `Vehículo: ${form.brand} ${form.model}`,
      `Año: ${form.year}`,
      `Kilometraje: ${form.mileage} km`,
      `Patente: ${form.plate || "No informada"}`,
      `Precio esperado: ${form.expectedPrice}`,
      `Fotos seleccionadas: ${photoNames.length ? photoNames.join(", ") : "Ninguna"}`,
      `Descripción: ${form.description || "Sin descripción adicional."}`,
    ].join("\n");

    if (supabase) {
      const { error: insertError } = await supabase.from("leads").insert({
        source: "general",
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        message,
      });
      if (insertError) {
        setError("No pudimos enviar la solicitud. Intenta nuevamente o escríbenos por WhatsApp.");
        setSubmitting(false);
        return;
      }
    }

    setSubmitting(false);
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f9fc] text-[#071a33]">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/15 bg-[#071a33]/90 text-white shadow-[0_8px_30px_rgba(7,26,51,0.18)] backdrop-blur-md">
        <div className="mx-auto flex min-h-[78px] max-w-[1240px] flex-wrap items-center justify-between gap-y-3 px-5 py-3 sm:px-8 sm:py-0">
          <Link href="/" className="flex items-center gap-3" aria-label="Melimotors inicio"><img src="/melimotors-logo.png" alt="Melimotors" className="h-10 w-[132px] object-contain object-left" /></Link>
          <nav className="order-3 flex w-full items-center gap-6 overflow-x-auto border-t border-white/10 pt-3 text-sm font-medium text-white/80 scrollbar-none md:order-none md:w-auto md:flex-1 md:justify-center md:gap-8 md:border-0 md:pt-0" aria-label="Navegación principal">
            <Link href="/" className="shrink-0 transition hover:text-white">Inicio</Link><Link href="/catalogo" className="shrink-0 transition hover:text-white">Catálogo</Link><Link href="/vender" className="shrink-0 text-white transition">Vender</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-[1240px] px-5 pb-14 pt-[170px] sm:px-8 sm:pb-20">
        <div className="max-w-[780px]"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#176bff]">Vende con Melimotors</p><h1 className="mt-4 text-5xl font-semibold leading-[0.98] tracking-[-0.07em] text-[#071a33] sm:text-7xl">Dale un buen destino a tu auto.</h1><p className="mt-6 max-w-[650px] text-lg leading-8 text-[#5c7082]">Elige la alternativa que más te acomoda y recibe una orientación clara para venderlo.</p></div>
      </section>

      <section className="border-y border-[#d9e4ef] bg-white">
        <div className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 sm:py-20"><div className="grid gap-5 md:grid-cols-2">
          <article className="rounded-[16px] border border-[#176bff] bg-[#eaf4ff] p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#176bff]">Alternativa 01</p><h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">Consignación virtual</h2><p className="mt-3 text-sm leading-6 text-[#5c7082]">Publicamos tu vehículo, recibimos interesados y coordinamos el proceso contigo, sin que tengas que gestionar cada contacto.</p><ul className="mt-6 space-y-3 text-sm font-medium text-[#17324f]"><li className="flex items-center gap-2"><Check size={17} className="text-[#176bff]" aria-hidden="true" /> Evaluamos la información de tu auto.</li><li className="flex items-center gap-2"><Check size={17} className="text-[#176bff]" aria-hidden="true" /> Definimos condiciones y precio de publicación.</li><li className="flex items-center gap-2"><Check size={17} className="text-[#176bff]" aria-hidden="true" /> Acompañamos las conversaciones con compradores.</li></ul></article>
          <article className="rounded-[16px] border border-[#d9e4ef] bg-[#f7f9fc] p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#176bff]">Alternativa 02</p><h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">Compra directa</h2><p className="mt-3 text-sm leading-6 text-[#5c7082]">Analizamos tu vehículo y, si se ajusta a nuestro inventario, te presentamos una propuesta directa para conversar.</p><ul className="mt-6 space-y-3 text-sm font-medium text-[#17324f]"><li className="flex items-center gap-2"><Check size={17} className="text-[#0b8a9e]" aria-hidden="true" /> Respuesta inicial con información completa.</li><li className="flex items-center gap-2"><Check size={17} className="text-[#0b8a9e]" aria-hidden="true" /> Revisión del estado y antecedentes.</li><li className="flex items-center gap-2"><Check size={17} className="text-[#0b8a9e]" aria-hidden="true" /> Propuesta clara, sin obligación de aceptar.</li></ul></article>
        </div></div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 sm:py-20"><div className="max-w-[700px]"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#176bff]">Cómo funciona</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#071a33] sm:text-4xl">Tres pasos para comenzar.</h2></div><div className="mt-8 grid gap-4 md:grid-cols-3">{[{ n: "01", title: "Cuéntanos sobre tu auto", text: "Completa el formulario con sus datos, fotos y el precio que esperas recibir." }, { n: "02", title: "Revisamos tu solicitud", text: "Analizamos la información y te contactamos para resolver tus dudas." }, { n: "03", title: "Definimos el camino", text: "Conversamos si conviene consignar o avanzar con una compra directa." }].map((step) => <div key={step.n} className="border-l border-[#b8c9da] pl-5"><span className="text-sm font-bold text-[#176bff]">{step.n}</span><h3 className="mt-5 text-lg font-semibold text-[#17324f]">{step.title}</h3><p className="mt-2 text-sm leading-6 text-[#5c7082]">{step.text}</p></div>)}</div></section>

      <section id="solicitud" className="border-t border-[#d9e4ef] bg-[#eaf4ff]"><div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.7fr_1.3fr] lg:items-start"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#176bff]">Solicitud de evaluación</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#071a33] sm:text-4xl">Cuéntanos todo sobre tu vehículo.</h2><p className="mt-4 text-base leading-7 text-[#5c7082]">Mientras más información recibamos, mejor podremos orientarte.</p><div className="mt-8 rounded-[12px] border border-[#b9d0e8] bg-white/70 p-4 text-sm leading-6 text-[#51687d]"><strong className="text-[#17324f]">Importante:</strong> la evaluación inicial es informativa y no garantiza una oferta final.</div></div>
        <div className="rounded-[16px] border border-[#d9e4ef] bg-white p-6 shadow-[0_14px_40px_rgba(7,26,51,0.06)] sm:p-8">
          {submitted ? <div className="flex min-h-[420px] flex-col items-center justify-center text-center"><Check size={38} className="text-[#0b8a9e]" aria-hidden="true" /><h2 className="mt-5 text-2xl font-semibold">Recibimos tu solicitud.</h2><p className="mt-3 max-w-[360px] text-sm leading-6 text-[#5c7082]">Nuestro equipo revisará los antecedentes y te contactará para continuar.</p><button type="button" onClick={() => { setSubmitted(false); setForm(initialForm); setPhotoNames([]); }} className="mt-7 rounded-[10px] border border-[#b8c9da] px-5 py-3 text-sm font-semibold text-[#17324f]">Enviar otra solicitud</button></div> : <form onSubmit={handleSubmit} className="space-y-5">
            <div><p className="text-sm font-semibold text-[#17324f]">¿Qué alternativa te interesa?</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setRequestType("consignacion")} className={`rounded-[10px] border px-4 py-3 text-left text-sm font-semibold transition ${requestType === "consignacion" ? "border-[#176bff] bg-[#eaf4ff] text-[#176bff]" : "border-[#d9e4ef] text-[#51687d] hover:border-[#176bff]"}`}>Consignación virtual<span className="mt-1 block text-xs font-normal text-[#7c8b9a]">Publicamos y acompañamos</span></button><button type="button" onClick={() => setRequestType("compra_directa")} className={`rounded-[10px] border px-4 py-3 text-left text-sm font-semibold transition ${requestType === "compra_directa" ? "border-[#176bff] bg-[#eaf4ff] text-[#176bff]" : "border-[#d9e4ef] text-[#51687d] hover:border-[#176bff]"}`}>Compra directa<span className="mt-1 block text-xs font-normal text-[#7c8b9a]">Evaluamos y proponemos</span></button></div></div>
            <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-[#17324f]">Nombre completo<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium text-[#17324f]">Teléfono<input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+56 9..." className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium text-[#17324f]">Correo electrónico<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium text-[#17324f]">Ciudad<input required value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label></div>
            <div className="border-t border-[#edf3f8] pt-5"><p className="text-sm font-semibold text-[#17324f]">Datos del vehículo</p><div className="mt-3 grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-[#17324f]">Marca<input required value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} placeholder="Toyota" className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium text-[#17324f]">Modelo<input required value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} placeholder="Corolla" className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium text-[#17324f]">Año<input required type="number" min="1900" max="2100" value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium text-[#17324f]">Kilometraje<input required type="number" min="0" value={form.mileage} onChange={(event) => setForm({ ...form, mileage: event.target.value })} placeholder="85000" className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium text-[#17324f]">Patente <span className="font-normal text-[#8a9baa]">(opcional)</span><input value={form.plate} onChange={(event) => setForm({ ...form, plate: event.target.value })} className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm uppercase outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium text-[#17324f]">Precio esperado<input required value={form.expectedPrice} onChange={(event) => setForm({ ...form, expectedPrice: event.target.value })} placeholder="$15.000.000" className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label></div></div>
            <label className="block text-sm font-medium text-[#17324f]">Descripción del vehículo <span className="font-normal text-[#8a9baa]">(estado, mantenciones, extras)</span><textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-2 min-h-[100px] w-full resize-y rounded-[10px] border border-[#d9e4ef] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#176bff]" /></label>
            <label className="flex cursor-pointer items-center gap-3 rounded-[12px] border border-dashed border-[#b8c9da] bg-[#f7f9fc] px-4 py-4 text-sm font-semibold text-[#51687d]"><ImagePlus size={19} className="shrink-0 text-[#176bff]" aria-hidden="true" /><span className="min-w-0 flex-1 truncate">{photoNames.length ? `${photoNames.length} foto(s) seleccionada(s)` : "Adjuntar fotos del vehículo"}</span><Upload size={17} aria-hidden="true" /><input type="file" accept="image/*" multiple onChange={(event) => setPhotoNames(Array.from(event.target.files ?? []).map((file) => file.name))} className="sr-only" /></label>
            {error && <p className="rounded-[10px] bg-[#fff0e9] px-3 py-2.5 text-sm text-[#c33c3c]">{error}</p>}
            <button disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#176bff] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#0d52d6] disabled:cursor-wait disabled:opacity-60">{submitting ? "Enviando solicitud..." : "Solicitar evaluación"}<ArrowRight size={17} aria-hidden="true" /></button>
          </form>}
        </div>
      </div></section>

      <a href="https://wa.me/56900000000" target="_blank" rel="noreferrer" title="Escribir por WhatsApp" aria-label="Escribir por WhatsApp" className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#25d366] shadow-[0_10px_28px_rgba(7,26,51,0.28)] transition hover:scale-105 sm:bottom-7 sm:right-7"><img src="/whatsapp-logo.png" alt="" className="h-14 w-14 rounded-full object-cover" /></a>
    </main>
  );
}
