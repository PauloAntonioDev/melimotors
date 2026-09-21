# Reglas de negocio

Cada regla contiene la politica normativa. Los criterios de aceptacion
relacionados se encuentran en `50-acceptance-criteria.md`.

## Vehiculos

| ID | Regla |
| --- | --- |
| BR-VEH-001 | Cada vehiculo tiene un identificador unico de inventario. |
| BR-VEH-002 | Para publicarse, un vehiculo requiere marca, modelo, anio, precio de venta, kilometraje, combustible, transmision y descripcion. |
| BR-VEH-003 | Para publicarse, un vehiculo requiere al menos una imagen y exactamente una portada. |
| BR-VEH-004 | El precio de venta es mayor que cero y se expresa en CLP sin decimales. |
| BR-VEH-005 | Los estados permitidos son `borrador`, `disponible`, `reservado`, `vendido` y `archivado`. |
| BR-VEH-006 | `borrador` y `archivado` no son visibles publicamente. |
| BR-VEH-007 | `disponible` puede ser consultado y contactado por clientes. |
| BR-VEH-008 | `reservado` es visible, pero muestra que no esta disponible. |
| BR-VEH-009 | Una reserva es manual y no vence automaticamente. |
| BR-VEH-010 | Solo un administrador puede cambiar el estado comercial. |
| BR-VEH-011 | Un vehiculo `vendido` no puede volver directamente a `disponible`; la correccion requiere una accion administrativa auditable. |

## Costos y margenes

| ID | Regla |
| --- | --- |
| BR-COST-001 | Los costos son compra, transferencia, reacondicionamiento, transporte, comision y otros. |
| BR-COST-002 | Todos los costos son mayores o iguales a cero. |
| BR-COST-003 | El costo total es la suma de los seis componentes. |
| BR-COST-004 | El margen bruto es `precio de venta - costo total`. |
| BR-COST-005 | El margen porcentual es `margen bruto / precio de venta * 100`. |
| BR-COST-006 | El umbral minimo de margen es configurable y comienza en 10%. |
| BR-COST-007 | Un margen bajo genera advertencia, pero no bloquea la publicacion. |
| BR-COST-008 | Cambiar precio o costos recalcula el margen automaticamente. |
| BR-COST-009 | Los costos internos nunca son publicos. |

## Reservas y ventas

| ID | Regla |
| --- | --- |
| BR-SALE-001 | Un vehiculo `disponible` puede pasar a `reservado` o `vendido`. |
| BR-SALE-002 | Un vehiculo `reservado` puede volver a `disponible` o pasar a `vendido`. |
| BR-SALE-003 | Un vehiculo `vendido` requiere fecha de venta y precio final positivo. |
| BR-SALE-004 | El precio final puede diferir del precio publicado, pero nunca ser negativo. |
| BR-SALE-005 | Los datos internos del comprador son opcionales. |
| BR-SALE-006 | Un vehiculo vendido no aparece en el catalogo activo. |

## Imagenes

| ID | Regla |
| --- | --- |
| BR-MEDIA-001 | Cada imagen pertenece a un unico vehiculo. |
| BR-MEDIA-002 | Cada vehiculo tiene una sola portada. |
| BR-MEDIA-003 | El orden de las imagenes puede ser editado por un administrador. |
| BR-MEDIA-004 | No se elimina una portada si no existe otra imagen que la reemplace. Si existe otra, la primera imagen ordenada pasa a ser portada. |
| BR-MEDIA-005 | El archivo vive en Supabase Storage y sus metadatos en PostgreSQL. |

## Consultas

| ID | Regla |
| --- | --- |
| BR-LEAD-001 | Una consulta originada en una ficha debe asociarse a ese vehiculo. |
| BR-LEAD-002 | Nombre y telefono son obligatorios; correo y mensaje son opcionales. |
| BR-LEAD-003 | Toda consulta inicia en estado `nueva`. |
| BR-LEAD-004 | Los estados permitidos son `nueva`, `contactada`, `en seguimiento`, `cerrada` y `perdida`. |
| BR-LEAD-005 | Solo un administrador cambia el estado o las notas internas. |
| BR-LEAD-006 | El telefono se conserva como texto. |

## Financiamiento

| ID | Regla |
| --- | --- |
| BR-FIN-001 | El pie es mayor o igual a cero y menor o igual al precio. |
| BR-FIN-002 | El plazo pertenece a una lista configurable de meses. |
| BR-FIN-003 | La tasa anual es mayor o igual a cero. |
| BR-FIN-004 | Con tasa cero, la cuota es capital dividido por plazo. |
| BR-FIN-005 | Con tasa positiva, se usa cuota fija mensual. |
| BR-FIN-006 | El calculo es informativo y no equivale a aprobacion bancaria. |
| BR-FIN-007 | La tasa por defecto es configurable. |

## Acceso y auditoria

| ID | Regla |
| --- | --- |
| BR-AUTH-001 | Las rutas publicas pueden consultarse sin iniciar sesion. |
| BR-AUTH-002 | Crear, editar, eliminar, publicar vehiculos y gestionar consultas requiere autenticacion. |
| BR-AUTH-003 | Solo `admin` ejecuta operaciones administrativas. |
| BR-AUTH-004 | La identidad se gestiona con Supabase Auth. |
| BR-AUTH-005 | RLS refuerza las separaciones publica e interna. |
| BR-AUTH-006 | El primer administrador se define mediante el correo empresarial configurado en `site_settings`. |
| BR-AUTH-007 | Las operaciones administrativas registran actor y fecha. |
