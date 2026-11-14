<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# TallerOS — reglas del proyecto

Sistema **offline-first** para talleres de motosierras y equipos motorizados: inventario, órdenes de servicio, clientes y trazabilidad real de costo/margen.

Este archivo es la **puerta de entrada obligatoria** para cualquier persona o agente que trabaje en el repositorio. No reemplaza a los documentos de área: los enlaza y fija lo no negociable.

## 1. Orden de lectura

Antes de escribir código:

1. `docs/README.md` — índice y precedencia.
2. `docs/producto/vision.md` — objetivo, ICP y límites.
3. `docs/ingenieria/arquitectura.md` — cómo está armado.
4. `docs/ingenieria/convenciones.md` — cómo se escribe código.
5. El documento del área que se va a tocar (`diseno/`, `ingenieria/seguridad.md`, `operacion/runbook.md`).
6. `docs/decisiones.md` — decisiones vigentes que no se contradicen.
7. `node_modules/next/dist/docs/` — guía de Next.js 16 antes de tocar rutas, layouts o datos.

## 2. Estado actual (no asumir más de lo que hay)

- **Fase:** prototipo local-first → preparación de piloto.
- **Datos:** IndexedDB (Dexie), base `talleros-db`. Un solo tenant demo: `tenant-demo`, "Taller Los Robles".
- **Nube:** Supabase tiene schema + RLS escritos, pero **no está conectado**. No hay auth, pull sync ni storage real de fotos.
- **Offline:** funciona dentro de la app; **recargar sin red todavía falla** (no hay service worker).
- **Respaldo:** exportar JSON existe; **restaurar no existe**.
- **Tests:** no hay runner automatizado. La verificación es `lint` + `build` + recorrido manual.

Si una tarea asume auth, sync bidireccional, restore o PWA, primero hay que implementarlo y documentarlo; no se simula que existe.

## 3. No negociables

1. **Offline-first:** la escritura se confirma en IndexedDB antes de la red. La app no se bloquea por falta de conexión.
2. **Un solo escritor:** el PC del mostrador es la fuente de verdad. No introducir concurrencia multi-dispositivo sin decisión y diseño de conflictos.
3. **Stock consistente:** se descuenta al agregar el repuesto; se repone al quitarlo o cancelar. Nunca stock negativo por una operación normal.
4. **Transacciones:** toda escritura que afecte más de una tabla usa `db.transaction`. Nada de escrituras parciales.
5. **Multi-tenant:** toda entidad de negocio lleva `tenantId`; toda consulta filtra por él. La nube refuerza con RLS.
6. **Sin `any`:** TypeScript estricto. Sin `@ts-ignore`, sin casts para silenciar errores, sin `!` injustificado.
7. **Reglas en acciones:** stock, totales y márgenes viven en `features/*/*-actions.ts`, no en componentes.
8. **Dinero entero CLP:** sin floats. El total incluye IVA (19%); el neto se deriva.
9. **Español en la UI, inglés en el código.** Mensajes de error claros, con qué hacer.
10. **Nada de secretos ni datos reales** en el repo, en prompts, en capturas o en documentación.

## 4. Comandos

```bash
npm install      # instalar
npm run dev      # desarrollo en http://localhost:3000
npm run lint     # ESLint
npm run build    # build + type check
npm run start    # servir build
```

No existe `npm test`. No inventarlo.

## 5. Mapa del repositorio

```
docs/                  Documentación normativa (leer antes de cambiar)
  producto/            Visión, objetivos, roadmap
  diseno/              Dirección visual y UX
  ingenieria/          Arquitectura, convenciones, seguridad
  operacion/           Runbook, verificación, soporte
src/app/               Rutas Next.js (delgadas)
src/components/ui/     Primitivas sin dominio
src/features/          Acciones, hooks y vistas por dominio
src/lib/               DB, seed, sync, formato, Supabase
src/types/domain.ts    Tipos y estados canónicos
supabase/migrations/   Schema, RLS, storage
```

## 6. Flujo de trabajo

### Antes de cambiar

- Leer el documento del área.
- Buscar si ya existe una acción, hook o componente reutilizable.
- Si el cambio altera alcance, precio, flujo, esquema o seguridad: registrar decisión en `docs/decisiones.md`.
- Si el cambio toca Next.js: leer la guía correspondiente en `node_modules/next/dist/docs/`.

### Mientras se cambia

- Mantener el patrón existente: acción → transacción → `queueChange` → hook `useLiveQuery` → vista.
- Actualizar el documento en el mismo cambio.
- No introducir dependencias nuevas sin justificarlo.
- No cambiar el esquema Dexie sin migración y prueba de upgrade.
- No conectar Supabase sin revisar RLS y resolver los hallazgos de `docs/ingenieria/seguridad.md`.

### Antes de terminar

- `npm run lint`
- `npm run build`
- Probar el flujo afectado en el navegador, incluido el caso error y sin red.
- Revisar que no haya secretos ni datos reales en el diff.
- Actualizar `docs/` si cambió el comportamiento.

## 7. Reglas de negocio que no se reinterpretan

- `total = laborPrice + partsTotal`
- `margen = total − (laborCost + Σ(unitCost × quantity))`
- `partsTotal = Σ(unitPrice × quantity)`
- Estados: `ingresado → diagnostico → esperando_repuesto → reparacion → listo → entregado`; `cancelado` es terminal.
- Una orden entregada o cancelada no admite repuestos.
- Una orden cancelada no se reabre y repone stock.
- El número de orden es correlativo por tenant y empieza en **1001**.
- El SKU es único por tenant; la importación hace upsert por SKU.
- El dashboard usa margen de **ventana móvil de 30 días**.

## 8. Cuándo preguntar en vez de asumir

- El cambio contradice una decisión de `docs/decisiones.md`.
- Hay que elegir entre dos flujos de negocio válidos.
- Se va a conectar un servicio externo, pagar infraestructura o cambiar precios.
- Se va a borrar o migrar datos.
- La tarea requiere auth, sync bidireccional o PWA, que hoy no existen.
- El pedido cae en la lista de "no objetivos" de `docs/producto/vision.md`.

## 9. Documentos que mandan

| Tema | Documento |
|---|---|
| Objetivos, ICP, métricas | `docs/producto/vision.md` |
| Fases y puertas | `docs/producto/roadmap.md` |
| Arquitectura y datos | `docs/ingenieria/arquitectura.md` |
| Código y estilo | `docs/ingenieria/convenciones.md` |
| Seguridad y privacidad | `docs/ingenieria/seguridad.md` |
| Diseño visual | `docs/diseno/direccion.md` |
| UX y flujos | `docs/diseno/ux.md` |
| Operación y soporte | `docs/operacion/runbook.md` |
| Decisiones | `docs/decisiones.md` |

## 10. Definición de terminado

Un cambio está listo cuando:

- [ ] Hace lo que dice el documento de UX.
- [ ] Respeta las reglas de negocio y el aislamiento por tenant.
- [ ] Usa transacciones donde corresponde.
- [ ] No tiene `any` ni atajos de tipo.
- [ ] Funciona sin red y en móvil/desktop.
- [ ] `lint` y `build` pasan.
- [ ] La documentación quedó actualizada.
- [ ] No hay secretos ni datos reales en el diff.

Si algo de esto no se cumple, no está terminado.
