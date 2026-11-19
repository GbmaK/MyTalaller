import { getDb, resetDatabase } from "@/lib/db";
import { daysFromToday, todayInputValue } from "@/lib/format";
import { isOpenOrder } from "@/types/domain";
import type {
  Customer,
  Equipment,
  InventoryItem,
  OrderStatus,
  ServiceOrder,
  ServiceOrderItem,
  Tenant,
} from "@/types/domain";

export const DEMO_TENANT_ID = "tenant-demo";

function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

const tenant: Tenant = {
  id: DEMO_TENANT_ID,
  name: "Taller Los Robles",
  plan: "pro",
  status: "active",
  createdAt: isoDaysAgo(120),
  updatedAt: isoDaysAgo(1),
};

const customers: Customer[] = [
  {
    id: "cust-1",
    tenantId: DEMO_TENANT_ID,
    name: "Pedro Muñoz",
    phone: "+56 9 8765 4321",
    address: "Fundo El Maitén, Km 12",
    notes: "Cliente recurrente. Prefiere que le avisen por WhatsApp.",
    createdAt: isoDaysAgo(90),
    updatedAt: isoDaysAgo(3),
  },
  {
    id: "cust-2",
    tenantId: DEMO_TENANT_ID,
    name: "María Soto",
    phone: "+56 9 7654 3210",
    address: "Los Aromos 145",
    notes: "Tiene dos motosierras Husqvarna.",
    createdAt: isoDaysAgo(80),
    updatedAt: isoDaysAgo(4),
  },
  {
    id: "cust-3",
    tenantId: DEMO_TENANT_ID,
    name: "Juan Pérez",
    phone: "+56 9 6543 2109",
    address: "Camino Viejo s/n",
    notes: "",
    createdAt: isoDaysAgo(60),
    updatedAt: isoDaysAgo(5),
  },
  {
    id: "cust-4",
    tenantId: DEMO_TENANT_ID,
    name: "Carolina Rivas",
    phone: "+56 9 5432 1098",
    address: "Pasaje Los Nogales 22",
    notes: "Compró una motosierra usada; revisar garantía.",
    createdAt: isoDaysAgo(45),
    updatedAt: isoDaysAgo(2),
  },
  {
    id: "cust-5",
    tenantId: DEMO_TENANT_ID,
    name: "Agrícola Los Aromos",
    phone: "+56 9 4321 0987",
    email: "compras@losaromos.cl",
    address: "Ruta 5 Sur, Km 340",
    notes: "Empresa. Facturar a nombre de Agrícola Los Aromos SpA.",
    createdAt: isoDaysAgo(30),
    updatedAt: isoDaysAgo(6),
  },
];

const equipment: Equipment[] = [
  {
    id: "eq-1",
    tenantId: DEMO_TENANT_ID,
    customerId: "cust-1",
    brand: "Stihl",
    model: "MS 250",
    serialNumber: "123456",
    notes: "Motosierra de uso particular.",
    createdAt: isoDaysAgo(90),
    updatedAt: isoDaysAgo(3),
  },
  {
    id: "eq-2",
    tenantId: DEMO_TENANT_ID,
    customerId: "cust-2",
    brand: "Husqvarna",
    model: "450",
    serialNumber: "987654",
    notes: "",
    createdAt: isoDaysAgo(80),
    updatedAt: isoDaysAgo(4),
  },
  {
    id: "eq-3",
    tenantId: DEMO_TENANT_ID,
    customerId: "cust-3",
    brand: "Stihl",
    model: "MS 180",
    serialNumber: "456789",
    notes: "",
    createdAt: isoDaysAgo(60),
    updatedAt: isoDaysAgo(5),
  },
  {
    id: "eq-4",
    tenantId: DEMO_TENANT_ID,
    customerId: "cust-4",
    brand: "Genérica",
    model: "5200",
    serialNumber: "321654",
    notes: "Sin manual.",
    createdAt: isoDaysAgo(45),
    updatedAt: isoDaysAgo(2),
  },
  {
    id: "eq-5",
    tenantId: DEMO_TENANT_ID,
    customerId: "cust-5",
    brand: "Stihl",
    model: "MS 361",
    serialNumber: "741852",
    notes: "Equipo de faena.",
    createdAt: isoDaysAgo(30),
    updatedAt: isoDaysAgo(6),
  },
  {
    id: "eq-6",
    tenantId: DEMO_TENANT_ID,
    customerId: "cust-1",
    brand: "Stihl",
    model: "FS 120",
    serialNumber: "963258",
    notes: "Desbrozadora.",
    createdAt: isoDaysAgo(70),
    updatedAt: isoDaysAgo(7),
  },
];

