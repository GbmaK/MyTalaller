# Runbook de operación

> **Estado:** vigente desde 2026-11-13.
> Cómo se corre, se verifica, se despliega, se da soporte y se recupera TallerOS.

## 1. Requisitos

- **Node.js 20.9 o superior** (requisito de Next.js 16).
- **npm** (el repo usa `package-lock.json`).
- **Chrome o Edge** actualizado. El prototipo se verifica en Chromium.
- Opcional: cuenta de Supabase para la fase 2.

## 2. Instalación y desarrollo

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

- La primera carga siembra el taller demo **"Taller Los Robles"**.
- Los datos viven en IndexedDB, base `talleros-db`.
- No se necesita `.env.local` para el modo local.

### Variables de entorno

Copiar `.env.example` a `.env.local` solo si se va a trabajar con Supabase:

```bash
cp .env.example .env.local
```

| Variable | Uso | ¿Pública? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima; depende de RLS | Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Administración; **nunca en cliente** | No (solo servidor) |

Sin variables, la app muestra **"Modo local"**. No prometer sincronización en ese estado.

## 3. Comandos

| Comando | Qué hace | Cuándo |
|---|---|---|
| `npm run dev` | Servidor de desarrollo | Trabajo diario |
| `npm run lint` | ESLint | Antes de commit |
| `npm run build` | Build de producción + type check | Antes de release |
| `npm run start` | Sirve el build | Verificación local de producción |

No hay script de tests todavía. No inventar `npm test`.

## 4. Datos de demo

- Se siembran automáticamente si la base está vacía.
- El seed tiene un lock para evitar duplicados por StrictMode.
- **No descontar stock de las órdenes sembradas**: el seed ya refleja el consumo.
- Reiniciar desde **Configuración → Reiniciar demo**. Es destructivo: borra la base y vuelve a sembrar.
- Antes de reiniciar, exportar si hay datos que importan.

### Limpiar la base manualmente

En DevTools → Application → IndexedDB → `talleros-db` → Delete database. Luego recargar.

## 5. Verificación manual por release

Ejecutar en orden. Si un paso falla, no publicar.

### 5.1 Arranque

- [ ] `npm run lint` sin errores.
- [ ] `npm run build` sin errores.
- [ ] `npm run dev` abre el dashboard.
- [ ] No hay errores en la consola del navegador.
- [ ] El sidebar muestra el taller y el plan.

### 5.2 Clientes

- [ ] Crear un cliente con nombre y teléfono.
- [ ] Editarlo.
- [ ] Agregar un equipo (marca, modelo, serie).
- [ ] Ver el cliente en la lista y abrir su detalle.

### 5.3 Orden: ingreso

- [ ] Crear una orden para ese cliente.
- [ ] Verificar número correlativo (desde 1001).
- [ ] Verificar estado **Ingresado**.
- [ ] Verificar promesa de entrega.
- [ ] Subir una foto y verla en el detalle.
- [ ] Eliminar la foto.

### 5.4 Orden: repuestos y stock

- [ ] Anotar el stock de un repuesto.
- [ ] Agregar 2 unidades a la orden.
- [ ] Verificar que el stock bajó 2.
- [ ] Verificar total y margen.
- [ ] Agregar el mismo repuesto otra vez: la línea se suma, no se duplica.
- [ ] Intentar agregar más que el stock: debe fallar con mensaje claro.
- [ ] Quitar la línea: el stock se repone.
- [ ] Verificar que el total se recalcula.

### 5.5 Orden: estados

- [ ] Avanzar Ingresado → Diagnóstico.
- [ ] Avanzar → Esperando repuesto.
- [ ] Avanzar → Reparación.
- [ ] Avanzar → Listo.
- [ ] Abrir el enlace de WhatsApp: el mensaje está prellenado y el teléfono normalizado.
- [ ] Avanzar → Entregado: se registra la fecha.
- [ ] Verificar que una orden entregada no admite repuestos.

### 5.6 Cancelación

- [ ] Crear otra orden y agregar un repuesto.
- [ ] Cancelar con confirmación.
- [ ] Verificar que el stock se repone.
- [ ] Verificar que la orden no se puede reabrir.

### 5.7 Inventario

- [ ] Crear un ítem con SKU único.
- [ ] Intentar duplicar el SKU: debe fallar.
- [ ] Editar costo, precio y stock mínimo.
- [ ] Ajustar stock y verificar el dashboard.
- [ ] Descargar la plantilla Excel.
- [ ] Importar un archivo válido y ver el resumen.
- [ ] Importar un archivo con una fila inválida y ver el reporte.

### 5.8 Dashboard

