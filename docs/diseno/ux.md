# UX, flujos y patrones de interacción

> **Estado:** vigente desde 2026-11-13.
> La identidad visual está en [`direccion.md`](direccion.md). Este documento define **cómo se comporta** el producto.

## 1. Principio de experiencia

**Registrar debe costar menos que recordar.**

El usuario está de pie, con las manos sucias, un cliente delante y una máquina desarmada. Cada pantalla debe responder:

1. **¿Qué tengo que hacer ahora?**
2. **¿Qué está pendiente?**
3. **¿Cuánto cuesta o cuánto deja esto?**

Si una pantalla no responde ninguna, sobra.

## 2. Mapa de la aplicación

| Ruta | Pantalla | Trabajo principal |
|---|---|---|
| `/` | Dashboard | Ver pendientes, stock bajo y margen de 30 días |
| `/ordenes` | Órdenes | Buscar, filtrar, abrir órdenes y registrar un ingreso (modal) |
| `/ordenes/[id]` | Detalle de orden | Diagnosticar, reparar, agregar repuestos, entregar |
| `/inventario` | Inventario | Ver stock, crear/editar, ajustar, importar |
| `/clientes` | Clientes | Buscar, crear, ver equipos e historial |
| `/clientes/[id]` | Detalle de cliente | Editar datos, gestionar equipos, ver órdenes |
| `/configuracion` | Configuración | Taller, plan, sync, respaldo, demo |

### Navegación

- **Sidebar** en desktop; **header + tabs horizontales** en móvil.
- El ítem activo se marca con fondo y acento ámbar.
- No hay menús anidados en el MVP. Si una sección crece, se resuelve con tabs internas, no con un árbol.
- El logo siempre vuelve al dashboard.
- El estado de conexión y sync vive al pie del sidebar; no interrumpe.

## 3. Dashboard

**Pregunta:** "¿Qué está pasando hoy en el taller?"

Orden de importancia:

1. **Stock bajo** — riesgo de no poder reparar.
2. **Órdenes abiertas** — trabajo en curso.
3. **Listas para retirar** — cliente esperando.
4. **Valor del inventario** — dinero inmovilizado.
5. **Margen de los últimos 30 días** — salud del negocio.
6. **Tablero de máquinas por estado** — dónde está cada trabajo.

Reglas:

- Los números son clicables hacia la lista filtrada cuando exista.
- El margen usa **ventana móvil de 30 días**, no mes calendario, para que la demo y el piloto no arranquen en cero.
- Si no hay datos, cada tarjeta muestra un estado vacío con acción ("Crear primera orden").
- No mostrar gráficos que no cambien una decisión.

## 4. Flujo: ingreso de una máquina

**Objetivo:** menos de 60 segundos.

1. El mostrador abre **Nueva orden**.
2. Selecciona un cliente existente. Si no existe, la app ofrece **Crear cliente** y vuelve al flujo.
3. Selecciona un equipo del cliente o deja "Sin equipo registrado".
4. Escribe el motivo/notas de ingreso.
5. Define la promesa de entrega (por defecto 3 días).
6. Registra mano de obra cobrada y costo interno si ya lo sabe; puede quedar en 0.
7. Crea la orden. Queda en **Ingresado**.
8. En el detalle agrega fotos de ingreso.

Reglas:

- El cliente es obligatorio; el equipo no.
- La promesa de entrega es una fecha, no una hora.
- No se pide el diagnóstico en el ingreso.
- La orden recibe un número correlativo por taller, desde **1001**.
- Si no hay clientes, el modal no permite crear la orden y explica por qué.

## 5. Flujo: reparación

1. El técnico abre la orden y avanza el estado.
2. **Ingresado → Diagnóstico:** registra el diagnóstico.
3. Si falta un repuesto: **Esperando repuesto**.
4. Al reparar: **Reparación**.
5. Agrega repuestos usados:
   - Busca por nombre o código.
   - Indica cantidad.
   - El precio y costo se precargan desde el inventario y se pueden ajustar.
   - El stock se descuenta al agregar.
   - Si ya existe la misma línea, se suma la cantidad.
6. Al terminar: **Listo para retirar**.

Reglas:

- Los estados avanzan en orden; no se salta de Ingresado a Entregado.
- Una orden **Entregada** o **Cancelada** no admite agregar/quitar repuestos.
- Una orden **Cancelada** no se reabre.
- Cambiar a **Entregado** registra `deliveredAt`.
- Cada acción muestra confirmación por toast y actualiza la vista sin recargar.

## 6. Flujo: retiro y aviso

1. En **Listo**, el mostrador ve el botón **Avisar por WhatsApp**.
2. El mensaje se prellena con nombre del cliente, número de orden y equipo.
3. Se abre WhatsApp con el texto; el usuario envía.
4. Cuando el cliente retira, se marca **Entregado**.