const inventory: InventoryItem[] = [
  {
    id: "inv-cad-325-72",
    tenantId: DEMO_TENANT_ID,
    sku: "CAD-325-72",
    barcode: "7801234567890",
    name: 'Cadena 325" 72 eslabones',
    category: "Cadena",
    brand: "Oregon",
    model: "325-72",
    unit: "unidad",
    costPrice: 12000,
    salePrice: 18990,
    stock: 4,
    minStock: 2,
    location: "Estante A3",
    createdAt: isoDaysAgo(100),
    updatedAt: isoDaysAgo(2),
  },
  {
    id: "inv-esp-18-325",
    tenantId: DEMO_TENANT_ID,
    sku: "ESP-18-325",
    name: 'Espada 18" paso 325',
    category: "Espada",
    brand: "Oregon",
    model: "18-325",
    unit: "unidad",
    costPrice: 18000,
    salePrice: 27990,
    stock: 2,
    minStock: 1,
    location: "Estante A4",
    createdAt: isoDaysAgo(100),
    updatedAt: isoDaysAgo(2),
  },
  {
    id: "inv-fil-001",
    tenantId: DEMO_TENANT_ID,
    sku: "FIL-001",
    barcode: "7809876543210",
    name: "Filtro de aire universal",
    category: "Filtro",
    brand: "Genérico",
    model: "Universal",
    unit: "unidad",
    costPrice: 2500,
    salePrice: 4990,
    stock: 10,
    minStock: 4,
    location: "Caja B1",
    createdAt: isoDaysAgo(95),
    updatedAt: isoDaysAgo(1),
  },
  {
    id: "inv-ace-2t-1l",
    tenantId: DEMO_TENANT_ID,
    sku: "ACE-2T-1L",
    name: "Aceite 2T 1 litro",
    category: "Insumo",
    brand: "Motul",
    model: "2T",
    unit: "litro",
    costPrice: 6500,
    salePrice: 9990,
    stock: 12,
    minStock: 6,
    location: "Estante C2",
    createdAt: isoDaysAgo(95),
    updatedAt: isoDaysAgo(1),
  },
  {
    id: "inv-buj-001",
    tenantId: DEMO_TENANT_ID,
    sku: "BUJ-001",
    name: "Bujía NGK BPMR7A",
    category: "Bujía",
    brand: "NGK",
    model: "BPMR7A",
    unit: "unidad",
    costPrice: 3200,
    salePrice: 5990,
    stock: 8,
    minStock: 3,
    location: "Caja B2",
    createdAt: isoDaysAgo(90),
    updatedAt: isoDaysAgo(1),
  },
  {
    id: "inv-car-001",
    tenantId: DEMO_TENANT_ID,
    sku: "CAR-001",
    name: "Carburador 5200",
    category: "Carburador",
    brand: "Genérico",
    model: "5200",
    unit: "unidad",
    costPrice: 22000,
    salePrice: 34990,
    stock: 1,
    minStock: 2,
    location: "Estante D1",
    createdAt: isoDaysAgo(85),
    updatedAt: isoDaysAgo(3),
  },
  {
    id: "inv-cad-3-8-64",
    tenantId: DEMO_TENANT_ID,
    sku: "CAD-3-8-64",
    name: 'Cadena 3/8" 64 eslabones',
    category: "Cadena",
    brand: "Stihl",
    model: "3/8-64",
    unit: "unidad",
    costPrice: 15000,
    salePrice: 22990,
    stock: 3,
    minStock: 2,
    location: "Estante A2",
    createdAt: isoDaysAgo(80),
    updatedAt: isoDaysAgo(4),
  },
  {
    id: "inv-esp-20-3-8",
    tenantId: DEMO_TENANT_ID,
    sku: "ESP-20-3-8",
    name: 'Espada 20" paso 3/8',
    category: "Espada",
    brand: "Stihl",
    model: "20-3/8",
    unit: "unidad",
    costPrice: 24000,
    salePrice: 36990,
    stock: 0,
    minStock: 1,
    location: "Estante A5",
    createdAt: isoDaysAgo(80),
    updatedAt: isoDaysAgo(4),
  },
  {
    id: "inv-fil-002",
    tenantId: DEMO_TENANT_ID,
    sku: "FIL-002",
    name: "Filtro de combustible",
    category: "Filtro",
    brand: "Genérico",
    model: "Universal",
    unit: "unidad",
    costPrice: 1800,
    salePrice: 3490,
    stock: 15,
    minStock: 5,
    location: "Caja B3",
    createdAt: isoDaysAgo(75),
    updatedAt: isoDaysAgo(1),
  },
  {
    id: "inv-ace-bar-1l",
    tenantId: DEMO_TENANT_ID,
    sku: "ACE-BAR-1L",
    name: "Aceite de cadena 1 litro",
    category: "Insumo",
    brand: "Husqvarna",
    model: "Bar",
    unit: "litro",
    costPrice: 4500,
    salePrice: 6990,
    stock: 9,
    minStock: 4,
    location: "Estante C1",
    createdAt: isoDaysAgo(75),
    updatedAt: isoDaysAgo(1),
  },
  {
    id: "inv-kit-mant-001",
    tenantId: DEMO_TENANT_ID,
    sku: "KIT-MANT-001",
    name: "Kit mantención básico",
    category: "Kit",
    brand: "Genérico",
    model: "Básico",
    unit: "kit",
    costPrice: 8000,
    salePrice: 13990,
    stock: 5,
    minStock: 2,
    location: "Estante E1",
    createdAt: isoDaysAgo(70),
    updatedAt: isoDaysAgo(2),
  },
  {
    id: "inv-bom-001",
    tenantId: DEMO_TENANT_ID,
    sku: "BOM-001",
    name: "Bomba de combustible",
    category: "Bomba",
    brand: "Genérico",
    model: "Universal",
    unit: "unidad",
    costPrice: 9500,
    salePrice: 15990,
    stock: 2,
    minStock: 1,
    location: "Estante D2",
    createdAt: isoDaysAgo(65),
    updatedAt: isoDaysAgo(2),
  },
];

