"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  ExternalLink,
  ImagePlus,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Upload,
  Users,
  X,
} from "lucide-react";
import { demoLeads, demoVehicles, vehicleImage } from "@/lib/demo-data";
import AdminProposals from "@/components/admin-proposals";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Lead, LeadStatus, ProposalStatus, Vehicle, VehicleForm, VehicleProposal, VehicleProposalForm, VehicleStatus } from "@/lib/types";

const emptyForm: VehicleForm = {
  stock_code: "",
  brand: "",
  model: "",
  model_year: "2022",
  mileage_km: "0",
  fuel_type: "benzina",
  transmission: "automatic",
  description: "",
  sale_price_clp: "",
  purchase_cost_clp: "",
  transfer_cost_clp: "0",
  reconditioning_cost_clp: "0",
  transport_cost_clp: "0",
  other_cost_clp: "0",
  inspection_pre_purchase_cost_clp: "0",
  advertising_cost_clp: "0",
  acquisition_type: "compra_directa",
  minimum_sale_price_clp: "0",
  commission_pct: "0",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);

const statusLabel: Record<VehicleStatus, string> = {
  borrador: "Borrador",
  disponible: "Disponible",
  reservado: "Reservado",
  vendido: "Vendido",
  archivado: "Archivado",
};

const leadStatusLabel: Record<LeadStatus, string> = {
  nueva: "Nueva",
  contactada: "Contactada",
  "en seguimiento": "En seguimiento",
  cerrada: "Cerrada",
  perdida: "Perdida",
};

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function Metric({ label, value, detail, icon: Icon, tone = "neutral" }: { label: string; value: string; detail: string; icon: typeof BarChart3; tone?: "neutral" | "green" | "red" }) {
  return (
    <div className="rounded-[16px] border border-[#d9e4ef] bg-white p-5 shadow-[0_10px_25px_rgba(31,35,31,0.04)]">
      <div className="flex items-start justify-between gap-3"><p className="text-sm text-[#6c7c8d]">{label}</p><span className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${tone === "green" ? "bg-[#e7f4f1] text-[#0b8a9e]" : tone === "red" ? "bg-[#fff0e9] text-[#176bff]" : "bg-[#eaf4ff] text-[#5c7082]"}`}><Icon size={18} aria-hidden="true" /></span></div>
      <p className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-[#071a33]">{value}</p>
      <p className="mt-1 text-xs text-[#8a9baa]">{detail}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: VehicleStatus }) {
  const style = status === "disponible" ? "bg-[#e7f4f1] text-[#0b8a9e]" : status === "reservado" ? "bg-[#fff4d8] text-[#f0b44d]" : status === "vendido" ? "bg-[#eee9e3] text-[#6e655a]" : "bg-[#eaf4ff] text-[#5c7082]";
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.09em] ${style}`}>{statusLabel[status]}</span>;
}

