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
  minimum_sale_price_clp?: number;
  acquisition_type?: "compra_directa" | "consignacion";
  status: VehicleStatus;
  published_at?: string | null;
  cover_storage_path?: string | null;
  cover_url?: string;
  cost_total_clp?: number;
  gross_margin_clp?: number;
  margin_pct?: number;
  commission_amount_clp?: number;
  client_estimated_proceeds_clp?: number;
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

export type ProposalStatus =
  | "nueva"
  | "en_revision"
  | "contactada"
  | "aceptada"
  | "rechazada"
  | "archivada";

export type VehicleProposal = {
  id: string;
  source: string;
  status: ProposalStatus;
  acquisition_type: "compra_directa" | "consignacion";
  seller_name: string;
  seller_phone: string;
  seller_email?: string | null;
  vehicle_id?: string | null;
  vehicle_plate?: string | null;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year?: number | null;
  vehicle_mileage_km: number;
  expected_price_clp: number;
  vehicle_description?: string | null;
  conversation_summary?: string | null;
  internal_notes?: string | null;
  created_at: string;
  updated_at?: string;
};

export type VehicleProposalForm = {
  source: "whatsapp" | "presencial" | "referido" | "otro";
  acquisition_type: "compra_directa" | "consignacion";
  seller_name: string;
  seller_phone: string;
  seller_email: string;
  vehicle_plate: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: string;
  vehicle_mileage_km: string;
  expected_price_clp: string;
  vehicle_description: string;
  conversation_summary: string;
  internal_notes: string;
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
  minimum_sale_price_clp: string;
  purchase_cost_clp: string;
  transfer_cost_clp: string;
  reconditioning_cost_clp: string;
  transport_cost_clp: string;
  commission_pct: string;
  other_cost_clp: string;
  inspection_pre_purchase_cost_clp: string;
  advertising_cost_clp: string;
  acquisition_type: "compra_directa" | "consignacion";
};
