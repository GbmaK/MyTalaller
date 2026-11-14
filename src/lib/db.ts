import Dexie, { type Table } from "dexie";
import type {
  Customer,
  Equipment,
  InventoryItem,
  OrderPhoto,
  ServiceOrder,
  ServiceOrderItem,
  SyncQueueItem,
  Tenant,
} from "@/types/domain";

export class TallerDatabase extends Dexie {
  tenants!: Table<Tenant, string>;
  customers!: Table<Customer, string>;
  equipment!: Table<Equipment, string>;
  inventoryItems!: Table<InventoryItem, string>;
  serviceOrders!: Table<ServiceOrder, string>;
  serviceOrderItems!: Table<ServiceOrderItem, string>;
  orderPhotos!: Table<OrderPhoto, string>;
  syncQueue!: Table<SyncQueueItem, string>;

  constructor() {
    super("talleros-db");

    this.version(1).stores({
      tenants: "id, name, status",
      customers: "id, tenantId, name, phone, updatedAt",
      equipment: "id, tenantId, customerId, brand, model, serialNumber",
      inventoryItems:
        "id, tenantId, sku, barcode, name, category, stock, updatedAt, [tenantId+sku]",
      serviceOrders:
        "id, tenantId, number, customerId, equipmentId, status, promisedAt, updatedAt, [tenantId+status], [tenantId+number]",
      serviceOrderItems:
        "id, tenantId, orderId, inventoryItemId, [tenantId+orderId]",
      orderPhotos: "id, tenantId, orderId, [tenantId+orderId]",
      syncQueue: "id, tenantId, entity, entityId, createdAt",
    });
  }
}

let database: TallerDatabase | null = null;

export function getDb(): TallerDatabase {
  if (!database) {
    database = new TallerDatabase();
  }
  return database;
}

export async function resetDatabase(): Promise<void> {
  const db = getDb();
  await db.delete();
  database = new TallerDatabase();
  await database.open();
}
