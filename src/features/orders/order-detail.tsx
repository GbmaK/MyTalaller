"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import {
  calculateIva,
  formatCLP,
  formatDate,
  formatDateTime,
  formatNumber,
  marginPercent,
  whatsAppLink,
} from "@/lib/format";
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_META,
  isOpenOrder,
  nextOrderStatus,
  type OrderStatus,
  type ServiceOrderWithRelations,
} from "@/types/domain";
import { useInventory } from "@/features/inventory/use-inventory";
import {
  addOrderPhoto,
  deleteOrderPhoto,
  removeOrderItem,
  updateOrderStatus,
} from "./order-actions";
import { useOrder, useOrderPhotos } from "./use-orders";
import { AddPartModal } from "./add-part-modal";
import { OrderEditForm } from "./order-edit-form";

async function compressImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });

  return new Promise<string>((resolve) => {
    const image = new Image();
    image.onload = () => {
      const maxSide = 1280;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext("2d");
      if (!context) {
        resolve(dataUrl);
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

function orderTotals(order: ServiceOrderWithRelations): {
  partsCharged: number;
  partsCost: number;
  cost: number;
  margin: number;
  marginPct: number;
} {
  const partsCharged = order.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const partsCost = order.items.reduce(
    (sum, item) => sum + item.unitCost * item.quantity,
    0,
  );
  const cost = order.laborCost + partsCost;
  const margin = order.total - cost;
  return {
    partsCharged,
    partsCost,
    cost,
    margin,
    marginPct: marginPercent(order.total, margin),
  };
}

function StatusFlow({ status }: { status: OrderStatus }) {
  if (status === "cancelado") {
    return (
      <Badge className="border-red-200 bg-red-50 text-red-700">
        Orden cancelada
      </Badge>
    );
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(status);

  return (
    <ol className="flex flex-wrap items-center gap-1.5">
      {ORDER_STATUS_FLOW.map((step, index) => {
        const meta = ORDER_STATUS_META[step];
        const done = index < currentIndex;
        const current = index === currentIndex;
        return (
          <li key={step} className="flex items-center gap-1.5">
            <span
              className={
                current
                  ? "inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800"
                  : done
                    ? "inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700"
                    : "inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-400"
              }
            >
              {done ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${current ? meta.dotClassName : "bg-slate-300"}`}
                />
              )}
              {meta.label}
            </span>
            {index < ORDER_STATUS_FLOW.length - 1 ? (
              <span className="text-[10px] text-slate-300">›</span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export function OrderDetailView({ orderId }: { orderId: string }) {
  const order = useOrder(orderId);
  const photos = useOrderPhotos(orderId);
  const inventory = useInventory(order?.tenantId);
  const fileRef = useRef<HTMLInputElement>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [addPartOpen, setAddPartOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busyStatus, setBusyStatus] = useState<OrderStatus | null>(null);
  const [uploading, setUploading] = useState(false);

  if (order === undefined) {
    return (
      <div className="space-y-6">
        <div className="h-16 animate-pulse rounded-2xl bg-slate-200/60" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-200/60" />
      </div>
    );
  }

  if (order === null) {
    return (
      <EmptyState
        icon={<XCircle className="h-5 w-5" />}
        title="Orden no encontrada"
        description="La orden que buscas no existe o fue eliminada."
        action={<ButtonLink href="/ordenes">Volver a órdenes</ButtonLink>}
      />
    );
  }

  const inventoryMap = new Map((inventory ?? []).map((item) => [item.id, item]));
  const totals = orderTotals(order);
  const iva = calculateIva(order.total);
  const next = nextOrderStatus(order.status);
  const nextMeta = next ? ORDER_STATUS_META[next] : null;
  const overdue =
    order.promisedAt !== undefined &&
    order.promisedAt < new Date().toISOString().slice(0, 10) &&
    order.status !== "entregado" &&
    order.status !== "cancelado";
  const closed = order.status === "entregado" || order.status === "cancelado";
  const equipment = order.equipment
    ? `${order.equipment.brand} ${order.equipment.model}`
    : "Equipo sin registrar";

  const readyMessage =
    `Hola ${order.customer.name}, tu equipo ${equipment} está listo para retirar en el taller. ` +
    `Orden #${order.number}. Total: ${formatCLP(order.total)}. ¡Te esperamos!`;

  async function changeStatus(status: OrderStatus) {
    setBusyStatus(status);
    try {
      await updateOrderStatus(orderId, status);
      toast.success(`Estado actualizado: ${ORDER_STATUS_META[status].label}`);
    } catch (statusError) {
      toast.error(
        statusError instanceof Error
          ? statusError.message
          : "No se pudo actualizar el estado.",
      );
    } finally {
      setBusyStatus(null);
    }
  }

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const compressed = await compressImage(file);
        await addOrderPhoto(orderId, compressed, file.name);
      }
      toast.success(
        files.length === 1 ? "Foto agregada" : `${files.length} fotos agregadas`,
      );
    } catch (photoError) {
      toast.error(
        photoError instanceof Error
          ? photoError.message
          : "No se pudo guardar la foto.",
      );
    } finally {
      setUploading(false);
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  }

  async function handleRemoveItem(orderItemId: string) {
    try {
      await removeOrderItem(orderItemId);
      toast.success("Repuesto quitado; el stock fue repuesto.");
    } catch (itemError) {
      toast.error(
        itemError instanceof Error
          ? itemError.message
          : "No se pudo quitar el repuesto.",
      );
    }
  }

  async function handleDeletePhoto(photoId: string) {
    try {
      await deleteOrderPhoto(photoId);
      toast.success("Foto eliminada");
    } catch {
      toast.error("No se pudo eliminar la foto.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/ordenes"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a órdenes
        </Link>
      </div>

      <PageHeader
        eyebrow={`Orden #${order.number}`}
        title={`${order.customer.name} · ${equipment}`}
        description={
          order.intakeNotes ??
          "Sin notas de ingreso registradas para esta orden."
        }
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
            {order.status === "listo" ? (
              <a
                href={whatsAppLink(order.customer.phone, readyMessage)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-500"
              >
                <MessageCircle className="h-4 w-4" />
                Avisar por WhatsApp
              </a>
            ) : null}
            {next && nextMeta ? (
              <Button
                onClick={() => changeStatus(next)}
                disabled={busyStatus !== null}
              >
                <CheckCircle2 className="h-4 w-4" />
                {busyStatus === next
                  ? "Actualizando..."
                  : `Pasar a ${nextMeta.label}`}
              </Button>
            ) : null}
          </>
        }
      />

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <StatusFlow status={order.status} />
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            {!closed ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setCancelOpen(true)}
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancelar orden
              </Button>
            ) : null}
          </div>
        </div>

        {isOpenOrder(order.status) ? (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
            <span className="mr-1 self-center text-[11px] font-medium text-slate-500">
              Cambiar a:
            </span>
            {ORDER_STATUS_FLOW.filter((status) => status !== order.status).map(
              (status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => changeStatus(status)}
                  disabled={busyStatus !== null}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800 disabled:opacity-50"
                >
                  {ORDER_STATUS_META[status].label}
                </button>
              ),
            )}
          </div>
        ) : null}
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Repuestos usados</CardTitle>
                <p className="text-xs text-slate-500">
                  Al agregar un repuesto, el stock se descuenta del inventario.
                </p>
              </div>
              {!closed ? (
                <Button size="sm" onClick={() => setAddPartOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Agregar
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="p-0">
              {order.items.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    Esta orden todavía no tiene repuestos
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Agrega los repuestos usados para descontar stock y calcular
                    el margen real.
                  </p>
                  {!closed ? (
                    <Button
                      size="sm"
                      className="mt-3"
                      onClick={() => setAddPartOpen(true)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar repuesto
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-2.5 font-medium">Repuesto</th>
                        <th className="px-3 py-2.5 font-medium">Cant.</th>
                        <th className="px-3 py-2.5 font-medium">Precio</th>
                        <th className="px-3 py-2.5 font-medium">Costo</th>
                        <th className="px-3 py-2.5 font-medium">Subtotal</th>
                        <th className="px-5 py-2.5 text-right font-medium" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {order.items.map((item) => {
                        const inventoryItem = inventoryMap.get(
                          item.inventoryItemId,
                        );
                        return (
                          <tr key={item.id}>
                            <td className="px-5 py-3">
                              <p className="font-medium text-slate-800">
                                {inventoryItem?.name ??
                                  "Repuesto eliminado del inventario"}
                              </p>
                              <p className="font-mono text-[11px] text-slate-400">
                                {inventoryItem?.sku ?? item.inventoryItemId}
                              </p>
                            </td>
                            <td className="px-3 py-3 text-slate-600">
                              {formatNumber(item.quantity)}
                            </td>
                            <td className="px-3 py-3 text-slate-600">
                              {formatCLP(item.unitPrice)}
                            </td>
                            <td className="px-3 py-3 text-slate-500">
                              {formatCLP(item.unitCost)}
                            </td>
                            <td className="px-3 py-3 font-medium text-slate-900">
                              {formatCLP(item.unitPrice * item.quantity)}
                            </td>
                            <td className="px-5 py-3 text-right">
                              {!closed ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Quitar repuesto"
                                  onClick={() => handleRemoveItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Fotos de ingreso</CardTitle>
                <p className="text-xs text-slate-500">
                  Respaldan el estado de la máquina cuando llegó al taller.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                <Camera className="h-3.5 w-3.5" />
                {uploading ? "Subiendo..." : "Agregar foto"}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhoto}
              />
            </CardHeader>
            <CardContent>
              {photos === undefined ? (
                <p className="text-xs text-slate-500">Cargando fotos...</p>
              ) : photos.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
                  <Camera className="mx-auto h-5 w-5 text-slate-300" />
                  <p className="mt-2 text-xs text-slate-500">
                    Sin fotos. Toma una foto al recibir la máquina para evitar
                    disputas.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative overflow-hidden rounded-xl border border-slate-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.dataUrl}
                        alt={photo.caption ?? "Foto de ingreso"}
                        className="h-32 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="absolute right-1.5 top-1.5 rounded-lg bg-slate-950/60 p-1.5 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                        aria-label="Eliminar foto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen económico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Mano de obra</span>
                <span className="font-medium text-slate-900">
                  {formatCLP(order.laborPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Repuestos cobrados</span>
                <span className="font-medium text-slate-900">
                  {formatCLP(totals.partsCharged)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                <span className="font-medium text-slate-700">Total</span>
                <span className="text-base font-semibold text-slate-900">
                  {formatCLP(order.total)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Neto + IVA 19%</span>
                <span>
                  {formatCLP(iva.net)} + {formatCLP(iva.iva)}
                </span>
              </div>

              <div className="mt-3 space-y-2.5 rounded-xl bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Costo repuestos</span>
                  <span className="text-slate-700">
                    {formatCLP(totals.partsCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Costo mano de obra</span>
                  <span className="text-slate-700">
                    {formatCLP(order.laborCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2.5">
                  <span className="text-xs font-medium text-slate-600">
                    Margen
                  </span>
                  <span
                    className={
                      totals.margin >= 0
                        ? "text-sm font-semibold text-emerald-600"
                        : "text-sm font-semibold text-red-600"
                    }
                  >
                    {formatCLP(totals.margin)} · {totals.marginPct}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datos del trabajo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Cliente
                </p>
                <Link
                  href={`/clientes/${order.customerId}`}
                  className="font-medium text-slate-900 hover:text-amber-700"
                >
                  {order.customer.name}
                </Link>
                <p className="text-xs text-slate-500">{order.customer.phone}</p>
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Equipo
                </p>
                <p className="text-slate-800">{equipment}</p>
                {order.equipment?.serialNumber ? (
                  <p className="text-xs text-slate-500">
                    Serie {order.equipment.serialNumber}
                  </p>
                ) : null}
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Promesa de entrega
                </p>
                <p
                  className={
                    overdue
                      ? "font-medium text-red-600"
                      : "text-slate-800"
                  }
                >
                  {formatDate(order.promisedAt)}
                  {overdue ? " · Atrasada" : ""}
                </p>
              </div>

              {order.deliveredAt ? (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Entregado
                  </p>
                  <p className="text-slate-800">
                    {formatDateTime(order.deliveredAt)}
                  </p>
                </div>
              ) : null}

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Diagnóstico
                </p>
                <p className="whitespace-pre-line text-slate-700">
                  {order.diagnosis ?? "Sin diagnóstico registrado."}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                Creada {formatDateTime(order.createdAt)} · Actualizada{" "}
                {formatDateTime(order.updatedAt)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {editOpen ? (
        <OrderEditForm
          order={order}
          onClose={() => setEditOpen(false)}
          onSaved={() => setEditOpen(false)}
        />
      ) : null}

      {addPartOpen ? (
        <AddPartModal
          orderId={order.id}
          tenantId={order.tenantId}
          onClose={() => setAddPartOpen(false)}
          onAdded={() => setAddPartOpen(false)}
        />
      ) : null}

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancelar orden"
        description="Esta acción devuelve los repuestos al stock y no se puede deshacer."
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={busyStatus !== null}
            >
              Volver
            </Button>
            <Button
              variant="danger"
              disabled={busyStatus !== null}
              onClick={async () => {
                await changeStatus("cancelado");
                setCancelOpen(false);
              }}
            >
              {busyStatus === "cancelado" ? "Cancelando..." : "Sí, cancelar"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          La orden <strong>#{order.number}</strong> de{" "}
          <strong>{order.customer.name}</strong> quedará cancelada. Los{" "}
          {order.items.length} repuesto
          {order.items.length === 1 ? "" : "s"} usados volverán al inventario.
        </p>
      </Modal>
    </div>
  );
}
