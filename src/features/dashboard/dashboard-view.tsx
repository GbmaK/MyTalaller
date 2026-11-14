"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Package,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { useTenant } from "@/lib/hooks";
import { useInventory } from "@/features/inventory/use-inventory";
import { useOrders } from "@/features/orders/use-orders";
import {
  formatCLP,
  formatDate,
  isWithinLastDays,
  todayInputValue,
} from "@/lib/format";
import {
  ORDER_STATUS_META,
  isOpenOrder,
  type InventoryItem,
  type OrderStatus,
  type ServiceOrderWithRelations,
} from "@/types/domain";

const boardStatuses: OrderStatus[] = [
  "ingresado",
  "diagnostico",
  "esperando_repuesto",
  "reparacion",
  "listo",
];

function isOverdue(promisedAt?: string): boolean {
  if (!promisedAt) return false;
  return promisedAt < todayInputValue();
}

function OrderCard({ order }: { order: ServiceOrderWithRelations }) {
  const overdue = isOverdue(order.promisedAt) && order.status !== "entregado";
  const equipment = order.equipment
    ? `${order.equipment.brand} ${order.equipment.model}`
    : "Equipo sin registrar";

  return (
    <Link
      href={`/ordenes/${order.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-amber-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-slate-400">
          #{order.number}
        </span>
        <span className="text-[11px] font-medium text-slate-500">
          {formatCLP(order.total)}
        </span>
      </div>
      <p className="mt-1 truncate text-sm font-semibold text-slate-900">
        {order.customer.name}
      </p>
      <p className="truncate text-xs text-slate-500">{equipment}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span
          className={
            overdue
              ? "text-[11px] font-medium text-red-600"
              : "text-[11px] text-slate-400"
          }
        >
          {order.promisedAt
            ? `Entrega: ${formatDate(order.promisedAt)}`
            : "Sin fecha prometida"}
        </span>
        {overdue ? (
          <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
            Atrasada
          </span>
        ) : null}
      </div>
    </Link>
  );
}

function BoardColumn({
  status,
  orders,
}: {
  status: OrderStatus;
  orders: ServiceOrderWithRelations[];
}) {
  const meta = ORDER_STATUS_META[status];
  const columnOrders = orders
    .filter((order) => order.status === status)
    .sort((a, b) => {
      if (a.promisedAt && b.promisedAt) {
        return a.promisedAt.localeCompare(b.promisedAt);
      }
      if (a.promisedAt) return -1;
      if (b.promisedAt) return 1;
      return a.number - b.number;
    });

  return (
    <div className="flex min-w-[250px] flex-1 flex-col rounded-2xl border border-slate-200 bg-slate-100/60 p-2.5">
      <div className="flex items-center justify-between gap-2 px-1 pb-2">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${meta.dotClassName}`}
            aria-hidden
          />
          <h3 className="text-xs font-semibold text-slate-700">
            {meta.label}
          </h3>
        </div>
        <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
          {columnOrders.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {columnOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white/50 px-3 py-6 text-center text-[11px] text-slate-400">
            Sin órdenes
          </div>
        ) : (
          columnOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))
        )}
      </div>
    </div>
  );
}

