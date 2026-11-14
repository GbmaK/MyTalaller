# Registro de decisiones

> Cada decisión tiene fecha, contexto y consecuencia. Si una decisión cambia, se marca como reemplazada, no se borra.

## D-001 — Vertical inicial: motosierras y equipos motorizados
**Fecha:** 2026-11-01
**Decisión:** Empezar por negocios que venden, reparan y mantienen motosierras y equipos motorizados.
**Por qué:** acceso directo a dueños, dolor validado, rubro desatendido por software vertical, y el patrón se expande a generadores, motobombas, cortadoras y maquinaria agrícola.
**Consecuencia:** el vocabulario, los estados y la plantilla de importación se diseñan para este rubro.

## D-002 — ICP: 2–5 personas, 20+ reparaciones/mes, ticket > $30.000 CLP
**Fecha:** 2026-11-01
**Decisión:** El cliente objetivo tiene entre 2 y 5 personas, al menos 20 reparaciones al mes y un ticket promedio sobre $30.000 CLP.
**Por qué:** por debajo de ese tamaño el dolor no alcanza para pagar el soporte; por encima (40+ ventas/día) el negocio necesita un POS, no trazabilidad.
**Consecuencia:** el plan Básico es de entrada; el plan Pro ($25.000) es el que sostiene la unidad económica. El negocio requiere 200–300 clientes o mayor ARPU para escalar.

## D-003 — Offline-first con un solo escritor
**Fecha:** 2026-11-01
**Decisión:** El PC del mostrador es la fuente de verdad. El MVP evita escrituras concurrentes desde múltiples dispositivos.
**Por qué:** el dolor declarado es trazabilidad, no conectividad; y el conflicto de stock multi-dispositivo es un problema caro de resolver. Un solo escritor simplifica el offline y elimina el riesgo de stock negativo por concurrencia.
**Consecuencia:** el teléfono es companion (fotos, consultas, avisos), no un segundo centro de datos. La sincronización multi-dispositivo se evalúa después del piloto.

## D-004 — PC primero, teléfono como companion
**Fecha:** 2026-11-01
**Decisión:** La experiencia principal se diseña para el PC del mostrador; el teléfono se usa para fotos de ingreso, consultas y avisos.
**Por qué:** el dueño ya trabaja en PC con Excel; el teléfono es ideal, pero no puede reemplazar el mostrador en el MVP.
**Consecuencia:** las fotos de ingreso se capturan desde el teléfono o el PC y se asocian a la orden. La app móvil completa queda fuera del MVP.

## D-005 — Boleta/factura fuera del MVP
**Fecha:** 2026-11-01
**Decisión:** No se emite boleta electrónica ni se integra el SII en el MVP. Queda para el plan Premium.
**Por qué:** es un problema regulatorio, no un diferenciador; el voucher de la máquina de tarjetas ya cubre el pago. El hueco es la trazabilidad, no el documento.
**Consecuencia:** el MVP calcula IVA y total, pero no emite documentos tributarios. La integración se decide más adelante (construir vs. partner DTE).

## D-006 — Plantilla estándar de importación
**Fecha:** 2026-11-01
**Decisión:** La app define una plantilla estándar de Excel; el usuario adapta sus datos. No se depende de un Excel real para diseñar el producto.
**Por qué:** no hay acceso garantizado a un archivo real; una plantilla explícita reduce la incertidumbre y permite validar el contrato de importación en el piloto.
**Consecuencia:** se ofrece "descargar plantilla" y mapeo de columnas. Los primeros 10 clientes se importan de forma asistida para aprender la estructura real.
**Estado 2026-11-13:** plantilla y alias de encabezado implementados; el editor visual de mapeo de columnas sigue pendiente.

## D-007 — Precio: $15.000 / $25.000 / $35.000–$50.000 + setup
**Fecha:** 2026-11-01
**Decisión:** Plan Básico $15.000, Pro $25.000, Premium $35.000–$50.000 CLP/mes; setup $50.000–$100.000 una vez.
**Por qué:** el Básico es una puerta de entrada; el Pro es el plan que paga el negocio; el Premium captura cumplimiento y multi-sucursal. El setup protege la economía del onboarding.
**Consecuencia:** el Básico debe ser autoservicio o casi; el Pro incluye onboarding guiado; el setup es gratis solo para los primeros 3 pilotos.

## D-008 — No construir un POS
**Fecha:** 2026-11-01
**Decisión:** El MVP no incluye caja, turnos, arqueo ni medios de pago. La venta es un módulo liviano dentro de la orden.
**Por qué:** el POS es otro producto, otro mercado y otra competencia. El foco es la trazabilidad del servicio.
**Consecuencia:** las tiendas de 40+ ventas/día quedan fuera del ICP hasta que exista un "modo venta rápida" validado.

