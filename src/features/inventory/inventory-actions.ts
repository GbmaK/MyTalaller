import { getDb } from "@/lib/db";
import { newId, nowIso } from "@/lib/ids";
import { queueChange } from "@/lib/sync";
import type { InventoryItem, InventoryUnit } from "@/types/domain";

export interface InventoryItemDraft {
  sku: string;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  unit: InventoryUnit;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  location?: string;
  barcode?: string;
}

function cleanDraft(draft: InventoryItemDraft): InventoryItemDraft {
  return {
    ...draft,
    sku: draft.sku.trim(),
    name: draft.name.trim(),
    category: draft.category.trim() || "General",
    brand: draft.brand?.trim() || undefined,
    model: draft.model?.trim() || undefined,
    location: draft.location?.trim() || undefined,
    barcode: draft.barcode?.trim() || undefined,
    costPrice: Math.max(0, Math.round(draft.costPrice)),
    salePrice: Math.max(0, Math.round(draft.salePrice)),
    stock: Math.max(0, draft.stock),
    minStock: Math.max(0, draft.minStock),
  };
}

export async function createInventoryItem(
  tenantId: string,
  draft: InventoryItemDraft,
): Promise<InventoryItem> {
  const db = getDb();
  const clean = cleanDraft(draft);

  if (!clean.sku) {
    throw new Error("El SKU es obligatorio.");
  }
  if (!clean.name) {
    throw new Error("El nombre es obligatorio.");
  }

  const existing = await db.inventoryItems
    .where("[tenantId+sku]")
    .equals([tenantId, clean.sku])
    .first();

  if (existing) {
    throw new Error(`Ya existe un repuesto con el SKU ${clean.sku}.`);
  }

  const now = nowIso();
  const item: InventoryItem = {
    id: newId(),
    tenantId,
    ...clean,
    createdAt: now,
    updatedAt: now,
  };

  await db.inventoryItems.add(item);
  await queueChange({
    tenantId,
    entity: "inventory_item",
    entityId: item.id,
    operation: "create",
    payload: item,
  });

  return item;
}

export async function updateInventoryItem(
  id: string,
  draft: InventoryItemDraft,
): Promise<InventoryItem> {
  const db = getDb();
  const clean = cleanDraft(draft);
  const current = await db.inventoryItems.get(id);

  if (!current) {
    throw new Error("El repuesto no existe.");
  }

  if (!clean.sku) {
    throw new Error("El SKU es obligatorio.");
  }
  if (!clean.name) {
    throw new Error("El nombre es obligatorio.");
  }

  const duplicate = await db.inventoryItems
    .where("[tenantId+sku]")
    .equals([current.tenantId, clean.sku])
    .first();

  if (duplicate && duplicate.id !== id) {
    throw new Error(`Ya existe un repuesto con el SKU ${clean.sku}.`);
  }

  const updated: InventoryItem = {
    ...current,
    ...clean,
    updatedAt: nowIso(),
  };

  await db.inventoryItems.put(updated);
  await queueChange({
    tenantId: updated.tenantId,
    entity: "inventory_item",
    entityId: updated.id,
    operation: "update",
    payload: updated,
  });

  return updated;
}

export async function setInventoryStock(
  id: string,
  stock: number,
): Promise<InventoryItem> {
  const db = getDb();
  const current = await db.inventoryItems.get(id);

  if (!current) {
    throw new Error("El repuesto no existe.");
  }

  const updated: InventoryItem = {
    ...current,
    stock: Math.max(0, stock),
    updatedAt: nowIso(),
  };

  await db.inventoryItems.put(updated);
  await queueChange({
    tenantId: updated.tenantId,
    entity: "inventory_item",
    entityId: updated.id,
    operation: "update",
    payload: updated,
  });

  return updated;
}

export interface ImportResult {
  created: number;
  updated: number;
  errors: string[];
}

export async function importInventoryItems(
  tenantId: string,
  drafts: InventoryItemDraft[],
): Promise<ImportResult> {
  const db = getDb();
  const result: ImportResult = { created: 0, updated: 0, errors: [] };
  const now = nowIso();

  for (const raw of drafts) {
    try {
      const clean = cleanDraft(raw);
      if (!clean.sku || !clean.name) {
        result.errors.push(
          `Fila sin SKU o nombre: ${clean.sku || "(sin SKU)"}`,
        );
        continue;
      }

      const existing = await db.inventoryItems
        .where("[tenantId+sku]")
        .equals([tenantId, clean.sku])
        .first();

      if (existing) {
        const updated: InventoryItem = {
          ...existing,
          ...clean,
          updatedAt: now,
        };
        await db.inventoryItems.put(updated);
        await queueChange({
          tenantId,
          entity: "inventory_item",
          entityId: updated.id,
          operation: "update",
          payload: updated,
        });
        result.updated += 1;
      } else {
        const item: InventoryItem = {
          id: newId(),
          tenantId,
          ...clean,
          createdAt: now,
          updatedAt: now,
        };
        await db.inventoryItems.add(item);
        await queueChange({
          tenantId,
          entity: "inventory_item",
          entityId: item.id,
          operation: "create",
          payload: item,
        });
        result.created += 1;
      }
    } catch (error) {
      result.errors.push(
        error instanceof Error ? error.message : "Error desconocido",
      );
    }
  }

  return result;
}