interface OrderSeed {
  id: string;
  number: number;
  customerId: string;
  equipmentId: string;
  status: OrderStatus;
  intakeNotes: string;
  diagnosis?: string;
  laborPrice: number;
  laborCost: number;
  promisedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  items: Array<{ inventoryItemId: string; quantity: number }>;
}

const orderSeeds: OrderSeed[] = [
  {
    id: "order-1",
    number: 1001,
    customerId: "cust-1",
    equipmentId: "eq-1",
    status: "reparacion",
    intakeNotes: "No enciende. El cliente ya cambió la bujía.",
    diagnosis: "Carburador sucio y filtro obstruido.",
    laborPrice: 15000,
    laborCost: 8000,
    promisedAt: daysFromToday(2),
    createdAt: isoDaysAgo(3),
    items: [
      { inventoryItemId: "inv-fil-001", quantity: 1 },
      { inventoryItemId: "inv-buj-001", quantity: 1 },
    ],
  },
  {
    id: "order-2",
    number: 1002,
    customerId: "cust-2",
    equipmentId: "eq-2",
    status: "esperando_repuesto",
    intakeNotes: "Cadena cortada. Revisar espada y piñón.",
    diagnosis: "Espada desgastada; se pidió repuesto.",
    laborPrice: 12000,
    laborCost: 7000,
    promisedAt: daysFromToday(4),
    createdAt: isoDaysAgo(4),
    items: [{ inventoryItemId: "inv-esp-18-325", quantity: 1 }],
  },
  {
    id: "order-3",
    number: 1003,
    customerId: "cust-3",
    equipmentId: "eq-3",
    status: "listo",
    intakeNotes: "Mantención completa y afilado.",
    diagnosis: "Mantención realizada.",
    laborPrice: 18000,
    laborCost: 10000,
    promisedAt: daysFromToday(-1),
    createdAt: isoDaysAgo(6),
    items: [
      { inventoryItemId: "inv-kit-mant-001", quantity: 1 },
      { inventoryItemId: "inv-ace-2t-1l", quantity: 1 },
    ],
  },
  {
    id: "order-4",
    number: 1004,
    customerId: "cust-4",
    equipmentId: "eq-4",
    status: "ingresado",
    intakeNotes: "Se apaga al acelerar. Cliente pide diagnóstico.",
    laborPrice: 0,
    laborCost: 0,
    promisedAt: daysFromToday(3),
    createdAt: isoDaysAgo(1),
    items: [],
  },
  {
    id: "order-5",
    number: 1005,
    customerId: "cust-5",
    equipmentId: "eq-5",
    status: "diagnostico",
    intakeNotes: "Ruido en el motor. Equipo de faena.",
    laborPrice: 0,
    laborCost: 0,
    promisedAt: daysFromToday(2),
    createdAt: isoDaysAgo(2),
    items: [],
  },
  {
    id: "order-6",
    number: 1006,
    customerId: "cust-1",
    equipmentId: "eq-6",
    status: "entregado",
    intakeNotes: "No parte. Revisar bujía y combustible.",
    diagnosis: "Bujía defectuosa.",
    laborPrice: 10000,
    laborCost: 5000,
    promisedAt: daysFromToday(-5),
    deliveredAt: isoDaysAgo(4),
    createdAt: isoDaysAgo(8),
    items: [{ inventoryItemId: "inv-buj-001", quantity: 1 }],
  },
  {
    id: "order-7",
    number: 1007,
    customerId: "cust-2",
    equipmentId: "eq-2",
    status: "reparacion",
    intakeNotes: "Cambio de cadena por desgaste.",
    diagnosis: "Cadena y espada gastadas.",
    laborPrice: 8000,
    laborCost: 4000,
    promisedAt: daysFromToday(1),
    createdAt: isoDaysAgo(2),
    items: [{ inventoryItemId: "inv-cad-325-72", quantity: 1 }],
  },
  {
    id: "order-8",
    number: 1008,
    customerId: "cust-3",
    equipmentId: "eq-3",
    status: "cancelado",
    intakeNotes: "El cliente desistió de la reparación.",
    laborPrice: 0,
    laborCost: 0,
    createdAt: isoDaysAgo(9),
    items: [],
  },
];

