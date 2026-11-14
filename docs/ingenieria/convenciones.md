# Convenciones de código

> **Estado:** vigente desde 2026-11-13.
> Normativo. Si el código existente no cumple, se corrige al tocarlo; no se usa como excusa para repetir el patrón.

## 1. Idioma y nombres

- **Código en inglés:** variables, funciones, tipos, tablas, archivos.
- **UI en español de Chile:** textos, etiquetas, errores, mensajes.
- **Comentarios:** en español, solo cuando explican el **por qué**. No comentar lo obvio.
- **Fechas:** `YYYY-MM-DD`; timestamps ISO 8601 en UTC.
- **Moneda:** CLP entero; nunca decimales para pesos.

| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivo | `kebab-case` | `order-actions.ts`, `add-part-modal.tsx` |
| Componente | `PascalCase` | `OrderDetailView` |
| Hook | `use` + `PascalCase` | `useOrders`, `useInventory` |
| Acción | verbo + sustantivo | `createOrder`, `addOrderItem` |
| Tipo/interfaz | `PascalCase` | `ServiceOrder`, `OrderDraft` |
| Constante | `SCREAMING_SNAKE_CASE` | `ORDER_STATUS_FLOW` |
| Tabla Dexie | `camelCase` plural | `serviceOrders` |
| Tabla SQL | `snake_case` plural | `service_orders` |
| Booleano | `is` / `has` / `can` | `isOpenOrder`, `hasStock` |
| Manejador | `handle` + evento | `handleSubmit` |

## 2. TypeScript

### Reglas duras

- **Prohibido `any`.** Si no se conoce el tipo, usar `unknown` y estrechar.
- **Prohibido `as` para silenciar errores.** Se permite `as const` y casts justificados con comentario.
- **Prohibido `@ts-ignore`.** Si es inevitable, `@ts-expect-error` con explicación.
- **Prohibido `!` (non-null assertion)** salvo invariante demostrable en la línea anterior.
- Tipos explícitos en la firma de acciones públicas.
- `import type` para tipos.
- Preferir uniones de literales a `enum`.
- Preferir `interface` para objetos extensibles y `type` para uniones/alias.
- Arrays de constantes con `readonly` y `as const`.

### Ejemplo

```ts
export type OrderStatus =
  | "ingresado"
  | "diagnostico"
  | "esperando_repuesto"
  | "reparacion"
  | "listo"
  | "entregado"
  | "cancelado";

export const OPEN_ORDER_STATUSES: readonly OrderStatus[] = [
  "ingresado",
  "diagnostico",
  "esperando_repuesto",
  "reparacion",
  "listo",
] as const;

export async function createOrder(
  tenantId: string,
  draft: OrderDraft,
): Promise<ServiceOrder> {
  // ...
}
```

### Prohibiciones de estilo

- No usar `Function` como tipo.
- No usar `object` como tipo de parámetro.
- No usar `Record<string, any>`.
- No retornar `Promise<any>`.
- No usar `Date` en el dominio; usar string ISO.
- No usar `number` para IDs; usar `string`.

## 3. Estructura de una feature

```
features/orders/
  order-actions.ts     Mutaciones + reglas de negocio
  use-orders.ts        Consultas reactivas
  orders-view.tsx      Pantalla de lista
  order-detail.tsx     Pantalla de detalle
  order-form.tsx       Formulario de creación
  add-part-modal.tsx   Modal de repuesto
  order-edit-form.tsx  Edición
```

Reglas:

- Una acción por operación de negocio, con nombre de verbo.
- Las acciones reciben IDs y drafts; no reciben eventos de React.
- Las acciones no muestran toasts; lanzan `Error`. La vista decide cómo mostrarlo.
- Los hooks no mutan; solo leen con `useLiveQuery`.
- Las vistas componen; no contienen cálculos de negocio complejos.
- Los formularios validan en cliente lo obvio; la acción valida lo crítico.

## 4. Acceso a datos

### Consultas

```ts
export function useOrders(tenantId?: string) {
  return useLiveQuery(async () => {
    if (!tenantId) return [];
    return getDb()
      .serviceOrders.where("tenantId")
      .equals(tenantId)
      .reverse()
      .sortBy("updatedAt");
  }, [tenantId]);
}
```

