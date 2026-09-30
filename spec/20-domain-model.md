# Modelo de dominio

## Entidades

### Profile

Representa un usuario de Supabase Auth y su rol dentro de Melimotors.
Actualmente solo `admin` tiene permisos administrativos. `seller` y `finance`
quedan reservados para una ampliacion posterior.

### Vehicle

Es la unidad principal de inventario. Contiene datos tecnicos, precio,
identificador de stock, fecha de ingreso, slug y estado comercial. La fecha de
ingreso permite calcular los dias que lleva en stock.

### VehicleImage

Representa el metadato de una imagen almacenada en Supabase Storage. Tiene
orden y un indicador de portada.

### VehicleCost

Contiene los componentes de costo internos, la comision porcentual y expone el
costo total generado. Tiene una relacion uno a uno con Vehicle.

### VehicleReservation

Representa una reserva manual. Solo puede existir una reserva activa por
vehiculo.

### VehicleSale

Representa el cierre de una venta. Es uno a uno con Vehicle y exige precio
final positivo y fecha de venta. Conserva los datos opcionales del comprador y
una fotografia financiera de la comision, el monto del cliente y la ganancia
real de Melimotors calculados al momento del cierre.

### VehicleSaleDocument

Representa un antecedente privado asociado a una venta, como nota de venta,
informe Autofact o contrato de compraventa. El archivo vive en Supabase Storage
y PostgreSQL conserva su categoria, nombre, tipo MIME, tamano y ubicacion.

### Lead

Representa una consulta publica. Puede asociarse a un vehiculo y tiene estado,
notas internas y datos de contacto.

### VehicleProposal

Representa una propuesta recibida para compra directa o consignacion. Conserva
el contacto, la ciudad o ubicacion, los datos del vehiculo y, opcionalmente, el
nombre y codigo de la campaña publicitaria que originó la captacion. Su
evaluacion comercial puede guardar rangos de compra y venta, ademas de una
calificacion de vendibilidad.

### SiteSetting

Contiene valores configurables del negocio, como correo administrador, umbral
de margen, tasa de financiamiento, plazos y datos de contacto.

### AuditEvent

Registra cambios administrativos con actor, entidad, accion, estado anterior y
estado posterior.

## Relaciones

```text
profiles 1 ---- N vehicles       (created_by / updated_by)
vehicles 1 --- N vehicle_images
vehicles 1 ---- 1 vehicle_costs
vehicles 1 --- N vehicle_reservations
vehicles 1 ---- 1 vehicle_sales
vehicle_sales 1 --- N vehicle_sale_documents
vehicles 1 --- N leads
vehicles 1 --- N vehicle_proposals (asociacion opcional)
profiles 1 --- N audit_events
profiles 1 ---- N site_settings (updated_by)
```

## Transiciones de estado

```text
borrador   -> disponible | archivado
disponible -> reservado | vendido | archivado
reservado  -> disponible | vendido | archivado
vendido    -> archivado
archivado  -> borrador
```

El regreso desde `vendido` a `disponible` no es una transicion normal. Requiere
una correccion administrativa explicita que quede registrada en auditoria.
