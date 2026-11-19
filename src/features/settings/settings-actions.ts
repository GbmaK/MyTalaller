import { getDb } from "@/lib/db";
import { nowIso } from "@/lib/ids";
import { queueChange } from "@/lib/sync";
import { reseedDemoDatabase } from "@/lib/seed";
import type { Tenant, TenantPlan } from "@/types/domain";

export async function updateTenant(
  tenantId: string,
  input: { name: string; plan: TenantPlan },
): Promise<Tenant> {
  const db = getDb();
  const current = await db.tenants.get(tenantId);
  if (!current) {
    throw new Error("El taller no existe.");
  }
  if (!input.name.trim()) {
    throw new Error("El nombre del taller es obligatorio.");
  }

  const updated: Tenant = {
    ...current,
    name: input.name.trim(),
    plan: input.plan,
    updatedAt: nowIso(),
  };

  await db.tenants.put(updated);
  await queueChange({
    tenantId: updated.id,
    entity: "tenant",
    entityId: updated.id,
    operation: "update",
    payload: updated,
  });

  return updated;
}

export interface ExportSummary {
  tenants: number;
  customers: number;
  equipment: number;
  inventoryItems: number;
  serviceOrders: number;
  serviceOrderItems: number;
  pendingChanges: number;
}

export async function exportDatabase(): Promise<ExportSummary> {
  const db = getDb();

  const [
    tenants,
    customers,
    equipment,
    inventoryItems,
    serviceOrders,
    serviceOrderItems,
    syncQueue,
  ] = await Promise.all([
    db.tenants.toArray(),
    db.customers.toArray(),
    db.equipment.toArray(),
    db.inventoryItems.toArray(),
    db.serviceOrders.toArray(),
    db.serviceOrderItems.toArray(),
    db.syncQueue.toArray(),
  ]);

  const payload = {
    exportedAt: nowIso(),
    version: 1,
    data: {
      tenants,
      customers,
      equipment,
      inventoryItems,
      serviceOrders,
      serviceOrderItems,
      syncQueue,
    },
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `talleros-respaldo-${stamp}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  return {
    tenants: tenants.length,
    customers: customers.length,
    equipment: equipment.length,
    inventoryItems: inventoryItems.length,
    serviceOrders: serviceOrders.length,
    serviceOrderItems: serviceOrderItems.length,
    pendingChanges: syncQueue.length,
  };
}

export async function resetDemoData(): Promise<void> {
  await reseedDemoDatabase();
}

export async function estimateStorage(): Promise<{
  usage: number;
  quota: number;
} | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
    return null;
  }
  const estimate = await navigator.storage.estimate();
  return {
    usage: estimate.usage ?? 0,
    quota: estimate.quota ?? 0,
  };
}