Reglas:

- La app no envía mensajes sola ni requiere integración con WhatsApp en el MVP.
- El teléfono se normaliza a formato chileno (`56` + número).
- Hoy no se bloquea un teléfono inválido antes de abrir WhatsApp; agregar esa validación es una mejora pendiente.

## 7. Flujo: cancelación

- Acción secundaria, nunca primaria.
- Requiere confirmación explícita con el número de orden.
- Al cancelar:
  - Se repone el stock de todos los repuestos.
  - La orden queda en **Cancelado**.
  - No se puede reabrir.
- El texto de confirmación explica la consecuencia de stock.

## 8. Flujo: inventario

### Lista

- Buscador por nombre, SKU o código de barras.
- Alertas visuales de stock bajo.
- Valor a costo y a venta visible.
- Acciones por fila: editar, ajustar stock.
- En móvil, cada ítem es una tarjeta.

### Crear/editar

- Campos obligatorios: SKU, nombre, categoría, unidad, costo, precio, stock, stock mínimo.
- El SKU es único por taller. Si se duplica, error inline.
- Costo y precio son enteros CLP ≥ 0.
- El stock puede ser decimal para litros/metros.
- El stock mínimo dispara la alerta del dashboard.

### Ajuste de stock

- Se usa para conteo físico, merma o corrección.
- Se registra la cantidad final. El motivo del ajuste es una mejora planificada (hoy solo se guarda el nuevo stock).
- No se usa para "vender"; para eso está la orden.
- El ajuste queda reflejado en el dashboard.

### Importación Excel

1. Descargar plantilla.
2. Subir archivo `.xlsx`, `.xls` o `.csv`.
3. Ver vista previa y errores.
4. Confirmar importación.
5. Ver resumen: creados, actualizados, rechazados.

Reglas:

- Upsert por `sku`.
- Una fila inválida no bloquea las válidas, pero se reporta.
- No se importa a medias sin avisar.
- Los primeros 10 clientes se acompañan.

## 9. Flujo: clientes

- Lista con búsqueda por nombre o teléfono.
- Crear cliente con nombre y teléfono obligatorios.
- Detalle con datos, equipos e historial de órdenes.
- Un cliente puede tener varias máquinas.
- Hoy no se elimina un cliente desde la UI. Si se agrega la acción, solo debe permitirse sin órdenes; con historial se conserva o se desactiva (decisión pendiente).

## 10. Flujo: configuración

- Nombre del taller y plan.
- Estado de conexión y sincronización.
- Exportar respaldo JSON.
- Reiniciar demo con confirmación destructiva.
- Estimación de almacenamiento.
- No exponer credenciales ni claves.

## 11. Patrones de formulario

- **Label arriba**, siempre visible. No usar placeholder como label.
- Campos obligatorios marcados con `*` y validados al enviar.
- Ayuda (`hint`) debajo del campo; error reemplaza la ayuda.
- Errores en español, específicos: "El SKU ya existe en este taller."
- Mantener el foco en el primer campo inválido.
- No deshabilitar el botón de envío sin explicar por qué; si está deshabilitado, la razón debe ser evidente.
- Durante el guardado: texto "Guardando..." y botón deshabilitado. No cerrar el modal hasta confirmar.
- Si falla: mantener los datos, mostrar error y permitir reintentar.
- Los formularios largos van en modal `lg` o página completa; nunca en un modal pequeño con scroll interno excesivo.

## 12. Patrones de lista y tabla

- Cabecera con título, contador y acción primaria.
- Búsqueda visible si hay más de 10 ítems.
- Filtros como chips o select, no como formulario oculto.
- Orden por defecto: lo más reciente o lo más urgente.
- Filas con hover y foco; toda la fila navega al detalle.
- Acciones destructivas separadas visualmente.
- Paginación o carga incremental; no infinite scroll en inventario.
- En móvil, tarjetas con la misma información priorizada.

## 13. Estados

Toda pantalla con datos debe cubrir:

| Estado | Comportamiento |
|---|---|
| **Cargando** | Skeleton o texto "Cargando..."; nunca pantalla en blanco |
| **Vacío** | Explica qué es y ofrece la acción para crear el primer dato |
| **Con datos** | Vista normal |
| **Error** | Qué pasó + qué hacer + reintentar |
| **Sin conexión** | La app sigue; indicador "Sin internet"; no bloquear |
| **Sync pendiente** | Contador discreto; no alarmar si es normal |
| **Permisos** | Mensaje claro si el rol no permite la acción |

## 14. Errores y confirmaciones

### Fórmula de error

