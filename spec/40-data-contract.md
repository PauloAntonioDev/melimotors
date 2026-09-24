# Contrato de datos

Los nombres de tablas y columnas de esta especificacion son la interfaz de
persistencia. Los montos terminados en `_clp` son enteros `bigint`.

## vehicles

| Campo | Tipo | Requerido | Regla |
| --- | --- | --- | --- |
| id | uuid | si | Identificador tecnico |
| stock_code | text | si | Patente unica del vehiculo; se conserva este nombre tecnico por compatibilidad con la base existente. |
| slug | text | si | Unico y publico |
| brand | text | si | No vacio para publicar |
| model | text | si | No vacio para publicar |
| model_year | smallint | si | Entre 1900 y 2100 |
| mileage_km | integer | si | Mayor o igual a cero |
| fuel_type | text | si | `benzina`, `diesel`, `hybrid`, `electric`, `other` |
| transmission | text | si | `manual`, `automatic`, `cvt`, `other` |
| description | text | si | No vacia para publicar |
| sale_price_clp | bigint | si | Mayor que cero |
| minimum_sale_price_clp | bigint | si | Mayor o igual a cero y menor o igual al precio publicado |
| acquisition_type | text | si | `compra_directa` o `consignacion` |
| status | text | si | Estados del dominio |
| published_at | timestamptz | no | Se completa al publicar |
| created_by | uuid | no | Usuario creador |
| updated_by | uuid | no | Ultimo usuario |
| created_at | timestamptz | si | UTC |
| updated_at | timestamptz | si | UTC |

## vehicle_images

| Campo | Tipo | Requerido | Regla |
| --- | --- | --- | --- |
| id | uuid | si | Identificador tecnico |
| vehicle_id | uuid | si | FK a vehicles |
| storage_path | text | si | Unico en Storage |
| alt_text | text | no | Texto alternativo |
| sort_order | integer | si | Mayor o igual a cero |
| is_cover | boolean | si | Una portada por vehiculo |

## vehicle_costs

| Campo | Tipo | Requerido | Regla |
| --- | --- | --- | --- |
| vehicle_id | uuid | si | PK y FK a vehicles |
| purchase_cost_clp | bigint | si | Mayor o igual a cero |
| transfer_cost_clp | bigint | si | Mayor o igual a cero |
| reconditioning_cost_clp | bigint | si | Mayor o igual a cero |
| transport_cost_clp | bigint | si | Mayor o igual a cero |
| commission_amount_clp | bigint | si | Monto calculado; es cero en compra directa |
| commission_pct | numeric(5,2) | si | Entre 0 y 100; solo genera monto en consignacion |
| other_cost_clp | bigint | si | Mayor o igual a cero |
| inspection_pre_purchase_cost_clp | bigint | si | Mayor o igual a cero |
| advertising_cost_clp | bigint | si | Mayor o igual a cero |
| total_cost_clp | bigint | si | Columna generada con costos operativos, sin comision |

La vista administrativa `vehicle_margin_summary` expone además `commission_amount_clp`,
`client_estimated_proceeds_clp`, `dealer_estimated_earnings_clp` y sus valores al
precio minimo. En consignacion, los costos operativos reducen la ganancia de
Melimotors y no el monto estimado para el cliente.

## vehicle_reservations

Una reserva activa por vehiculo. `status` es `active` o `cancelled` para que la
historia no se pierda aunque el vehiculo vuelva a estar disponible.

## vehicle_sales

Una venta por vehiculo. `final_sale_price_clp` debe ser positivo y `sold_at` es
obligatorio.

## leads

`name` y `phone` son obligatorios. `vehicle_id` es obligatorio cuando `source`
es `vehicle_detail`. Los leads publicos solo pueden crearse como `nueva`.

## vehicle_proposals

| Campo | Tipo | Requerido | Regla |
| --- | --- | --- | --- |
| id | uuid | si | Identificador tecnico |
| source | text | si | `whatsapp`, `presencial`, `referido` u `otro` |
| status | text | si | Estado de seguimiento |
| acquisition_type | text | si | `compra_directa` o `consignacion` |
| whatsapp_id | text | si | Numero normalizado con codigo de pais, por ejemplo `+56912345678` |
| seller_name | text | si | No vacio |
| seller_phone | text | si | No vacio; se conserva como texto |
| seller_email | text | no | Correo opcional |
| vehicle_plate | text | no | Patente informada por la persona |
| vehicle_brand | text | si | No vacio |
| vehicle_model | text | si | No vacio |
| vehicle_year | smallint | no | Entre 1900 y 2100 |
| vehicle_mileage_km | integer | si | Mayor o igual a cero |
| expected_price_clp | bigint | si | Mayor o igual a cero |
| vehicle_description | text | no | Datos del vehiculo |
| conversation_summary | text | no | Resumen del contacto por WhatsApp |
| internal_notes | text | no | Solo administracion |
| created_at | timestamptz | si | Fecha de ingreso |

## site_settings

La clave es unica y el valor se guarda como JSONB para permitir listas y
valores numericos. Claves iniciales:

- `admin_email`
- `margin_threshold_pct`
- `financing_terms_months`
- `financing_default_annual_rate_pct`
- `company_name`
- `company_whatsapp`
- `company_address`
- `company_hours`

## calculate_financing_payment

Funcion publica e inmutable para calculo referencial:

```text
calculate_financing_payment(
  price_clp bigint,
  down_payment_clp bigint,
  annual_rate_pct numeric,
  term_months integer
) -> numeric(14, 2)
```

Rechaza precio no positivo, pie fuera de rango, tasa negativa o plazo no
positivo. Con tasa cero devuelve capital dividido por plazo; con tasa positiva
usa cuota fija mensual.
