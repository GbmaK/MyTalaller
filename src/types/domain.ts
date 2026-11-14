export type TenantPlan = "basic" | "pro" | "premium";

export type TenantStatus = "active" | "suspended";

export type UserRole = "owner" | "technician" | "super_admin";

export type InventoryUnit = "unidad" | "litro" | "metro" | "kit" | "otro";

export type OrderStatus =
  | "ingresado"
  | "diagnostico"
  | "esperando_repuesto"
  | "reparacion"
  | "listo"
  | "entregado"
  | "cancelado";

export type SyncOperation = "create" | "update" | "delete";

export interface Tenant {
  id: string;
  name: string;
  plan: TenantPlan;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Equipment {
  id: string;
  tenantId: string;
  customerId: string;
  brand: string;
  model: string;
  serialNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  tenantId: string;
  sku: string;
  barcode?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrder {
  id: string;
  tenantId: string;
  number: number;
  customerId: string;
  equipmentId?: string;
  status: OrderStatus;
  intakeNotes?: string;
  diagnosis?: string;
  laborPrice: number;
  laborCost: number;
  partsTotal: number;
  total: number;
  promisedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrderItem {
  id: string;
  tenantId: string;
  orderId: string;
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  createdAt: string;
}

export interface OrderPhoto {
  id: string;
  tenantId: string;
  orderId: string;
  dataUrl: string;
  caption?: string;
  createdAt: string;
}

export interface SyncQueueItem {
  id: string;
  tenantId: string;
  entity: string;
  entityId: string;
  operation: SyncOperation;
  payload: string;
  attempts: number;
  lastError?: string;
  createdAt: string;
}

export interface ServiceOrderWithRelations extends ServiceOrder {
  customer: Customer;
  equipment?: Equipment;
  items: ServiceOrderItem[];
}

export interface DashboardStats {
  lowStockCount: number;
  openOrdersCount: number;
  readyOrdersCount: number;
  inventoryCostValue: number;
  inventorySaleValue: number;
  monthMargin: number;
}

export interface OrderStatusMeta {
  label: string;
  description: string;
  badgeClassName: string;
  dotClassName: string;
}

export const ORDER_STATUSES: readonly OrderStatus[] = [
  "ingresado",
  "diagnostico",
  "esperando_repuesto",
  "reparacion",
  "listo",
  "entregado",
  "cancelado",
] as const;

export const OPEN_ORDER_STATUSES: readonly OrderStatus[] = [
  "ingresado",
  "diagnostico",
  "esperando_repuesto",
  "reparacion",
  "listo",
] as const;

export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  ingresado: {
    label: "Ingresado",
    description: "La máquina llegó al taller.",
    badgeClassName: "border-slate-200 bg-slate-100 text-slate-700",
    dotClassName: "bg-slate-400",
  },
  diagnostico: {
    label: "Diagnóstico",
    description: "Se está evaluando la falla.",
    badgeClassName: "border-sky-200 bg-sky-100 text-sky-700",
    dotClassName: "bg-sky-500",
  },
  esperando_repuesto: {
    label: "Esperando repuesto",
    description: "Falta un repuesto para continuar.",
    badgeClassName: "border-amber-200 bg-amber-100 text-amber-800",
    dotClassName: "bg-amber-500",
  },
  reparacion: {
    label: "Reparación",
    description: "Se está reparando la máquina.",
    badgeClassName: "border-violet-200 bg-violet-100 text-violet-700",
    dotClassName: "bg-violet-500",
  },
  listo: {
    label: "Listo para retirar",
    description: "La máquina está lista para el cliente.",
    badgeClassName: "border-emerald-200 bg-emerald-100 text-emerald-700",
    dotClassName: "bg-emerald-500",
  },
  entregado: {
    label: "Entregado",
    description: "El cliente retiró la máquina.",
    badgeClassName: "border-stone-200 bg-stone-100 text-stone-600",
    dotClassName: "bg-stone-400",
  },
  cancelado: {
    label: "Cancelado",
    description: "La orden fue cancelada.",
    badgeClassName: "border-red-200 bg-red-100 text-red-700",
    dotClassName: "bg-red-500",
  },
};

export const ORDER_STATUS_FLOW: readonly OrderStatus[] = [
  "ingresado",
  "diagnostico",
  "esperando_repuesto",
  "reparacion",
  "listo",
  "entregado",
] as const;

export function nextOrderStatus(status: OrderStatus): OrderStatus | null {
  const index = ORDER_STATUS_FLOW.indexOf(status);
  if (index === -1 || index === ORDER_STATUS_FLOW.length - 1) {
    return null;
  }
  return ORDER_STATUS_FLOW[index + 1] ?? null;
}

export function isOpenOrder(status: OrderStatus): boolean {
  return OPEN_ORDER_STATUSES.includes(status);
}
