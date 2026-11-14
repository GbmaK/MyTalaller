"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import type { Customer, Equipment } from "@/types/domain";

export function useCustomers(tenantId?: string): Customer[] | undefined {
  return useLiveQuery(async () => {
    if (!tenantId) return [];
    const db = getDb();
    const customers = await db.customers
      .where("tenantId")
      .equals(tenantId)
      .toArray();
    return customers.sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [tenantId]);
}

export function useCustomer(customerId?: string): Customer | undefined {
  return useLiveQuery(async () => {
    if (!customerId) return undefined;
    return getDb().customers.get(customerId);
  }, [customerId]);
}

export function useEquipmentByCustomer(
  customerId?: string,
): Equipment[] | undefined {
  return useLiveQuery(async () => {
    if (!customerId) return [];
    return getDb().equipment.where("customerId").equals(customerId).toArray();
  }, [customerId]);
}

export function useEquipment(tenantId?: string): Equipment[] | undefined {
  return useLiveQuery(async () => {
    if (!tenantId) return [];
    const db = getDb();
    return db.equipment.where("tenantId").equals(tenantId).toArray();
  }, [tenantId]);
}
