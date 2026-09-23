export type VehicleStatus =
  | "borrador"
  | "disponible"
  | "reservado"
  | "vendido"
  | "archivado";

export type Vehicle = {
  id: string;
  stock_code: string;
  slug: string;
  brand: string;
  model: string;
  model_year: number;
  mileage_km: number;
  fuel_type: string;
  transmission: string;
  description: string;
  sale_price_clp: number;
  acquisition_type?: "compra_directa" | "consignacion";
  status: VehicleStatus;
  published_at?: string | null;
  cover_storage_path?: string | null;
  cover_url?: string;
  cost_total_clp?: number;
  gross_margin_clp?: number;
  margin_pct?: number;
};

export type LeadStatus =
  | "nueva"
  | "contactada"
  | "en seguimiento"
  | "cerrada"
  | "perdida";

export type Lead = {
  id: string;
  vehicle_id?: string | null;
  source: string;
  name: string;
  phone: string;
  email?: string | null;
  message?: string | null;
  status: LeadStatus;
  internal_notes?: string | null;
  created_at: string;
};

export type VehicleForm = {
  stock_code: string;
  brand: string;
  model: string;
  model_year: string;
  mileage_km: string;
  fuel_type: string;
  transmission: string;
  description: string;
  sale_price_clp: string;
  purchase_cost_clp: string;
  transfer_cost_clp: string;
  reconditioning_cost_clp: string;
  transport_cost_clp: string;
  commission_cost_clp: string;
  other_cost_clp: string;
  inspection_pre_purchase_cost_clp: string;
  advertising_cost_clp: string;
  acquisition_type: "compra_directa" | "consignacion";
};
