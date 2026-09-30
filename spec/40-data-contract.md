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
| inventory_entry_date | date | si | Fecha de ingreso al stock; no puede ser futura |
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
obligatorio y no puede estar en el futuro. Conserva comprador y notas opcionales,
ademas de `commission_amount_clp`, `client_proceeds_clp` y
`dealer_profit_clp` calculados al momento de la venta.

La funcion administrativa `register_vehicle_sale` guarda o actualiza la venta y
cambia el vehiculo a `vendido` dentro de una unica transaccion.

## vehicle_sale_documents

| Campo | Tipo | Requerido | Regla |
| --- | --- | --- | --- |
| id | uuid | si | Identificador tecnico |
| vehicle_id | uuid | si | Venta propietaria del documento |
| document_type | text | si | `nota_venta`, `autofact`, `contrato_compraventa` u `otro` |
| file_name | text | si | Nombre original no vacio |
| storage_path | text | si | Ruta unica en el bucket privado `sale-documents` |
| mime_type | text | no | Tipo MIME informado durante la carga |
| file_size_bytes | bigint | si | Entre 1 byte y 15 MB |
| uploaded_by | uuid | no | Administrador que adjunto el documento |
| created_at | timestamptz | si | Fecha de carga |

El bucket `sale-documents` no es publico. La lectura, carga y eliminacion exigen
autenticacion y rol `admin`; la descarga se realiza con enlaces temporales.

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
| region | text | si | Una de las 16 regiones oficiales de Chile |
| location | text | si | Comuna perteneciente a la región seleccionada |
| vehicle_plate | text | no | Patente informada por la persona |
| vehicle_brand | text | si | No vacio |
| vehicle_model | text | si | No vacio |
| vehicle_year | smallint | no | Entre 1900 y 2100 |
| vehicle_mileage_km | integer | si | Mayor o igual a cero |
| expected_price_clp | bigint | si | Mayor o igual a cero |
| business_purchase_price_min_clp | bigint | no | Mínimo del rango de compra para el negocio |
| business_purchase_price_max_clp | bigint | no | Máximo del rango de compra, mayor o igual al mínimo |
| market_sale_price_min_clp | bigint | no | Mínimo del rango de venta de mercado |
| market_sale_price_max_clp | bigint | no | Máximo del rango de venta, mayor o igual al mínimo |
| sellability_score | numeric(2,1) | si | Entre 0 y 5, en intervalos de 0,5 |
| campaign_name | text | no | Nombre de la campaña publicitaria asociada |
| campaign_code | text | no | Código alfanumérico normalizado en mayúsculas |
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
