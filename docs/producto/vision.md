# Visión, objetivos y límites

> **Estado:** vigente desde 2026-11-13.
> **Documento canónico de negocio:** [`../tesis.md`](../tesis.md). Este documento traduce la tesis a objetivos operativos y criterios de decisión para el producto.

## 1. En una frase

**TallerOS es la secretaria que el taller no tiene:** registra cada trabajo y cada repuesto en el flujo, muestra qué está pendiente, avisa al cliente cuando su equipo está listo y calcula el costo y margen real de cada servicio, aunque se caiga internet.

## 2. El problema que resolvemos

El dueño de un taller de 2–5 personas hace de técnico, mostrador y administrador. La información vive en Excel, memoria y WhatsApp, y se pierde en el día:

1. No sabe con exactitud **qué stock tiene** ni cuánto vale.
2. No sabe **qué trabajos están pendientes** ni en qué estado está cada máquina.
3. No sabe **qué repuesto se usó** en cada reparación ni si se cobró.
4. No sabe **cuánto ganó** realmente por trabajo.
5. No sabe **qué cliente ya puede retirar** su equipo.

El costo de no saber se paga en repuestos no cobrados, trabajos sin registrar, stock inflado y clientes mal atendidos.

## 3. Cliente objetivo (ICP)

Negocios de **motosierras y equipos motorizados** que:

- Tienen entre **2 y 5 personas**.
- **Venden, reparan y mantienen** equipos con inventario propio.
- Hacen **20+ reparaciones al mes**.
- Tienen un **ticket promedio sobre $30.000 CLP**.
- Hoy controlan con Excel, memoria y WhatsApp.
- El dueño es comprador y usuario diario.

**Fuera del ICP por ahora:**

- Tiendas de 40+ ventas al día: necesitan un POS, no trazabilidad.
- Talleres de una persona con menos de 15 trabajos al mes: el dolor no paga el soporte.
- Rubros sin inventario propio o sin mano de obra cobrada.

**Expansión futura:** generadores, motobombas, cortadoras, ATV y maquinaria agrícola. El núcleo es horizontal; el vocabulario y la configuración son por vertical.

## 4. Promesa de producto

Para el dueño:

> **Sabes qué tienes, qué está pendiente y cuánto ganaste, sin internet y sin planillas.**

Para el técnico:

> **Registrar el repuesto y cambiar el estado toma menos que anotarlo en un papel.**

Para el mostrador:

> **Recibir una máquina y avisar que está lista no depende de la memoria de nadie.**

## 5. Objetivos

### 5.1 Objetivo de negocio (12 meses, hipótesis)

Validar que un taller de 2–5 personas paga **$15.000–$25.000 CLP/mes** por trazabilidad y margen, y que el onboarding se puede hacer con bajo contacto.

Resultados esperados:

- 1 piloto pagado de 30 días que renueva.
- 10 talleres pagando o en piloto al final del año.
- Costo de soporte por taller compatible con un ARPU de $15.000–$25.000.
- Una plantilla de importación que funcione sin ayuda en la mayoría de los casos.

> Estos números son una hipótesis de planificación, no una promesa. Se revisan con evidencia del piloto.

### 5.2 Objetivo de producto (MVP)

Demostrar **trazabilidad operativa y margen** en un taller real:

- El 100% de los trabajos de dos semanas consecutivas queda registrado.
- Cada trabajo entregado tiene repuestos, costo, total y margen.
- El stock físico y el del sistema difieren menos de 5%.
- El dueño abre la app todos los días sin que nadie se lo recuerde.
- Se envían al menos 3 avisos de "listo para retirar" por WhatsApp.

### 5.3 Objetivo de experiencia

- Entender la app en **5 minutos**, sin capacitación formal.
- Registrar un ingreso en **menos de 60 segundos**.
- Agregar un repuesto a una orden en **menos de 15 segundos**.
- Encontrar "qué está pendiente" en **una sola pantalla**.
- Ninguna acción frecuente requiere más de **3 clics**.

### 5.4 Objetivos de ingeniería

- La app **nunca bloquea** una operación por falta de red.
- Ninguna escritura de negocio deja datos a medias: o se confirma todo, o no se confirma nada.
- Ningún taller puede ver datos de otro taller.
- Un error de sincronización **no pierde** el cambio local.
- `lint` y `build` pasan antes de cada entrega.

## 6. Principios de producto

1. **Captura en el flujo:** registrar es parte del trabajo, no una tarea aparte.
2. **Un solo escritor:** el PC del mostrador es la fuente de verdad; el teléfono es companion.
3. **Offline primero, sin drama:** se trabaja sin red y se sincroniza cuando vuelve.
4. **Radicalmente simple:** si el dueño no lo entiende en 5 minutos, no sirve.
5. **El tablero manda:** la pantalla principal responde "qué está pendiente", no "qué SKUs existen".
6. **La app define la estructura:** plantilla estándar de importación; el usuario adapta sus datos.
7. **El margen es el valor mensual:** el gancho diario es el tablero; lo que justifica la suscripción es saber cuánto se ganó.
8. **No construir un POS:** caja, turnos y medios de pago son otro producto.

