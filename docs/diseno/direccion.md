# Dirección de diseño

> **Estado:** vigente desde 2026-11-13.
> Define la identidad visual y los criterios estéticos. El comportamiento de las pantallas está en [`ux.md`](ux.md).

## 1. Idea rectora

**Un taller limpio y ordenado, no una startup.**

La app se usa en un mostrador, con luz variable, prisa y un cliente esperando. La interfaz debe sentirse:

- **Herramienta:** sólida, directa, sin adornos.
- **Orden:** cada cosa en su lugar; el estado se entiende de un vistazo.
- **Confianza:** números claros, acciones explícitas, nada que parezca un juguete.
- **Local:** cercana al rubro, sin estética corporativa genérica.

La metáfora visual es una **caja de herramientas rotulada**: fondo claro, estructura oscura, un acento ámbar que señala lo importante.

## 2. Principios visuales

1. **El dato manda.** El número y el estado tienen más peso que el contenedor.
2. **Contraste estructural.** Shell oscuro para navegación; contenido claro para trabajar.
3. **Un solo acento.** El ámbar señala acción primaria y foco. No se usa para decorar.
4. **Bordes antes que sombras.** La jerarquía se construye con bordes, espacio y tipografía.
5. **Densidad cómoda.** Filas amplias, no tablas de ERP apretadas.
6. **Semántica estable.** Un color por estado, en toda la app.
7. **Sin ruido.** Nada de gradientes, glassmorphism, ilustraciones grandes ni animaciones decorativas.

## 3. Paleta

### Base

| Rol | Token | Uso |
|---|---|---|
| Fondo de app | `bg-slate-50` | Lienzo general |
| Superficie | `bg-white` | Tarjetas, tablas, modales |
| Shell | `bg-slate-950` | Sidebar y header móvil |
| Texto principal | `text-slate-900` | Títulos y datos |
| Texto secundario | `text-slate-600` / `text-slate-500` | Descripciones y metadatos |
| Texto terciario | `text-slate-400` | Ayudas y placeholders |
| Borde | `border-slate-200` | Separación estándar |
| Borde suave | `border-slate-100` | Separación interna |

### Acento

| Rol | Token | Uso |
|---|---|---|
| Acción primaria | `bg-amber-500` | Botón principal, logo, foco |
| Hover | `bg-amber-400` | Hover del primario |
| Activo | `bg-amber-600` | Pressed |
| Fondo suave | `bg-amber-100` | Íconos de alerta, badges |
| Texto sobre acento | `text-slate-950` | Contraste del botón ámbar |

**Regla:** el ámbar no se usa como color de texto sobre blanco para párrafos (contraste insuficiente). Para texto de advertencia usar `text-amber-700` o `text-amber-800` sobre fondo claro.

### Semántica de estados

| Estado | Fondo / borde | Texto | Punto |
|---|---|---|---|
| Ingresado | `bg-slate-100` / `border-slate-200` | `text-slate-700` | `bg-slate-400` |
| Diagnóstico | `bg-sky-100` / `border-sky-200` | `text-sky-700` | `bg-sky-500` |
| Esperando repuesto | `bg-amber-100` / `border-amber-200` | `text-amber-800` | `bg-amber-500` |
| Reparación | `bg-violet-100` / `border-violet-200` | `text-violet-700` | `bg-violet-500` |
| Listo | `bg-emerald-100` / `border-emerald-200` | `text-emerald-700` | `bg-emerald-500` |
| Entregado | `bg-stone-100` / `border-stone-200` | `text-stone-600` | `bg-stone-400` |
| Cancelado | `bg-red-100` / `border-red-200` | `text-red-700` | `bg-red-500` |

El color **nunca** es la única señal: siempre va acompañado de etiqueta y/o ícono.

### Tonos de StatCard

`default` (slate), `info` (sky), `warning` (amber), `success` (emerald), `danger` (red). Se eligen por el significado del dato, no por estética.

## 4. Tipografía

- **Sans:** Geist (`--font-geist-sans`), fallback Arial/Helvetica.
- **Mono:** Geist Mono (`--font-geist-mono`) para SKU, códigos, números de orden y datos que se comparan carácter a carácter.

| Nivel | Tamaño | Peso | Uso |
|---|---|---|---|
| Título de página | `text-2xl` | `font-semibold` | Encabezado de vista |
| Título de tarjeta | `text-sm` | `font-semibold` | CardTitle |
| Dato grande | `text-xl` | `font-semibold` | StatCard |
| Cuerpo | `text-sm` | `font-normal` | Texto general |
| Metadato | `text-xs` | `font-medium` | Etiquetas, ayudas |
| Micro | `text-[11px]` | `font-medium` | Solo shell y badges; no para contenido crítico |

**Reglas:**

- No usar más de 3 tamaños por pantalla.
- Los montos usan `tabular-nums` para alinear columnas.
- No usar mayúsculas sostenidas en párrafos; solo en etiquetas muy cortas (`uppercase tracking-wider`).
- No justificar texto.

## 5. Espaciado y forma