- [ ] Stock bajo coincide con inventario.
- [ ] Órdenes abiertas coincide con la lista.
- [ ] Listas para retirar coincide con estado `listo`.
- [ ] Margen de 30 días se mueve al entregar una orden.
- [ ] Los enlaces llevan a la vista correcta.

### 5.9 Configuración

- [ ] Cambiar nombre del taller y plan; se refleja en el sidebar.
- [ ] Exportar JSON; el archivo se descarga y contiene las tablas.
- [ ] Ver el estado de sync ("Modo local" sin Supabase).
- [ ] Reiniciar demo con confirmación; vuelve el estado sembrado.

### 5.10 Offline y responsive

- [ ] DevTools → Network → Offline: navegar entre vistas funciona.
- [ ] Crear una orden sin red: se guarda localmente.
- [ ] Recargar sin red: **falla** hasta que exista service worker (limitación conocida).
- [ ] Probar a 360 px: navegación, tablas y modales usables.
- [ ] Probar a 1440 px: sidebar y contenido correctos.
- [ ] Navegar solo con teclado; el foco es visible.

## 6. Preparación de Supabase (fase 2)

> **Estado:** schema escrito, app **sin autenticación ni sync automática**. No usar con datos reales todavía.

1. Crear proyecto en Supabase.
2. Abrir SQL Editor y ejecutar `supabase/migrations/0001_init.sql`.
3. Verificar que las tablas, enums, políticas y el bucket `order-photos` existan.
4. Copiar URL y anon key a `.env.local`.
5. Reiniciar `npm run dev`.
6. Crear un usuario en Auth.
7. Llamar `bootstrap_tenant` con el usuario autenticado (cuando exista el flujo de login).
8. Probar aislamiento con dos usuarios y dos talleres antes de cargar datos reales.

**No** ejecutar la migración dos veces sin revisar: usa `if not exists` y `drop policy if exists`, pero un cambio futuro requiere migración incremental, no editar la 0001.

## 7. Deploy

### Opción recomendada: Vercel

1. Conectar el repositorio.
2. Configurar variables de entorno (solo si hay Supabase).
3. Build command: `npm run build`.
4. Verificar la URL de producción con el recorrido de la sección 5.
5. Recordar: sin backend, los datos siguen siendo locales del navegador. El deploy no “guarda en la nube”.

### Verificación local de producción

```bash
npm run build
npm run start
```

Abrir `http://localhost:3000` y repetir el recorrido crítico.

### Rollback

- Vercel: promover el deployment anterior.
- Base local: no hay rollback automático; restaurar desde respaldo (cuando exista).
- Supabase: restaurar backup o revertir migración con un script probado.

## 8. Onboarding de un piloto

### Antes de la visita

- [ ] Confirmar ICP: 2–5 personas, 20+ reparaciones/mes, ticket > $30.000.
- [ ] Pedir export de inventario actual (Excel/CSV).
- [ ] Enviar la plantilla estándar y explicar las columnas.
- [ ] Acordar fecha de conteo físico.
- [ ] Definir responsable interno (dueño o encargado).

### Día 1: instalación

- [ ] PC del mostrador con Chrome/Edge actualizado.
- [ ] Cuenta de usuario del SO protegida.
- [ ] Abrir la app y verificar persistencia.
- [ ] Configurar nombre del taller y plan.
- [ ] Crear usuarios (cuando exista auth) o dejar un responsable.
- [ ] Exportar un respaldo inicial.

### Día 1: inventario

- [ ] Importar el archivo con la plantilla.
- [ ] Revisar errores fila por fila.
- [ ] Hacer conteo físico de al menos 20 SKU críticos.
- [ ] Ajustar diferencias.
- [ ] Verificar que el stock bajo coincida con la realidad.

### Día 1: capacitación (20–30 min)

1. Crear un cliente.
2. Crear una orden con foto.
3. Agregar un repuesto.
4. Cambiar estados.
5. Avisar por WhatsApp.
6. Entregar.
7. Ver el margen.
8. Exportar respaldo.

Entregar una guía de una página con estos 8 pasos.

### Semana 1

- [ ] Revisar si todos los trabajos quedaron registrados.
- [ ] Revisar discrepancias de stock.
- [ ] Revisar fricciones de registro.
- [ ] Ajustar la plantilla o el flujo si es sistémico.
- [ ] Registrar feedback en `docs/entrevista.md` o notas del piloto.

### Día 31

- [ ] Métricas: trabajos, stock, uso diario, avisos, margen.
- [ ] Entrevista de cierre.
- [ ] Decisión: renovar, ajustar o terminar.
- [ ] Registrar la razón, no solo el sí/no.

## 9. Respaldos

### Hoy

- Manual: **Configuración → Exportar respaldo JSON**.
- Incluye tenants, clientes, equipos, inventario, órdenes, ítems y cola de sync.
- **No incluye fotos** en el JSON; las fotos viven como data URLs en la base y no se exportan actualmente.
- **No hay restauración implementada.**

