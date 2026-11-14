import { getDb } from "@/lib/db";
import { newId, nowIso } from "@/lib/ids";
import { queueChange } from "@/lib/sync";
import type {
  InventoryItem,
  OrderPhoto,
  OrderStatus,
  ServiceOrder,
  ServiceOrderItem,
} from "@/types/domain";

export interface OrderDraft {
  customerId: string;
  equipmentId?: string;
  intakeNotes?: string;
  laborPrice: number;
  laborCost: number;
  promisedAt?: string;
}

export interface OrderUpdateDraft {
  intakeNotes?: string;
  diagnosis?: string;
  laborPrice: number;
  laborCost: number;
  promisedAt?: string;
}

export interface AddOrderItemInput {
  orderId: string;
  inventoryItemId: string;
  quantity: number;
  unitPrice?: number;
  unitCost?: number;
}

function money(value: number): number {
  return Math.max(0, Math.round(Number.isFinite(value) ? value : 0));
}

async function computeNextNumber(tenantId: string): Promise<number> {
  const db = getDb();
  const orders = await db.serviceOrders
    .where("tenantId")
    .equals(tenantId)
    .toArray();
  const max = orders.reduce(
    (current, order) => Math.max(current, order.number),
    1000,
  );
  return max + 1;
}

export async function createOrder(
  tenantId: string,
  draft: OrderDraft,
): Promise<ServiceOrder> {
  if (!draft.customerId) {
    throw new Error("Selecciona un cliente.");
  }

  const db = getDb();
  const now = nowIso();
  const number = await computeNextNumber(tenantId);
  const laborPrice = money(draft.laborPrice);

  const order: ServiceOrder = {
    id: newId(),
    tenantId,
    number,
    customerId: draft.customerId,
    equipmentId: draft.equipmentId,
    status: "ingresado",
    intakeNotes: draft.intakeNotes?.trim() || undefined,
    laborPrice,
    laborCost: money(draft.laborCost),
    partsTotal: 0,
    total: laborPrice,
    promisedAt: draft.promisedAt || undefined,
    createdAt: now,
    updatedAt: now,
  };

  await db.serviceOrders.add(order);
  await queueChange({
    tenantId,
    entity: "service_order",
    entityId: order.id,
    operation: "create",
    payload: order,
  });

  return order;
}

