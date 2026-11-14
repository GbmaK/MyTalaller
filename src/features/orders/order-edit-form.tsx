"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { ServiceOrderWithRelations } from "@/types/domain";
import { updateOrder } from "./order-actions";

function parseNumber(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function OrderEditForm({
  order,
  onClose,
  onSaved,
}: {
  order: ServiceOrderWithRelations;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [intakeNotes, setIntakeNotes] = useState(order.intakeNotes ?? "");
  const [diagnosis, setDiagnosis] = useState(order.diagnosis ?? "");
  const [laborPrice, setLaborPrice] = useState(String(order.laborPrice));
  const [laborCost, setLaborCost] = useState(String(order.laborCost));
  const [promisedAt, setPromisedAt] = useState(order.promisedAt ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await updateOrder(order.id, {
        intakeNotes,
        diagnosis,
        laborPrice: parseNumber(laborPrice),
        laborCost: parseNumber(laborCost),
        promisedAt: promisedAt || undefined,
      });
      toast.success("Orden actualizada");
      onSaved();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo actualizar la orden.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Editar orden #${order.number}`}
      description="Actualiza el diagnóstico, la promesa y la mano de obra."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="order-edit-form" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </>
      }
    >
      <form
        id="order-edit-form"
        onSubmit={handleSubmit}
        className="grid gap-4 sm:grid-cols-2"
      >
        <Field label="Motivo / notas de ingreso" className="sm:col-span-2">
          <Textarea
            value={intakeNotes}
            onChange={(event) => setIntakeNotes(event.target.value)}
          />
        </Field>

        <Field label="Diagnóstico" className="sm:col-span-2">
          <Textarea
            value={diagnosis}
            onChange={(event) => setDiagnosis(event.target.value)}
            placeholder="Qué se encontró y qué se va a hacer..."
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

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700 sm:col-span-2">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
