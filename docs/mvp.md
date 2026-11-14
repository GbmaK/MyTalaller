# MVP — Alcance, flujos y modelo de datos

> Documento de trabajo. El objetivo del MVP es **demostrar trazabilidad y uso diario en un taller de 2–5 personas**, no cubrir todos los casos.

## 1. Principios de producto

1. **Captura en el flujo:** registrar debe ser parte del trabajo, no una tarea aparte.
2. **Un solo escritor:** el PC del mostrador es la fuente de verdad. El teléfono es companion (fotos, consultas, avisos).
3. **Offline primero, sin drama:** la app funciona sin internet; sincroniza cuando vuelve.
4. **Radicalmente simple:** si el dueño no lo entiende en 5 minutos, no sirve.
5. **El tablero manda:** la pantalla principal es "qué está pendiente", no una tabla de SKUs.
6. **Plantilla estándar:** la app define la estructura; el usuario adapta sus datos a ella.

## 2. Personas

- **Dueño / administrador:** compra, decide, usa el tablero y revisa márgenes.
- **Técnico:** registra diagnóstico, repuestos usados y cambios de estado.
- **Mostrador / recepción:** recibe la máquina, toma fotos, avisa al cliente.

En un taller de 2–5 personas, los roles se solapan. El MVP soporta un usuario principal y roles básicos.

## 3. Historias de usuario del MVP

### Inventario
- Como dueño, quiero ver **qué repuestos tengo y cuánto valen** para no comprar de más ni quedarme sin stock.
- Como dueño, quiero **alertas de stock mínimo** para reponer a tiempo.
- Como dueño, quiero **importar mi inventario desde Excel** para no cargarlo a mano.
- Como técnico, quiero **buscar un repuesto por código o nombre** y agregarlo a una orden.
- Como dueño, quiero **ajustar el stock** cuando cuento físicamente.

### Órdenes
- Como recepcionista, quiero **crear una orden** con cliente, máquina, fotos y promesa de entrega.
- Como técnico, quiero **cambiar el estado** de la máquina y dejar diagnóstico.
- Como técnico, quiero **agregar repuestos usados** y que el stock se descuente.
- Como dueño, quiero ver **el total y el margen** de cada trabajo.
- Como recepcionista, quiero **avisar por WhatsApp** que la máquina está lista.

### Clientes
- Como dueño, quiero **ver el historial** de un cliente y sus equipos.
- Como recepcionista, quiero **crear un cliente** rápido en el mostrador.

### Dashboard
- Como dueño, quiero ver **cuántas máquinas están pendientes y en qué estado**.
- Como dueño, quiero ver **stock bajo, órdenes abiertas y listas para retirar**.

## 4. Flujos principales

### 4.1 Ingreso de una máquina
1. Se selecciona o crea el cliente.
2. Se selecciona o crea el equipo (marca, modelo, serie).
3. Se registra el motivo, accesorios y fotos de ingreso.
4. Se asigna una promesa de entrega y un responsable.
5. La orden queda en estado **Ingresado**.

### 4.2 Reparación
1. El técnico pasa a **Diagnóstico** y registra el diagnóstico.
2. Si falta un repuesto, pasa a **Esperando repuesto**.
3. Al reparar, pasa a **Reparación** y agrega los repuestos usados.
4. Cada repuesto agregado descuenta stock y suma al costo del trabajo.
5. Al terminar, pasa a **Listo**.

### 4.3 Retiro
1. El mostrador envía el aviso de WhatsApp.
2. El cliente retira; se marca **Entregado** y se registra la fecha.
3. El trabajo queda en el historial del cliente y del equipo.

### 4.4 Cobro (fuera del MVP)
La boleta/factura queda para el plan Premium. El MVP calcula IVA y total, pero no emite documentos tributarios.

## 5. Reglas de negocio

- **Stock:** al agregar un repuesto a una orden, se descuenta el stock. Al quitarlo, se repone. No se permite agregar más que el stock disponible (salvo ajuste manual).
- **Costo y margen:**
  - `total = laborPrice + suma(unitPrice × quantity)`
  - `costo = laborCost + suma(unitCost × quantity)`
  - `margen = total - costo`
  - `margen % = margen / total` (si `total > 0`).
- **IVA:** el MVP muestra el IVA incluido en el total (19% en Chile) y el neto. No emite boleta.
- **Estados:** `ingresado → diagnostico → esperando_repuesto → reparacion → listo → entregado`. `cancelado` es terminal.
- **Numeración:** correlativo por tenant, empieza en **1001**.
- **Multi-tenant:** toda fila lleva `tenant_id`; toda consulta filtra por él.

## 6. Modelo de datos

### `tenants`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| name | text | Nombre del taller |
| plan | enum | `basic`, `pro`, `premium` |
| status | enum | `active`, `suspended` |
| created_at / updated_at | timestamptz | |

