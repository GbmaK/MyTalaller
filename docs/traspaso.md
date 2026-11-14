# Traspaso y estado del proyecto

> **Corte:** 2026-11-13.
> Este documento existe para retomar TallerOS después de un tiempo sin contexto. Léelo antes que cualquier otro.

## 1. Qué es TallerOS

Sistema **offline-first** para talleres de motosierras y equipos motorizados de **2–5 personas**, con **20+ reparaciones/mes** y ticket promedio **> $30.000 CLP**.

> **La secretaria que el taller no tiene:** sabe qué hay en stock, qué está pendiente, qué repuesto se usó y cuánto dejó cada trabajo.

No es un POS. Es trazabilidad operativa y margen.

## 2. Qué está construido

Prototipo local-first funcional:

- Dashboard con stock bajo, órdenes abiertas, listas para retirar, valor de inventario, margen de **últimos 30 días** y tablero por estado.
- Inventario: CRUD, búsqueda, ajuste de stock, stock mínimo, importación Excel y plantilla descargable.
- Órdenes: creación, cliente/equipo, fotos de ingreso, estados, repuestos con descuento de stock, total, IVA, margen y aviso por WhatsApp.
- Clientes: CRUD, equipos e historial.
- Configuración: nombre/plan, estado de sync, exportar JSON, reiniciar demo.
- Datos de demo: “Taller Los Robles”, tenant `tenant-demo`.

## 3. Stack

- Next.js **16.4.3**, React **19.3**, TypeScript estricto, Tailwind **4**.
- Dexie/IndexedDB como fuente local.
- `xlsx` para importación.
- `sonner` para toasts, `lucide-react` para iconos.
- Supabase: schema, RLS, storage y `bootstrap_tenant` **escritos pero sin conectar**.
- Sin tests automatizados.

## 4. Cómo correr

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

Verificación:

```bash
npm run lint
npm run build
```

Recorrido manual completo en `docs/operacion/runbook.md`.

## 5. Reglas de negocio que no cambian

- Stock se descuenta al **agregar** el repuesto y se repone al **quitarlo o cancelar**.
- `total = laborPrice + partsTotal`
- `margen = total − (laborCost + Σ(unitCost × quantity))`
- `partsTotal = Σ(unitPrice × quantity)`
- Total incluye **IVA 19%**; el neto se deriva.
- Estados: `ingresado → diagnostico → esperando_repuesto → reparacion → listo → entregado`; `cancelado` es terminal.
- Orden entregada/cancelada no admite repuestos.
- Orden cancelada no se reabre.
- Número de orden: correlativo por taller, desde **1001**.
- SKU único por taller; importación hace upsert por SKU.
- Un solo escritor: el PC del mostrador manda; el teléfono es companion.

## 6. Decisiones importantes

- D-001: vertical inicial motosierras/equipos motorizados.
- D-002: ICP 2–5 personas, 20+ reparaciones/mes, ticket > $30.000.
- D-003: offline-first con un solo escritor.
- D-004: PC primero, teléfono companion.
- D-005: boleta/factura fuera del MVP.
- D-006: plantilla estándar de importación (alias implementados; mapeo manual pendiente).
- D-007: Básico $15.000 / Pro $25.000 / Premium $35.000–$50.000 + setup $50.000–$100.000.
- D-008: no construir POS.
- D-009: prototipo local antes de Supabase.
- D-010: fotos de ingreso en el MVP.
- D-011: descontar stock al agregar repuesto.
- D-012: margen = total cobrado − costo interno.
- D-013: documentación normativa con precedencia.
- D-014: margen del dashboard en ventana móvil de 30 días.
- D-015: correlativo desde 1001.
- D-016: diseño industrial sobrio, shell oscuro + ámbar.
- D-017: no conectar Supabase hasta corregir RLS.

Detalle completo en `docs/decisiones.md`.

## 7. Documentación que manda

