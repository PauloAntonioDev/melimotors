# Casos de uso

## UC-001 Crear vehiculo

**Actor:** administrador.

**Precondicion:** usuario autenticado con rol `admin`.

**Flujo:** registra datos tecnicos, fecha de ingreso al stock, precio publicado,
precio minimo, modalidad de adquisicion y descripcion. Registra los costos y la
comision porcentual. La fecha no puede ser futura. El vehiculo se crea como
`borrador` y recibe un identificador unico de inventario.

**Resultado:** existe un vehiculo editable sin visibilidad publica y se puede
consultar cuantos dias lleva en stock.

## UC-002 Cargar y ordenar imagenes

**Actor:** administrador.

**Precondicion:** existe un vehiculo.

**Flujo:** sube archivos a Storage, registra metadatos, define orden y portada.

**Resultado:** el vehiculo tiene imagenes trazables y una portada unica.

## UC-003 Publicar vehiculo

**Actor:** administrador.

**Precondicion:** datos obligatorios completos, precio positivo, al menos una
imagen y una portada.

**Flujo:** cambia el estado de `borrador` a `disponible`.

**Resultado:** el vehiculo aparece en el catalogo publico. Si el margen esta
bajo el umbral, se publica con advertencia interna.

## UC-004 Registrar costos

**Actor:** administrador.

**Flujo:** registra o actualiza los siete costos operativos y el porcentaje de
comision. La comision solo se calcula para consignacion y usa el precio
publicado como base.

**Resultado:** el costo operativo total, el monto estimado para el cliente y la
ganancia neta de Melimotors se calculan al precio publicado y al precio minimo.

## UC-005 Reservar vehiculo

**Actor:** administrador.

**Precondicion:** vehiculo `disponible`.

**Flujo:** crea una reserva activa y cambia el estado a `reservado`.

**Resultado:** el vehiculo sigue visible, pero se muestra como no disponible.

## UC-006 Vender vehiculo

**Actor:** administrador.

**Precondicion:** vehiculo `borrador`, `disponible` o `reservado`.

**Flujo:** registra fecha, precio final, comprador opcional, notas y documentos
opcionales. El sistema calcula la comision, el monto del cliente cuando
corresponde y la ganancia real, y luego cambia el estado a `vendido`.

**Resultado:** el vehiculo sale del catalogo activo y queda disponible en el
historial de ventas con sus resultados financieros.

## UC-007 Registrar consulta publica

**Actor:** cliente publico.

**Precondicion:** nombre y telefono informados; el vehiculo, si existe, es
publico.

**Resultado:** se crea un lead en estado `nueva`.

## UC-008 Gestionar consulta

**Actor:** administrador.

**Flujo:** consulta leads, cambia estado y agrega notas internas.

**Resultado:** queda trazabilidad del seguimiento comercial.

## UC-009 Calcular financiamiento

**Actor:** cliente publico o administrador.

**Flujo:** informa precio, pie, tasa y plazo validos.

**Resultado:** recibe cuota mensual y costo total referencial.

## UC-010 Configurar negocio

**Actor:** administrador.

**Flujo:** actualiza umbral de margen, plazos, tasa y datos publicos.

**Resultado:** los nuevos calculos y presentaciones usan la configuracion
vigente.

## UC-011 Registrar propuesta de WhatsApp

**Actor:** administrador.

**Precondicion:** usuario autenticado con rol `admin`.

**Flujo:** registra contacto, ciudad o ubicacion, modalidad, datos del vehiculo,
precio esperado, resumen de la conversacion y notas internas. Opcionalmente
asocia la propuesta a una campaña publicitaria mediante su nombre y codigo
alfanumerico.

**Resultado:** la propuesta queda guardada en estado `nueva`, identificada por
el WhatsApp con codigo de pais y su campaña cuando corresponde; puede filtrarse,
ordenarse y avanzar por su seguimiento comercial.

## UC-012 Gestionar documentos de venta

**Actor:** administrador.

**Precondicion:** existe una venta registrada.

**Flujo:** clasifica y adjunta uno o mas documentos PDF, imagen o Word. Puede
abrirlos mediante un enlace temporal privado o eliminarlos del expediente.

**Resultado:** los archivos quedan almacenados de forma privada y asociados a
la venta con sus metadatos auditables.
