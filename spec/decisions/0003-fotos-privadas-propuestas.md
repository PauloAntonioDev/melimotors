# ADR-0003: Fotos privadas en propuestas

## Estado

Aceptada.

## Decision

Cada propuesta puede tener una sola imagen principal. El archivo se almacena en
el bucket privado `proposal-images` y la tabla `vehicle_proposals` conserva su
ruta en `image_storage_path`. La administración usa enlaces temporales para
mostrarla.

El margen potencial no se persiste: se calcula desde los rangos de compra para
el negocio y venta de mercado para evitar valores desactualizados.

## Consecuencias

- Las fotos de captacion no quedan expuestas en una URL publica.
- Reemplazar una foto elimina el archivo anterior despues de guardar la nueva.
- El listado siempre refleja el margen de los rangos vigentes.
