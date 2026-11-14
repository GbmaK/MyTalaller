"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ClipboardList,
  Plus,
  Search,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/cn";
import { useTenant } from "@/lib/hooks";
import {
  formatCLP,
  formatDate,
  todayInputValue,
} from "@/lib/format";
import {
  isOpenOrder,
  type OrderStatus,
  type ServiceOrderWithRelations,
} from "@/types/domain";
import { useOrders } from "./use-orders";
import { OrderForm } from "./order-form";

type FilterValue = "all" | "open" | OrderStatus;

const tabs: Array<{ value: FilterValue; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "open", label: "Abiertas" },
  { value: "listo", label: "Listas" },
  { value: "entregado", label: "Entregadas" },
  { value: "cancelado", label: "Canceladas" },
];

function matchesFilter(
  order: ServiceOrderWithRelations,
  filter: FilterValue,
): boolean {
  if (filter === "all") return true;
  if (filter === "open") return isOpenOrder(order.status);
  return order.status === filter;
}

function orderMargin(order: ServiceOrderWithRelations): number {
  const partsCost = order.items.reduce(
    (sum, item) => sum + item.unitCost * item.quantity,
    0,
  );
  return order.total - order.laborCost - partsCost;
}

export function OrdersView() {
  const router = useRouter();
  const tenant = useTenant();
  const orders = useOrders(tenant?.id);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return (orders ?? []).filter((order) => {
      if (!matchesFilter(order, filter)) return false;
      if (!normalizedQuery) return true;
      const equipment = order.equipment
        ? `${order.equipment.brand} ${order.equipment.model} ${
            order.equipment.serialNumber ?? ""
          }`
        : "";
      const haystack =
        `${order.number} ${order.customer.name} ${order.customer.phone} ${equipment}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [orders, filter, query]);

  if (!tenant || !orders) {
    return (
      <div className="space-y-6">
        <div className="h-16 animate-pulse rounded-2xl bg-slate-200/60" />
        <div className="h-10 animate-pulse rounded-xl bg-slate-200/60" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-200/60" />
      </div>
    );
  }

  const counts = {
    all: orders.length,
    open: orders.filter((order) => isOpenOrder(order.status)).length,
    listo: orders.filter((order) => order.status === "listo").length,
    entregado: orders.filter((order) => order.status === "entregado").length,
    cancelado: orders.filter((order) => order.status === "cancelado").length,
  };

  const hasFilters = query.length > 0 || filter !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Órdenes de servicio"
        title="Máquinas en el taller"
        description="Cada orden sigue el flujo desde que ingresa la máquina hasta que el cliente la retira."
        actions={
          <>
            <ButtonLink href="/clientes" variant="outline">
              Ver clientes
            </ButtonLink>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Nueva orden
            </Button>
          </>
        }
      />

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
        {tabs.map((tab) => {
          const active = filter === tab.value;
          const count = counts[tab.value as keyof typeof counts] ?? 0;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px]",
                  active
                    ? "bg-white/15 text-white"
                    : "bg-slate-100 text-slate-500",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por número, cliente o equipo..."
              className="pl-9"
            />
          </div>
          <p className="text-xs text-slate-500">
            {filtered.length} de {orders.length} órdenes
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<ClipboardList className="h-5 w-5" />}
              title={
                orders.length === 0
                  ? "Todavía no hay órdenes"
                  : "No hay órdenes con este filtro"
              }
              description={
                orders.length === 0
                  ? "Crea la primera orden cuando llegue una máquina al taller."
                  : "Cambia el filtro o limpia la búsqueda."
              }
              action={
                orders.length === 0 ? (
                  <Button onClick={() => setFormOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Nueva orden
                  </Button>
                ) : hasFilters ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilter("all");
                      setQuery("");
                    }}
                  >
                    Limpiar filtros
                  </Button>
                ) : null
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Orden</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Equipo</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Entrega</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Margen</th>
                  <th className="px-4 py-3 text-right font-medium">Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((order) => {
                  const overdue =
                    order.promisedAt &&
                    order.promisedAt < todayInputValue() &&
                    order.status !== "entregado" &&
                    order.status !== "cancelado";
                  const margin = orderMargin(order);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <Link
                          href={`/ordenes/${order.id}`}
                          className="font-semibold text-slate-900 hover:text-amber-700"
                        >
                          #{order.number}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">
                          {order.customer.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {order.customer.phone}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {order.equipment
                          ? `${order.equipment.brand} ${order.equipment.model}`
                          : "Sin equipo"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            overdue
                              ? "text-xs font-medium text-red-600"
                              : "text-xs text-slate-500"
                          }
                        >
                          {order.promisedAt
                            ? formatDate(order.promisedAt)
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {formatCLP(order.total)}
                      </td>
                      <td className="px-4 py-3">
                        {order.status === "cancelado" ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          <span
                            className={
                              margin >= 0
                                ? "text-xs font-medium text-emerald-600"
                                : "text-xs font-medium text-red-600"
                            }
                          >
                            {formatCLP(margin)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Link
                            href={`/ordenes/${order.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            aria-label={`Ver orden ${order.number}`}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {formOpen ? (
        <OrderForm
          tenantId={tenant.id}
          onClose={() => setFormOpen(false)}
          onCreated={(orderId) => {
            setFormOpen(false);
            router.push(`/ordenes/${orderId}`);
          }}
        />
      ) : null}
    </div>
  );
}
