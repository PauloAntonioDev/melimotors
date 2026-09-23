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
| commission_cost_clp | bigint | si | Mayor o igual a cero |
| other_cost_clp | bigint | si | Mayor o igual a cero |
| total_cost_clp | bigint | si | Columna generada |

## vehicle_reservations

Una reserva activa por vehiculo. `status` es `active` o `cancelled` para que la
historia no se pierda aunque el vehiculo vuelva a estar disponible.

## vehicle_sales

Una venta por vehiculo. `final_sale_price_clp` debe ser positivo y `sold_at` es
obligatorio.

## leads

`name` y `phone` son obligatorios. `vehicle_id` es obligatorio cuando `source`
es `vehicle_detail`. Los leads publicos solo pueden crearse como `nueva`.

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