## D-009 — Prototipo local-first antes de Supabase
**Fecha:** 2026-11-01
**Decisión:** Construir primero un prototipo funcional con IndexedDB (Dexie) y datos de demo; Supabase se integra después.
**Por qué:** permite mostrar y validar el flujo sin credenciales, sin auth y sin costo de infraestructura. El schema SQL y el cliente de Supabase quedan preparados.
**Consecuencia:** la app corre 100% local. La sincronización real, el multi-tenant en la nube y el storage de fotos son el siguiente hito.

## D-010 — Fotos de ingreso en el MVP
**Fecha:** 2026-11-01
**Decisión:** Incluir fotos de ingreso de la máquina en la orden.
**Por qué:** reduce disputas con el cliente ("así llegó"), es barato de implementar y aumenta la confianza en el sistema.
**Consecuencia:** en el prototipo se guardan como data URLs en IndexedDB; en producción van a Supabase Storage.

## D-011 — Descontar stock al agregar el repuesto
**Fecha:** 2026-11-01
**Decisión:** El stock se descuenta cuando el repuesto se agrega a la orden, no cuando la orden pasa a "Reparación".
**Por qué:** es más simple, evita dobles descuentos y refleja la realidad física: el repuesto ya salió del estante.
**Consecuencia:** al quitar el ítem, el stock se repone. La regla queda documentada y se valida en el piloto.

## D-012 — Margen = total cobrado − costo interno
**Fecha:** 2026-11-01
**Decisión:** `margen = (laborPrice + repuestos cobrados) − (laborCost + repuestos a costo)`.
**Por qué:** el dueño necesita saber si el trabajo dejó plata, no solo el total facturado.
**Consecuencia:** la orden guarda `labor_cost` y cada ítem guarda `unit_cost`. El reporte de margen es el valor mensual que justifica la suscripción.

## D-013 — Documentación normativa con precedencia explícita
**Fecha:** 2026-11-13
**Decisión:** La dirección del proyecto vive en `.md` versionados: `AGENTS.md` como entrada, `docs/README.md` como índice y documentos de área para producto, diseño, ingeniería y operación.
**Por qué:** el contexto se perdía entre sesiones y las decisiones se reconstruían desde cero. Un sistema explícito permite que personas y agentes trabajen con el mismo criterio.
**Consecuencia:** todo cambio de comportamiento, alcance, diseño o seguridad actualiza su documento en el mismo cambio. Las decisiones estructurales se agregan a este registro y no se borran.

## D-014 — Margen del dashboard en ventana móvil de 30 días
**Fecha:** 2026-11-13
**Decisión:** El margen del dashboard se calcula sobre los últimos 30 días, no sobre el mes calendario.
**Por qué:** un mes calendario deja el tablero vacío al inicio de cada mes y empobrece la demo y el piloto. La ventana móvil siempre muestra actividad reciente.
**Consecuencia:** la etiqueta de la UI dice "últimos 30 días". Los reportes contables futuros podrán usar mes calendario, pero no reemplazan este indicador operativo.

## D-015 — Correlativo de órdenes desde 1001
**Fecha:** 2026-11-13
**Decisión:** La numeración de órdenes empieza en 1001 y es correlativa por tenant.
**Por qué:** evita números de orden de un dígito en la operación real y da una apariencia consistente desde el primer trabajo.
**Consecuencia:** `computeNextNumber` parte de 1000 y suma 1. La documentación y las pruebas usan 1001 como primer número.

## D-016 — Dirección visual industrial y sobria
**Fecha:** 2026-11-13
**Decisión:** Shell oscuro (`slate-950`), contenido claro (`slate-50`/blanco) y un único acento ámbar (`amber-500`), con tipografía Geist y componentes de bordes redondeados.
**Por qué:** el producto debe sentirse como una herramienta de taller, no como un SaaS genérico. El contraste estructural y el acento único favorecen el uso rápido en mostrador.
**Consecuencia:** no se agregan gradientes, glassmorphism ni paletas decorativas. Los colores de estado son semánticos y estables (ver `docs/diseno/direccion.md`).

## D-017 — No conectar Supabase hasta cerrar hallazgos de RLS
**Fecha:** 2026-11-13
**Decisión:** La nube no se conecta con datos reales hasta corregir y probar los hallazgos de seguridad documentados.
**Por qué:** la política `profiles_update` permite potencial escalada de `tenant_id`/`role`, y `tenants_update` permite cambiar plan/status. Conectarlas así expondría datos entre talleres o la facturación.
**Consecuencia:** antes de la fase 2 se restringen esas actualizaciones, se ejecuta una prueba de acceso cruzado con dos tenants y se registra el resultado. Ver `docs/ingenieria/seguridad.md`.
