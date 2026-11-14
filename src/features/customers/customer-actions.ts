import { getDb } from "@/lib/db";
import { newId, nowIso } from "@/lib/ids";
import { queueChange } from "@/lib/sync";
import type { Customer, Equipment } from "@/types/domain";

export interface CustomerDraft {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface EquipmentDraft {
  customerId: string;
  brand: string;
  model: string;
  serialNumber?: string;
  notes?: string;
}

function cleanCustomer(draft: CustomerDraft): CustomerDraft {
  return {
    name: draft.name.trim(),
    phone: draft.phone.trim(),
    email: draft.email?.trim() || undefined,
    address: draft.address?.trim() || undefined,
    notes: draft.notes?.trim() || undefined,
  };
}

export async function createCustomer(
  tenantId: string,
  draft: CustomerDraft,
): Promise<Customer> {
  const clean = cleanCustomer(draft);
  if (!clean.name) {
    throw new Error("El nombre del cliente es obligatorio.");
  }
  if (!clean.phone) {
    throw new Error("El teléfono es obligatorio para poder avisar por WhatsApp.");
  }

  const db = getDb();
  const now = nowIso();
  const customer: Customer = {
    id: newId(),
    tenantId,
    ...clean,
    createdAt: now,
    updatedAt: now,
  };

  await db.customers.add(customer);
  await queueChange({
    tenantId,
    entity: "customer",
    entityId: customer.id,
    operation: "create",
    payload: customer,
  });

  return customer;
}

export async function updateCustomer(
  id: string,
  draft: CustomerDraft,
): Promise<Customer> {
  const db = getDb();
  const current = await db.customers.get(id);
  if (!current) {
    throw new Error("El cliente no existe.");
  }

  const clean = cleanCustomer(draft);
  if (!clean.name) {
    throw new Error("El nombre del cliente es obligatorio.");
  }

  const updated: Customer = {
    ...current,
    ...clean,
    updatedAt: nowIso(),
  };

  await db.customers.put(updated);
  await queueChange({
    tenantId: updated.tenantId,
    entity: "customer",
    entityId: updated.id,
    operation: "update",
    payload: updated,
  });

  return updated;
}

export async function createEquipment(
  tenantId: string,
  draft: EquipmentDraft,
): Promise<Equipment> {
  if (!draft.customerId) {
    throw new Error("Selecciona un cliente.");
  }
  if (!draft.brand.trim() || !draft.model.trim()) {
    throw new Error("La marca y el modelo del equipo son obligatorios.");
  }

  const db = getDb();
  const now = nowIso();
  const equipment: Equipment = {
    id: newId(),
    tenantId,
    customerId: draft.customerId,
    brand: draft.brand.trim(),
    model: draft.model.trim(),
    serialNumber: draft.serialNumber?.trim() || undefined,
    notes: draft.notes?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  await db.equipment.add(equipment);
  await queueChange({
    tenantId,
    entity: "equipment",
    entityId: equipment.id,
    operation: "create",
    payload: equipment,
  });

  return equipment;
}

export async function updateEquipment(
  id: string,
  draft: EquipmentDraft,
): Promise<Equipment> {
  const db = getDb();
  const current = await db.equipment.get(id);
  if (!current) {
    throw new Error("El equipo no existe.");
  }

  const updated: Equipment = {
    ...current,
    customerId: draft.customerId || current.customerId,
    brand: draft.brand.trim(),
    model: draft.model.trim(),
    serialNumber: draft.serialNumber?.trim() || undefined,
    notes: draft.notes?.trim() || undefined,
    updatedAt: nowIso(),
  };

  await db.equipment.put(updated);
  await queueChange({
    tenantId: updated.tenantId,
    entity: "equipment",
    entityId: updated.id,
    operation: "update",
    payload: updated,
  });

  return updated;
}