function LowStockList({ items }: { items: InventoryItem[] }) {
  const lowStock = items
    .filter((item) => item.stock <= item.minStock)
    .sort((a, b) => a.stock - a.minStock - (b.stock - b.minStock))
    .slice(0, 6);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Repuestos por reponer</CardTitle>
          <p className="text-xs text-slate-500">
            Stock igual o bajo el mínimo.
          </p>
        </div>
        <Link
          href="/inventario"
          className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700"
        >
          Ver todo
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {lowStock.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-500">
            Todo el stock está sobre el mínimo.
          </p>
        ) : (
          lowStock.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-800">
                  {item.name}
                </p>
                <p className="text-[11px] text-slate-400">{item.sku}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-semibold text-slate-900">
                  {item.stock} / {item.minStock}
                </p>
                <p className="text-[10px] text-slate-400">stock / mínimo</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function MonthSummary({
  orders,
}: {
  orders: ServiceOrderWithRelations[];
}) {
  const monthOrders = orders.filter(
    (order) =>
      order.status !== "cancelado" && isWithinLastDays(order.createdAt, 30),
  );
  const revenue = monthOrders.reduce((sum, order) => sum + order.total, 0);
  const partsCost = monthOrders.reduce(
    (sum, order) =>
      sum +
      order.items.reduce(
        (itemsSum, item) => itemsSum + item.unitCost * item.quantity,
        0,
      ),
    0,
  );
  const laborCost = monthOrders.reduce(
    (sum, order) => sum + order.laborCost,
    0,
  );
  const margin = revenue - partsCost - laborCost;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen de 30 días</CardTitle>
        <p className="text-xs text-slate-500">
          Ingresos, costo y margen de los últimos 30 días.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Trabajos</span>
          <span className="font-semibold text-slate-900">
            {monthOrders.length}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Ingresos</span>
          <span className="font-semibold text-slate-900">
            {formatCLP(revenue)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Costo (repuestos + mano de obra)</span>
          <span className="font-semibold text-slate-900">
            {formatCLP(partsCost + laborCost)}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
          <span className="font-medium text-slate-700">Margen</span>
          <span
            className={
              margin >= 0
                ? "flex items-center gap-1 font-semibold text-emerald-600"
                : "flex items-center gap-1 font-semibold text-red-600"
            }
          >
            {margin >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {formatCLP(margin)}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          El margen es una estimación: ingresos menos el costo de los repuestos
          usados y la mano de obra registrada.
        </p>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-16 animate-pulse rounded-2xl bg-slate-200/60" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl bg-slate-200/60"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-slate-200/60" />
    </div>
  );
}

export function DashboardView() {
  const tenant = useTenant();
  const orders = useOrders(tenant?.id);
  const inventory = useInventory(tenant?.id);

  if (!tenant || !orders || !inventory) {
    return <DashboardSkeleton />;
  }

  const openOrders = orders.filter((order) => isOpenOrder(order.status));
  const readyOrders = orders.filter((order) => order.status === "listo");
  const lowStockCount = inventory.filter(
    (item) => item.stock <= item.minStock,
  ).length;
  const inventoryCostValue = inventory.reduce(
    (sum, item) => sum + item.costPrice * item.stock,
    0,
  );
  const monthOrders = orders.filter(
    (order) =>
      order.status !== "cancelado" && isWithinLastDays(order.createdAt, 30),
  );
  const monthMargin = monthOrders.reduce((sum, order) => {
    const partsCost = order.items.reduce(
      (itemsSum, item) => itemsSum + item.unitCost * item.quantity,
      0,
    );
    return sum + (order.total - order.laborCost - partsCost);
  }, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Resumen"
        title="Panel del taller"
        description={`Lo que está pasando hoy en ${tenant.name}.`}
        actions={
          <>
            <ButtonLink href="/inventario" variant="outline">
              <Package className="h-4 w-4" />
              Inventario
            </ButtonLink>
            <ButtonLink href="/ordenes">
              <Plus className="h-4 w-4" />
              Nueva orden
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Órdenes abiertas"
          value={String(openOrders.length)}
          hint={`${readyOrders.length} listas para retirar`}
          icon={<ClipboardList className="h-4 w-4" />}
          tone="info"
        />
        <StatCard
          label="Listas para retirar"
          value={String(readyOrders.length)}
          hint="Avisar al cliente"
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="success"
        />
        <StatCard
          label="Stock bajo"
          value={String(lowStockCount)}
          hint={`${inventory.length} repuestos en total`}
          icon={<AlertTriangle className="h-4 w-4" />}
          tone="warning"
        />
        <StatCard
          label="Valor del inventario"
          value={formatCLP(inventoryCostValue)}
          hint="Al costo"
          icon={<Package className="h-4 w-4" />}
          tone="default"
        />
        <StatCard
          label="Margen 30 días"
          value={formatCLP(monthMargin)}
          hint={`${monthOrders.length} trabajos`}
          icon={<TrendingUp className="h-4 w-4" />}
          tone={monthMargin >= 0 ? "success" : "danger"}
        />
      </div>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Tablero de máquinas
            </h2>
            <p className="text-xs text-slate-500">
              Arrastra la operación con el estado de cada trabajo.
            </p>
          </div>
          <Link
            href="/ordenes"
            className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700"
          >
            Ver todas
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {boardStatuses.map((status) => (
            <BoardColumn key={status} status={status} orders={orders} />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <LowStockList items={inventory} />
        <MonthSummary orders={orders} />
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-5 w-5" />}
          title="Todavía no hay órdenes"
          description="Crea la primera orden para empezar a registrar el trabajo del taller."
          action={
            <ButtonLink href="/ordenes">
              <Plus className="h-4 w-4" />
              Nueva orden
            </ButtonLink>
          }
        />
      ) : null}
    </div>
  );
}