## 7. Modelo de negocio

Suscripción mensual **por negocio**, no por usuario.

| Plan | Precio | Incluye | Para quién |
|---|---|---|---|
| Básico | $15.000 CLP/mes | 1 usuario, 1 dispositivo, inventario, órdenes, tablero, import Excel | Dueño solo, autoservicio |
| Pro | $25.000 CLP/mes | Hasta 3 usuarios, escáner, avisos WhatsApp, mano de obra, reportes | Taller de 3–5 personas |
| Premium | $35.000–$50.000 CLP/mes | Boleta/facturación, multi-sucursal, integraciones, soporte prioritario | Futuro |
| Setup | $50.000–$100.000 CLP una vez | Importación, etiquetado y capacitación | Opcional; gratis para los primeros 3 pilotos |

**Piloto:** $15.000 CLP por 30 días, setup gratis para los primeros 3, a cambio de feedback semanal y testimonio.

**Realidad económica:** a $15.000 de ARPU, 100 clientes son $1,5M CLP/mes. Para sostener un equipo hay que aspirar a 200–300 clientes o subir el ARPU con Pro. Eso exige onboarding y soporte de bajo contacto.

## 8. Métricas

### North Star

**Órdenes entregadas por semana con repuestos, costo y margen registrados.**

Mide lo que el producto promete: trabajo trazado y margen visible. No mide usuarios ni clics.

### Métricas de apoyo

| Métrica | Objetivo | Dónde se mide |
|---|---|---|
| Trabajos registrados | 100% en 2 semanas | Piloto, revisión semanal |
| Exactitud de stock | discrepancia < 5% | Conteo físico vs. sistema |
| Uso diario del dueño | ≥ 5 días/semana | Acceso y órdenes creadas |
| Tiempo de ingreso | < 60 s | Observación en mostrador |
| Avisos de retiro | ≥ 3 en 30 días | Mensajes enviados |
| Órdenes con margen completo | 100% de las entregadas | Dashboard / orden |
| Errores de sincronización | 0 pérdidas | Cola local y logs |

### Métricas de guarda (no sacrificar)

- **Tiempo por trabajo:** si registrar duplica el tiempo, el producto fracasa.
- **Integridad de stock:** nunca stock negativo por una operación normal.
- **Aislamiento:** cero accesos cruzados entre talleres.
- **Pérdida de datos:** cero cambios locales perdidos por fallo de sync.

## 9. No objetivos (explícitos)

Hasta nuevo aviso **no** construimos:

- Boleta o factura electrónica del SII.
- POS completo: caja, turnos, arqueo, medios de pago.
- App móvil nativa o app móvil completa.
- Compras a proveedores y cuentas por pagar.
- Cobranza y cuentas por cobrar.
- Multi-sucursal.
- Hardware propio o etiquetas RFID.
- Contabilidad, nómina o reportes financieros avanzados.
- Integraciones con marketplaces.
- Personalización por cliente a nivel de código.

Si una petición cae en esta lista, se responde con el alcance actual y se registra como candidato, no se improvisa.

## 10. Criterios para priorizar

Ante dos ideas, gana la que:

1. Aumente la trazabilidad de un trabajo real.
2. Se use todos los días en el mostrador.
3. Funcione sin internet.
4. Reduzca soporte o pasos manuales.
5. Mejore la visibilidad del margen.
6. Se pueda validar en el piloto en menos de 2 semanas.

Pierde la que:

- Agregue un módulo que el ICP no pidió.
- Aumente el registro sin ahorrar tiempo.
- Requiera hardware o integración regulatoria.
- Solo sirva para un cliente y no se pueda generalizar.
- Introduzca concurrencia multi-dispositivo antes de validar el núcleo.

## 11. Riesgos y supuestos

| Riesgo | Supuesto a validar | Mitigación |
|---|---|---|
| Abandono por exceso de registro | El dueño registra si le ahorra tiempo | Captura en el flujo, importación, simplicidad |
| Precio bajo para el soporte | 2–5 personas pagan $15.000–$25.000 | Setup, autoservicio, plan Pro |
| El offline no era el dolor | El taller valora no depender de internet | Validar en piloto; no sobre-invertir |
| La plantilla no calza | Un contrato estándar es suficiente | Primeros 10 imports asistidos |
| El dueño no cambia | El dolor supera la inercia | Piloto pagado, no gratis |
| El vertical es chico | 2–5 personas × motosierras da 100+ clientes | Expandir a equipos motorizados |
| Complejidad multi-tenant | RLS bien hecha evita fugas | Revisión de seguridad antes de la nube |

## 12. Frase que hay que defender

> **No es un software de inventario. Es la memoria y el margen del taller, funcionando aunque se caiga internet.**
