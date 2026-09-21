# Decision 0001: Supabase como plataforma de datos

## Estado

Aceptada.

## Decision

Supabase cubrira PostgreSQL, Auth y Storage. La interfaz y el framework de
aplicacion no forman parte de esta primera entrega.

## Motivo

El dominio necesita datos relacionales persistentes, usuarios administradores,
RLS e imagenes asociadas al inventario. Centralizar estas capacidades reduce
la duplicacion de reglas de seguridad y permite que una interfaz futura se
implemente contra contratos estables.

## Consecuencias

- Las migraciones son artefactos versionados del proyecto.
- La identidad se referencia con `auth.users(id)`.
- Los archivos de vehiculos viven en el bucket `vehicle-images`.
- El catalogo publico se resuelve mediante politicas RLS, no mediante datos
  duplicados en el navegador.
