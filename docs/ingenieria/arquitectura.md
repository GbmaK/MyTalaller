# Arquitectura

> **Estado:** vigente desde 2026-11-13.
> Describe lo que existe **hoy** y lo que está planificado. Lo planificado se marca explícitamente.

## 1. Principios arquitectónicos

1. **Local-first:** la escritura se confirma en IndexedDB antes de tocar la red.
2. **Un solo escritor:** el PC del mostrador es la fuente de verdad. El teléfono consulta y captura, no compite por stock.
3. **Transacciones para el negocio:** stock, ítems de orden y totales se escriben juntos o no se escriben.
4. **La cola no pierde cambios:** un fallo de sync no revierte el dato local.
5. **Tipos canónicos:** un solo lugar para el dominio (`src/types/domain.ts`).
6. **Reglas en acciones, no en componentes:** la UI no calcula stock ni márgenes críticos.
7. **Aislamiento por tenant:** toda entidad lleva `tenantId`; la nube lo refuerza con RLS.
8. **Sin sobre-ingeniería:** no hay capa de red, estado global ni ORM hasta que el piloto lo justifique.

## 2. Vista de contexto

```
┌─────────────────────────────────────────────────────────────┐
│ Navegador (PC del mostrador / teléfono companion)           │
│                                                             │
│  Next.js 16 App Router + React 19                           │
│    rutas → vistas cliente → hooks (useLiveQuery)            │
│                         │                                   │
│                         ▼                                   │
│                  acciones de dominio                        │
│                         │                                   │
│              ┌──────────┴──────────┐                        │
│              ▼                     ▼                        │
│      Dexie / IndexedDB       syncQueue (local)              │
│      (fuente de verdad)             │                       │
│              │                      │                       │
│              └──────────┬───────────┘                       │
│                         ▼                                   │
│              syncPendingChanges()                           │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS (cuando hay red + sesión)
                          ▼
              ┌───────────────────────────┐
              │ Supabase                  │
              │ PostgreSQL + RLS + Auth   │
              │ Storage (fotos)           │
              └───────────────────────────┘
```

**Hoy:** la nube está escrita pero desconectada. La app funciona 100% local con datos de demo.
**Planificado:** auth, pull sync, storage de fotos y resolución de conflictos (ver `producto/roadmap.md`).

## 3. Capas y carpetas

```
src/
  app/                    Rutas del App Router (server components delgados)
  components/
    ui/                   Primitivas sin conocimiento de dominio
    app-shell.tsx         Navegación, tenant y estado de sync
    app-providers.tsx     Toaster y providers
  features/
    <dominio>/
      *-actions.ts        Mutaciones y reglas de negocio
      use-*.ts            Consultas reactivas (Dexie live queries)
      *-view.tsx          Composición de pantalla
      *-form.tsx          Formularios de dominio
  lib/
    db.ts                 Esquema Dexie y lifecycle
    seed.ts               Datos de demo
    sync.ts               Cola y push a Supabase
    supabase.ts           Cliente y detección de configuración
    format.ts             CLP, fechas, IVA, WhatsApp
    ids.ts                IDs y timestamps
    hooks.ts              Hooks transversales
    cn.ts                 Compositor de clases
  types/
    domain.ts             Tipos, estados y flujo de estados
supabase/
  migrations/0001_init.sql  Schema, RLS, storage, bootstrap
```

### Regla de dependencias

```
app → features → lib → types
components/ui → lib/cn
```

- `app/` no contiene lógica de negocio; solo monta vistas.
- `features/` puede importar `lib/` y `types/`, nunca al revés.
- `components/ui/` no importa `features/` ni `types/domain.ts`.
- `lib/db.ts` no importa `features/`.
- Ningún componente accede a Dexie directamente; usa un hook o una acción.

## 4. Modelo de datos local

Base: `talleros-db`, versión 1.

| Tabla | PK | Índices principales |
|---|---|---|
| `tenants` | `id` | `name`, `status` |
| `customers` | `id` | `tenantId`, `name`, `phone`, `updatedAt` |
| `equipment` | `id` | `tenantId`, `customerId`, `brand`, `model`, `serialNumber` |
| `inventoryItems` | `id` | `tenantId`, `sku`, `barcode`, `name`, `category`, `stock`, `updatedAt`, `[tenantId+sku]` |
| `serviceOrders` | `id` | `tenantId`, `number`, `customerId`, `equipmentId`, `status`, `promisedAt`, `updatedAt`, `[tenantId+status]`, `[tenantId+number]` |
| `serviceOrderItems` | `id` | `tenantId`, `orderId`, `inventoryItemId`, `[tenantId+orderId]` |
| `orderPhotos` | `id` | `tenantId`, `orderId`, `[tenantId+orderId]` |
| `syncQueue` | `id` | `tenantId`, `entity`, `entityId`, `createdAt` |