- `useLiveQuery` para todo lo que deba reaccionar a IndexedDB.
- Siempre filtrar por `tenantId` en entidades de negocio.
- Devolver `undefined` mientras carga, no `[]`, si la UI necesita distinguir "cargando" de "vacío".
- No usar `useEffect` para cargar datos que `useLiveQuery` puede observar.

### Mutaciones

- Usar `db.transaction("rw", tablaA, tablaB, ...)` cuando se afecta más de una tabla.
- Pasar las tablas como argumentos separados, no un array anidado incorrecto.
- Capturar resultados en un objeto fuera del closure para evitar problemas de narrowing.
- Recalcular totales dentro de la transacción.
- Encolar cambios **después** de confirmar la transacción (hasta implementar outbox atómico).

```ts
const captured: { order?: ServiceOrder } = {};

await db.transaction("rw", db.serviceOrders, async () => {
  // ...
  captured.order = nextOrder;
});

const updatedOrder = captured.order;
if (!updatedOrder) throw new Error("No se pudo actualizar la orden.");
```

## 5. Reglas de negocio

Viven en `*-actions.ts` y se prueban por comportamiento:

- **Stock:** se descuenta al agregar el repuesto; se repone al quitarlo o cancelar.
- **Stock insuficiente:** error, no stock negativo.
- **Orden cerrada:** entregada/cancelada no admite repuestos.
- **Cancelación:** terminal; repone stock; no reabre.
- **Entrega:** setea `deliveredAt`.
- **Totales:** `total = laborPrice + partsTotal`.
- **Margen:** `total − (laborCost + Σ unitCost × quantity)`.
- **IVA:** incluido en el total; se deriva neto e IVA.
- **Numeración:** por tenant, desde 1001.
- **Duplicados de repuesto:** se suman cantidades, no se crean líneas repetidas.

Nunca duplicar estas reglas en componentes.

## 6. Dinero, fechas y números

- Montos: **enteros CLP**. `Math.round`, `Math.max(0, ...)`.
- Helper canónico: `money()` en `order-actions.ts`; `formatCLP()` para mostrar.
- No sumar floats de dinero.
- Cantidades de stock pueden ser decimales (litros/metros).
- Fechas de dominio: string ISO (`nowIso()`).
- Fechas de input: `YYYY-MM-DD` (`toDateInput`, `daysFromToday`).
- Formatear con `Intl` vía `src/lib/format.ts`; no concatenar strings de fecha.
- Teléfonos: normalizar con `normalizePhone()`; WhatsApp con `whatsAppLink()`.

## 7. Errores y mensajes

- Las acciones lanzan `new Error("Mensaje para el usuario.")`.
- Mensaje: qué pasó + qué hacer, en español.
- La vista captura y muestra con `toast.error` o error inline.
- No exponer errores técnicos, stack traces ni SQL.
- No usar `catch {}` vacío.
- Si se registra un error, usar `console.error` solo en desarrollo; en producción, un logger.

```ts
if (inventory.stock < input.quantity) {
  throw new Error(
    `Stock insuficiente de ${inventory.name}. Quedan ${inventory.stock}.`,
  );
}
```

## 8. React

- `"use client"` solo donde se necesita estado, efectos, eventos o APIs del navegador.
- Un componente = una responsabilidad.
- Props explícitas; evitar `props: any` o spreads indiscriminados.
- Listas con `key` estable (`id`), nunca índice.
- No usar `useEffect` para estado derivable; calcular en render.
- No usar `useMemo`/`useCallback` por defecto; solo con costo medible.
- Formularios controlados con `useState` para campos simples.
- Durante submit: `saving`, botón deshabilitado, texto "Guardando...".
- No cerrar un modal antes de que la promesa resuelva.
- No usar `window`/`document` durante el render; solo en efectos o handlers.
- Evitar `dangerouslySetInnerHTML`; si es imprescindible, sanitizar y justificar.

## 9. Next.js 16

- **Leer `node_modules/next/dist/docs/` antes de escribir código de Next.** La versión tiene cambios respecto de versiones anteriores.
- Páginas delgadas; la lógica va en features.
- Páginas dinámicas: `PageProps<"/ruta/[id]">` y `const { id } = await params`.
- `src/app/layout.tsx` mantiene `export const instant = false` mientras el shell use `usePathname()` y no se adopte navegación instantánea.
- No agregar `"use client"` al layout raíz.
- Metadata en el layout o en la página, no en componentes cliente.
- No usar APIs de servidor en componentes cliente.
- Si se agrega una ruta, actualizar `docs/diseno/ux.md` y el mapa de arquitectura.

