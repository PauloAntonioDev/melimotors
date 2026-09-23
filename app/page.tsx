"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CarFront,
  ChevronDown,
  ClipboardCheck,
  CircleDollarSign,
  FileText,
  Fuel,
  Gauge,
  KeyRound,
  MessageCircle,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { demoVehicles, vehicleImage } from "@/lib/demo-data";
import { isSupabaseConfigured, publicStorageUrl, supabase } from "@/lib/supabase";
import type { Vehicle } from "@/lib/types";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);

const formatMileage = (value: number) =>
  new Intl.NumberFormat("es-CL").format(value);

const readableFuel = (value: string) =>
  ({ benzina: "Bencina", diesel: "Diésel", hybrid: "Híbrido", electric: "Eléctrico" }[
    value
  ] ?? value);

const readableTransmission = (value: string) =>
  ({ automatic: "Automática", manual: "Manual", cvt: "CVT" }[value] ?? value);

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <article className="group overflow-hidden rounded-[20px] border border-[#d9e4ef] bg-white shadow-[0_14px_40px_rgba(31,35,31,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(31,35,31,0.12)]">
      <Link href={`/vehiculos/${vehicle.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#dbe6f0]">
          <img
            src={vehicleImage(vehicle)}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
          />
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span className="rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#071a33] shadow-sm">
              {vehicle.status === "reservado" ? "Reservado" : "Disponible"}
            </span>
          </div>
          <span className="absolute bottom-4 right-4 rounded-full bg-[#071a33]/90 px-3 py-1.5 text-xs font-medium text-white">
            {vehicle.stock_code}
          </span>
        </div>
        <div className="space-y-5 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2b6bd9]">
              {vehicle.model_year} · {readableFuel(vehicle.fuel_type)}
            </p>
            <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.03em] text-[#071a33]">
              {vehicle.brand} {vehicle.model}
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-3 border-y border-[#e0e9f2] py-4 text-[13px] text-[#5c7082]">
            <span className="flex min-w-0 items-center gap-1.5">
              <Gauge size={15} aria-hidden="true" />
              <span className="truncate">{formatMileage(vehicle.mileage_km)} km</span>
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              <KeyRound size={15} aria-hidden="true" />
              <span className="truncate">{readableTransmission(vehicle.transmission)}</span>
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              <Fuel size={15} aria-hidden="true" />
              <span className="truncate">{readableFuel(vehicle.fuel_type)}</span>
            </span>
          </div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-[#7c8b9a]">Precio publicado</p>
              <p className="mt-1 text-xl font-semibold text-[#071a33]">
                {formatCurrency(vehicle.sale_price_clp)}
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf4ff] text-[#14334f] transition group-hover:bg-[#176bff] group-hover:text-white">
              <ArrowRight size={18} aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function Home() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(demoVehicles);
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("Todas");
  const [maxPrice, setMaxPrice] = useState("Todos");
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase
      .from("public_vehicle_catalog")
      .select("*")
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        if (data?.length) {
          setVehicles(
            data.map((item) => ({
              ...item,
              cover_url: publicStorageUrl(item.cover_storage_path),
            })) as Vehicle[],
          );
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const brands = useMemo(
    () => ["Todas", ...Array.from(new Set(vehicles.map((vehicle) => vehicle.brand)))],
    [vehicles],
  );

  const filteredVehicles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      const matchesQuery =
        !normalized ||
        `${vehicle.brand} ${vehicle.model} ${vehicle.model_year}`
          .toLowerCase()
          .includes(normalized);
      const matchesBrand = brand === "Todas" || vehicle.brand === brand;
      const matchesPrice =
        maxPrice === "Todos" || vehicle.sale_price_clp <= Number(maxPrice);
      return matchesQuery && matchesBrand && matchesPrice;
    });
  }, [brand, maxPrice, query, vehicles]);

  return (
    <main id="inicio" className="min-h-screen overflow-x-hidden bg-[#f7f9fc] text-[#071a33]">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/15 bg-[#071a33]/90 text-white shadow-[0_8px_30px_rgba(7,26,51,0.18)] backdrop-blur-md">
        <div className="mx-auto flex min-h-[78px] max-w-[1240px] flex-wrap items-center justify-between gap-y-3 px-5 py-3 sm:px-8 sm:py-0">
          <Link href="/" className="flex items-center gap-3" aria-label="Melimotors inicio">
            <img src="/melimotors-logo.png" alt="Melimotors" className="h-10 w-[132px] object-contain object-left" />
          </Link>
          <nav className="order-3 flex w-full items-center gap-6 overflow-x-auto border-t border-white/10 pt-3 text-sm font-medium text-white/80 scrollbar-none md:order-none md:w-auto md:flex-1 md:justify-center md:gap-8 md:border-0 md:pt-0" aria-label="Navegación principal">
            <a href="#inicio" className="shrink-0 transition hover:text-white">Inicio</a>
            <a href="#inventario" className="shrink-0 transition hover:text-white">Comprar</a>
            <a href="#vender" className="shrink-0 transition hover:text-white">Vender</a>
            <a href="#financiamiento" className="shrink-0 transition hover:text-white">Créditos</a>
            <a href="#blog" className="shrink-0 transition hover:text-white">Blog</a>
            <a href="#nosotros" className="shrink-0 transition hover:text-white">Nosotros</a>
          </nav>
        </div>
      </header>

      <section className="relative isolate flex min-h-[640px] items-end overflow-hidden bg-[#071a33] pt-[126px] md:pt-[78px]">
        <img
          src="/talca.jpg"
          alt="Entrada de Talca con el letrero de la ciudad"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-[#071a33]/65" />
        <div className="absolute inset-0 -z-10 bg-[#071a33]/20 sm:w-[68%]" />
        <div className="mx-auto w-full max-w-[1240px] px-5 pb-20 sm:px-8 sm:pb-24">
          <div className="max-w-[650px] text-white">
            <h1 className="max-w-[570px] text-[clamp(2.4rem,4.8vw,4.7rem)] font-semibold leading-[0.96] tracking-[-0.06em]">
              <span className="block">Tu próximo auto</span>
              <span className="block text-[#176bff]">está aquí</span>
            </h1>
            <p className="mt-6 max-w-[510px] text-sm leading-6 text-white/75 sm:text-base">
              Encuentra vehículos revisados y opciones de financiamiento adaptadas a ti en Talca.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a href="#inventario" className="inline-flex items-center gap-2 rounded-[10px] bg-[#176bff] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#0d52d6]">
                Ver inventario <ArrowRight size={17} aria-hidden="true" />
              </a>
              <a href="#contacto" className="inline-flex items-center gap-2 rounded-[10px] border border-white/30 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">
                <MessageCircle size={17} aria-hidden="true" /> Hablar con Melimotors
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="inventario" className="mx-auto max-w-[1240px] scroll-mt-28 px-5 py-20 sm:px-8 sm:py-28 md:scroll-mt-24">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#176bff]">Stock disponible</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#071a33] sm:text-5xl">Encuentra el que te mueve.</h2>
            <p className="mt-4 max-w-[560px] text-base leading-7 text-[#5c7082]">Explora nuestro inventario actual y revisa cada detalle antes de visitarnos.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#6c7c8d]">
            <span className="h-2 w-2 rounded-full bg-[#0b8a9e]" />
            {loading ? "Actualizando inventario" : `${filteredVehicles.length} vehículos publicados`}
          </div>
        </div>

        <div className="mt-10 grid gap-3 rounded-[18px] border border-[#d9e4ef] bg-white p-3 shadow-[0_12px_35px_rgba(31,35,31,0.04)] sm:grid-cols-[1.4fr_0.8fr_0.8fr_auto] sm:items-center">
          <label className="relative flex items-center">
            <Search size={18} className="pointer-events-none absolute left-4 text-[#8a9baa]" aria-hidden="true" />
            <span className="sr-only">Buscar marca o modelo</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar marca o modelo" className="h-12 w-full rounded-[12px] border border-[#ece9e2] bg-[#ffffff] pl-11 pr-4 text-sm text-[#071a33] outline-none transition placeholder:text-[#8a9baa] focus:border-[#176bff]" />
          </label>
          <label className="relative flex items-center">
            <span className="sr-only">Filtrar por marca</span>
            <select value={brand} onChange={(event) => setBrand(event.target.value)} className="h-12 w-full appearance-none rounded-[12px] border border-[#ece9e2] bg-[#ffffff] px-4 pr-10 text-sm text-[#405b72] outline-none focus:border-[#176bff]">
              {brands.map((item) => <option key={item}>{item}</option>)}
            </select>
            <ChevronDown size={17} className="pointer-events-none absolute right-4 text-[#7c8b9a]" aria-hidden="true" />
          </label>
          <label className="relative flex items-center">
            <span className="sr-only">Filtrar por precio máximo</span>
            <select value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} className="h-12 w-full appearance-none rounded-[12px] border border-[#ece9e2] bg-[#ffffff] px-4 pr-10 text-sm text-[#405b72] outline-none focus:border-[#176bff]">
              <option value="Todos">Cualquier precio</option>
              <option value="13000000">Hasta $13.000.000</option>
              <option value="16000000">Hasta $16.000.000</option>
              <option value="20000000">Hasta $20.000.000</option>
            </select>
            <ChevronDown size={17} className="pointer-events-none absolute right-4 text-[#7c8b9a]" aria-hidden="true" />
          </label>
          <span className="hidden items-center justify-center px-3 text-[#7c8b9a] sm:flex" title="Filtros de inventario">
            <SlidersHorizontal size={19} aria-hidden="true" />
          </span>
        </div>

        {filteredVehicles.length ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredVehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} />)}
          </div>
        ) : (
          <div className="mt-8 flex min-h-[260px] flex-col items-center justify-center rounded-[20px] border border-dashed border-[#d9e4ef] bg-white text-center">
            <CarFront size={30} className="text-[#8a9baa]" aria-hidden="true" />
            <p className="mt-4 font-semibold text-[#17324f]">No encontramos vehículos con esos filtros.</p>
            <button onClick={() => { setQuery(""); setBrand("Todas"); setMaxPrice("Todos"); }} className="mt-3 text-sm font-semibold text-[#176bff] hover:underline">Limpiar búsqueda</button>
          </div>
        )}
      </section>

      <section id="vender" className="scroll-mt-28 bg-[#071a33] text-white md:scroll-mt-24">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-5 py-16 sm:px-8 sm:py-20 md:flex-row md:items-center md:justify-between">
          <div className="max-w-[620px]">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#18c8ff]"><Sparkles size={15} aria-hidden="true" /> Vende con respaldo</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Tu auto puede ser el próximo en nuestro inventario.</h2>
            <p className="mt-4 text-base leading-7 text-white/70">Cuéntanos sobre tu vehículo y coordinamos una primera conversación clara, sin compromisos.</p>
          </div>
          <a href="#contacto" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] bg-[#176bff] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#0d52d6]">Quiero vender mi auto <ArrowRight size={17} aria-hidden="true" /></a>
        </div>
      </section>

      <section id="financiamiento" className="scroll-mt-28 border-y border-[#e1ded6] bg-[#eaf4ff] md:scroll-mt-24">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#176bff]">Compra a tu ritmo</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#071a33] sm:text-5xl">Calcula una cuota que te haga sentido.</h2>
            <p className="mt-5 max-w-[480px] text-base leading-7 text-[#5c7082]">Cada vehículo incluye un cálculo referencial para que llegues a conversar con una idea clara.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {["Elige tu vehículo", "Define tu pie", "Conoce tu cuota"].map((step, index) => (
              <div key={step} className="border-l border-[#c9d0c8] pl-4 sm:min-h-[126px]">
                <span className="text-sm font-bold text-[#176bff]">0{index + 1}</span>
                <p className="mt-8 text-base font-semibold text-[#16334f]">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="blog" className="mx-auto max-w-[1240px] scroll-mt-28 px-5 py-16 sm:px-8 sm:py-20 md:scroll-mt-24">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#176bff]">Blog Melimotors</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#071a33] sm:text-4xl">Decisiones claras antes de moverte.</h2>
          </div>
          <span className="text-sm text-[#5c7082]">Consejos para comprar mejor</span>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { icon: ClipboardCheck, title: "Qué revisar en un auto usado", text: "Una mirada práctica a los detalles que conviene comprobar antes de decidir." },
            { icon: CircleDollarSign, title: "Cómo pensar el financiamiento", text: "Precio, pie y cuota: las variables que vale la pena conversar con calma." },
            { icon: FileText, title: "Documentos que debes pedir", text: "La información que ayuda a comprar con más claridad y menos sorpresas." },
          ].map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-[18px] border border-[#d9e4ef] bg-white p-5 shadow-[0_12px_35px_rgba(7,26,51,0.05)]">
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#eaf4ff] text-[#176bff]"><Icon size={19} aria-hidden="true" /></span>
              <h3 className="mt-5 text-lg font-semibold tracking-[-0.03em] text-[#071a33]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#5c7082]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="nosotros" className="scroll-mt-28 border-y border-[#d9e4ef] bg-white md:scroll-mt-24">
        <div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-16 sm:px-8 sm:py-20 md:grid-cols-[0.8fr_1.2fr] md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#176bff]">Sobre Melimotors</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#071a33] sm:text-4xl">Comprar un auto también puede ser claro.</h2>
          </div>
          <p className="max-w-[620px] text-base leading-8 text-[#5c7082]">Somos una automotora enfocada en seleccionar vehículos, explicar la información importante y acompañar cada conversación con transparencia. Menos ruido, mejores decisiones.</p>
        </div>
      </section>

      <section id="contacto" className="mx-auto flex max-w-[1240px] flex-col gap-8 px-5 py-16 sm:px-8 sm:py-20 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#176bff]">Visítanos</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#071a33]">Conversemos sobre tu próximo auto.</h2>
          <p className="mt-3 text-[#5c7082]">Agenda una visita o escríbenos por WhatsApp.</p>
        </div>
        <div className="flex flex-wrap gap-3">
            <a href="https://wa.me/56900000000" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-[10px] bg-[#0b8a9e] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#086a7d]"><MessageCircle size={17} aria-hidden="true" /> WhatsApp</a>
        </div>
      </section>

      <a
        href="https://wa.me/56900000000"
        target="_blank"
        rel="noreferrer"
        title="Escribir por WhatsApp"
        aria-label="Escribir por WhatsApp"
        className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_10px_28px_rgba(7,26,51,0.28)] transition hover:scale-105 hover:bg-[#1daf57] sm:bottom-7 sm:right-7"
      >
        <MessageCircle size={25} strokeWidth={2.2} aria-hidden="true" />
      </a>

      <footer className="border-t border-[#e1ded6] bg-[#071a33] text-white">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-5 py-8 text-sm text-white/60 sm:px-8 md:flex-row md:items-center md:justify-between">
          <p><span className="font-semibold text-white">MELIMOTORS</span> · Automotora</p>
          <p>Información referencial. Vehículos sujetos a disponibilidad.</p>
        </div>
      </footer>
    </main>
  );
}
