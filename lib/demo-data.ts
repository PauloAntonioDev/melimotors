import type { Lead, Vehicle } from "./types";

export const demoVehicles: Vehicle[] = [
  {
    id: "demo-001",
    stock_code: "KJRP42",
    slug: "kia-sportage-2022",
    brand: "Kia",
    model: "Sportage EX",
    model_year: 2022,
    mileage_km: 38_400,
    fuel_type: "benzina",
    transmission: "automatic",
    description:
      "SUV familiar de una dueña, con historial de mantenciones y excelente equipamiento.",
    sale_price_clp: 15_990_000,
    status: "disponible",
    published_at: "2026-08-12T14:00:00.000Z",
    cover_url: "/melimotors-showroom.png",
    cost_total_clp: 12_280_000,
    gross_margin_clp: 3_710_000,
    margin_pct: 23.2,
  },
  {
    id: "demo-002",
    stock_code: "LZTM18",
    slug: "mazda-cx-5-2021",
    brand: "Mazda",
    model: "CX-5 GTX",
    model_year: 2021,
    mileage_km: 52_100,
    fuel_type: "benzina",
    transmission: "automatic",
    description:
      "Diseño, seguridad y confort para moverse en ciudad o carretera con confianza.",
    sale_price_clp: 17_490_000,
    status: "reservado",
    published_at: "2026-08-05T14:00:00.000Z",
    cover_url: "/melimotors-showroom.png",
    cost_total_clp: 14_980_000,
    gross_margin_clp: 2_510_000,
    margin_pct: 14.4,
  },
  {
    id: "demo-003",
    stock_code: "PJHC77",
    slug: "toyota-corolla-2020",
    brand: "Toyota",
    model: "Corolla XEI",
    model_year: 2020,
    mileage_km: 61_700,
    fuel_type: "benzina",
    transmission: "automatic",
    description:
      "Sedan confiable, económico y listo para su próximo dueño con revisión al día.",
    sale_price_clp: 12_990_000,
    status: "disponible",
    published_at: "2026-07-28T14:00:00.000Z",
    cover_url: "/melimotors-showroom.png",
    cost_total_clp: 10_950_000,
    gross_margin_clp: 2_040_000,
    margin_pct: 15.7,
  },
];

export const demoLeads: Lead[] = [
  {
    id: "lead-001",
    vehicle_id: "demo-001",
    source: "vehicle_detail",
    name: "Camila Rojas",
    phone: "+56 9 8765 4321",
    email: "camila@example.com",
    message: "Me interesa agendar una visita para este fin de semana.",
    status: "nueva",
    created_at: "2026-09-20T16:30:00.000Z",
  },
  {
    id: "lead-002",
    vehicle_id: "demo-003",
    source: "vehicle_detail",
    name: "Nicolas Perez",
    phone: "+56 9 7654 3210",
    message: "¿Se puede financiar con un pie de 30%?",
    status: "en seguimiento",
    created_at: "2026-09-19T12:00:00.000Z",
  },
];

export const vehicleImage = (vehicle: Vehicle) =>
  vehicle.cover_url ?? "/melimotors-showroom.png";