## 10. Estilos

- **Tailwind 4** exclusivamente. No CSS modules, no styled-components, no estilos inline salvo valores dinámicos justificados.
- Usar `cn()` para combinar clases.
- Respetar los tokens de `docs/diseno/direccion.md`.
- Mobile-first: `base` → `sm:` → `lg:`.
- Foco visible en todo interactivo.
- No usar colores hex sueltos en componentes; usar la escala de Tailwind.
- No crear utilidades CSS nuevas sin necesidad.
- `globals.css` solo para tokens globales y resets.

## 11. Accesibilidad

- Todo input tiene `label` asociado.
- Botones de icono tienen `aria-label`.
- Modales: `role="dialog"`, `aria-modal`, `aria-labelledby`, cierre con `Escape`.
- No comunicar estado solo por color.
- Contraste mínimo 4.5:1.
- Navegación por teclado completa.
- Objetivos táctiles ≥ 44 px en móvil.
- `prefers-reduced-motion` respetado si se agrega animación.

## 12. Imports y orden

1. React / Next.
2. Librerías externas.
3. `@/components`, `@/features`, `@/lib`, `@/types`.
4. Relativos (`./`).

- Usar alias `@/*`; no rutas relativas que suban varios niveles.
- `import type` para tipos.
- No imports circulares.
- No dejar imports sin usar.

## 13. Comentarios y documentación

- Comentar decisiones no obvias, invariantes y workarounds.
- No comentar código autoexplicativo.
- No dejar `TODO` sin dueño ni contexto. Formato: `// TODO(fase-2): subir foto a Storage antes de encolar`.
- Los documentos `.md` son la fuente de verdad; el código no repite la explicación completa.

## 14. Verificación

Antes de dar por terminado un cambio:

```bash
npm run lint
npm run build
```

Además:

- Probar el flujo afectado en el navegador.
- Probar el caso vacío y el caso error.
- Probar stock insuficiente si se tocó inventario/órdenes.
- Probar cancelación y entrega si se tocó el ciclo de orden.
- Revisar la consola del navegador.

**No hay tests automatizados todavía.** No inventar un comando de test. Cuando se agreguen, la decisión y el runner se documentan en `decisiones.md`.

## 15. Git

- Commits pequeños y con intención.
- Formato sugerido: `tipo(área): descripción` — `feat(ordenes): descontar stock al agregar repuesto`.
- Tipos: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`, `test`.
- No commitear `.env.local`, `node_modules`, `.next` ni datos de clientes.
- No commitear el bloque autogenerado de `AGENTS.md` como si fuera cambio manual; se conserva.

## 16. Definition of Done

- [ ] La funcionalidad hace lo que dice el documento de UX.
- [ ] Las reglas de negocio están en acciones, no en componentes.
- [ ] No hay `any`, `@ts-ignore` ni `!` injustificado.
- [ ] Toda consulta de negocio filtra por `tenantId`.
- [ ] Las escrituras multi-tabla usan transacción.
- [ ] Los errores son claros y en español.
- [ ] Funciona sin red.
- [ ] Funciona en móvil (360 px) y desktop (1440 px).
- [ ] Teclado y foco visibles.
- [ ] `lint` y `build` pasan.
- [ ] Documentación actualizada.
- [ ] Si es decisión estructural, está en `decisiones.md`.

## 17. Anti-patrones prohibidos

- Lógica de stock en un componente.
- `useEffect` para cargar datos de Dexie.
- `any` para "avanzar rápido".
- Consultas sin `tenantId`.
- Escrituras multi-tabla sin transacción.
- Mostrar `error.message` crudo de Supabase.
- Duplicar tipos de dominio.
- Crear un componente nuevo antes de revisar `components/ui`.
- Mezclar español e inglés en nombres de código.
- Agregar una dependencia sin justificar y documentar.
- Cambiar el esquema de Dexie sin migración.
- Ocultar un error con un `catch` vacío.
- Usar `confirm()` o `alert()` del navegador.
- Prometer offline en la UI cuando no hay service worker.
