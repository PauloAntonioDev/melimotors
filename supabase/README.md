# Supabase de Melimotors

## Orden de aplicacion

1. Ejecutar la migracion de `migrations/` con Supabase CLI o el sistema de
   migraciones del proyecto.
2. Ejecutar `seed.sql` de forma repetible.
3. Cambiar `site_settings.admin_email` por el correo empresarial real usando
   una sesion con privilegios de servicio.
4. Registrar ese correo en Supabase Auth. El trigger de usuarios creara el
   perfil con rol `admin`.

## Objetos principales

- `public.public_vehicle_catalog`: lectura publica de vehiculos activos.
- `public.vehicle_margin_summary`: vista administrativa de costos y margenes.
- `public.calculate_financing_payment(...)`: cuota referencial reutilizable.
- `storage.vehicle-images`: bucket publico de lectura y escritura restringida.

## Seguridad

RLS esta habilitado en todas las tablas publicas. Los clientes anonimos solo
pueden leer vehiculos activos, imagenes publicas y configuracion publica, y
crear leads validos. Los costos, reservas, ventas, auditoria y configuracion
privada requieren un perfil con rol `admin`.

Las pruebas realizadas sobre PostgreSQL local cubren publicacion, portadas,
reservas, ventas, leads, calculo de costos y separacion RLS. La aplicacion
futura debe agregar pruebas de integracion contra un proyecto Supabase real.