export async function updateOrder(
  orderId: string,
  draft: OrderUpdateDraft,
): Promise<ServiceOrder> {
  const db = getDb();
  const current = await db.serviceOrders.get(orderId);
  if (!current) {
    throw new Error("La orden no existe.");
  }

  const laborPrice = money(draft.laborPrice);
  const updated: ServiceOrder = {
    ...current,
    intakeNotes: draft.intakeNotes?.trim() || undefined,
    diagnosis: draft.diagnosis?.trim() || undefined,
    laborPrice,
    laborCost: money(draft.laborCost),
    total: laborPrice + current.partsTotal,
    promisedAt: draft.promisedAt || undefined,
    updatedAt: nowIso(),
  };

  await db.serviceOrders.put(updated);
  await queueChange({
    tenantId: updated.tenantId,
    entity: "service_order",
    entityId: updated.id,
    operation: "update",
    payload: updated,
  });

  return updated;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<ServiceOrder> {
  const db = getDb();
  const current = await db.serviceOrders.get(orderId);
  if (!current) {
    throw new Error("La orden no existe.");
  }
  if (current.status === status) {
    return current;
  }
  if (current.status === "cancelado") {
    throw new Error("Una orden cancelada no se puede reabrir.");
  }

  if (status === "cancelado") {
    const captured: { order?: ServiceOrder } = {};
    const restored: InventoryItem[] = [];

    await db.transaction(
      "rw",
      db.serviceOrders,
      db.serviceOrderItems,
      db.inventoryItems,
      async () => {
        const items = await db.serviceOrderItems
          .where("orderId")
          .equals(orderId)
          .toArray();

        for (const item of items) {
          const inventory = await db.inventoryItems.get(item.inventoryItemId);
          if (!inventory) continue;
          const next: InventoryItem = {
            ...inventory,
            stock: inventory.stock + item.quantity,
            updatedAt: nowIso(),
          };
          await db.inventoryItems.put(next);
          restored.push(next);
        }

        const nextOrder: ServiceOrder = {
          ...current,
          status,
          deliveredAt: undefined,
          updatedAt: nowIso(),
        };
        await db.serviceOrders.put(nextOrder);
        captured.order = nextOrder;
      },
    );

    const updatedOrder = captured.order;
    if (updatedOrder) {
      await queueChange({
        tenantId: updatedOrder.tenantId,
        entity: "service_order",
        entityId: updatedOrder.id,
        operation: "update",
        payload: updatedOrder,
      });
    }
    for (const inventory of restored) {
      await queueChange({
        tenantId: inventory.tenantId,
        entity: "inventory_item",
        entityId: inventory.id,
        operation: "update",
        payload: inventory,
      });
    }

    return updatedOrder ?? current;
  }

  const updated: ServiceOrder = {
    ...current,
    status,
    deliveredAt: status === "entregado" ? nowIso() : undefined,
    updatedAt: nowIso(),
  };

  await db.serviceOrders.put(updated);
  await queueChange({
    tenantId: updated.tenantId,
    entity: "service_order",
    entityId: updated.id,
    operation: "update",
    payload: updated,
  });

  return updated;
}

export async function addOrderItem(
  input: AddOrderItemInput,
): Promise<ServiceOrderItem> {
  if (input.quantity <= 0) {
    throw new Error("La cantidad debe ser mayor que cero.");
  }

  const db = getDb();
  const captured: {
    item?: ServiceOrderItem;
    inventory?: InventoryItem;
    order?: ServiceOrder;
  } = {};

  await db.transaction(
    "rw",
    db.serviceOrders,
    db.serviceOrderItems,
    db.inventoryItems,
    async () => {
      const order = await db.serviceOrders.get(input.orderId);
      if (!order) {
        throw new Error("La orden no existe.");
      }
      if (order.status === "cancelado" || order.status === "entregado") {
        throw new Error("No se pueden agregar repuestos a una orden cerrada.");
      }

      const inventory = await db.inventoryItems.get(input.inventoryItemId);
      if (!inventory) {
        throw new Error("El repuesto no existe.");
      }
      if (inventory.stock < input.quantity) {
        throw new Error(
          `Stock insuficiente de ${inventory.name}. Quedan ${inventory.stock}.`,
        );
      }

      const existing = await db.serviceOrderItems
        .where("orderId")
        .equals(input.orderId)
        .toArray()
        .then((items) =>
          items.find(
            (item) => item.inventoryItemId === input.inventoryItemId,
          ),
        );

      const unitPrice = money(input.unitPrice ?? inventory.salePrice);
      const unitCost = money(input.unitCost ?? inventory.costPrice);

      if (existing) {
        const nextItem: ServiceOrderItem = {
          ...existing,
          quantity: existing.quantity + input.quantity,
          unitPrice,
          unitCost,
        };
        await db.serviceOrderItems.put(nextItem);
        captured.item = nextItem;
      } else {
        const nextItem: ServiceOrderItem = {
          id: newId(),
          tenantId: order.tenantId,
          orderId: order.id,
          inventoryItemId: inventory.id,
          quantity: input.quantity,
          unitPrice,
          unitCost,
          createdAt: nowIso(),
        };
        await db.serviceOrderItems.add(nextItem);
        captured.item = nextItem;
      }

      const nextInventory: InventoryItem = {
        ...inventory,
        stock: inventory.stock - input.quantity,
        updatedAt: nowIso(),
      };
      await db.inventoryItems.put(nextInventory);
      captured.inventory = nextInventory;

      const items = await db.serviceOrderItems
        .where("orderId")
        .equals(input.orderId)
        .toArray();
      const partsTotal = items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      );
      const nextOrder: ServiceOrder = {
        ...order,
        partsTotal,
        total: order.laborPrice + partsTotal,
        updatedAt: nowIso(),
      };
      await db.serviceOrders.put(nextOrder);
      captured.order = nextOrder;
    },
  );

  const result = captured.item;
  const updatedInventory = captured.inventory;
  const updatedOrder = captured.order;

  if (!result || !updatedInventory || !updatedOrder) {
    throw new Error("No se pudo agregar el repuesto.");
  }

  await queueChange({
    tenantId: result.tenantId,
    entity: "service_order_item",
    entityId: result.id,
    operation: "create",
    payload: result,
  });
  await queueChange({
    tenantId: updatedInventory.tenantId,
    entity: "inventory_item",
    entityId: updatedInventory.id,
    operation: "update",
    payload: updatedInventory,
  });
  await queueChange({
    tenantId: updatedOrder.tenantId,
    entity: "service_order",
    entityId: updatedOrder.id,
    operation: "update",
    payload: updatedOrder,
  });

  return result;
}

