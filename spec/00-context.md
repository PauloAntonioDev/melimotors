# Contexto del producto

## Objetivo

Melimotors necesita operar su inventario de vehiculos usados, publicar fichas
comerciales para clientes, controlar costos internos y registrar consultas.

## Alcance de esta fase

Esta fase define el dominio y la persistencia antes de construir catalogo,
administrador u otras interfaces. La plataforma de datos sera Supabase:

- PostgreSQL para datos relacionales.
- Supabase Auth para identidad.
- Supabase Storage para imagenes.
- Row Level Security para separar lectura publica y operaciones internas.

La interfaz y el framework de aplicacion quedan fuera de esta fase.

## Mercado y formato

- Pais inicial: Chile.
- Moneda: CLP.
- Los montos se almacenan como enteros positivos en pesos chilenos.
- Las fechas se almacenan en UTC y se muestran en la zona horaria de negocio.

## Actores

### Cliente publico

Puede consultar vehiculos disponibles o reservados y crear consultas.

### Administrador

Puede gestionar inventario, imagenes, costos, reservas, ventas, consultas y
configuracion. Las operaciones quedan auditadas.

### Usuario autenticado sin rol administrativo

Puede existir en Supabase Auth para crecimiento futuro, pero no puede leer
informacion interna ni ejecutar operaciones de administracion.
