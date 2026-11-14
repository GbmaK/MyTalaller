# Guion de demo

> **Objetivo:** mostrar la idea de TallerOS en 5–7 minutos sin explicar arquitectura.
> **Estado:** demo local, sin login ni nube.

## 1. Antes de mostrar

1. Abrir la app en Chrome o Edge.
2. Ir a **Configuración → Reiniciar demo**.
3. Confirmar que el dashboard muestra “Taller Los Robles”.
4. Tener el teléfono a mano para mostrar el modo móvil.
5. Cerrar pestañas y notificaciones.

No mostrar datos reales de ningún taller.

## 2. Recorrido recomendado

### Minuto 0–1: el problema

> “El dueño no sabe qué stock tiene, qué está pendiente ni cuánto ganó por trabajo. Todo vive en Excel, memoria y WhatsApp.”

Abrir el **Dashboard**.

Mostrar:

- Stock bajo.
- Órdenes abiertas.
- Listas para retirar.
- Margen de los últimos 30 días.
- Tablero por estado.

> “Esto es lo que el dueño necesita ver al abrir el PC en la mañana.”

### Minuto 1–2: ingreso de una máquina

Ir a **Órdenes → Nueva orden**.

- Elegir cliente.
- Elegir equipo.
- Escribir motivo: “No enciende”.
- Fecha de entrega.
- Crear.

> “En menos de un minuto queda registrado quién trajo qué, en qué estado llegó y cuándo se prometió.”

Abrir la orden y subir una foto.

> “La foto evita discusiones: así llegó la máquina.”

### Minuto 2–4: reparación y stock

En la orden:

- Avanzar a **Diagnóstico**.
- Agregar un repuesto.
- Mostrar que el stock baja.
- Mostrar total, costo y margen.
- Intentar agregar más stock del disponible: mostrar el error.
- Quitar el repuesto: el stock vuelve.

> “El repuesto se descuenta cuando sale del estante. Si se anula, vuelve. No hay stock fantasma.”

### Minuto 4–5: aviso y entrega

- Avanzar a **Listo**.
- Abrir **Avisar por WhatsApp**.
- Mostrar el mensaje prellenado.
- Volver y marcar **Entregado**.

> “El cliente sabe que puede retirar sin que nadie se acuerde de avisarle.”

### Minuto 5–6: margen e historial

Volver al **Dashboard**.

- Mostrar el margen actualizado.
- Entrar a **Clientes**.
- Abrir el cliente.
- Mostrar equipos e historial.

> “Cada trabajo queda en la memoria del taller y del cliente.”

### Minuto 6–7: inventario e importación

Ir a **Inventario**.

- Buscar un repuesto.
- Mostrar stock mínimo.
- Descargar la plantilla Excel.
- Mencionar la importación.

> “El taller no carga todo a mano: adapta su Excel a una plantilla estándar.”

## 3. Cierre

> “TallerOS no es un POS. Es la memoria y el margen del taller, funcionando aunque se caiga internet.”

Mencionar el estado real:

- Es una **demo**.
- Los datos viven solo en ese navegador.
- La versión con usuarios y nube viene después.

## 4. Qué no mostrar

- Configuración de Supabase.
- JSON de respaldo.
- Detalles de implementación.
- Datos reales.
- Promesas de boleta/factura o POS.

## 5. Después de la demo

- Reiniciar demo para dejar el estado limpio.
- O exportar si se quiere conservar algo.
- Anotar preguntas y objeciones del prospecto.

## 6. En Vercel

- La demo no necesita variables de entorno.
- Cada visitante tiene su propia base local.
- Si se abre en otro navegador, se ve la demo desde cero.
- El aviso **Demo** aparece automáticamente mientras Supabase no esté configurado.
