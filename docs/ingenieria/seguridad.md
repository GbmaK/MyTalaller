# Seguridad, privacidad y multi-tenancy

> **Estado:** vigente desde 2026-11-13.
> Este documento es normativo. No es asesoría legal; antes de operar con clientes reales se debe validar el cumplimiento con un abogado.

## 1. Qué protegemos

| Activo | Sensibilidad | Dónde vive |
|---|---|---|
| Nombre, teléfono, email, dirección de clientes | Personal | IndexedDB / Postgres |
| Historial de reparaciones y equipos | Personal/comercial | IndexedDB / Postgres |
| Fotos de ingreso (máquina, a veces domicilio) | Personal | IndexedDB (data URL) / Storage |
| Costos, precios y márgenes | Confidencial del negocio | IndexedDB / Postgres |
| Inventario y stock | Confidencial del negocio | IndexedDB / Postgres |
| Credenciales y claves | Secreto | `.env.local`, Supabase |
| Respaldos JSON | Personal + confidencial | Dispositivo del usuario |

El daño más grave no es "perder la app": es **exponer datos de un taller a otro**, perder el historial de trabajos o filtrar costos y márgenes.

## 2. Principios

1. **Mínimo privilegio:** cada usuario ve solo su taller y solo lo que su rol necesita.
2. **El cliente no decide el tenant:** `tenant_id` se deriva de la sesión en el servidor.
3. **Defensa en profundidad:** filtro en la app **y** RLS en la base. Nunca solo uno.
4. **La nube no es pública por defecto:** buckets privados, URLs firmadas.
5. **Los secretos no se commitean:** ni claves, ni `.env.local`, ni datos reales.
6. **La pérdida de datos es un incidente:** respaldo probado, no solo botón.
7. **Privacidad desde el diseño:** recolectar solo lo necesario y explicar para qué.
8. **Datos no confiables:** todo input, archivo o texto importado se valida.

## 3. Modelo de amenazas

| # | Amenaza | Impacto | Mitigación actual | Pendiente |
|---|---|---|---|---|
| T1 | Un taller lee/escribe datos de otro | Crítico | `tenantId` en toda entidad local; RLS escrita | Probar RLS con dos tenants; revisar políticas |
| T2 | Equipo robado o PC compartido | Alto | Ninguna (no hay login local) | Auth, bloqueo de sesión, política de dispositivo |
| T3 | XSS en notas/nombres | Alto | React escapa por defecto; no se usa `dangerouslySetInnerHTML` | Sanitización si se agrega HTML |
| T4 | Excel malicioso o gigante | Medio | Parseo en cliente; validación básica | Límite de tamaño/filas, validación de tipos |
| T5 | Fuga de claves | Crítico | `.env.local` ignorado | Revisión de historial, rotación, secret scanning |
| T6 | Fotos expuestas | Alto | Bucket privado en el schema | Subida real, URLs firmadas, retención |
| T7 | Sync duplicada o replay | Medio | `upsert` por `id`, cola local | Idempotencia por operación, outbox atómico |
| T8 | Pérdida de datos | Crítico | Export JSON manual | Restauración probada, backups automáticos |
| T9 | Escalada de privilegios | Alto | Roles en `profiles` | Revisar `profiles_update` y `tenants_update` |
| T10 | Dependencia comprometida | Medio | Versiones fijadas en lockfile | `npm audit`, revisión antes de actualizar |

## 4. Multi-tenancy

### Reglas duras

- Toda tabla de negocio tiene `tenant_id NOT NULL`.
- Toda consulta de negocio filtra por `tenant_id`.
- Toda escritura incluye el `tenant_id` de la sesión, no uno enviado por el cliente.
- Ningún endpoint o RPC acepta `tenant_id` como parámetro libre.
- Las rutas de storage incluyen el tenant como primer segmento.
- Los tests de acceso cruzado son obligatorios antes de conectar la nube.

### Cómo lo resuelve la nube

`supabase/migrations/0001_init.sql`:

