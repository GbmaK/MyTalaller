"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { Customer } from "@/types/domain";
import { createCustomer, updateCustomer } from "./customer-actions";

interface FormState {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

function toForm(customer?: Customer): FormState {
  return {
    name: customer?.name ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    address: customer?.address ?? "",
    notes: customer?.notes ?? "",
  };
}

export function CustomerForm({
  tenantId,
  customer,
  onClose,
  onSaved,
}: {
  tenantId: string;
  customer?: Customer;
  onClose: () => void;
  onSaved: (customer: Customer) => void;
}) {
  const [form, setForm] = useState<FormState>(() => toForm(customer));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("El nombre del cliente es obligatorio.");
      return;
    }
    if (!form.phone.trim()) {
      setError("El teléfono es obligatorio para poder avisar por WhatsApp.");
      return;
    }

    setSaving(true);
    try {
      const saved = customer
        ? await updateCustomer(customer.id, form)
        : await createCustomer(tenantId, form);
      toast.success(customer ? "Cliente actualizado" : "Cliente creado");
      onSaved(saved);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo guardar el cliente.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={customer ? "Editar cliente" : "Nuevo cliente"}
      description="El teléfono se usa para enviar el aviso de retiro por WhatsApp."
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="customer-form" disabled={saving}>
            {saving ? "Guardando..." : customer ? "Guardar cambios" : "Crear cliente"}
          </Button>
        </>
      }
    >
      <form
        id="customer-form"
        onSubmit={handleSubmit}
        className="grid gap-4 sm:grid-cols-2"
      >
        <Field label="Nombre *" className="sm:col-span-2">
          <Input
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="Pedro Muñoz"
            autoFocus
          />
        </Field>
        <Field label="Teléfono *" hint="Formato libre: +56 9 1234 5678">
          <Input
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
            placeholder="+56 9 8765 4321"
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="cliente@correo.cl"
          />
        </Field>
        <Field label="Dirección" className="sm:col-span-2">
          <Input
            value={form.address}
            onChange={(event) => update("address", event.target.value)}
            placeholder="Fundo El Maitén, Km 12"
          />
        </Field>
        <Field label="Notas" className="sm:col-span-2">
          <Textarea
            value={form.notes}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Preferencias, historial, condiciones de pago..."
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