### Regla operativa

- Exportar al cierre de cada día de piloto.
- Guardar una copia fuera del PC del mostrador (disco cifrado o nube privada del taller).
- No enviar respaldos por WhatsApp ni correo personal.
- Probar la restauración antes de prometerla.

### Pendiente P0

Implementar importación de respaldo y probar:

1. Exportar.
2. Borrar la base.
3. Restaurar.
4. Verificar conteos y una orden con repuestos.

## 10. Soporte

### Triage

| Síntoma | Causa probable | Acción |
|---|---|---|
| "No aparecen mis datos" | Otro navegador/perfil, base borrada, modo incógnito | Verificar perfil, revisar IndexedDB, restaurar respaldo |
| "El stock no coincide" | Ajuste manual, cancelación, importación | Revisar historial de la orden y ajustar con motivo |
| "No puedo agregar repuesto" | Stock insuficiente u orden cerrada | Revisar stock y estado |
| "Quedó pendiente de sincronizar" | Sin Supabase, sin sesión, sin red, error de RLS | Revisar Configuración, consola y último error |
| "Se borró todo" | Reinicio de demo o limpieza del navegador | Restaurar respaldo; si no hay, documentar pérdida |
| "La foto no carga" | Data URL corrupta o cuota de IndexedDB | Reintentar; revisar almacenamiento |
| "El build falla" | Tipo, import o cambio de Next | Ejecutar `npm run build` y leer el primer error |
| "Se ve mal en el teléfono" | Layout no responsive | Revisar breakpoints y priorizar tarjetas |

### Información mínima para un bug

- Qué hizo el usuario, paso a paso.
- Qué esperaba vs. qué pasó.
- Navegador y versión.
- ¿Online u offline?
- Captura de consola (sin datos personales).
- Número de orden o SKU (no datos del cliente).
- ¿Se puede reproducir en demo?

### Tiempos de respuesta (piloto)

- **P0** (pérdida/fuga): inmediato.
- **P1** (no puede trabajar): mismo día.
- **P2** (fricción): 2 días hábiles.
- **P3** (mejora): backlog.

## 11. Incidentes operativos

1. **Contener:** detener sync, revocar sesiones, aislar el equipo.
2. **Preservar evidencia:** no borrar la base ni la cola; exportar si es seguro.
3. **Evaluar:** alcance, datos, tenants.
4. **Comunicar:** al dueño del taller con lenguaje claro.
5. **Corregir:** fix + verificación.
6. **Postmortem:** causa raíz, acciones, dueño, fecha.

Ver `docs/ingenieria/seguridad.md` para severidades y notificación.

## 12. Mantenimiento

- **Semanal:** revisar consola, errores de sync, feedback del piloto.
- **Mensual:** `npm audit`, revisar dependencias, probar respaldo.
- **Antes de actualizar Next:** leer `node_modules/next/dist/docs/` y el changelog; probar `build`.
- **Antes de cambiar Dexie:** definir versión nueva y migración; probar upgrade desde una base existente.
- **Antes de cambiar Supabase:** migración incremental, backup, prueba en proyecto de staging.
- **No** actualizar varias dependencias mayores a la vez.

## 13. Checklist de release

- [ ] `npm run lint` limpio.
- [ ] `npm run build` limpio.
- [ ] Recorrido de la sección 5 completo.
- [ ] Sin secretos en el diff.
- [ ] Sin datos reales en capturas o docs.
- [ ] Documentos actualizados.
- [ ] Migraciones probadas.
- [ ] Respaldo exportado antes de un cambio riesgoso.
- [ ] Notas de release con riesgos conocidos.

## 14. Métricas del piloto (registro manual)

Mientras no haya analytics, registrar semanalmente en una hoja:

| Semana | Órdenes creadas | Entregadas | Con margen | Stock bajo | Avisos | Días de uso | Incidencias |
|---|---|---|---|---|---|---|---|
| 1 | | | | | | | |

Definiciones:

- **Con margen:** tiene `laborCost` y todos los ítems con `unitCost`.
- **Días de uso:** días con al menos una orden creada o actualizada.
- **Incidencia:** cualquier evento que impidió registrar un trabajo.

## 15. Contactos y responsabilidades

| Rol | Responsable | Cuándo |
|---|---|---|
| Producto | Dueño del proyecto | Prioridades y alcance |
| Soporte piloto | Dueño del proyecto | P0/P1 |
| Datos y respaldos | Dueño del proyecto + taller | Diario |
| Facturación | Dueño del proyecto | Mensual |

Completar nombres y canales antes del piloto. No dejar este cuadro vacío en producción.
