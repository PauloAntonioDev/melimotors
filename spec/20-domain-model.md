# Modelo de dominio

## Entidades

### Profile

Representa un usuario de Supabase Auth y su rol dentro de Melimotors.
Actualmente solo `admin` tiene permisos administrativos. `seller` y `finance`
quedan reservados para una ampliacion posterior.

### Vehicle

Es la unidad principal de inventario. Contiene datos tecnicos, precio,
identificador de stock, slug y estado comercial.

### VehicleImage

Representa el metadato de una imagen almacenada en Supabase Storage. Tiene
orden y un indicador de portada.

### VehicleCost

Contiene los componentes de costo internos y expone el costo total generado.
Tiene una relacion uno a uno con Vehicle.

### VehicleReservation

Representa una reserva manual. Solo puede existir una reserva activa por
vehiculo.

### VehicleSale

Representa el cierre de una venta. Es uno a uno con Vehicle y exige precio
final positivo y fecha de venta.

### Lead

Representa una consulta publica. Puede asociarse a un vehiculo y tiene estado,
notas internas y datos de contacto.

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
vehicles 1 --- N leads
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