Tipos canónicos en `src/types/domain.ts`. No se crean tipos paralelos en componentes.

### Invariantes

- Toda entidad de negocio tiene `tenantId`.
- Toda consulta de negocio filtra por `tenantId`.
- `serviceOrders.number` es correlativo por tenant y empieza en **1001**.
- `serviceOrders.total = laborPrice + partsTotal`.
- `partsTotal` es caché de `Σ(unitPrice × quantity)`.
- `margen = total − (laborCost + Σ(unitCost × quantity))`.
- El total incluye IVA (19%); el neto se deriva.
- `orderPhotos` guarda una data URL en el prototipo; en producción será una ruta de Storage.

## 5. Flujo de escritura

Ejemplo: agregar un repuesto a una orden.

```
Usuario → AddPartModal
  → addOrderItem(input)
    → db.transaction("rw", serviceOrders, serviceOrderItems, inventoryItems)
        1. valida orden abierta
        2. valida stock suficiente
        3. crea o suma la línea
        4. descuenta stock
        5. recalcula partsTotal y total
    → queueChange(service_order_item, create)
    → queueChange(inventory_item, update)
    → queueChange(service_order, update)
  → useLiveQuery detecta el cambio y re-renderiza
```

Reglas:

- La transacción cubre **todas** las tablas afectadas.
- Los valores que se necesitan fuera de la transacción se capturan en un objeto (`captured`) por el narrowing de TypeScript.
- La cola se escribe **después** de confirmar la transacción.
- Si una validación falla, se lanza un `Error` con mensaje en español y no se escribe nada.

### Limitación conocida

La escritura de la cola no es atómica con la transacción de negocio. Si el navegador se cierra entre ambas, el dato local queda bien pero el cambio no se encola. Para la fase 2 se debe implementar un **outbox atómico** (encolar dentro de la misma transacción) o una reconciliación por `updatedAt`.

## 6. Offline-first y sincronización

### Hoy

- Toda la app lee y escribe en IndexedDB.
- `queueChange()` agrega una entrada a `syncQueue` con `entity`, `entityId`, `operation`, `payload` JSON, `attempts` y `lastError`.
- `syncPendingChanges()`:
  - procesa hasta 50 entradas por corrida, ordenadas por `createdAt`;
  - mapea entidad → tabla (`service_order` → `service_orders`, etc.);
  - convierte `camelCase` a `snake_case`;
  - hace `upsert` por `id` o `delete` por `id`;
  - elimina la entrada si tuvo éxito;
  - incrementa `attempts` y guarda `lastError` si falla;
  - descarta entidades desconocidas como `skipped`.
- Si Supabase no está configurado, devuelve `{ pushed: 0, failed: 0, skipped: 0 }` y la UI dice "Modo local".
- El botón de sincronizar está en Configuración.

### Lo que no existe todavía

- **Pull:** no se traen cambios desde la nube.
- **Resolución de conflictos:** no hay merge ni last-write-wins explícito.
- **Auth:** no hay sesión, por lo que RLS no puede autenticar.
- **Subida de fotos:** la cola envía el data URL como `storage_path`; no se sube el binario a Storage.
- **Service worker:** recargar sin red falla.
- **Sincronización automática:** se dispara manualmente desde Configuración.

### Contrato para la fase 2

1. Autenticar y resolver `tenant_id` desde `profiles`, nunca desde el cliente.
2. Subir fotos a Storage y encolar la ruta, no el binario.
3. Implementar pull incremental por `updated_at` y un cursor local.
4. Definir conflicto: single-writer para stock; last-write-wins para texto; nunca merge automático de cantidades.
5. Hacer el outbox atómico.
6. Reintentos con backoff y límite; marcar entradas "muertas" para revisión.
7. Mostrar en Configuración el último error y un botón de reintento.

## 7. Multi-tenant

### Local

Cada entidad lleva `tenantId`. Los hooks reciben `tenantId` o lo derivan de la orden. En el prototipo hay un solo taller demo (`tenant-demo`), así que el aislamiento real se prueba en la nube.

### Nube (escrito, sin conectar)

`supabase/migrations/0001_init.sql` define:

