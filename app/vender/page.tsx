import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

export default function SellPage() {
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

      <section className="mx-auto flex min-h-screen max-w-[1240px] items-center px-5 pb-16 pt-[170px] sm:px-8 sm:pb-24">
        <div className="max-w-[760px]"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#176bff]">Vende con Melimotors</p><h1 className="mt-4 text-5xl font-semibold leading-[0.98] tracking-[-0.07em] text-[#071a33] sm:text-7xl">Dale un buen destino a tu auto.</h1><p className="mt-6 max-w-[620px] text-lg leading-8 text-[#5c7082]">Cuéntanos sobre tu vehículo y conversemos una propuesta clara, sin compromisos.</p><div className="mt-9 flex flex-wrap gap-3"><a href="https://wa.me/56900000000" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-[10px] bg-[#176bff] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#0d52d6]"><MessageCircle size={17} aria-hidden="true" /> Hablar por WhatsApp</a><Link href="/catalogo" className="inline-flex items-center gap-2 rounded-[10px] border border-[#b8c9da] px-5 py-3.5 text-sm font-semibold text-[#17324f] transition hover:bg-white"><ArrowRight size={17} aria-hidden="true" /> Ver catálogo</Link></div></div>
      </section>

      <a href="https://wa.me/56900000000" target="_blank" rel="noreferrer" title="Escribir por WhatsApp" aria-label="Escribir por WhatsApp" className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#25d366] shadow-[0_10px_28px_rgba(7,26,51,0.28)] transition hover:scale-105 sm:bottom-7 sm:right-7"><img src="/whatsapp-logo.png" alt="" className="h-14 w-14 rounded-full object-cover" /></a>
    </main>
  );
}