- Escala base de **4 px**; usar múltiplos de 4 (Tailwind `1`, `2`, `3`, `4`, `5`, `6`, `8`).
- Padding de página: `px-4 py-6` móvil, `sm:px-6`, `lg:px-8 lg:py-8`.
- Ancho máximo de contenido: `max-w-7xl`.
- Separación entre secciones: `space-y-6`.
- Tarjetas: `rounded-2xl border border-slate-200 bg-white shadow-sm`.
- Controles: `rounded-xl`.
- Badges: `rounded-full` o `rounded-md` según densidad.
- No usar radios distintos para el mismo tipo de elemento.

## 6. Layout

### Desktop (≥ 1024 px)

- Sidebar fijo de **256 px** (`w-64`), oscuro, con logo, navegación, tenant y estado de sync.
- Contenido centrado con `max-w-7xl`.
- Header de página con título, descripción y acciones a la derecha.
- Tablas y listas ocupan el ancho completo; no se encierran en columnas innecesarias.

### Tablet (768–1023 px)

- Sidebar colapsado a header superior.
- Navegación horizontal con scroll.
- Acciones primarias visibles; secundarias en menú si es necesario.

### Móvil (< 768 px)

- Header oscuro compacto con navegación horizontal.
- Contenido a una columna.
- Modales como **bottom sheet** (`items-end`, `rounded-t-2xl`).
- Tablas se convierten en tarjetas o filas apiladas; nunca scroll horizontal para datos críticos.
- Acciones táctiles de al menos **44 × 44 px**.

## 7. Componentes

Librería base en `src/components/ui/`:

| Componente | Rol | Regla |
|---|---|---|
| `Button` / `ButtonLink` | Acción | Una sola acción `primary` por zona |
| `Card` + subcomponentes | Contenedor | No anidar tarjetas con sombra |
| `StatCard` | Métrica de dashboard | Máximo 4–6 por fila; valor legible |
| `Input`, `Textarea`, `Select`, `Field` | Formularios | Label siempre visible; error debajo |
| `Modal` | Tarea acotada | No para navegación principal |
| `Badge` | Estado | Color + texto; nunca solo color |
| `EmptyState` | Sin datos | Explica qué hacer, no solo "no hay datos" |
| `PageHeader` | Encabezado | Título, descripción, acciones |

**Reglas de composición:**

- No crear un componente nuevo si el patrón existente se puede extender.
- Los componentes de UI no conocen el dominio (no importan `ServiceOrder`).
- Las variantes se expresan con props y `Record<Variant, string>`, no con condicionales dispersos.
- `cn()` es el único helper de clases.

## 8. Iconografía

- **Lucide React**, tamaño `h-4 w-4` o `h-5 w-5`.
- Un ícono acompaña, no reemplaza, una etiqueta en acciones críticas.
- No usar emojis como iconos de interfaz.
- El ícono de la acción primaria puede ir a la izquierda del texto.
- No mezclar familias de íconos.

## 9. Movimiento

- Transiciones de color y opacidad: **150–200 ms**.
- No animar layout, sombras grandes ni entradas de página.
- Los modales aparecen sin rebote.
- Respetar `prefers-reduced-motion`; si se agrega animación, debe poder desactivarse.
- El estado de carga puede usar skeleton sutil, no spinners de pantalla completa.

## 10. Accesibilidad visual

- Contraste mínimo **4.5:1** para texto normal y **3:1** para texto grande.
- Foco visible siempre: `focus-visible:ring-2 ring-amber-400 ring-offset-2`.
- No comunicar estado solo con color.
- No usar texto menor a 12 px para información necesaria.
- Los números y montos deben alinearse; usar `tabular-nums`.
- Formularios con `label` asociado, `hint` y `error` textual.
- Objetivos táctiles ≥ 44 px en móvil.
- Respetar zoom al 200% sin pérdida de contenido.

## 11. Tono visual y de contenido

- **Directo:** "Agregar repuesto", no "Gestionar ítem de inventario".
- **Concreto:** "Quedan 3 unidades", no "Stock insuficiente".
- **Sin culpar:** "No se pudo guardar. Revisa la conexión e intenta de nuevo."
- **Chileno neutro:** "taller", "repuesto", "máquina", "orden", "boleta". Evitar "tenant", "usuario final", "recurso".
- **Montos:** `$12.000` (CLP, sin decimales). **Fechas:** `13 nov 2026`.
- **Estados:** etiqueta en español; el valor interno puede quedar en inglés.

## 12. Anti-patrones

No hacer:

- Gradientes de fondo, glassmorphism, neón o sombras difusas grandes.
- Landing pages dentro de la app.
- Tablas con 10 columnas y texto de 10 px.
- Modales para flujos de varios pasos.
- Acciones destructivas sin confirmación.
- Botones `primary` repetidos en la misma tarjeta.
- Iconos sin etiqueta en acciones que cambian datos.
- Scroll horizontal para datos esenciales.
- Animaciones que retrasan una tarea.
- Colores de estado distintos para el mismo concepto en pantallas distintas.

## 13. Checklist de revisión visual

- [ ] ¿Se entiende la jerarquía en 3 segundos?
- [ ] ¿Hay una sola acción primaria por zona?
- [ ] ¿Los estados usan la paleta semántica?
- [ ] ¿Los montos están en CLP y alineados?
- [ ] ¿El foco es visible con teclado?
- [ ] ¿Funciona a 360 px y a 1440 px?
- [ ] ¿Los textos son concretos y en español?
- [ ] ¿Se evitó un componente nuevo innecesario?
- [ ] ¿La pantalla se siente como una herramienta, no como una demo?
