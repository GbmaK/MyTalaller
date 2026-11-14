# TallerOS (nombre de trabajo)

Sistema **offline-first** para talleres de motosierras y equipos motorizados que venden, reparan y mantienen con inventario propio.

> **La secretaria que el taller no tiene:** sabe qué hay en stock, qué está pendiente, qué repuesto se usó y cuánto dejó cada trabajo.

Este repositorio contiene el **prototipo local-first** y la documentación que dirige el producto. La app funciona sin internet y guarda todo en IndexedDB (Dexie). Supabase queda preparado para la siguiente fase (multi-tenant, auth, sync y storage).

## Estado

- **Fase:** prototipo funcional → preparación de piloto con 1 taller.
- **Datos:** demo local (se siembran automáticamente en el primer arranque).
- **Backend:** schema SQL y cliente de Supabase listos, pero **sin conectar**.
- **Offline:** funciona dentro de la app; recargar sin red requiere service worker (pendiente).
- **Respaldo:** exportar JSON existe; restaurar todavía no.
- **Boleta/factura:** fuera del MVP (plan Premium futuro).

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4
- Dexie / IndexedDB (offline-first)
- Supabase (PostgreSQL + Auth + Storage) — siguiente fase
- `xlsx` para importar inventario desde Excel

## Cómo correr

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Para probar el modo offline: carga la app una vez, luego desactiva la red en DevTools (Network → Offline) y sigue navegando dentro de la app. Los datos y las escrituras siguen funcionando en IndexedDB. Recargar la página sin red requiere un service worker/PWA, que queda para la siguiente fase.

## Documentación que dirige el proyecto

La documentación es **normativa**, no decorativa. Antes de cambiar algo, lee el documento del área.

| Tema | Documento |
|---|---|
| Entrada y reglas para agentes | [`AGENTS.md`](AGENTS.md) |
| **Retomar el proyecto** | [`docs/traspaso.md`](docs/traspaso.md) |
| **Guion para mostrar la demo** | [`docs/operacion/demo.md`](docs/operacion/demo.md) |
| Índice y precedencia | [`docs/README.md`](docs/README.md) |
| Visión, objetivos, ICP y métricas | [`docs/producto/vision.md`](docs/producto/vision.md) |
| Roadmap y puertas de avance | [`docs/producto/roadmap.md`](docs/producto/roadmap.md) |
| Arquitectura y flujo de datos | [`docs/ingenieria/arquitectura.md`](docs/ingenieria/arquitectura.md) |
| Convenciones de código | [`docs/ingenieria/convenciones.md`](docs/ingenieria/convenciones.md) |
| Seguridad, privacidad y multi-tenancy | [`docs/ingenieria/seguridad.md`](docs/ingenieria/seguridad.md) |
| Dirección de diseño | [`docs/diseno/direccion.md`](docs/diseno/direccion.md) |
| UX y flujos | [`docs/diseno/ux.md`](docs/diseno/ux.md) |
| Runbook, verificación y soporte | [`docs/operacion/runbook.md`](docs/operacion/runbook.md) |
| Decisiones | [`docs/decisiones.md`](docs/decisiones.md) |

### Documentación de negocio

- [Tesis](docs/tesis.md)
- [MVP](docs/mvp.md)
- [Entrevista](docs/entrevista.md)
- [Plantilla de importación](docs/plantilla-importacion.md)

## Qué funciona

- **Dashboard:** stock bajo, órdenes abiertas, listas para retirar, valor del inventario, margen de los últimos 30 días y tablero de máquinas por estado.
- **Inventario:** listar, buscar, crear, editar, ajustar stock, alertas de stock mínimo e **importar desde Excel**.
- **Órdenes:** crear orden con cliente, equipo, fotos de ingreso y promesa; cambiar estado; agregar repuestos (descuenta stock); calcular total, costo, margen e IVA; aviso de retiro por WhatsApp.
- **Clientes:** listar, crear, editar, ver equipos e historial.
- **Configuración:** datos del taller, plan, estado de sincronización, exportar JSON, reiniciar demo.

## Verificación

```bash
npm run lint
npm run build
```

El recorrido manual completo está en [`docs/operacion/runbook.md`](docs/operacion/runbook.md). No hay tests automatizados todavía.

## Estructura

```
AGENTS.md                 Entrada y reglas no negociables
docs/
  README.md               Índice y precedencia
  producto/               Visión, objetivos, roadmap
  diseno/                 Dirección visual y UX
  ingenieria/             Arquitectura, convenciones, seguridad
  operacion/              Runbook y soporte
  tesis.md                Tesis, ICP, modelo, riesgos
  mvp.md                  Alcance, flujos, modelo de datos
  decisiones.md           Registro de decisiones
  entrevista.md           Guion de validación
  plantilla-importacion.md
supabase/
  migrations/0001_init.sql  Schema multi-tenant + RLS
src/
  app/                    Rutas (dashboard, inventario, órdenes, clientes)
  components/             Shell y UI
  features/               Lógica por dominio
  lib/                    DB, seed, formato, sync, Supabase
  types/                  Tipos de dominio
```

## Datos de demo

Al primer arranque se crea el taller **"Taller Los Robles"** con clientes, equipos, repuestos y órdenes en distintos estados. Puedes reiniciar la demo desde **Configuración**.

> Reiniciar demo borra la base local. Exporta un respaldo antes si hay datos que conservar.

## Supabase (siguiente fase)

1. Copia `.env.example` a `.env.local` y completa las credenciales.
2. Ejecuta `supabase/migrations/0001_init.sql` en el SQL Editor.
3. Implementa auth y la sincronización de `sync_queue` (ver `src/lib/sync.ts`).

Antes de conectar datos reales, revisa los hallazgos de RLS en [`docs/ingenieria/seguridad.md`](docs/ingenieria/seguridad.md).

## Siguiente hito

Validar con 1 taller piloto de 2–5 personas, 20+ reparaciones/mes y ticket > $30.000 CLP. Métricas: trabajos registrados, exactitud de stock, uso diario y conversión a pago al día 31.
