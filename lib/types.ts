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
  inventory_entry_date?: string;
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
  commission_pct?: number;
  client_estimated_proceeds_clp?: number;
};

export type VehicleSale = {
  vehicle_id: string;
  sold_at: string;
  final_sale_price_clp: number;
  buyer_name?: string | null;
  buyer_phone?: string | null;
  notes?: string | null;
  commission_amount_clp: number;
  client_proceeds_clp?: number | null;
  dealer_profit_clp: number;
  created_at: string;
  updated_at?: string;
};

export type VehicleSaleForm = {
  vehicle_id: string;
  sold_at: string;
  final_sale_price_clp: string;
  buyer_name: string;
  buyer_phone: string;
  notes: string;
};

export type SaleDocumentType =
  | "nota_venta"
  | "autofact"
  | "contrato_compraventa"
  | "otro";

export type VehicleSaleDocument = {
  id: string;
  vehicle_id: string;
  document_type: SaleDocumentType;
  file_name: string;
  storage_path: string;
  mime_type?: string | null;
  file_size_bytes: number;
  created_at: string;
};

export type PendingSaleDocument = {
  id: string;
  document_type: SaleDocumentType;
  file: File;
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
  whatsapp_id: string;
  seller_name: string;
  seller_phone: string;
  seller_email?: string | null;
  location: string;
  vehicle_id?: string | null;
  vehicle_plate?: string | null;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year?: number | null;
  vehicle_mileage_km: number;
  expected_price_clp: number;
  business_purchase_price_min_clp?: number | null;
  business_purchase_price_max_clp?: number | null;
  market_sale_price_min_clp?: number | null;
  market_sale_price_max_clp?: number | null;
  sellability_score: number;
  campaign_name?: string | null;
  campaign_code?: string | null;
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
  location: string;
  vehicle_plate: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: string;
  vehicle_mileage_km: string;
  expected_price_clp: string;
  business_purchase_price_min_clp: string;
  business_purchase_price_max_clp: string;
  market_sale_price_min_clp: string;
  market_sale_price_max_clp: string;
  sellability_score: string;
  campaign_name: string;
  campaign_code: string;
  vehicle_description: string;
  conversation_summary: string;
  internal_notes: string;
};

export type VehicleForm = {
  stock_code: string;
  inventory_entry_date: string;
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
