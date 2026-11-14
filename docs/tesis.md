# Tesis del negocio — TallerOS (nombre de trabajo)

> Documento vivo. Última actualización: 2026-11-01.

## 1. La idea en una frase

**TallerOS es la secretaria que el taller no tiene:** un sistema offline-first para el PC del mostrador que registra cada trabajo y cada repuesto en el flujo, muestra qué está pendiente, avisa al cliente cuando su equipo está listo y calcula el costo y margen real de cada servicio.

## 2. Cliente objetivo (ICP)

Negocios de **motosierras y equipos motorizados** que:

- Tienen entre **2 y 5 personas** (dueño + técnicos / mostrador).
- **Venden, reparan y mantienen** equipos con **inventario propio**.
- Hacen **20+ reparaciones al mes** y tienen un **ticket promedio sobre $30.000 CLP**.
- Hoy controlan con **Excel, memoria y WhatsApp**; el inventario tiene códigos o IDs, pero no está integrado al flujo de servicio.
- El dueño es el comprador y también un usuario diario.

**Fuera del ICP (por ahora):**

- Tiendas de 40+ ventas al día: necesitan un POS, no un sistema de trazabilidad.
- Talleres de una sola persona con menos de 15 trabajos al mes: el dolor existe, pero no alcanza para pagar el soporte.
- Rubros sin inventario propio o sin mano de obra cobrada.

## 3. Problema

El dueño no sabe con exactitud:

1. **Qué stock tiene** y cuánto vale.
2. **Qué trabajos están pendientes** y en qué estado está cada máquina.
3. **Qué repuesto se usó** en cada reparación y si se cobró.
4. **Cuánto ganó** realmente en cada trabajo, sumando repuesto + mano de obra.
5. **Qué cliente ya puede retirar** su equipo.

La información se pierde en el día a día. El dueño hace de técnico, vendedor, recepcionista y administrador al mismo tiempo. El costo de no saber se paga en repuestos no cobrados, trabajos sin registrar, stock inflado y clientes mal atendidos.

## 4. Propuesta de valor

> **La secretaria que tu taller no tiene: sabe qué tienes, qué está pendiente y cuánto ganaste, sin internet y sin planillas.**

No vendemos "gestión". Vendemos **trazabilidad operativa y margen**:

- Gancho diario: stock, tablero de máquinas y aviso de retiro.
- Valor mensual: costo y margen por trabajo.

## 5. Solución (MVP)

- **Inventario** con costo, precio, stock, stock mínimo y alertas.
- **Órdenes de servicio** con cliente, máquina, fotos de ingreso, estado, repuestos usados, mano de obra, total y margen.
- **Tablero de máquinas** por estado, con promesa de entrega y responsable.
- **Aviso de retiro** por WhatsApp con mensaje prellenado.
- **Offline-first** en el PC del mostrador, con sincronización al volver internet.
- **Importación desde Excel** con plantilla estándar.

## 6. Modelo de negocio

Suscripción mensual **por negocio**, no por usuario.

| Plan | Precio | Incluye | Para quién |
|---|---|---|---|
| Básico | $15.000 CLP/mes | 1 usuario, 1 dispositivo, inventario, órdenes, tablero, import Excel | Dueño solo, autoservicio |
| Pro | $25.000 CLP/mes | Hasta 3 usuarios, escáner, avisos WhatsApp, mano de obra, reportes | Taller de 3–5 personas |
| Premium | $35.000–$50.000 CLP/mes | Boletas/facturación, multi-sucursal, integraciones, soporte prioritario | Futuro |
| Setup | $50.000–$100.000 CLP una vez | Importación, etiquetado y capacitación | Opcional; gratis para los primeros 3 pilotos |

**Piloto:** $15.000 CLP por 30 días, con setup gratis para los primeros 3, a cambio de feedback semanal y testimonio.

**Economía honesta:** a $15.000 CLP de ARPU, 100 clientes son $1.5M CLP/mes. Para sostener un equipo hay que aspirar a 200–300 clientes o subir el ARPU con el plan Pro. Eso solo es posible si el onboarding y el soporte son de bajo contacto. La plantilla de importación y el autoservicio no son un lujo: son la condición para que el negocio escale.

## 7. Competencia

El competidor real no es otro SaaS. Es:

- **Excel** para el inventario.
- **La memoria del dueño** para los pendientes.
- **WhatsApp** para la coordinación.
- **El voucher de la máquina de tarjetas** para el pago.

Ninguno conecta **repuesto → trabajo → cobro → margen**. Ahí está el espacio.

## 8. Foso inicial (moat)

- Datos históricos de costos, trabajos y márgenes del taller.
- Catálogo de repuestos y códigos del vertical.
- Confianza local y boca a boca.
- Promesa offline confiable (el taller no se detiene).
- Costo de cambio: una vez que el inventario y el historial viven en el sistema, migrar duele.

## 9. Riesgos y supuestos

| Riesgo | Supuesto a validar | Mitigación |
|---|---|---|
| Abandono por exceso de registro | El dueño registrará el trabajo si le ahorra tiempo | Captura en el flujo, importación Excel, simplicidad radical |
| El precio es demasiado bajo para el soporte | 2–5 personas pagan $15.000–$25.000 | Setup fee, autoservicio, plan Pro |
| El offline no era el dolor | El taller valora no depender de internet | Validar en piloto; no sobre-invertir antes |
| La plantilla no calza con la realidad | Un contrato de importación estándar es suficiente | Primeros 10 clientes con importación asistida |
| El dueño no quiere cambiar | El dolor es más fuerte que la inercia | Piloto pagado, no gratis |
| El vertical es muy chico | 2–5 personas × motosierras alcanza para 100+ clientes | Expandir a equipos motorizados/agrícolas |

## 10. Piloto y métricas de éxito

Un negocio, 30 días, $15.000 CLP.

- Todos los trabajos de 2 semanas consecutivas registrados.
- Conteo de stock que coincida con la realidad (o discrepancia <5%).
- El dueño abre la app todos los días sin recordatorio.
- Al menos 3 avisos de "lista para retirar" enviados.
- Al día 31: dice sí o no a seguir pagando, con una razón.

## 11. Expansión

Motosierras → generadores, motobombas, cortadoras, ATV, maquinaria agrícola. Mismo patrón: **venden, reparan y tienen repuestos**. El núcleo es horizontal; la configuración (vocabulario, unidades, estados) es por vertical.

## 12. La frase que hay que defender

> **No es un software de inventario. Es la memoria y el margen del taller, funcionando aunque se caiga internet.**
