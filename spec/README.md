# Especificacion de Melimotors

Esta carpeta es la fuente normativa del dominio de Melimotors. La aplicacion,
las migraciones y las pruebas deben derivarse de estos documentos.

## Orden de autoridad

1. `10-business-rules.md`: invariantes y politicas del negocio.
2. `30-use-cases.md`: acciones que el negocio permite ejecutar.
3. `20-domain-model.md` y `40-data-contract.md`: entidades, relaciones y contratos.
4. `50-acceptance-criteria.md`: verificacion observable.
5. `60-brand-manual.md`: identidad visual, tono y criterios de interfaz.
6. `supabase/migrations/`: implementacion reproducible de persistencia y seguridad.

Si dos documentos se contradicen, se corrige primero la especificacion y luego
se actualiza la implementacion. No se debe resolver una contradiccion solamente
con codigo o SQL.

## Convencion de reglas

Cada regla usa un identificador estable por area:

- `BR-VEH-*`: vehiculos e inventario.
- `BR-COST-*`: costos y margenes.
- `BR-SALE-*`: reservas y ventas.
- `BR-MEDIA-*`: imagenes.
- `BR-LEAD-*`: consultas.
- `BR-FIN-*`: financiamiento referencial.
- `BR-AUTH-*`: identidad y autorizacion.

Una regla implementada debe tener al menos un criterio de aceptacion y, cuando
sea aplicable, una restriccion o politica equivalente en Supabase.

## Flujo Spec-Driven Development

1. Crear o modificar una regla en `10-business-rules.md`.
2. Actualizar los casos de uso y contratos afectados.
3. Registrar una decision si cambia una politica existente.
4. Derivar o actualizar la migracion de Supabase.
5. Agregar pruebas para el camino valido y los rechazos esperados.
6. Verificar los criterios de aceptacion.
7. Marcar el estado de implementacion en la documentacion correspondiente.

## Definition of Done

Una funcionalidad esta terminada cuando tiene reglas identificadas, casos de
uso documentados, criterios verificables, restricciones de datos, politicas
RLS, migracion reproducible y pruebas para los caminos validos y de error.
