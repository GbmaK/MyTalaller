"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Search, Users, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { useTenant } from "@/lib/hooks";
import { formatDate } from "@/lib/format";
import { isOpenOrder, type OrderStatus } from "@/types/domain";
import { useOrders } from "@/features/orders/use-orders";
import { useCustomers, useEquipment } from "./use-customers";
import { CustomerForm } from "./customer-form";

interface CustomerSummary {
  equipmentCount: number;
  openOrders: number;
  lastActivity?: string;
  lastStatus?: OrderStatus;
}

export function CustomersView() {
  const tenant = useTenant();
  const customers = useCustomers(tenant?.id);
  const equipment = useEquipment(tenant?.id);
  const orders = useOrders(tenant?.id);

  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const summaries = useMemo(() => {
    const map = new Map<string, CustomerSummary>();

    for (const customer of customers ?? []) {
      map.set(customer.id, { equipmentCount: 0, openOrders: 0 });
    }

    for (const machine of equipment ?? []) {
      const summary = map.get(machine.customerId);
      if (summary) summary.equipmentCount += 1;
    }

    for (const order of orders ?? []) {
      const summary = map.get(order.customerId);
      if (!summary) continue;
      if (isOpenOrder(order.status)) summary.openOrders += 1;
      if (
        !summary.lastActivity ||
        order.updatedAt.localeCompare(summary.lastActivity) > 0
      ) {
        summary.lastActivity = order.updatedAt;
        summary.lastStatus = order.status;
      }
    }

    return map;
  }, [customers, equipment, orders]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (customers ?? []).filter((customer) => {
      if (!normalized) return true;
      const haystack =
        `${customer.name} ${customer.phone} ${customer.email ?? ""} ${
          customer.address ?? ""
        }`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [customers, query]);

  if (!tenant || !customers || !equipment || !orders) {
    return (
      <div className="space-y-6">
        <div className="h-16 animate-pulse rounded-2xl bg-slate-200/60" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl bg-slate-200/60"
            />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-slate-200/60" />
      </div>
    );
  }

  const customersWithOpenOrders = customers.filter(
    (customer) => (summaries.get(customer.id)?.openOrders ?? 0) > 0,
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Clientes"
        title="Clientes y sus equipos"
        description="El historial de cada cliente y sus máquinas, en un solo lugar."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Clientes"
          value={String(customers.length)}
          hint="Registrados en el taller"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Equipos"
          value={String(equipment.length)}
          hint="Máquinas asociadas"
          icon={<Wrench className="h-4 w-4" />}
          tone="info"
        />
        <StatCard
          label="Con trabajo abierto"
          value={String(customersWithOpenOrders)}
          hint="Tienen una orden en curso"
          icon={<ArrowRight className="h-4 w-4" />}
          tone={customersWithOpenOrders > 0 ? "warning" : "success"}
        />
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, teléfono o dirección..."
              className="pl-9"
            />
          </div>
          <p className="text-xs text-slate-500">
            {filtered.length} de {customers.length} clientes
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Users className="h-5 w-5" />}
              title={
                customers.length === 0
                  ? "Todavía no hay clientes"
                  : "No encontramos clientes"
              }
              description={
                customers.length === 0
                  ? "Crea el primer cliente para poder registrar sus equipos y órdenes."
                  : "Prueba con otro nombre, teléfono o dirección."
              }
              action={
                customers.length === 0 ? (
                  <Button onClick={() => setFormOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Nuevo cliente
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setQuery("")}>
                    Limpiar búsqueda
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Teléfono</th>
                  <th className="px-4 py-3 font-medium">Equipos</th>
                  <th className="px-4 py-3 font-medium">Órdenes abiertas</th>
                  <th className="px-4 py-3 font-medium">Última actividad</th>
                  <th className="px-4 py-3 text-right font-medium">Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((customer) => {
                  const summary = summaries.get(customer.id);
                  return (
                    <tr key={customer.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <Link
                          href={`/clientes/${customer.id}`}
                          className="font-medium text-slate-900 hover:text-amber-700"
                        >
                          {customer.name}
                        </Link>
                        {customer.email ? (
                          <p className="text-[11px] text-slate-400">
                            {customer.email}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {customer.phone}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {summary?.equipmentCount ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        {(summary?.openOrders ?? 0) > 0 ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                            {summary?.openOrders} en curso
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(summary?.lastActivity)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Link
                            href={`/clientes/${customer.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            aria-label={`Ver ${customer.name}`}
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
        <CustomerForm
          tenantId={tenant.id}
          onClose={() => setFormOpen(false)}
          onSaved={() => setFormOpen(false)}
        />
      ) : null}
    </div>
  );
}