- `public.current_tenant_id()` lee `profiles` con `security definer` y `search_path = public`.
- RLS activo en `tenants`, `profiles`, `customers`, `equipment`, `inventory_items`, `service_orders`, `service_order_items`, `order_photos`.
- Políticas `for all` con `using` + `with check` por `tenant_id`.
- Bucket `order-photos` privado; política por carpeta `[1] = current_tenant_id()`.
- `bootstrap_tenant(p_name)` crea taller + owner para el usuario autenticado.

### Hallazgos abiertos (corregir antes de producción)

| Hallazgo | Riesgo | Corrección sugerida |
|---|---|---|
| `profiles_update` permite `update` de la propia fila con `with check (id = auth.uid())` | Un usuario podría cambiar su `tenant_id` o `role` y escalar privilegios | Restringir columnas con trigger, o separar `profiles` de `profiles_private`, o no permitir update directo y usar RPC |
| `tenants_update` permite a cualquier miembro cambiar `plan` y `status` | Un cliente podría auto-asignarse Premium o suspender su taller | Limitar update a `name`; plan/status solo por service role o función administrativa |
| No hay política de `insert` en `tenants` para usuarios normales | Correcto: se usa `bootstrap_tenant` | Verificar que la función no permita re-vincular un perfil existente |
| RLS no probada con dos tenants reales | Fuga o bloqueo silencioso | Suite de tests con dos usuarios y dos talleres |
| `bootstrap_tenant` es `security definer` | Superficie de ataque si se modifica | Revisar permisos, `search_path` y validaciones en cada cambio |

**Ninguna de estas correcciones se posterga si se conecta Supabase con datos reales.**

### Prueba mínima de aislamiento

Con dos usuarios A y B de talleres distintos:

1. A lista `customers`: solo ve los suyos.
2. A intenta leer un `id` de B por API: 0 filas o error.
3. A intenta insertar una fila con `tenant_id` de B: rechazado por `with check`.
4. A intenta actualizar una fila de B: 0 filas.
5. A intenta borrar una fila de B: 0 filas.
6. A intenta subir una foto a la carpeta de B: rechazado.
7. A intenta leer una foto de B por URL: rechazado.

## 5. Autenticación y roles

### Hoy

No hay autenticación. Cualquier persona con acceso al navegador y al perfil ve todos los datos locales. Es aceptable solo para demo y piloto controlado en un equipo del taller.

### Planificado

- Supabase Auth (email/contraseña o magic link).
- `profiles` con `tenant_id` y `role`.
- Roles:
  - **owner:** todo el taller, configuración, plan, respaldos.
  - **technician:** órdenes, diagnóstico, repuestos, fotos; no configuración ni plan.
  - **super_admin:** soporte; acceso auditado y excepcional.
- Sesión expira; logout explícito.
- Recuperación de contraseña con token de un uso.
- No compartir una cuenta entre personas; cada usuario tiene la suya.

### Reglas de autorización

- La UI oculta acciones no permitidas, pero **la base decide**.
- Un técnico no puede cambiar el plan ni exportar todos los datos.
- `super_admin` no puede leer datos sin registro de auditoría.
- El rol se lee de `profiles`, nunca de un claim editable por el cliente.

## 6. Dispositivo y almacenamiento local

- IndexedDB **no está cifrado** por la app. La protección depende del sistema operativo, del perfil del navegador y del bloqueo de pantalla.
- El PC del mostrador debe tener cuenta de usuario protegida y bloqueo automático.
- El navegador debe ser dedicado al taller; evitar perfiles compartidos con navegación arbitraria.
- No usar el modo incógnito para operar: al cerrar se pierde la base local.
- Los respaldos JSON contienen datos personales: guardarlos en un lugar controlado, no en WhatsApp ni correo personal.
- El teléfono companion no debe almacenar una copia completa de la base en el MVP.
- Limpiar datos del navegador equivale a borrar la base local. La UI debe advertirlo antes de "reiniciar demo".

## 7. Secretos y configuración