### `profiles` (usuarios)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK, referencia a `auth.users` |
| tenant_id | uuid | FK a `tenants`; null para super admin |
| role | enum | `owner`, `technician`, `super_admin` |
| full_name | text | |
| email | text | |

### `customers`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK, obligatorio |
| name | text | |
| phone | text | Para WhatsApp |
| email | text | Opcional |
| address | text | Opcional |
| notes | text | Opcional |
| created_at / updated_at | timestamptz | |

### `equipment`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK |
| customer_id | uuid | FK |
| brand | text | |
| model | text | |
| serial_number | text | Opcional |
| notes | text | Opcional |
| created_at / updated_at | timestamptz | |

### `inventory_items`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK |
| sku | text | Código interno o del fabricante |
| barcode | text | Opcional |
| name | text | |
| category | text | |
| brand / model | text | Opcional |
| unit | enum | `unidad`, `litro`, `metro`, `kit`, `otro` |
| cost_price | integer | CLP |
| sale_price | integer | CLP |
| stock | numeric | |
| min_stock | numeric | |
| location | text | Estante/ubicación |
| created_at / updated_at | timestamptz | |

### `service_orders`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK |
| number | integer | Correlativo por tenant |
| customer_id | uuid | FK |
| equipment_id | uuid | FK, opcional |
| status | enum | Ver estados |
| intake_notes | text | Motivo, accesorios |
| diagnosis | text | |
| labor_price | integer | Mano de obra cobrada |
| labor_cost | integer | Costo interno de la mano de obra |
| parts_total | integer | Cache de suma de ítems |
| total | integer | `labor_price + parts_total` |
| promised_at | date | Promesa de entrega |
| delivered_at | timestamptz | |
| created_at / updated_at | timestamptz | |

### `service_order_items`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK |
| order_id | uuid | FK |
| inventory_item_id | uuid | FK |
| quantity | numeric | |
| unit_price | integer | Precio cobrado |
| unit_cost | integer | Costo interno |
| created_at | timestamptz | |

### `order_photos`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK |
| order_id | uuid | FK |
| storage_path | text | En producción: Supabase Storage |
| caption | text | Opcional |
| created_at | timestamptz | |

### `sync_queue` (solo local, IndexedDB)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | |
| entity | text | `customer`, `inventory_item`, etc. |
| entity_id | uuid | |
| operation | enum | `create`, `update`, `delete` |
| payload | text | JSON |
| attempts | integer | |
| last_error | text | |
| created_at | timestamptz | |

## 7. Plantilla de importación

La app impone una plantilla estándar. El usuario adapta su Excel a estas columnas. La importación reconoce alias comunes de encabezado; el mapeo manual de columnas está planificado.

| Columna | Obligatoria | Ejemplo | Regla |
|---|---|---|---|
| `sku` | Sí | `CAD-325-72` | Único por tenant |
| `nombre` | Sí | `Cadena 325" 72 eslabones` | |
| `categoria` | No | `Cadena` | Default: `General` |
| `marca` | No | `Oregon` | |
| `modelo` | No | `325-72` | |
| `unidad` | No | `unidad` | Default: `unidad` |
| `costo` | Sí | `12000` | Entero CLP |
| `precio` | Sí | `18990` | Entero CLP |
| `stock` | Sí | `4` | Numérico |
| `stock_minimo` | No | `2` | Default: 0 |
| `ubicacion` | No | `Estante A3` | |
| `codigo_barras` | No | `7801234567890` | |

**Reglas de importación:**
- Si el `sku` existe, actualiza; si no, crea.
- Filas con error se muestran en un reporte; no se importan.
- El primer import de cada piloto se hace acompañado (concierge) para aprender la estructura real.
- La app ofrece "descargar plantilla" en Excel.

## 8. Fuera del MVP

- Boleta/factura electrónica (SII).
- POS completo: caja, turnos, arqueo, medios de pago.
- App móvil completa (solo companion).
- Compras a proveedores y cuentas por pagar.
- Cobranza y cuentas por cobrar.
- Multi-sucursal.
- Hardware propio.
- Reportes avanzados y contabilidad.

## 9. Roadmap

1. **Prototipo local-first (este repo):** inventario, órdenes, tablero, clientes, fotos, importación, cálculo de margen. Datos en IndexedDB.
2. **Supabase + auth + RLS:** multi-tenant real, sync de la cola, storage de fotos.
3. **Piloto:** 1 taller, 30 días, métricas de uso y disposición a pagar.
4. **Iteración:** importación asistida, escáner, avisos WhatsApp, reportes.
5. **Premium:** boleta/factura, multi-sucursal, integraciones.

## 10. Métricas del piloto

- % de trabajos registrados (objetivo: 100% en 2 semanas).
- Exactitud de stock (objetivo: discrepancia <5%).
- Frecuencia de uso del dueño (objetivo: diaria).
- Avisos de retiro enviados (objetivo: 3+).
- Conversión a pago al día 31 (objetivo: 1 de 1; si no, entender por qué).
