# Documentación que dirige TallerOS

> **Estado:** vigente desde 2026-11-13.
> Este directorio no es un archivo histórico: es el conjunto de instrucciones que define cómo se piensa, se diseña, se construye y se opera TallerOS.

## 1. Para qué existe este sistema de documentos

TallerOS es un producto de un nicho específico, con reglas de negocio que no son obvias (stock, margen, offline, multi-tenant, fotos). La documentación existe para que cualquier persona —o agente— pueda tomar una decisión sin reconstruir el contexto desde cero.

Cada documento responde una pregunta distinta:

| Pregunta | Documento |
|---|---|
| ¿Dónde quedamos y cómo retomo? | [`traspaso.md`](traspaso.md) |
| ¿Cómo muestro la demo? | [`operacion/demo.md`](operacion/demo.md) |
| ¿Qué estamos construyendo y para quién? | [`producto/vision.md`](producto/vision.md) |
| ¿En qué orden y con qué criterios avanzamos? | [`producto/roadmap.md`](producto/roadmap.md) |
| ¿Cómo está armado el sistema y cómo fluyen los datos? | [`ingenieria/arquitectura.md`](ingenieria/arquitectura.md) |
| ¿Cómo se escribe código aquí? | [`ingenieria/convenciones.md`](ingenieria/convenciones.md) |
| ¿Cómo protegemos los datos y aislamos talleres? | [`ingenieria/seguridad.md`](ingenieria/seguridad.md) |
| ¿Cómo se ve y se siente el producto? | [`diseno/direccion.md`](diseno/direccion.md) |
| ¿Cómo se comportan las pantallas y los flujos? | [`diseno/ux.md`](diseno/ux.md) |
| ¿Cómo se corre, se prueba, se despliega y se da soporte? | [`operacion/runbook.md`](operacion/runbook.md) |
| ¿Qué se decidió y por qué? | [`decisiones.md`](decisiones.md) |
| ¿Cuál es la tesis de negocio y el alcance del MVP? | [`tesis.md`](tesis.md), [`mvp.md`](mvp.md) |

## 2. Orden de lectura

### Para una persona nueva

1. `tesis.md` — por qué existe el negocio.
2. `producto/vision.md` — objetivo y métricas.
3. `mvp.md` — alcance y reglas.
4. `diseno/direccion.md` y `diseno/ux.md` — cómo se ve y se usa.
5. `ingenieria/arquitectura.md` y `ingenieria/convenciones.md` — cómo se construye.
6. `ingenieria/seguridad.md` y `operacion/runbook.md` — cómo se protege y se opera.

### Para un agente antes de tocar código

1. `AGENTS.md` (raíz) — reglas no negociables.
2. `docs/README.md` — este índice.
3. El documento del área que se va a modificar.
4. `docs/decisiones.md` — decisiones vigentes que no se deben contradecir.

## 3. Precedencia cuando hay conflicto

1. **`AGENTS.md`** — reglas operativas y no negociables.
2. **`docs/decisiones.md`** — decisiones explícitas del proyecto.
3. **Documentos de área** (`producto/`, `diseno/`, `ingenieria/`, `operacion/`).
4. **`README.md` raíz** — resumen y puerta de entrada.
5. **Documentos de negocio de referencia** (`tesis.md`, `mvp.md`, `entrevista.md`, `plantilla-importacion.md`).

Si un documento de área contradice una decisión, gana la decisión. Si el código contradice un documento, hay un bug: se corrige el código o se actualiza el documento **en el mismo cambio**, y si la decisión es estructural se agrega una entrada en `decisiones.md`.

## 4. Reglas de mantenimiento

- **Un cambio de comportamiento actualiza su documento.** No se acepta un cambio de flujo, precio, regla de stock, esquema o política de seguridad sin actualizar el `.md` correspondiente.
- **Las decisiones no se borran.** Se marcan como reemplazadas por otra decisión, con fecha.
- **Una fuente canónica por tema.** Si un dato ya vive en `mvp.md` o `decisiones.md`, el documento de área lo enlaza. Las reglas críticas pueden repetirse como recordatorio operativo, pero no se inventan variantes.
- **Los documentos son normativos, no aspiracionales.** Si algo está planificado pero no existe, se marca explícitamente como **planificado** o **pendiente**.
- **Idioma:** documentación y UI en español de Chile. Identificadores de código en inglés.
- **Fechas:** `YYYY-MM-DD`. Moneda: CLP entero.
- **Enlaces relativos** dentro de `docs/`; no enlaces absolutos a la máquina local.

## 5. Mapa de estados

| Estado | Significado |
|---|---|
| **Vigente** | Se debe cumplir hoy. |
| **Planificado** | Decidido, pero todavía no implementado. |
| **Pendiente** | Falta una decisión; no se debe asumir. |
| **Reemplazado** | Se conserva por historia; no se debe usar. |

## 6. Definición de "trabajo terminado" documental

Un cambio está documentado cuando:

- [ ] El documento de área describe el comportamiento nuevo.
- [ ] Las decisiones estructurales quedaron en `decisiones.md`.
- [ ] Los enlaces del índice siguen siendo válidos.
- [ ] No hay contradicciones con `AGENTS.md`.
- [ ] Lo planificado está marcado como tal y no se presenta como existente.

## 7. Documentos de negocio existentes

- [`tesis.md`](tesis.md) — ICP, propuesta de valor, modelo, competencia, riesgos.
- [`mvp.md`](mvp.md) — alcance, flujos, reglas y modelo de datos.
- [`decisiones.md`](decisiones.md) — registro cronológico de decisiones.
- [`entrevista.md`](entrevista.md) — guion de validación con talleres.
- [`plantilla-importacion.md`](plantilla-importacion.md) — contrato del Excel de inventario.

## 8. Qué NO va aquí

- Credenciales, tokens o datos reales de clientes.
- Notas personales sin decisión.
- Capturas de pantalla sin fecha ni contexto.
- Código de ejemplo que no exista o no compile.

Los secretos viven en `.env.local` y nunca se commitean. Los datos de clientes reales no se usan en demos ni en documentación.