- `AGENTS.md` — entrada y reglas no negociables.
- `docs/README.md` — índice y precedencia.
- `docs/producto/vision.md` — objetivos, ICP, métricas.
- `docs/producto/roadmap.md` — fases y puertas.
- `docs/ingenieria/arquitectura.md` — capas, datos, sync, límites.
- `docs/ingenieria/convenciones.md` — cómo codear.
- `docs/ingenieria/seguridad.md` — RLS, privacidad, incidentes.
- `docs/diseno/direccion.md` — identidad visual.
- `docs/diseno/ux.md` — flujos y patrones.
- `docs/operacion/runbook.md` — operación, soporte, verificación.
- `docs/tesis.md`, `docs/mvp.md`, `docs/entrevista.md`, `docs/plantilla-importacion.md` — negocio.

## 8. Límites actuales (importante)

- **Sin auth:** cualquiera con acceso al navegador ve los datos locales.
- **Sin pull sync:** solo existe un push manual desde Configuración.
- **Sin service worker:** recargar sin red falla.
- **Sin restauración de respaldo:** solo exportar JSON.
- **Fotos como data URLs** en IndexedDB; la cola envía el data URL como `storage_path`, no sube el binario.
- **Cola no atómica:** se escribe después de la transacción; una caída entre ambas pierde el encolado (no el dato local).
- **Sin tests** ni observabilidad.
- Un solo tenant local en la práctica.

## 9. Seguridad: pendientes antes de producción

- `profiles_update` permite al usuario cambiar su propio `tenant_id`/`role` → posible escalada.
- `tenants_update` permite cambiar `plan`/`status` → riesgo de facturación.
- RLS no probada con dos talleres reales.
- Faltan URLs firmadas y subida real de fotos.
- Faltan backups automáticos y prueba de restauración.

Ver `docs/ingenieria/seguridad.md`.

## 10. Hacia dónde va el MVP en Vercel

Stack recomendado:

| Pieza | Rol |
|---|---|
| Vercel | Hostear Next.js |
| Supabase | Postgres + Auth + Storage + RLS |
| Resend | SMTP de Supabase Auth (verificación, recuperación, cambio de contraseña) |

**Resend no es auth.** Solo entrega correos. Los usuarios, tokens y sesiones los maneja Supabase Auth.

### Estrategia de datos para inventario pequeño

**Snapshot + outbox**, no sync incremental complejo:

1. Login.
2. Subir cambios pendientes.
3. Bajar snapshot completo del taller a IndexedDB.
4. Trabajar offline.
5. Al reconectar, subir la cola.

El snapshot incluye clientes, equipos, inventario, órdenes, ítems y metadatos de fotos; no los binarios.

### Web o desktop

**Web responsive + PWA primero.** Corre en PC y teléfono, se instala desde Chrome/Edge y se despliega en Vercel.

Desktop nativo solo si hace falta impresora térmica, escáner o archivos locales; ahí se evalúa Tauri reutilizando la app web.

## 11. Orden recomendado para retomar

1. Revisar `git status` y **commitear** el trabajo actual.
2. Corregir hallazgos de RLS.
3. Crear proyecto Supabase y ejecutar `supabase/migrations/0001_init.sql`.
4. Configurar Supabase Auth + Resend como SMTP.
5. Implementar login, `bootstrap_tenant` y sesión con `@supabase/ssr`.
6. Implementar snapshot pull + outbox push.
7. Subir fotos a Storage y servir URLs firmadas.
8. Agregar service worker/PWA y restauración de respaldo.
9. Probar aislamiento con dos talleres.
10. Onboarding del piloto de 30 días.

## 12. Primeras acciones al volver

```bash
git status
npm install
npm run lint
npm run build
npm run dev
```

Luego leer:

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/producto/roadmap.md`
4. `docs/ingenieria/seguridad.md`
5. `docs/operacion/runbook.md`

## 13. Estado de git

Al 2026-11-13 **no se hizo commit ni push** desde el agente. Hay trabajo del prototipo y de la documentación sin versionar. Revisar antes de continuar.

## 14. Frase para no olvidar el foco

> **No es un software de inventario. Es la memoria y el margen del taller, funcionando aunque se caiga internet.**