- `tenants`, `profiles`, `customers`, `equipment`, `inventory_items`, `service_orders`, `service_order_items`, `order_photos`.
- Enums para plan, estado, rol, unidad y estado de orden.
- `current_tenant_id()` como `security definer` para leer `profiles` sin recursión en RLS.
- RLS activo en todas las tablas.
- Políticas por tenant para `select/insert/update/delete`.
- Bucket de storage no público y políticas por carpeta de tenant.
- `bootstrap_tenant(p_name)` para crear taller + owner.

**Regla:** el cliente nunca decide su `tenant_id`. La política RLS lo deriva de `auth.uid()`.

## 8. Fotos

- El prototipo guarda data URLs en `orderPhotos.dataUrl`.
- Antes de guardar, la imagen se comprime a un lado máximo de 1280 px y JPEG 0.72.
- Se muestran en el detalle de la orden y se pueden eliminar.
- En producción:
  - subir el binario a `order-photos/<tenant_id>/<order_id>/<photo_id>.jpg`;
  - guardar solo la ruta;
  - servir con URL firmada;
  - validar tipo y tamaño;
  - aplicar retención y borrado.

## 9. Importación de inventario

```
Archivo .xlsx/.xls/.csv
  → xlsx parse
  → normalización de encabezados
  → validación por fila
  → vista previa / errores
  → upsert por sku (tenantId + sku)
```

Reglas:

- El SKU es la clave de negocio.
- Si existe, actualiza; si no, crea.
- Moneda CLP entero; se limpian `$` y puntos.
- Filas inválidas se reportan; no se importa silenciosamente a medias.
- El contrato vive en `docs/plantilla-importacion.md`.

## 10. Routing y renderización

- **App Router** de Next.js 16.
- Las páginas son delgadas y montan vistas cliente.
- El shell (`AppShell`) es cliente porque usa `usePathname()`.
- `src/app/layout.tsx` declara `export const instant = false` para que el shell pueda bloquear la navegación mientras se adopta el modelo de navegación instantánea de Next 16.
- `next.config.ts` usa `cacheComponents: true` y `partialPrefetching: true`.
- Las páginas dinámicas usan `PageProps<"...">` y `await params`.
- **Antes de escribir código de Next, leer la guía correspondiente en `node_modules/next/dist/docs/`.** Esta versión tiene cambios que no coinciden con versiones anteriores.

## 11. Decisiones de plataforma

| Decisión | Por qué | Consecuencia |
|---|---|---|
| Dexie/IndexedDB | Offline real sin backend, demo sin credenciales | Datos por navegador; requiere respaldo y sync |
| Supabase | Postgres + Auth + Storage + RLS en un solo proveedor | Dependencia del proveedor; migrar después es posible |
| Sin estado global | `useLiveQuery` cubre el caso | No introducir Redux/Zustand sin necesidad |
| Sin React Query | La fuente es local, no HTTP | No agregar caché de red prematura |
| `xlsx` en cliente | Importación sin servidor | Archivos grandes consumen memoria; validar límites |
| Tailwind 4 | Velocidad y consistencia | Requiere disciplina de tokens; no CSS ad hoc |
| Sin tests aún | Prioridad era el flujo | Deuda: agregar Vitest/Playwright en fase 1–2 |

## 12. Límites actuales (honestos)

- Un solo tenant local; no hay login.
- No hay pull ni conflictos.
- No hay service worker; recargar sin red falla.
- No hay restauración de respaldo.
- Las fotos viven como data URLs y podrían exceder la cuota de IndexedDB.
- La cola no es atómica con la transacción.
- No hay tests automatizados.
- No hay observabilidad ni métricas automáticas.
- El dashboard calcula en cliente sobre todos los registros; con miles de órdenes habrá que paginar/agregar.

## 13. Evolución prevista

Orden recomendado:

1. Outbox atómico + service worker + restauración de respaldo.
2. Auth + RLS verificada + `bootstrap_tenant`.
3. Subida de fotos a Storage.
4. Pull incremental + conflictos definidos.
5. Tests de reglas de negocio (stock, margen, cancelación).
6. Índices/agregados para dashboard cuando el volumen lo exija.
7. Auditoría y observabilidad.

## 14. Reglas para cambiar la arquitectura

- Una decisión estructural se registra en `docs/decisiones.md`.
- No se introduce una librería de estado, ORM o capa de red sin demostrar que el caso actual no se resuelve con lo existente.
- No se cambia el esquema Dexie sin una estrategia de migración y prueba de upgrade.
- No se agrega una segunda fuente de verdad.
- No se conecta Supabase sin revisar RLS y sin una prueba de acceso cruzado.
- Cualquier cambio en el flujo de stock se prueba con: agregar, quitar, cancelar, entregar y stock insuficiente.
