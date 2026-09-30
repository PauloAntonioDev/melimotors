# Decision 0002: Regiones y comunas oficiales de Chile

## Estado

Aceptada.

## Decision

Las propuestas seleccionan una de las 16 regiones de Chile y luego una comuna
perteneciente a esa region. La interfaz usa el listado de 346 comunas publicado
por el Sistema Integrado de Informacion Territorial de la Biblioteca del
Congreso Nacional.

Fuente: https://www.bcn.cl/siit/mapoteca/comunas

## Motivo

Los campos libres generan nombres inconsistentes y dificultan agrupar
propuestas por territorio. La division region-comuna es oficial, completa y
adecuada para la operacion comercial.

## Consecuencias

- region y location se guardan por separado.
- location representa la comuna seleccionada.
- Cambiar la region reinicia la comuna para evitar combinaciones invalidas.
- Las propuestas nuevas solo aceptan pares region-comuna del listado oficial.