function buildOrders(): {
  orders: ServiceOrder[];
  items: ServiceOrderItem[];
} {
  const orders: ServiceOrder[] = [];
  const items: ServiceOrderItem[] = [];

  for (const seed of orderSeeds) {
    const orderItems: ServiceOrderItem[] = seed.items.map((spec, index) => {
      const item = inventory.find((entry) => entry.id === spec.inventoryItemId);
      if (!item) {
        throw new Error(`Repuesto de demo no encontrado: ${spec.inventoryItemId}`);
      }
      return {
        id: `oi-${seed.number}-${index + 1}`,
        tenantId: DEMO_TENANT_ID,
        orderId: seed.id,
        inventoryItemId: item.id,
        quantity: spec.quantity,
        unitPrice: item.salePrice,
        unitCost: item.costPrice,
        createdAt: seed.createdAt,
      };
    });

    const partsTotal = orderItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    orders.push({
      id: seed.id,
      tenantId: DEMO_TENANT_ID,
      number: seed.number,
      customerId: seed.customerId,
      equipmentId: seed.equipmentId,
      status: seed.status,
      intakeNotes: seed.intakeNotes,
      diagnosis: seed.diagnosis,
      laborPrice: seed.laborPrice,
      laborCost: seed.laborCost,
      partsTotal,
      total: seed.laborPrice + partsTotal,
      promisedAt: seed.promisedAt,
      deliveredAt: seed.deliveredAt,
      createdAt: seed.createdAt,
      updatedAt: seed.createdAt,
    });

    items.push(...orderItems);
  }

  return { orders, items };
}

export interface SeedResult {
  /** true cuando la demo existía pero estaba vencida y se regeneró. */
  refreshed: boolean;
}

let seedPromise: Promise<SeedResult> | null = null;

async function insertDemoData(): Promise<void> {
  const db = getDb();
  const { orders, items } = buildOrders();

  await db.transaction(
    "rw",
    [
      db.tenants,
      db.customers,
      db.equipment,
      db.inventoryItems,
      db.serviceOrders,
      db.serviceOrderItems,
      db.orderPhotos,
    ],
    async () => {
      await db.tenants.add(tenant);
      await db.customers.bulkAdd(customers);
      await db.equipment.bulkAdd(equipment);
      await db.inventoryItems.bulkAdd(inventory);
      await db.serviceOrders.bulkAdd(orders);
      await db.serviceOrderItems.bulkAdd(items);
    },
  );
}

/**
 * La demo se considera vencida cuando ninguna orden abierta tiene una entrega
 * futura: el tablero se vería todo atrasado y dejaría de representar el taller.
 */
function isDemoStale(orders: ServiceOrder[]): boolean {
  const open = orders.filter((order) => isOpenOrder(order.status));
  if (open.length === 0) return false;

  const today = todayInputValue();
  return open.every((order) => !order.promisedAt || order.promisedAt < today);
}

async function runSeed(): Promise<SeedResult> {
  if (typeof window === "undefined") return { refreshed: false };

  const db = getDb();
  const existing = await db.tenants.count();

  if (existing === 0) {
    await insertDemoData();
    return { refreshed: false };
  }

  const orders = await db.serviceOrders
    .where("tenantId")
    .equals(DEMO_TENANT_ID)
    .toArray();

  if (!isDemoStale(orders)) return { refreshed: false };

  await resetDatabase();
  await insertDemoData();
  return { refreshed: true };
}

/**
 * Siembra la demo una sola vez. El lock evita que React StrictMode (o dos
 * pestañas) dispare dos inserciones concurrentes y provoque duplicados.
 * Si la demo quedó vencida, la regenera con fechas relativas a hoy.
 */
export function seedDatabase(): Promise<SeedResult> {
  if (!seedPromise) {
    seedPromise = runSeed().catch((error: unknown) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}

/** Borra la base local y vuelve a sembrar la demo desde cero. */
export async function reseedDemoDatabase(): Promise<SeedResult> {
  await resetDatabase();
  seedPromise = null;
  return seedDatabase();
}
