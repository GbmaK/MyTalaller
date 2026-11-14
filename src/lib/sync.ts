import type { SyncOperation } from "@/types/domain";
import { getDb } from "@/lib/db";
import { newId, nowIso } from "@/lib/ids";
import { getSupabaseClient } from "@/lib/supabase";

const TABLE_MAP: Record<string, string> = {
  customer: "customers",
  equipment: "equipment",
  inventory_item: "inventory_items",
  service_order: "service_orders",
  service_order_item: "service_order_items",
  order_photo: "order_photos",
  tenant: "tenants",
};

export interface QueueChangeInput {
  tenantId: string;
  entity: string;
  entityId: string;
  operation: SyncOperation;
  payload: unknown;
}

export async function queueChange(input: QueueChangeInput): Promise<void> {
  if (typeof window === "undefined") return;

  const db = getDb();
  await db.syncQueue.add({
    id: newId(),
    tenantId: input.tenantId,
    entity: input.entity,
    entityId: input.entityId,
    operation: input.operation,
    payload: JSON.stringify(input.payload),
    attempts: 0,
    createdAt: nowIso(),
  });
}

function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function toSnakeCase(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toSnakeCase);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        camelToSnake(key),
        toSnakeCase(entry),
      ]),
    );
  }
  return value;
}

export interface SyncResult {
  pushed: number;
  failed: number;
  skipped: number;
}

/**
 * Empuja los cambios locales a Supabase.
 *
 * Requiere que las variables NEXT_PUBLIC_SUPABASE_URL y
 * NEXT_PUBLIC_SUPABASE_ANON_KEY estén configuradas y que el usuario
 * tenga una sesión válida (RLS). En el prototipo local no hay sesión,
 * así que esta función no hace nada si Supabase no está configurado.
 */
export async function syncPendingChanges(): Promise<SyncResult> {
  const supabase = getSupabaseClient();
  const db = getDb();

  if (!supabase) {
    return { pushed: 0, failed: 0, skipped: 0 };
  }

  const pending = await db.syncQueue
    .orderBy("createdAt")
    .limit(50)
    .toArray();

  let pushed = 0;
  let failed = 0;
  let skipped = 0;

  for (const entry of pending) {
    const table = TABLE_MAP[entry.entity];
    if (!table) {
      skipped += 1;
      await db.syncQueue.delete(entry.id);
      continue;
    }

    try {
      if (entry.operation === "delete") {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq("id", entry.entityId);
        if (error) throw error;
      } else {
        const payload = toSnakeCase(JSON.parse(entry.payload)) as Record<
          string,
          unknown
        >;
        const { error } = await supabase
          .from(table)
          .upsert(payload, { onConflict: "id" });
        if (error) throw error;
      }

      await db.syncQueue.delete(entry.id);
      pushed += 1;
    } catch (error) {
      failed += 1;
      await db.syncQueue.update(entry.id, {
        attempts: entry.attempts + 1,
        lastError: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  return { pushed, failed, skipped };
}
