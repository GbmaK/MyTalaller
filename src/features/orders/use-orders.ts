"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import type {
  OrderPhoto,
  ServiceOrderItem,
  ServiceOrderWithRelations,
} from "@/types/domain";

export function useOrders(
  tenantId?: string,
): ServiceOrderWithRelations[] | undefined {
  return useLiveQuery(async () => {
    if (!tenantId) return [];

    const db = getDb();
    const [orders, customers, equipment, items] = await Promise.all([
      db.serviceOrders.where("tenantId").equals(tenantId).toArray(),
      db.customers.where("tenantId").equals(tenantId).toArray(),
      db.equipment.where("tenantId").equals(tenantId).toArray(),
      db.serviceOrderItems.where("tenantId").equals(tenantId).toArray(),
    ]);

    const customerMap = new Map(customers.map((entry) => [entry.id, entry]));
    const equipmentMap = new Map(equipment.map((entry) => [entry.id, entry]));
    const itemsByOrder = new Map<string, ServiceOrderItem[]>();

    for (const item of items) {
      const list = itemsByOrder.get(item.orderId) ?? [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }

    const result: ServiceOrderWithRelations[] = [];
    for (const order of orders) {
      const customer = customerMap.get(order.customerId);
      if (!customer) continue;
      result.push({
        ...order,
        customer,
        equipment: order.equipmentId
          ? equipmentMap.get(order.equipmentId)
          : undefined,
        items: itemsByOrder.get(order.id) ?? [],
      });
    }

    return result.sort((a, b) => b.number - a.number);
  }, [tenantId]);
}

export function useOrder(
  orderId?: string,
): ServiceOrderWithRelations | null | undefined {
  return useLiveQuery(async () => {
    if (!orderId) return null;

    const db = getDb();
    const order = await db.serviceOrders.get(orderId);
    if (!order) return null;

    const [customer, equipment, items] = await Promise.all([
      db.customers.get(order.customerId),
      order.equipmentId
        ? db.equipment.get(order.equipmentId)
        : Promise.resolve(undefined),
      db.serviceOrderItems.where("orderId").equals(order.id).toArray(),
    ]);

    if (!customer) return null;

    return {
      ...order,
      customer,
      equipment: equipment ?? undefined,
      items,
    };
  }, [orderId]);
}

export function useOrderPhotos(
  orderId?: string,
): OrderPhoto[] | undefined {
  return useLiveQuery(async () => {
    if (!orderId) return [];
    return getDb().orderPhotos.where("orderId").equals(orderId).toArray();
  }, [orderId]);
}
