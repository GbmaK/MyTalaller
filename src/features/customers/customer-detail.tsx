"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  StickyNote,
  Wrench,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { formatCLP, formatDate, whatsAppLink } from "@/lib/format";
import { isOpenOrder, type Equipment } from "@/types/domain";
import { useOrders } from "@/features/orders/use-orders";
import { useCustomer, useEquipmentByCustomer } from "./use-customers";
import { CustomerForm } from "./customer-form";
import { EquipmentForm } from "./equipment-form";

export function CustomerDetailView({ customerId }: { customerId: string }) {
  const customer = useCustomer(customerId);
  const machines = useEquipmentByCustomer(customerId);
  const allOrders = useOrders(customer?.tenantId);

  const [editOpen, setEditOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<
    Equipment | undefined
  >(undefined);

  if (customer === undefined) {
    return (
      <div className="space-y-6">
        <div className="h-16 animate-pulse rounded-2xl bg-slate-200/60" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-200/60" />
      </div>
    );
  }

  if (customer === null) {
    return (
      <EmptyState
        icon={<Wrench className="h-5 w-5" />}
        title="Cliente no encontrado"
        description="El cliente que buscas no existe o fue eliminado."
        action={<ButtonLink href="/clientes">Volver a clientes</ButtonLink>}
      />
    );
  }

  const orders = (allOrders ?? []).filter(
    (order) => order.customerId === customer.id,
  );
  const openOrders = orders.filter((order) => isOpenOrder(order.status));
  const finishedOrders = orders.filter((order) => order.status === "entregado");
  const totalBilled = finishedOrders.reduce(
    (sum, order) => sum + order.total,
    0,
  );
  const lastOrder = orders[0];

  const message = `Hola ${customer.name}, te escribimos del taller.`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a clientes
        </Link>
      </div>

      <PageHeader
        eyebrow="Cliente"
        title={customer.name}
        description={customer.notes ?? "Sin notas registradas para este cliente."}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
            <a
              href={whatsAppLink(customer.phone, message)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-500"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
            <ButtonLink href="/ordenes">
              <Plus className="h-4 w-4" />
              Nueva orden
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Órdenes totales"
          value={String(orders.length)}
          hint={`${openOrders.length} abiertas`}
          icon={<Wrench className="h-4 w-4" />}
          tone="info"
        />
        <StatCard
          label="Equipos"
          value={String(machines?.length ?? 0)}
          hint="Máquinas registradas"
          icon={<Wrench className="h-4 w-4" />}
        />
        <StatCard
          label="Trabajos entregados"
          value={String(finishedOrders.length)}
          hint="Historial cerrado"
          icon={<ArrowRight className="h-4 w-4" />}
          tone="success"
        />
        <StatCard
          label="Total historial"
          value={formatCLP(totalBilled)}
          hint="Solo órdenes entregadas"
          icon={<StickyNote className="h-4 w-4" />}
          tone="default"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Equipos del cliente</CardTitle>
                <p className="text-xs text-slate-500">
                  Máquinas que se pueden asociar a una orden.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingEquipment(undefined);
                  setEquipmentOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent>
              {machines === undefined ? (
                <p className="text-xs text-slate-500">Cargando equipos...</p>
              ) : machines.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
                  <Wrench className="mx-auto h-5 w-5 text-slate-300" />
                  <p className="mt-2 text-xs text-slate-500">
                    Sin equipos registrados. Agrega la máquina para no tener que
                    escribirla en cada orden.
                  </p>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {machines.map((machine) => (
                    <div
                      key={machine.id}
                      className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {machine.brand} {machine.model}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {machine.serialNumber
                            ? `Serie ${machine.serialNumber}`
                            : "Sin número de serie"}
                        </p>
                        {machine.notes ? (
                          <p className="mt-1 text-[11px] text-slate-500">
                            {machine.notes}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Editar equipo"
                        onClick={() => {
                          setEditingEquipment(machine);
                          setEquipmentOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial de órdenes</CardTitle>
              <p className="text-xs text-slate-500">
                Todas las máquinas que este cliente trajo al taller.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {orders.length === 0 ? (
                <div className="px-5 py-8 text-center text-xs text-slate-500">
                  Este cliente todavía no tiene órdenes.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-sm">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-2.5 font-medium">Orden</th>
                        <th className="px-3 py-2.5 font-medium">Equipo</th>
                        <th className="px-3 py-2.5 font-medium">Estado</th>
                        <th className="px-3 py-2.5 font-medium">Entrega</th>
                        <th className="px-3 py-2.5 font-medium">Total</th>
                        <th className="px-5 py-2.5 text-right font-medium" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/60">
                          <td className="px-5 py-3">
                            <Link
                              href={`/ordenes/${order.id}`}
                              className="font-semibold text-slate-900 hover:text-amber-700"
                            >
                              #{order.number}
                            </Link>
                            <p className="text-[11px] text-slate-400">
                              {formatDate(order.createdAt)}
                            </p>
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            {order.equipment
                              ? `${order.equipment.brand} ${order.equipment.model}`
                              : "Sin equipo"}
                          </td>
                          <td className="px-3 py-3">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="px-3 py-3 text-slate-500">
                            {formatDate(order.promisedAt)}
                          </td>
                          <td className="px-3 py-3 font-medium text-slate-900">
                            {formatCLP(order.total)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Link
                              href={`/ordenes/${order.id}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                              aria-label={`Ver orden ${order.number}`}
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Teléfono
                  </p>
                  <p className="text-slate-800">{customer.phone}</p>
                </div>
              </div>
              {customer.email ? (
                <div className="flex items-start gap-2.5">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                      Email
                    </p>
                    <p className="break-all text-slate-800">{customer.email}</p>
                  </div>
                </div>
              ) : null}
              {customer.address ? (
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                      Dirección
                    </p>
                    <p className="text-slate-800">{customer.address}</p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Última actividad</CardTitle>
            </CardHeader>
            <CardContent>
              {lastOrder ? (
                <div className="space-y-2">
                  <p className="text-sm text-slate-700">
                    Orden{" "}
                    <Link
                      href={`/ordenes/${lastOrder.id}`}
                      className="font-semibold text-slate-900 hover:text-amber-700"
                    >
                      #{lastOrder.number}
                    </Link>
                  </p>
                  <StatusBadge status={lastOrder.status} />
                  <p className="text-xs text-slate-500">
                    Actualizada {formatDate(lastOrder.updatedAt)}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Sin actividad todavía.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {editOpen ? (
        <CustomerForm
          tenantId={customer.tenantId}
          customer={customer}
          onClose={() => setEditOpen(false)}
          onSaved={() => setEditOpen(false)}
        />
      ) : null}

      {equipmentOpen ? (
        <EquipmentForm
          key={editingEquipment?.id ?? "new"}
          tenantId={customer.tenantId}
          customerId={customer.id}
          equipment={editingEquipment}
          onClose={() => setEquipmentOpen(false)}
          onSaved={() => setEquipmentOpen(false)}
        />
      ) : null}
    </div>
  );
}