export async function removeOrderItem(
  orderItemId: string,
): Promise<void> {
  const db = getDb();
  const captured: {
    removed?: ServiceOrderItem;
    inventory?: InventoryItem;
    order?: ServiceOrder;
  } = {};

  await db.transaction(
    "rw",
    db.serviceOrders,
    db.serviceOrderItems,
    db.inventoryItems,
    async () => {
      const item = await db.serviceOrderItems.get(orderItemId);
      if (!item) {
        throw new Error("El repuesto de la orden no existe.");
      }
      const order = await db.serviceOrders.get(item.orderId);
      if (!order) {
        throw new Error("La orden no existe.");
      }
      if (order.status === "entregado" || order.status === "cancelado") {
        throw new Error("No se pueden quitar repuestos de una orden cerrada.");
      }

      const inventory = await db.inventoryItems.get(item.inventoryItemId);
      await db.serviceOrderItems.delete(orderItemId);
      captured.removed = item;

      if (inventory) {
        const nextInventory: InventoryItem = {
          ...inventory,
          stock: inventory.stock + item.quantity,
          updatedAt: nowIso(),
        };
        await db.inventoryItems.put(nextInventory);
        captured.inventory = nextInventory;
      }

      const items = await db.serviceOrderItems
        .where("orderId")
        .equals(order.id)
        .toArray();
      const partsTotal = items.reduce(
        (sum, entry) => sum + entry.unitPrice * entry.quantity,
        0,
      );
      const nextOrder: ServiceOrder = {
        ...order,
        partsTotal,
        total: order.laborPrice + partsTotal,
        updatedAt: nowIso(),
      };
      await db.serviceOrders.put(nextOrder);
      captured.order = nextOrder;
    },
  );

  const removed = captured.removed;
  const updatedInventory = captured.inventory;
  const updatedOrder = captured.order;

  if (!removed) {
    return;
  }

  await queueChange({
    tenantId: removed.tenantId,
    entity: "service_order_item",
    entityId: removed.id,
    operation: "delete",
    payload: { id: removed.id },
  });

  if (updatedInventory) {
    await queueChange({
      tenantId: updatedInventory.tenantId,
      entity: "inventory_item",
      entityId: updatedInventory.id,
      operation: "update",
      payload: updatedInventory,
    });
  }

  if (updatedOrder) {
    await queueChange({
      tenantId: updatedOrder.tenantId,
      entity: "service_order",
      entityId: updatedOrder.id,
      operation: "update",
      payload: updatedOrder,
    });
  }
}

export async function addOrderPhoto(
  orderId: string,
  dataUrl: string,
  caption?: string,
): Promise<OrderPhoto> {
  const db = getDb();
  const order = await db.serviceOrders.get(orderId);
  if (!order) {
    throw new Error("La orden no existe.");
  }

  const photo: OrderPhoto = {
    id: newId(),
    tenantId: order.tenantId,
    orderId,
    dataUrl,
    caption: caption?.trim() || undefined,
    createdAt: nowIso(),
  };

  await db.orderPhotos.add(photo);
  await queueChange({
    tenantId: photo.tenantId,
    entity: "order_photo",
    entityId: photo.id,
    operation: "create",
    payload: {
      id: photo.id,
      tenantId: photo.tenantId,
      orderId: photo.orderId,
      storagePath: photo.dataUrl,
      caption: photo.caption,
      createdAt: photo.createdAt,
    },
  });

  return photo;
}

export async function deleteOrderPhoto(photoId: string): Promise<void> {
  const db = getDb();
  const photo = await db.orderPhotos.get(photoId);
  if (!photo) return;

  await db.orderPhotos.delete(photoId);
  await queueChange({
    tenantId: photo.tenantId,
    entity: "order_photo",
    entityId: photo.id,
    operation: "delete",
    payload: { id: photo.id },
  });
}
