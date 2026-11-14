# Plantilla de importación de inventario

> La app define la estructura; el usuario adapta sus datos. La plantilla se descarga en Excel desde la pantalla de Inventario.

## Columnas

| Columna | Obligatoria | Tipo | Ejemplo | Regla |
|---|---|---|---|---|
| `sku` | Sí | texto | `CAD-325-72` | Único por taller. Si existe, actualiza. |
| `nombre` | Sí | texto | `Cadena 325" 72 eslabones` | |
| `categoria` | No | texto | `Cadena` | Default: `General`. |
| `marca` | No | texto | `Oregon` | |
| `modelo` | No | texto | `325-72` | |
| `unidad` | No | texto | `unidad` | `unidad`, `litro`, `metro`, `kit`, `otro`. Default: `unidad`. |
| `costo` | Sí | entero | `12000` | CLP, sin decimales. |
| `precio` | Sí | entero | `18990` | CLP, sin decimales. |
| `stock` | Sí | número | `4` | Puede ser decimal (litros, metros). |
| `stock_minimo` | No | número | `2` | Default: 0. |
| `ubicacion` | No | texto | `Estante A3` | |
| `codigo_barras` | No | texto | `7801234567890` | Opcional. |

## Ejemplo

| sku | nombre | categoria | marca | modelo | unidad | costo | precio | stock | stock_minimo | ubicacion | codigo_barras |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CAD-325-72 | Cadena 325" 72 eslabones | Cadena | Oregon | 325-72 | unidad | 12000 | 18990 | 4 | 2 | Estante A3 | 7801234567890 |
| ESP-18-325 | Espada 18" paso 325 | Espada | Oregon | 18-325 | unidad | 18000 | 27990 | 2 | 1 | Estante A4 | |
| FIL-001 | Filtro de aire universal | Filtro | Genérico | — | unidad | 2500 | 4990 | 10 | 4 | Caja B1 | 7809876543210 |
| ACE-2T-1L | Aceite 2T 1 litro | Insumo | Motul | 2T | litro | 6500 | 9990 | 12 | 6 | Estante C2 | |

## Reglas de importación

1. **Validación previa:** la app muestra una vista previa de las primeras filas y los errores antes de importar.
2. **Upsert por `sku`:** si el SKU existe, actualiza los campos; si no, crea el ítem.
3. **Filas inválidas:** se rechazan y se muestra el motivo (por ejemplo, SKU duplicado). Las filas válidas sí se importan y el resumen indica cuántas quedaron fuera.
   - **Estado actual:** la importación exige `sku` y `nombre`; si `costo`, `precio` o `stock` vienen vacíos, se interpretan como 0. La validación estricta de esos tres campos está planificada (ver `producto/roadmap.md`, Fase 1).
4. **Formato:** acepta `.xlsx`, `.xls` y `.csv`. La primera fila debe ser el encabezado.
5. **Moneda:** CLP entero. Si el Excel trae `$` o puntos, se limpian automáticamente.
6. **Onboarding asistido:** los primeros 10 clientes se importan con acompañamiento para aprender la estructura real y ajustar la plantilla.

## Qué hacer si el Excel del cliente es distinto

- **Hoy:** la app reconoce alias comunes de encabezado (por ejemplo, `codigo`, `descripcion`, `precio_venta`, `existencia`). No hay un editor visual de mapeo de columnas.
- **Planificado:** mapeo manual donde el usuario elige qué columna corresponde a cada campo. Mientras no exista, el onboarding asistido adapta el archivo a la plantilla.
- **No implementado:** generar un `sku` automático desde nombre + marca + modelo. Si el archivo no trae SKU, se rechaza la fila.
- Si el archivo tiene varias hojas, se importa la primera.
- Si el archivo tiene celdas combinadas o totales al final, se ignoran las filas sin `sku` o sin `nombre`.
