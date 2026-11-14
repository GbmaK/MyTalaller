"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { daysFromToday } from "@/lib/format";
import { useCustomers, useEquipmentByCustomer } from "@/features/customers/use-customers";
import { createOrder } from "./order-actions";

function parseNumber(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function OrderForm({
  tenantId,
  onClose,
  onCreated,
}: {
  tenantId: string;
  onClose: () => void;
  onCreated: (orderId: string) => void;
}) {
  const customers = useCustomers(tenantId);
  const [customerId, setCustomerId] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const equipment = useEquipmentByCustomer(customerId || undefined);
  const [intakeNotes, setIntakeNotes] = useState("");
  const [promisedAt, setPromisedAt] = useState(daysFromToday(3));
  const [laborPrice, setLaborPrice] = useState("0");
  const [laborCost, setLaborCost] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const noCustomers = customers !== undefined && customers.length === 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!customerId) {
      setError("Selecciona un cliente.");
      return;
    }

    setSaving(true);
    try {
      const order = await createOrder(tenantId, {
        customerId,
        equipmentId: equipmentId || undefined,
        intakeNotes,
        laborPrice: parseNumber(laborPrice),
        laborCost: parseNumber(laborCost),
        promisedAt: promisedAt || undefined,
      });
      toast.success(`Orden #${order.number} creada`);
      onCreated(order.id);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo crear la orden.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Nueva orden de servicio"
      description="Registra la máquina que llega al taller. Los repuestos y la mano de obra se pueden ajustar después."
      size="lg"
      footer={
        noCustomers ? (
          <>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <ButtonLink href="/clientes">Crear cliente</ButtonLink>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="order-form"
              disabled={saving || !customerId}
            >
              {saving ? "Creando..." : "Crear orden"}
            </Button>
          </>
        )
      }
    >
      {noCustomers ? (
        <div className="space-y-3 py-4 text-center">
          <p className="text-sm font-medium text-slate-800">
            Todavía no tienes clientes
          </p>
          <p className="mx-auto max-w-sm text-xs text-slate-500">
            Crea un cliente primero para poder asociar la máquina y avisarle
            cuando esté lista.
          </p>
        </div>
      ) : (
        <form
          id="order-form"
          onSubmit={handleSubmit}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field label="Cliente *" className="sm:col-span-2">
            <Select
              value={customerId}
              onChange={(event) => {
                setCustomerId(event.target.value);
                setEquipmentId("");
              }}
              autoFocus
            >
              <option value="">
                {customers === undefined
                  ? "Cargando clientes..."
                  : "Selecciona un cliente"}
              </option>
              {(customers ?? []).map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} · {customer.phone}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Equipo"
            hint="Si no está registrado, puedes crear la orden sin equipo y agregarlo después."
            className="sm:col-span-2"
          >
            <Select
              value={equipmentId}
              onChange={(event) => setEquipmentId(event.target.value)}
              disabled={!customerId}
            >
              <option value="">Sin equipo registrado</option>
              {(equipment ?? []).map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.brand} {entry.model}
                  {entry.serialNumber ? ` · ${entry.serialNumber}` : ""}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Motivo / notas de ingreso" className="sm:col-span-2">
            <Textarea
              value={intakeNotes}
              onChange={(event) => setIntakeNotes(event.target.value)}
              placeholder="No enciende, el cliente ya cambió la bujía..."
            />
          </Field>

          <Field label="Promesa de entrega">
            <Input
              type="date"
              value={promisedAt}
              onChange={(event) => setPromisedAt(event.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Mano de obra (CLP)">
              <Input
                type="number"
                min="0"
                step="1"
                value={laborPrice}
                onChange={(event) => setLaborPrice(event.target.value)}
              />
            </Field>
            <Field label="Costo mano de obra">
              <Input
                type="number"
                min="0"
                step="1"
                value={laborCost}
                onChange={(event) => setLaborCost(event.target.value)}
              />
            </Field>
          </div>

          <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800 sm:col-span-2">
            El total se calcula con la mano de obra más los repuestos que
            agregues en el detalle. El margen usa el costo interno de cada
            repuesto.
          </div>

          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700 sm:col-span-2">
              {error}
            </p>
          ) : null}
        </form>
      )}
    </Modal>
  );
}