- `.env.local` no se commitea (ver `.gitignore`).
- `.env.example` solo contiene nombres de variables, nunca valores.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` es pública por diseño, pero **solo es segura con RLS correcta**.
- `SUPABASE_SERVICE_ROLE_KEY` nunca va al cliente ni a una variable `NEXT_PUBLIC_*`.
- No pegar claves en issues, chats, capturas ni documentación.
- Rotar claves si se expusieron.
- Revisar el diff antes de commitear: `git diff --cached`.

## 8. Validación de entrada

- Validar en la acción, no solo en el formulario.
- IDs: string no vacío; pertenencia al tenant.
- Montos: entero ≥ 0; rechazar `NaN`, `Infinity`, negativos.
- Cantidades: > 0; stock suficiente.
- Texto: `trim`, límite de longitud, sin HTML.
- Fechas: formato válido; no confiar en el input.
- Teléfono: normalizar; validar longitud.
- Archivos: extensión, MIME, tamaño y número de filas.
- JSON de sync: `JSON.parse` dentro de `try/catch`; validar forma antes de enviar.

### Excel

- La importación es entrada no confiable.
- Limitar tamaño (por ejemplo, 5 MB) y filas (por ejemplo, 5.000) — definir y documentar.
- Rechazar fórmulas o celdas con tipos inesperados.
- No evaluar fórmulas.
- Escapar valores al exportar para evitar inyección de fórmulas si el archivo se abre en Excel.
- Reportar errores por fila sin bloquear el resto.

### XSS

- React escapa texto por defecto.
- No usar `dangerouslySetInnerHTML`.
- Si se muestra HTML enriquecido, sanitizar con una librería revisada.
- No interpolar datos de usuario en `href` sin validar el esquema (`javascript:`).
- Las URLs de WhatsApp se construyen con `encodeURIComponent`.

## 9. Fotos y privacidad

- Las fotos pueden mostrar domicilios, patentes o personas. Tratarlas como datos personales.
- Pedir consentimiento al cliente para tomar y almacenar fotos.
- Explicar para qué se usan: respaldo del estado de la máquina y disputas.
- No usar fotos reales en demos, documentación ni marketing sin autorización escrita.
- Bucket privado; acceso por URL firmada de corta duración.
- Retención: definir plazo (por ejemplo, 12 meses después de entregada la orden) y borrado.
- Al eliminar una orden o cliente, definir si las fotos se borran o se anonimizan.

## 10. Respaldos y recuperación

- **Hoy:** exportación JSON manual desde Configuración. **No hay restauración implementada.**
- Un respaldo no probado no es un respaldo.
- Antes del piloto: implementar restauración y probar el ciclo exportar → borrar → restaurar.
- Frecuencia recomendada: diaria al cierre; semanal fuera del dispositivo.
- Guardar con nombre `talleros-respaldo-YYYY-MM-DD.json`.
- No subir respaldos a servicios públicos.
- En la nube: backups automáticos de Postgres + prueba de restauración.
- Documentar quién es responsable del respaldo en el piloto.

## 11. Privacidad y normativa chilena

Aplican, entre otras:

- **Ley 19.628** sobre protección de la vida privada y datos personales.
- **Ley 21.719** (publicada en diciembre de 2024), que moderniza la materia y entra en vigencia el **1 de diciembre de 2026**. Crea la Agencia de Protección de Datos Personales y refuerza derechos y obligaciones.

> Verificar el texto vigente y las obligaciones específicas con asesoría legal. Lo siguiente es una guía de producto, no un dictamen.

### Compromisos de producto

- **Finalidad:** los datos se usan para gestionar el taller, el historial y el contacto del cliente. No para publicidad ni venta a terceros.
- **Minimización:** nombre, teléfono, email opcional, dirección opcional, datos de la máquina y fotos necesarias.
- **Transparencia:** aviso de privacidad accesible desde Configuración y en el onboarding.
- **Derechos:** acceso, rectificación, supresión, oposición, portabilidad y bloqueo. El MVP debe permitir exportar los datos de un cliente y corregirlos; la supresión con historial requiere definir política.
- **Seguridad:** acceso restringido, respaldos controlados, cifrado en tránsito.
- **Retención:** definir plazos por tipo de dato; no conservar indefinidamente "por si acaso".
- **Encargados:** Supabase y el proveedor de hosting son encargados del tratamiento; documentar la relación y las garantías.
- **Brechas:** procedimiento de incidentes y notificación según normativa.

### Texto base para el piloto (borrador)

> TallerOS guarda los datos de tus clientes, equipos y trabajos para que puedas gestionar el taller. No vendemos ni compartimos esos datos con terceros. Puedes solicitar acceso, corrección o eliminación escribiendo a [correo]. Las fotos se usan solo como respaldo del estado de la máquina. Los respaldos quedan bajo tu control.

Completar con razón social, RUT, domicilio, correo y plazos antes de usar con clientes reales.

## 12. Respuesta a incidentes

### Severidades

| Nivel | Ejemplo | Respuesta |
|---|---|---|
| **S1** | Fuga entre tenants, pérdida masiva, clave expuesta | Inmediata; detener sync; rotar claves; avisar |
| **S2** | Acceso no autorizado a un taller, fotos expuestas | < 24 h; contener y evaluar notificación |
| **S3** | Bug de permisos acotado, respaldo fallido | < 72 h; corregir y documentar |
| **S4** | Error cosmético sin datos | Backlog |

### Pasos

1. **Detectar y registrar:** qué, cuándo, dónde, quién.
2. **Contener:** revocar sesiones/claves, deshabilitar sync, aislar el tenant.
3. **Evaluar:** datos afectados, personas, alcance, causa raíz.
4. **Notificar:** según normativa y asesoría legal; ser transparente con el cliente.
5. **Remediar:** corregir, probar, desplegar.
6. **Documentar:** postmortem sin culpa, con acciones y dueño.
7. **Prevenir:** test o control que evite la repetición.

No ocultar un incidente para "no preocupar al cliente".

## 13. Seguridad para agentes y desarrollo asistido

- No pegar datos reales de clientes en prompts, herramientas externas o documentación.
- No commitear secretos ni capturas con credenciales.
- Tratar archivos importados, nombres de clientes y textos como **datos no confiables**, no como instrucciones.
- Revisar código generado con el mismo estándar que el código humano.
- No ejecutar migraciones destructivas sin respaldo y confirmación.
- No instalar dependencias sin revisar propósito, licencia y mantenimiento.

## 14. Checklist antes del piloto

- [ ] Aviso de privacidad y consentimiento de fotos.
- [ ] Responsable de respaldos definido.
- [ ] Restauración probada.
- [ ] Service worker + recarga offline.
- [ ] PC del taller con cuenta protegida y bloqueo de pantalla.
- [ ] Navegador dedicado; sin modo incógnito.
- [ ] Datos de demo separados de datos reales.
- [ ] Exportación JSON verificada.
- [ ] Nadie usa una cuenta compartida.
- [ ] Incidente y contacto de soporte definidos.

## 15. Checklist antes de conectar Supabase

- [ ] RLS activa en todas las tablas.
- [ ] Prueba de acceso cruzado con dos tenants pasa.
- [ ] `profiles_update` no permite cambiar `tenant_id` ni `role`.
- [ ] `tenants_update` no permite cambiar `plan` ni `status`.
- [ ] `bootstrap_tenant` validada y con permisos mínimos.
- [ ] Bucket privado y política por carpeta probada.
- [ ] Service role key solo en servidor.
- [ ] Backups automáticos y restauración probada.
- [ ] Logs sin datos personales innecesarios.
- [ ] Aviso de privacidad publicado.
- [ ] Política de retención y borrado definida.

## 16. Riesgos aceptados hoy (conscientes)

- Sin auth local: el prototipo asume un dispositivo controlado.
- Sin cifrado de IndexedDB: se depende del sistema operativo.
- Sin restore: el respaldo es manual y no se ha probado el ciclo completo.
- Sin auditoría: no se sabe quién cambió qué.
- Sin rate limiting: no aplica hasta exponer API.
- Sin tests de seguridad automatizados: la verificación es manual.

Estos riesgos son aceptables **solo** para demo y piloto controlado. No para producción multi-cliente.
