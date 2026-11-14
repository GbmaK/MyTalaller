# Roadmap y criterios de avance

> **Estado:** plan vigente desde 2026-11-13.
> El roadmap no es una lista de deseos: cada fase tiene una **puerta de salida** y no se avanza si no se cumple.

## 1. Dónde estamos

**Fase actual: 0 → 1.** El prototipo local-first está funcional y verificado manualmente. Falta endurecerlo para un piloto real y preparar la nube.

| Área | Estado |
|---|---|
| Inventario, órdenes, clientes, dashboard | Funcional |
| Importación Excel con plantilla | Funcional |
| Fotos de ingreso en IndexedDB | Funcional (data URLs) |
| Multi-tenant local (`tenantId`) | Modelado, un solo tenant en la práctica |
| Supabase schema + RLS | Escrito, **sin conectar** |
| Auth | No implementado |
| Sync push | Scaffold; requiere Supabase + sesión |
| Sync pull / conflictos | No implementado |
| Service worker / PWA | No implementado |
| Restauración de respaldo | No implementado |
| Tests automatizados | No implementados |

## 2. Fases

### Fase 0 — Prototipo local-first (completada)

**Objetivo:** demostrar el flujo completo sin infraestructura.

Entregado:

- Datos de demo, dashboard y navegación.
- CRUD de inventario, clientes, equipos y órdenes.
- Stock que se descuenta al agregar repuesto y se repone al quitarlo o cancelar.
- Fotos de ingreso, total, IVA y margen.
- Importación Excel y plantilla descargable.
- Exportación JSON y reinicio de demo.
- Schema Supabase multi-tenant con RLS.

**Puerta de salida:** un recorrido completo de ingreso → reparación → entrega se puede hacer sin errores y con `lint` + `build` limpios. **Cumplida.**

### Fase 1 — Pilot-ready (actual)

**Objetivo:** que un taller real use la app 30 días sin que un fallo técnico destruya la confianza.

Prioridades:

1. **Persistencia real del shell offline:** service worker/PWA para recargar sin red.
2. **Respaldo y restauración:** exportar JSON ya existe; falta importar/restaurar y probar el ciclo.
3. **Importación robusta:** validación previa, filas inválidas, duplicados, columnas con `$` y puntos, archivos grandes, y exigir `costo`, `precio` y `stock` (hoy los faltantes quedan en 0). El mapeo manual de columnas sigue planificado.
4. **Guion de verificación manual:** recorrido reproducible por release (ver `operacion/runbook.md`).
5. **Privacidad y consentimiento:** aviso de datos, fotos y contacto; texto para el piloto.
6. **Pulido de UX:** estados vacíos, errores, confirmaciones destructivas, foco atrapado en modales, validación de teléfono, motivo de ajuste de stock y accesibilidad básica.
7. **Modo demo seguro:** reiniciar demo solo con confirmación explícita.
8. **Observabilidad mínima:** registrar fallos de sync y mostrar último error en Configuración.

**Puerta de salida:**

- [ ] La app carga y opera con red desactivada después de una recarga.
- [ ] Un respaldo se puede restaurar en un navegador limpio.
- [ ] El import rechaza filas inválidas sin importar a medias.
- [ ] El recorrido manual completo pasa en Chrome y Edge.
- [ ] `npm run lint` y `npm run build` limpios.
- [ ] Un usuario nuevo completa un ingreso sin ayuda en < 5 minutos.

### Fase 2 — Nube y multi-tenant real

**Objetivo:** que los datos sobrevivan al dispositivo y que dos talleres no se vean nunca.

Alcance:

1. Supabase Auth (email/contraseña o magic link) y `profiles` con `tenant_id` y rol.
2. `bootstrap_tenant` para crear taller + owner en el primer registro.
3. Verificación de RLS con tests de acceso cruzado.
4. Sync **push** idempotente y **pull** incremental con `updated_at`.
5. Resolución de conflictos documentada; el MVP mantiene un solo escritor.
6. Fotos en Supabase Storage con rutas por tenant y URLs firmadas.
7. Auditoría mínima: quién cambió qué y cuándo en entidades críticas.
8. Backups automáticos y política de retención.

**Puerta de salida:**

- [ ] Dos usuarios de talleres distintos no pueden leer ni escribir datos del otro, probado con la API y con la UI.
- [ ] Un cambio hecho offline llega a la nube al reconectar, sin duplicados.
- [ ] Un cambio hecho en la nube se refleja en el dispositivo al sincronizar.
- [ ] Las fotos no son públicas y expiran.
- [ ] Restaurar un backup de Supabase está probado.

### Fase 3 — Piloto pagado de 30 días

**Objetivo:** validar uso, valor y disposición a pagar.

Actividades:

- Onboarding asistido (ver `operacion/runbook.md`).
- Importación del inventario real con conteo físico inicial.
- Capacitación de 20–30 minutos y guía de una página.
- Revisión semanal de métricas y fricciones.
- Al día 31: renovación o entrevista de salida.

**Puerta de salida:**

- [ ] Todos los trabajos de 2 semanas consecutivas registrados.
- [ ] Discrepancia de stock < 5%.
- [ ] Uso diario del dueño.
- [ ] ≥ 3 avisos de retiro enviados.
- [ ] Decisión explícita de seguir pagando, con razón.

### Fase 4 — Premium y expansión

Solo después de validar la Fase 3:

- Boleta/factura electrónica (construir vs. partner DTE).
- Multi-sucursal.
- Reportes avanzados y exportaciones contables.
- Roles y permisos más finos.
- Nuevos verticales: generadores, motobombas, cortadoras, ATV, maquinaria agrícola.

## 3. Prioridad dentro de cada fase

| Prioridad | Significado | Ejemplos |
|---|---|---|
| **P0** | Sin esto no hay piloto | Pérdida de datos, fuga entre tenants, stock incorrecto, build roto |
| **P1** | Afecta uso diario | Importación, fotos, estados, avisos, respaldo |
| **P2** | Mejora percepción | Animaciones, reportes, atajos |
| **P3** | Ideas futuras | POS, integraciones, hardware |

**Regla:** ningún P2 se empieza si hay un P0 abierto.

## 4. Qué no se adelanta

- No se conecta Supabase antes de que la RLS esté revisada.
- No se implementa sync bidireccional antes de definir conflictos.
- No se agrega un segundo escritor antes de resolver stock concurrente.
- No se construye boleta antes de validar que el taller paga por trazabilidad.
- No se agrega un módulo nuevo si el flujo principal todavía tiene fricción.

## 5. Cómo se revisa el roadmap

- **Semanal en piloto:** métricas, fricciones, bugs, decisión de la próxima semana.
- **Al cerrar una fase:** revisar puerta de salida y actualizar este documento.
- **Si cambia una prioridad:** registrar la decisión en `decisiones.md` con contexto.
- **Si una fase se retrasa:** se ajusta el alcance, no se baja la calidad de las puertas P0.

## 6. Definición de release

Un release es publicable cuando:

- [ ] `npm run lint` pasa.
- [ ] `npm run build` pasa.
- [ ] El recorrido manual de `operacion/runbook.md` pasa.
- [ ] No hay migraciones de Dexie sin estrategia de upgrade.
- [ ] No hay secretos en el diff.
- [ ] Los documentos afectados están actualizados.
- [ ] El changelog interno indica qué cambió y qué riesgo tiene.
