"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import type { InventoryItem } from "@/types/domain";

export function useInventory(
  tenantId?: string,
): InventoryItem[] | undefined {
  return useLiveQuery(async () => {
    if (!tenantId) return [];
    const db = getDb();
    const items = await db.inventoryItems
      .where("tenantId")
      .equals(tenantId)
      .toArray();
    return items.sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [tenantId]);
}

export function useInventoryItem(
  itemId?: string,
): InventoryItem | undefined {
  return useLiveQuery(async () => {
    if (!itemId) return undefined;
    return getDb().inventoryItems.get(itemId);
  }, [itemId]);
}
