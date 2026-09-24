# Criterios de aceptacion

Cada criterio debe poder verificarse con una prueba de base de datos o una
prueba de integracion de la futura aplicacion.

| ID | Criterio |
| --- | --- |
| AC-001 | No se puede crear un vehiculo con `stock_code` duplicado. |
| AC-002 | Un vehiculo disponible sin imagen o portada es rechazado. |
| AC-003 | Un vehiculo con campos obligatorios vacios no puede publicarse. |
| AC-004 | El catalogo publico solo devuelve `disponible` y `reservado`. |
| AC-005 | Un usuario no admin no puede insertar, actualizar ni eliminar vehiculos. |
| AC-006 | El costo operativo total coincide con la suma de sus siete componentes y no incluye la comision. |
| AC-007 | La ganancia de Melimotors y su porcentaje reflejan la modalidad, precio y costos vigentes. |
| AC-008 | Un margen menor a 10% genera advertencia sin bloquear la publicacion. |
| AC-009 | No se puede tener mas de una portada por vehiculo. |
| AC-010 | El borrado de una portada selecciona otra imagen o es rechazado si no existe. |
| AC-011 | Un vehiculo vendido requiere venta registrada con precio positivo y fecha. |
| AC-012 | Un vehiculo vendido no vuelve directamente a disponible. |
| AC-013 | Una consulta sin nombre o telefono es rechazada. |
| AC-014 | Una consulta publica valida queda en estado `nueva`. |
| AC-015 | Un cliente publico no puede leer notas internas ni costos. |
| AC-016 | El financiamiento con tasa cero divide el capital por el plazo. |
| AC-017 | El financiamiento con tasa positiva usa cuota fija mensual. |
| AC-018 | Un pie mayor al precio es rechazado. |
| AC-019 | Solo un administrador puede cambiar estados de leads y agregar notas. |
| AC-020 | Los cambios administrativos generan un evento de auditoria con actor y fecha. |
| AC-021 | El usuario cuyo correo coincide con `admin_email` obtiene rol `admin` al registrarse. |
| AC-022 | Las politicas RLS impiden que el cliente publico consulte tablas internas. |
| AC-023 | La funcion de financiamiento calcula cuota cero correctamente y aplica cuota fija con tasa positiva. |
| AC-024 | Una comision porcentual entre 0% y 100% calcula y guarda su monto solo en consignacion. |
| AC-025 | Una comision menor que 0% o mayor que 100% es rechazada. |
| AC-026 | Un precio minimo mayor que el precio publicado es rechazado. |
| AC-027 | En consignacion, los costos operativos se descuentan de la comision y la vista expone el monto estimado para el cliente. |
| AC-028 | En compra directa, la comision guardada es cero y la ganancia de Melimotors es precio menos costos operativos. |
| AC-029 | La vista administrativa expone la ganancia de Melimotors al precio publicado y al precio minimo. |
| AC-030 | Una propuesta sin nombre o telefono es rechazada. |
| AC-031 | Una propuesta valida queda en estado `nueva` y con origen `whatsapp` por defecto. |
| AC-032 | Solo un administrador puede consultar y modificar propuestas. |
| AC-033 | El administrador puede filtrar propuestas por estado y actualizarlas sin perder su fecha de ingreso. |

## Definition of Done de esta fase

- Todos los documentos de `spec/` existen.
- La migracion crea tablas, indices, triggers, funciones y politicas RLS.
- `seed.sql` contiene configuracion inicial sin credenciales.
- Las reglas con invariantes de datos tienen restricciones SQL o triggers.
- Las reglas que requieren flujo de aplicacion tienen casos de uso y criterios.
- No se agrega interfaz de catalogo ni administrador en esta fase.
