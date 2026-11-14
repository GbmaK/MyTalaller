"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { Equipment } from "@/types/domain";
import { createEquipment, updateEquipment } from "./customer-actions";

interface FormState {
  brand: string;
  model: string;
  serialNumber: string;
  notes: string;
}

function toForm(equipment?: Equipment): FormState {
  return {
    brand: equipment?.brand ?? "",
    model: equipment?.model ?? "",
    serialNumber: equipment?.serialNumber ?? "",
    notes: equipment?.notes ?? "",
  };
}

export function EquipmentForm({
  tenantId,
  customerId,
  equipment,
  onClose,
  onSaved,
}: {
  tenantId: string;
  customerId: string;
  equipment?: Equipment;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => toForm(equipment));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.brand.trim() || !form.model.trim()) {
      setError("La marca y el modelo son obligatorios.");
      return;
    }

    setSaving(true);
    try {
      if (equipment) {
        await updateEquipment(equipment.id, { customerId, ...form });
        toast.success("Equipo actualizado");
      } else {
        await createEquipment(tenantId, { customerId, ...form });
        toast.success("Equipo registrado");
      }
      onSaved();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo guardar el equipo.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={equipment ? "Editar equipo" : "Nuevo equipo"}
      description="Registra la máquina del cliente para asociarla a futuras órdenes."
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="equipment-form" disabled={saving}>
            {saving ? "Guardando..." : equipment ? "Guardar cambios" : "Registrar equipo"}
          </Button>
        </>
      }
    >
      <form
        id="equipment-form"
        onSubmit={handleSubmit}
        className="grid gap-4 sm:grid-cols-2"
      >
        <Field label="Marca *">
          <Input
            value={form.brand}
            onChange={(event) => update("brand", event.target.value)}
            placeholder="Stihl"
            autoFocus
          />
        </Field>
        <Field label="Modelo *">
          <Input
            value={form.model}
            onChange={(event) => update("model", event.target.value)}
            placeholder="MS 250"
          />
        </Field>
        <Field label="Número de serie" className="sm:col-span-2">
          <Input
            value={form.serialNumber}
            onChange={(event) => update("serialNumber", event.target.value)}
            placeholder="123456"
          />
        </Field>
        <Field label="Notas" className="sm:col-span-2">
          <Textarea
            value={form.notes}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Accesorios, estado, observaciones..."
          />
        </Field>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700 sm:col-span-2">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
