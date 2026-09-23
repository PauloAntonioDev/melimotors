import Link from "next/link";
import { MapPin, MessageCircle } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#071a33] text-white">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.2fr_0.7fr_1fr] md:py-16">
        <div>
          <img src="/melimotors-logo.png" alt="Melimotors" className="h-12 w-[158px] object-contain object-left" />
          <p className="mt-5 max-w-[360px] text-sm leading-6 text-white/65">Autos usados seleccionados en Talca, con información clara y acompañamiento para decidir mejor.</p>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[#18c8ff]">Explora</h2>
          <nav className="mt-5 flex flex-col items-start gap-3 text-sm text-white/70" aria-label="Enlaces del pie de página"><Link href="/" className="transition hover:text-white">Inicio</Link><Link href="/catalogo" className="transition hover:text-white">Catálogo</Link><Link href="/vender" className="transition hover:text-white">Vender</Link></nav>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[#18c8ff]">Hablemos</h2>
          <div className="mt-5 space-y-4 text-sm text-white/70"><p className="flex items-start gap-3"><MapPin size={18} className="mt-0.5 shrink-0 text-[#18c8ff]" aria-hidden="true" />Talca, Región del Maule</p><a href="https://wa.me/56900000000" target="_blank" rel="noreferrer" className="flex items-center gap-3 transition hover:text-white"><MessageCircle size={18} className="text-[#18c8ff]" aria-hidden="true" />Escribir por WhatsApp</a></div>
        </div>
      </div>
      <div className="border-t border-white/10"><div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-5 py-5 text-xs text-white/45 sm:px-8 md:flex-row md:items-center md:justify-between"><span>© 2026 Melimotors</span><span>Información referencial · Vehículos sujetos a disponibilidad</span></div></div>
    </footer>
  );
}