export default function AdminPage() {
  const localDemoMode = !isSupabaseConfigured && process.env.NODE_ENV !== "production";
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loginError, setLoginError] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>(isSupabaseConfigured ? [] : demoVehicles);
  const [leads, setLeads] = useState<Lead[]>(isSupabaseConfigured ? [] : demoLeads);
  const [proposals, setProposals] = useState<VehicleProposal[]>([]);
  const [form, setForm] = useState<VehicleForm>(emptyForm);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [activeView, setActiveView] = useState<"overview" | "leads" | "proposals" | "settings">("overview");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUserEmail(session?.user?.email ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !userEmail) return;
    void loadData();
  }, [userEmail]);

  async function loadData() {
    if (!supabase) return;
    setLoading(true);
    const [vehicleResponse, leadResponse, proposalResponse] = await Promise.all([
      supabase.from("vehicles").select("*, vehicle_costs(*)").order("created_at", { ascending: false }),
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase.from("vehicle_proposals").select("*").order("created_at", { ascending: false }),
    ]);
    if (!vehicleResponse.error) {
      setVehicles((vehicleResponse.data ?? []).map((item) => {
        const costs = Array.isArray(item.vehicle_costs) ? item.vehicle_costs[0] : item.vehicle_costs;
        const operatingCostTotal = Number(costs?.total_cost_clp ?? 0);
        const commissionAmount = Number(costs?.commission_amount_clp ?? 0);
        const salePrice = Number(item.sale_price_clp);
        const dealerEarnings = item.acquisition_type === "consignacion" ? commissionAmount - operatingCostTotal : salePrice - operatingCostTotal;
        const clientProceeds = item.acquisition_type === "consignacion" ? salePrice - commissionAmount : undefined;
        return { ...item, cost_total_clp: operatingCostTotal, commission_amount_clp: commissionAmount, client_estimated_proceeds_clp: clientProceeds, gross_margin_clp: dealerEarnings, margin_pct: salePrice ? (dealerEarnings / salePrice) * 100 : 0 } as Vehicle;
      }));
    }
    if (!leadResponse.error) setLeads((leadResponse.data ?? []) as Lead[]);
    if (!proposalResponse.error) setProposals((proposalResponse.data ?? []) as VehicleProposal[]);
    setLoading(false);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginError("No pudimos iniciar sesión. Revisa tus datos o la autorización del administrador.");
  }

  async function handleLogout() {
    await supabase?.auth.signOut();
    setUserEmail(null);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    const numeric = (value: string) => Number(value || 0);
    const salePrice = numeric(form.sale_price_clp);
    const minimumSalePrice = numeric(form.minimum_sale_price_clp);
    const commissionPct = numeric(form.commission_pct);
    if (minimumSalePrice > salePrice) {
      setNotice("El precio mínimo no puede superar el precio de venta publicado.");
      setSaving(false);
      return;
    }
    if (commissionPct < 0 || commissionPct > 100) {
      setNotice("La comisión debe estar entre 0% y 100%.");
      setSaving(false);
      return;
    }
    const commissionAmount = form.acquisition_type === "consignacion" ? Math.round((salePrice * commissionPct) / 100) : 0;
    const totalCost = [form.purchase_cost_clp, form.transfer_cost_clp, form.reconditioning_cost_clp, form.transport_cost_clp, form.other_cost_clp, form.inspection_pre_purchase_cost_clp, form.advertising_cost_clp].reduce((sum, value) => sum + numeric(value), 0);
    const dealerEarnings = form.acquisition_type === "consignacion" ? commissionAmount - totalCost : salePrice - totalCost;
    const slug = slugify(`${form.brand}-${form.model}-${form.model_year}-${form.stock_code}`);

    if (!supabase) {
      const localVehicle: Vehicle = {
        id: `demo-${Date.now()}`,
        stock_code: form.stock_code,
        slug,
        brand: form.brand,
        model: form.model,
        model_year: numeric(form.model_year),
        mileage_km: numeric(form.mileage_km),
        fuel_type: form.fuel_type,
        transmission: form.transmission,
        description: form.description,
        sale_price_clp: salePrice,
        minimum_sale_price_clp: minimumSalePrice,
        acquisition_type: form.acquisition_type,
        status: coverFile ? "disponible" : "borrador",
        cover_url: "/melimotors-showroom.png",
        cost_total_clp: totalCost,
        commission_amount_clp: commissionAmount,
        client_estimated_proceeds_clp: form.acquisition_type === "consignacion" ? salePrice - commissionAmount : undefined,
        gross_margin_clp: dealerEarnings,
        margin_pct: salePrice ? (dealerEarnings / salePrice) * 100 : 0,
      };
      setVehicles((current) => [localVehicle, ...current]);
      setNotice(coverFile ? "Vehículo agregado al inventario demo." : "Vehículo guardado como borrador: agrega una foto para publicarlo.");
      setForm(emptyForm);
      setCoverFile(null);
      setShowCreate(false);
      setSaving(false);
      return;
    }

    const { data: vehicle, error } = await supabase.from("vehicles").insert({
      stock_code: form.stock_code,
      slug,
      brand: form.brand,
      model: form.model,
      model_year: numeric(form.model_year),
      mileage_km: numeric(form.mileage_km),
      fuel_type: form.fuel_type,
      transmission: form.transmission,
      description: form.description,
      sale_price_clp: numeric(form.sale_price_clp),
      minimum_sale_price_clp: minimumSalePrice,
      acquisition_type: form.acquisition_type,
      status: "borrador",
    }).select().single();

    if (error || !vehicle) {
      setNotice(error?.message ?? "No pudimos crear el vehículo.");
      setSaving(false);
      return;
    }

    const { error: costsError } = await supabase.from("vehicle_costs").insert({
      vehicle_id: vehicle.id,
      purchase_cost_clp: numeric(form.purchase_cost_clp),
      transfer_cost_clp: numeric(form.transfer_cost_clp),
      reconditioning_cost_clp: numeric(form.reconditioning_cost_clp),
      transport_cost_clp: numeric(form.transport_cost_clp),
      commission_pct: commissionPct,
      other_cost_clp: numeric(form.other_cost_clp),
      inspection_pre_purchase_cost_clp: numeric(form.inspection_pre_purchase_cost_clp),
      advertising_cost_clp: numeric(form.advertising_cost_clp),
    });

    if (costsError) {
      setNotice("El vehículo se creó, pero no pudimos guardar sus costos. Revisa los valores e inténtalo nuevamente.");
      setSaving(false);
      await loadData();
      return;
    }

    if (coverFile) {
      const path = `${vehicle.id}/${crypto.randomUUID()}-${coverFile.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const upload = await supabase.storage.from("vehicle-images").upload(path, coverFile, { upsert: false });
      if (!upload.error) {
        await supabase.from("vehicle_images").insert({ vehicle_id: vehicle.id, storage_path: path, sort_order: 0, is_cover: true });
        const publish = await supabase.from("vehicles").update({ status: "disponible" }).eq("id", vehicle.id);
        if (publish.error) setNotice("El vehículo se guardó como borrador porque la publicación requiere completar sus imágenes.");
      } else {
        setNotice("El vehículo se guardó, pero no pudimos subir la portada.");
      }
    }
    await loadData();
    setForm(emptyForm);
    setCoverFile(null);
    setShowCreate(false);
    setSaving(false);
  }

  async function handleVehicleStatus(id: string, status: VehicleStatus) {
    if (!supabase) {
      setVehicles((current) => current.map((item) => item.id === id ? { ...item, status } : item));
      setNotice("Estado actualizado en el modo demo.");
      return;
    }
    const { error } = await supabase.from("vehicles").update({ status }).eq("id", id);
    setNotice(error ? "La regla de negocio rechazó ese cambio. Revisa reserva, venta o imágenes." : "Estado actualizado.");
    await loadData();
  }

  async function handleLeadStatus(id: string, status: LeadStatus) {
    if (!supabase) {
      setLeads((current) => current.map((item) => item.id === id ? { ...item, status } : item));
      return;
    }
    await supabase.from("leads").update({ status }).eq("id", id);
    await loadData();
  }

  async function handleCreateProposal(proposal: VehicleProposalForm) {
    const numeric = (value: string) => Number(value || 0);
    if (!supabase) {
      const localProposal: VehicleProposal = {
        id: `proposal-${Date.now()}`,
        ...proposal,
        status: "nueva",
        vehicle_id: null,
        vehicle_year: proposal.vehicle_year ? numeric(proposal.vehicle_year) : null,
        vehicle_mileage_km: numeric(proposal.vehicle_mileage_km),
        expected_price_clp: numeric(proposal.expected_price_clp),
        created_at: new Date().toISOString(),
      };
      setProposals((current) => [localProposal, ...current]);
      setNotice("Propuesta guardada en el modo demo.");
      return true;
    }

    const { error } = await supabase.from("vehicle_proposals").insert({
      source: proposal.source,
      acquisition_type: proposal.acquisition_type,
      seller_name: proposal.seller_name,
      seller_phone: proposal.seller_phone,
      seller_email: proposal.seller_email || null,
      vehicle_plate: proposal.vehicle_plate || null,
      vehicle_brand: proposal.vehicle_brand,
      vehicle_model: proposal.vehicle_model,
      vehicle_year: proposal.vehicle_year ? numeric(proposal.vehicle_year) : null,
      vehicle_mileage_km: numeric(proposal.vehicle_mileage_km),
      expected_price_clp: numeric(proposal.expected_price_clp),
      vehicle_description: proposal.vehicle_description || null,
      conversation_summary: proposal.conversation_summary || null,
      internal_notes: proposal.internal_notes || null,
    });
    if (error) {
      setNotice(error.message || "No pudimos guardar la propuesta.");
      return false;
    }
    setNotice("Propuesta guardada correctamente.");
    await loadData();
    return true;
  }

  async function handleProposalStatus(id: string, status: ProposalStatus) {
    if (!supabase) {
      setProposals((current) => current.map((proposal) => proposal.id === id ? { ...proposal, status } : proposal));
      setNotice("Estado de propuesta actualizado en el modo demo.");
      return;
    }
    const { error } = await supabase.from("vehicle_proposals").update({ status }).eq("id", id);
    setNotice(error ? "No pudimos actualizar el estado de la propuesta." : "Estado de propuesta actualizado.");
    await loadData();
  }

  const activeVehicles = vehicles.filter((vehicle) => ["disponible", "reservado"].includes(vehicle.status));
  const totalStockValue = activeVehicles.reduce((sum, vehicle) => sum + vehicle.sale_price_clp, 0);
  const totalMargin = activeVehicles.reduce((sum, vehicle) => sum + (vehicle.gross_margin_clp ?? 0), 0);
  const newLeads = leads.filter((lead) => lead.status === "nueva").length;
  const previewSalePrice = Number(form.sale_price_clp || 0);
  const previewCommission = form.acquisition_type === "consignacion" ? Math.round((previewSalePrice * Number(form.commission_pct || 0)) / 100) : 0;
  const previewTotalCost = [form.purchase_cost_clp, form.transfer_cost_clp, form.reconditioning_cost_clp, form.transport_cost_clp, form.other_cost_clp, form.inspection_pre_purchase_cost_clp, form.advertising_cost_clp].reduce((sum, value) => sum + Number(value || 0), 0);
  const previewProfit = form.acquisition_type === "consignacion" ? previewCommission - previewTotalCost : previewSalePrice - previewTotalCost;
  const previewClientProceeds = form.acquisition_type === "consignacion" ? previewSalePrice - previewCommission : 0;
  const previewMinimumPrice = Number(form.minimum_sale_price_clp || 0);
  const previewMinimumCommission = form.acquisition_type === "consignacion" ? Math.round((previewMinimumPrice * Number(form.commission_pct || 0)) / 100) : 0;
  const previewMinimumProfit = form.acquisition_type === "consignacion" ? previewMinimumCommission - previewTotalCost : previewMinimumPrice - previewTotalCost;

  if (isSupabaseConfigured && !userEmail) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#071a33] px-5 py-10 text-[#071a33]">
        <div className="w-full max-w-[440px] rounded-[22px] bg-[#f7f9fc] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.25)] sm:p-9">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold text-[#405b72]"><ArrowLeft size={16} aria-hidden="true" /> Volver al sitio público</Link>
          <img src="/melimotors-logo.png" alt="Melimotors" className="mt-12 h-12 w-[160px] object-contain object-left" />
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-[#176bff]">Área privada</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em]">Panel Melimotors</h1>
          <p className="mt-3 text-sm leading-6 text-[#5c7082]">Ingresa con la cuenta autorizada para administrar inventario y consultas.</p>
          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <label className="block text-sm font-medium">Correo<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-12 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label>
            <label className="block text-sm font-medium">Contraseña<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-12 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label>
            {loginError && <p className="rounded-[10px] bg-[#fff0e9] px-3 py-2.5 text-sm text-[#c33c3c]">{loginError}</p>}
            <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#176bff] text-sm font-bold text-white transition hover:bg-[#0d52d6]"><LogIn size={17} aria-hidden="true" /> Ingresar</button>
          </form>
          <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-[#8d968d]"><ShieldCheck size={15} className="mt-0.5 shrink-0" aria-hidden="true" /> El acceso está protegido por Supabase Auth y las políticas RLS del proyecto.</p>
        </div>
      </main>
    );
  }

  if (!isSupabaseConfigured && !localDemoMode) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#071a33] px-5 py-10 text-[#071a33]">
        <div className="w-full max-w-[480px] rounded-[22px] bg-[#f7f9fc] p-7 text-center shadow-[0_24px_80px_rgba(0,0,0,0.25)] sm:p-9">
          <img src="/melimotors-logo.png" alt="Melimotors" className="mx-auto mt-2 h-12 w-[160px] object-contain object-center" />
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-[#176bff]">Administración no disponible</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">Conecta Supabase para operar.</h1>
          <p className="mt-4 text-sm leading-6 text-[#5c7082]">El panel se mantiene bloqueado hasta configurar la URL y la clave pública de Supabase. El catálogo público continúa disponible.</p>
          <Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-[10px] bg-[#176bff] px-5 py-3.5 text-sm font-bold text-white">Volver al sitio público <ArrowLeft size={16} aria-hidden="true" /></Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#071a33]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[244px] shrink-0 flex-col bg-[#071a33] px-5 py-6 text-white lg:flex">
          <Link href="/" className="flex items-center gap-3 px-2"><img src="/melimotors-logo.png" alt="Melimotors" className="h-10 w-[132px] object-contain object-left" /></Link>
          <p className="mt-14 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Operación</p>
          <nav className="mt-3 space-y-1" aria-label="Panel de administración">
            {[{ id: "overview", label: "Resumen e inventario", icon: LayoutDashboard }, { id: "leads", label: "Consultas", icon: MessageCircle }, { id: "proposals", label: "Propuestas", icon: ClipboardList }, { id: "settings", label: "Configuración", icon: Settings2 }].map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setActiveView(id as typeof activeView)} className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-3 text-left text-sm font-semibold transition ${activeView === id ? "bg-white/12 text-white" : "text-white/60 hover:bg-white/6 hover:text-white"}`}><Icon size={17} aria-hidden="true" />{label}{(id === "leads" && newLeads > 0) && <span className="ml-auto rounded-full bg-[#176bff] px-2 py-0.5 text-[11px] text-white">{newLeads}</span>}</button>)}
          </nav>
          <div className="mt-auto space-y-2 border-t border-white/10 pt-5"><Link href="/" className="flex items-center gap-3 rounded-[10px] px-3 py-3 text-sm font-semibold text-white/60 hover:bg-white/6 hover:text-white"><ExternalLink size={17} aria-hidden="true" /> Ver sitio público</Link>{isSupabaseConfigured && <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-[10px] px-3 py-3 text-left text-sm font-semibold text-white/60 hover:bg-white/6 hover:text-white"><LogOut size={17} aria-hidden="true" /> Cerrar sesión</button>}</div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex h-[76px] items-center justify-between border-b border-[#d9e4ef] bg-[#f7f9fc]/95 px-5 backdrop-blur-md sm:px-8">
            <div className="flex items-center gap-3"><button className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#d9e4ef] bg-white lg:hidden" aria-label="Abrir menú"><Menu size={18} /></button><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#176bff]">Administración</p><h1 className="mt-1 text-xl font-semibold tracking-[-0.04em]">{activeView === "overview" ? "Resumen de operación" : activeView === "leads" ? "Consultas de clientes" : activeView === "proposals" ? "Propuestas de vehículos" : "Configuración"}</h1></div></div>
            <div className="flex items-center gap-3"><span className="hidden items-center gap-2 text-xs text-[#6c7c8d] sm:flex"><span className={`h-2 w-2 rounded-full ${isSupabaseConfigured ? "bg-[#0b8a9e]" : "bg-[#f0b44d]"}`} /> {isSupabaseConfigured ? userEmail : "Modo demo"}</span><Link href="/" className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#d9e4ef] bg-white text-[#51687d]" aria-label="Ir al sitio público"><ExternalLink size={17} aria-hidden="true" /></Link></div>
          </header>

          <div className="mx-auto max-w-[1320px] px-5 py-8 sm:px-8 sm:py-10">
            {!isSupabaseConfigured && <div className="mb-6 flex items-start gap-3 rounded-[14px] border border-[#f1d88c] bg-[#fff9e8] px-4 py-3.5 text-sm text-[#8b641e]"><AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" /><p><strong>Modo demo activo.</strong> Configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` para operar con datos reales.</p></div>}
            {notice && <div className="mb-6 flex items-center justify-between gap-3 rounded-[14px] border border-[#c3ece5] bg-[#e7f8f4] px-4 py-3.5 text-sm text-[#0b746c]"><span className="flex items-center gap-2"><Check size={17} aria-hidden="true" /> {notice}</span><button onClick={() => setNotice("")} aria-label="Cerrar aviso"><X size={16} aria-hidden="true" /></button></div>}

            {activeView === "overview" && <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Vehículos activos" value={String(activeVehicles.length)} detail={`${vehicles.filter((item) => item.status === "reservado").length} reservados`} icon={ClipboardList} tone="green" /><Metric label="Valor publicado" value={formatCurrency(totalStockValue)} detail="Precio de venta acumulado" icon={CircleDollarSign} /><Metric label="Ganancia Melimotors" value={formatCurrency(totalMargin)} detail="Después de costos internos" icon={BarChart3} tone="green" /><Metric label="Consultas nuevas" value={String(newLeads)} detail="Requieren seguimiento" icon={Users} tone={newLeads ? "red" : "neutral"} /></div>
            <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#176bff]">Inventario</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">Vehículos publicados y en preparación</h2></div><button onClick={() => setShowCreate(true)} className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#176bff] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0d52d6]"><Plus size={17} aria-hidden="true" /> Nuevo vehículo</button></div>
              <div className="mt-5 overflow-hidden rounded-[16px] border border-[#d9e4ef] bg-white shadow-[0_10px_25px_rgba(31,35,31,0.04)]"><div className="hidden grid-cols-[1.7fr_0.7fr_0.8fr_0.9fr_0.65fr] gap-4 border-b border-[#ece9e2] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7c8b9a] md:grid"><span>Vehículo</span><span>Estado</span><span>Precio</span><span>Ganancia</span><span>Acción</span></div>{loading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-[#7c8b9a]"><RefreshCw size={17} className="animate-spin" aria-hidden="true" /> Cargando inventario</div> : vehicles.length ? vehicles.map((vehicle) => <div key={vehicle.id} className="grid gap-4 border-b border-[#edf3f8] px-5 py-4 last:border-0 md:grid-cols-[1.7fr_0.7fr_0.8fr_0.9fr_0.65fr] md:items-center"><div className="flex items-center gap-3"><img src={vehicleImage(vehicle)} alt="" className="h-12 w-16 rounded-[8px] object-cover" /><div><p className="font-semibold text-[#16334f]">{vehicle.brand} {vehicle.model}</p><p className="mt-1 text-xs text-[#7c8b9a]">{vehicle.stock_code} · {vehicle.model_year}</p></div></div><div><StatusBadge status={vehicle.status} /></div><div className="text-sm font-semibold text-[#17324f]">{formatCurrency(vehicle.sale_price_clp)}</div><div><p className={`text-sm font-semibold ${(vehicle.margin_pct ?? 0) < 10 ? "text-[#176bff]" : "text-[#0b8a9e]"}`}>{vehicle.margin_pct?.toFixed(1) ?? "0.0"}%</p><p className="text-xs text-[#8a9baa]">{formatCurrency(vehicle.gross_margin_clp ?? 0)}</p></div><div><label className="relative block"><span className="sr-only">Cambiar estado de {vehicle.brand} {vehicle.model}</span><select value={vehicle.status} onChange={(event) => void handleVehicleStatus(vehicle.id, event.target.value as VehicleStatus)} className="h-9 w-full appearance-none rounded-[8px] border border-[#d9e4ef] bg-[#ffffff] px-2.5 pr-7 text-xs font-semibold text-[#51687d] outline-none focus:border-[#176bff]"><option value="borrador">Borrador</option><option value="disponible">Disponible</option><option value="reservado">Reservado</option><option value="vendido">Vendido</option><option value="archivado">Archivado</option></select><ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#7c8b9a]" aria-hidden="true" /></label></div></div>) : <div className="p-12 text-center text-sm text-[#7c8b9a]">Todavía no hay vehículos en el inventario.</div>}</div>
            </>}

            {activeView === "leads" && <div><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#176bff]">Seguimiento comercial</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">Consultas recibidas</h2></div><span className="text-sm text-[#6c7c8d]">{leads.length} registros</span></div><div className="mt-6 space-y-3">{leads.length ? leads.map((lead) => <article key={lead.id} className="grid gap-4 rounded-[16px] border border-[#d9e4ef] bg-white p-5 shadow-[0_10px_25px_rgba(31,35,31,0.04)] md:grid-cols-[1.1fr_1.2fr_0.85fr]"><div><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${lead.status === "nueva" ? "bg-[#176bff]" : "bg-[#0b8a9e]"}`} /><p className="font-semibold text-[#16334f]">{lead.name}</p></div><p className="mt-2 text-sm text-[#5c7082]">{lead.phone}{lead.email ? ` · ${lead.email}` : ""}</p><p className="mt-2 text-xs text-[#8a9baa]">{new Date(lead.created_at).toLocaleDateString("es-CL")}</p></div><div className="text-sm leading-6 text-[#51687d]">{lead.message || "Sin mensaje adicional."}<a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="mt-3 flex w-fit items-center gap-1.5 text-xs font-bold text-[#0b8a9e] hover:underline"><MessageCircle size={14} aria-hidden="true" /> Abrir WhatsApp</a></div><label className="relative block"><span className="sr-only">Cambiar estado de consulta</span><select value={lead.status} onChange={(event) => void handleLeadStatus(lead.id, event.target.value as LeadStatus)} className="h-10 w-full appearance-none rounded-[9px] border border-[#d9e4ef] bg-[#ffffff] px-3 pr-8 text-sm font-semibold text-[#51687d] outline-none focus:border-[#176bff]">{Object.entries(leadStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8b9a]" aria-hidden="true" /></label></article>) : <div className="rounded-[16px] border border-dashed border-[#d9e4ef] bg-white p-12 text-center text-sm text-[#7c8b9a]">No hay consultas registradas.</div>}</div></div>}

            {activeView === "proposals" && <AdminProposals proposals={proposals} onCreate={handleCreateProposal} onStatusChange={handleProposalStatus} />}
            {activeView === "settings" && <div className="max-w-[760px]"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#176bff]">Configuración</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">Parámetros del negocio</h2><div className="mt-6 space-y-3"><div className="flex items-start gap-4 rounded-[16px] border border-[#d9e4ef] bg-white p-5"><Settings2 size={20} className="mt-0.5 text-[#176bff]" aria-hidden="true" /><div><p className="font-semibold">Umbral de margen</p><p className="mt-1 text-sm leading-6 text-[#5c7082]">La especificación inicia con un umbral de 10%. La publicación se permite, pero el inventario queda marcado cuando el margen está bajo.</p></div><span className="ml-auto rounded-full bg-[#eaf4ff] px-3 py-1 text-xs font-bold text-[#51687d]">10%</span></div><div className="flex items-start gap-4 rounded-[16px] border border-[#d9e4ef] bg-white p-5"><ShieldCheck size={20} className="mt-0.5 text-[#0b8a9e]" aria-hidden="true" /><div><p className="font-semibold">Acceso administrativo</p><p className="mt-1 text-sm leading-6 text-[#5c7082]">Los permisos dependen del rol `admin` y las políticas RLS de Supabase. El correo del primer administrador se configura en `site_settings`.</p></div></div><div className="flex items-start gap-4 rounded-[16px] border border-[#d9e4ef] bg-white p-5"><CircleDollarSign size={20} className="mt-0.5 text-[#f0b44d]" aria-hidden="true" /><div><p className="font-semibold">Financiamiento</p><p className="mt-1 text-sm leading-6 text-[#5c7082]">Los plazos y la tasa por defecto viven en Supabase y se usan para el cálculo referencial público.</p></div></div></div></div>}
          </div>
        </section>
      </div>

      {showCreate && <div className="fixed inset-0 z-30 flex items-end justify-center bg-[#071a33]/45 p-0 backdrop-blur-sm sm:items-center sm:p-5"><div className="max-h-[92vh] w-full max-w-[780px] overflow-y-auto rounded-t-[22px] bg-[#f7f9fc] p-6 shadow-[0_24px_100px_rgba(0,0,0,0.28)] sm:rounded-[22px] sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#176bff]">Inventario</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">Nuevo vehículo</h2></div><button onClick={() => setShowCreate(false)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d9e4ef] bg-white text-[#5c7082]" aria-label="Cerrar formulario"><X size={17} aria-hidden="true" /></button></div><form onSubmit={handleCreate} className="mt-7 space-y-5"><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Patente (identificador único)<input required value={form.stock_code} onChange={(event) => setForm({ ...form, stock_code: event.target.value })} placeholder="ABCD12" className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium">Marca<input required value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} placeholder="Toyota" className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium">Modelo<input required value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} placeholder="Corolla XEI" className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium">Año<input required type="number" min="1900" max="2100" value={form.model_year} onChange={(event) => setForm({ ...form, model_year: event.target.value })} className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium">Precio de venta publicado<input required type="number" min="1" value={form.sale_price_clp} onChange={(event) => setForm({ ...form, sale_price_clp: event.target.value })} placeholder="15990000" className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium">Precio mínimo de venta<input type="number" min="0" value={form.minimum_sale_price_clp} onChange={(event) => setForm({ ...form, minimum_sale_price_clp: event.target.value })} placeholder="0 si no defines un mínimo" className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium">Kilometraje<input required type="number" min="0" value={form.mileage_km} onChange={(event) => setForm({ ...form, mileage_km: event.target.value })} className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]" /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Combustible<select value={form.fuel_type} onChange={(event) => setForm({ ...form, fuel_type: event.target.value })} className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]"><option value="benzina">Bencina</option><option value="diesel">Diésel</option><option value="hybrid">Híbrido</option><option value="electric">Eléctrico</option></select></label><label className="block text-sm font-medium">Transmisión<select value={form.transmission} onChange={(event) => setForm({ ...form, transmission: event.target.value })} className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]"><option value="automatic">Automática</option><option value="manual">Manual</option><option value="cvt">CVT</option></select></label></div><label className="block text-sm font-medium">Descripción<textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-2 min-h-[90px] w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#176bff]" /></label><label className="block text-sm font-medium">Modalidad de adquisición<select value={form.acquisition_type} onChange={(event) => { const acquisitionType = event.target.value as VehicleForm["acquisition_type"]; setForm({ ...form, acquisition_type: acquisitionType, commission_pct: acquisitionType === "consignacion" ? form.commission_pct : "0" }); }} className="mt-2 h-11 w-full rounded-[10px] border border-[#d9e4ef] bg-white px-3 text-sm outline-none focus:border-[#176bff]"><option value="compra_directa">Compra directa</option><option value="consignacion">Consignación</option></select></label><div><p className="text-sm font-semibold">Costos internos</p><div className="mt-3 grid gap-3 sm:grid-cols-3">{[["purchase_cost_clp", "Compra"], ["transfer_cost_clp", "Transferencia"], ["reconditioning_cost_clp", "Reacondicionamiento"], ["transport_cost_clp", "Transporte"], ["commission_pct", "Comisión (%) · solo consignación"], ["other_cost_clp", "Otros"], ["inspection_pre_purchase_cost_clp", "Inspección precompra"], ["advertising_cost_clp", "Anuncios"]].map(([key, label]) => <label key={key} className="block text-xs font-medium text-[#5c7082]">{label}<input type="number" min="0" max={key === "commission_pct" ? "100" : undefined} step={key === "commission_pct" ? "0.01" : "1"} disabled={key === "commission_pct" && form.acquisition_type !== "consignacion"} value={form[key as keyof VehicleForm]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1.5 h-10 w-full rounded-[9px] border border-[#d9e4ef] bg-white px-3 text-sm text-[#071a33] outline-none focus:border-[#176bff] disabled:cursor-not-allowed disabled:bg-[#eef2f6]" /></label>)}</div></div><div className="grid gap-3 rounded-[12px] border border-[#b9d0e8] bg-[#eaf4ff] p-4 text-sm sm:grid-cols-4"><div><p className="text-[#5c7082]">Comisión Melimotors</p><p className="mt-1 font-semibold text-[#071a33]">{form.acquisition_type === "consignacion" ? formatCurrency(previewCommission) : "No aplica"}</p></div><div><p className="text-[#5c7082]">Cliente recibe</p><p className="mt-1 font-semibold text-[#071a33]">{form.acquisition_type === "consignacion" ? formatCurrency(previewClientProceeds) : "No aplica"}</p></div><div><p className="text-[#5c7082]">Ganancia Melimotors</p><p className={`mt-1 font-semibold ${previewProfit < 0 ? "text-[#c33c3c]" : "text-[#0b8a9e]"}`}>{formatCurrency(previewProfit)}</p></div><div><p className="text-[#5c7082]">Ganancia al mínimo</p><p className={`mt-1 font-semibold ${previewMinimumProfit < 0 ? "text-[#c33c3c]" : "text-[#0b8a9e]"}`}>{previewMinimumPrice > 0 ? formatCurrency(previewMinimumProfit) : "No definido"}</p></div></div><label className="flex cursor-pointer items-center gap-3 rounded-[12px] border border-dashed border-[#b8c9da] bg-white px-4 py-3.5 text-sm font-semibold text-[#51687d]"><Upload size={18} aria-hidden="true" /><span className="min-w-0 flex-1 truncate">{coverFile ? coverFile.name : "Subir imagen de portada"}</span><input type="file" accept="image/*" onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)} className="sr-only" /></label><p className="flex items-center gap-2 text-xs leading-5 text-[#7c8b9a]"><ImagePlus size={14} aria-hidden="true" /> Sin portada se guardará como borrador; con portada queda listo para publicar.</p><div className="flex flex-col-reverse gap-3 border-t border-[#d9e4ef] pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={() => setShowCreate(false)} className="rounded-full border border-[#b8c9da] px-5 py-3 text-sm font-semibold text-[#51687d]">Cancelar</button><button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#176bff] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? "Guardando..." : "Guardar vehículo"} <Check size={17} aria-hidden="true" /></button></div></form></div></div>}
    </main>
  );
}