1. **Qué pasó:** "No se pudo guardar el repuesto."
2. **Por qué, si se sabe:** "Quedan 2 unidades y pediste 3."
3. **Qué hacer:** "Ajusta la cantidad o repón stock."

Nunca:

- "Error inesperado."
- "Algo salió mal."
- Mostrar un stack trace.
- Culpar al usuario.

### Confirmaciones

- Solo para acciones destructivas o irreversibles: cancelar orden, reiniciar demo, eliminar foto.
- El botón destructivo dice qué hace: "Cancelar orden", "Reiniciar demo".
- El botón seguro es "Volver" o "Mantener".
- No usar `confirm()` del navegador; usar el `Modal`.

## 15. Offline y sincronización

- La app **nunca** bloquea una acción por falta de red.
- El indicador muestra "En línea" / "Sin internet" y "Sincronizado" / "N por sincronizar" / "Modo local".
- Un cambio local se confirma inmediatamente; la sync es un proceso posterior.
- Si la sync falla, el cambio **no se pierde** y se reintenta.
- No mostrar "guardado en la nube" si Supabase no está configurado.
- En modo local, decirlo: "Modo local".
- La recarga sin red requiere service worker; hasta que exista, no prometerlo en la UI.

## 16. Móvil companion

El teléfono sirve para:

- Consultar pendientes y estado de una orden.
- Tomar fotos de ingreso.
- Abrir WhatsApp para avisar.
- Ver historial de un cliente.

No es prioridad en móvil:

- Importar Excel.
- Editar inventario masivo.
- Configuración avanzada.
- Reportes.

Reglas:

- Navegación horizontal scrolleable, sin hamburguesa en el MVP.
- Modales como bottom sheet.
- Botones de al menos 44 px.
- Cámara accesible desde el detalle de orden.
- No pedir zoom para leer.

## 17. Accesibilidad

- Navegación completa por teclado.
- Foco visible en todos los interactivos.
- `aria-label` en botones de ícono.
- `role="dialog"`, `aria-modal` y título en modales.
- Cerrar modal con `Escape`.
- No atrapar el foco fuera del modal.
- Formularios con `label` asociado y errores anunciados.
- No depender del color para el estado.
- Respetar `prefers-reduced-motion`.

## 18. Microcopy

### Glosario

| Usar | No usar |
|---|---|
| Taller | Tenant, organización, empresa |
| Orden | Ticket, caso, trabajo (en UI) |
| Repuesto | Ítem, SKU (como concepto visible) |
| Mano de obra | Labor |
| Margen | Ganancia (ambos válidos, preferir margen) |
| Stock | Inventario (stock es la cantidad) |
| Stock mínimo | Punto de reorden |
| Entregado | Cerrado |
| Avisar por WhatsApp | Notificar |

### Tono

- Frases cortas. Voz activa.
- "Agregar repuesto", no "Añadir ítem al servicio".
- "Quedan 3", no "Cantidad disponible: 3 unidades".
- "No se pudo crear la orden. Revisa el cliente e intenta de nuevo."
- Sin signos de exclamación. Sin humor en errores.

### Números

- CLP: `$12.000`.
- Porcentaje: `32%`.
- Fechas: `13 nov 2026`.
- Fecha y hora: `13 nov 2026, 14:30`.
- Stock decimal: `2,5 L`.

## 19. Brechas conocidas (no confundir con comportamiento actual)

- El modal no atrapa el foco del teclado; hoy solo cierra con `Escape`. Atrapar el foco es requisito pendiente.
- El teléfono se normaliza pero no se valida antes del enlace de WhatsApp.
- El ajuste de stock no guarda motivo.
- La importación no exige `costo`, `precio` y `stock`: los faltantes quedan en 0.
- No hay eliminación/desactivación de clientes.
- No hay service worker: recargar sin red falla.
- No hay restauración de respaldo.
- No hay roles ni login: todas las acciones están disponibles para quien abra la app.
- Las tablas en móvil se resuelven con scroll o tarjetas según la vista, pero no hay un patrón único auditado.

Estas brechas están priorizadas en `producto/roadmap.md`. La UI no debe prometer que ya están resueltas.

## 20. Checklist de aceptación por pantalla

- [ ] ¿Responde la pregunta principal en 3 segundos?
- [ ] ¿Tiene acción primaria clara y una sola?
- [ ] ¿Cubre vacío, carga, error y sin conexión?
- [ ] ¿El flujo se completa sin recargar la página?
- [ ] ¿Funciona con teclado y en móvil?
- [ ] ¿Los textos están en español y sin jerga técnica?
- [ ] ¿Las acciones destructivas confirman y explican?
- [ ] ¿Los montos y estados usan los formatos canónicos?
- [ ] ¿El usuario sabe qué pasó después de guardar?
