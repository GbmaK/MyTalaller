"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { InventoryItem, InventoryUnit } from "@/types/domain";
import {
  createInventoryItem,
  updateInventoryItem,
  type InventoryItemDraft,
} from "./inventory-actions";

interface FormState {
  sku: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  unit: InventoryUnit;
  costPrice: string;
  salePrice: string;
  stock: string;
  minStock: string;
  location: string;
  barcode: string;
}

const emptyForm: FormState = {
  sku: "",
  name: "",
  category: "",
  brand: "",
  model: "",
  unit: "unidad",
  costPrice: "",
  salePrice: "",
  stock: "0",
  minStock: "0",
  location: "",
  barcode: "",
};

function toForm(item?: InventoryItem): FormState {
  if (!item) return emptyForm;
  return {
    sku: item.sku,
    name: item.name,
    category: item.category,
    brand: item.brand ?? "",
    model: item.model ?? "",
    unit: item.unit,
    costPrice: String(item.costPrice),
    salePrice: String(item.salePrice),
    stock: String(item.stock),
    minStock: String(item.minStock),
    location: item.location ?? "",
    barcode: item.barcode ?? "",
  };
}

function parseNumber(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDraft(form: FormState): InventoryItemDraft {
  return {
    sku: form.sku,
    name: form.name,
    category: form.category,
    brand: form.brand,
    model: form.model,
    unit: form.unit,
    costPrice: parseNumber(form.costPrice),
    salePrice: parseNumber(form.salePrice),
    stock: parseNumber(form.stock),
    minStock: parseNumber(form.minStock),
    location: form.location,
    barcode: form.barcode,
  };
}

export function InventoryItemForm({
  tenantId,
  item,
  onClose,
  onSaved,
}: {
  tenantId: string;
  item?: InventoryItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => toForm(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.sku.trim()) {
      setError("El SKU es obligatorio.");
      return;
    }
    if (!form.name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    setSaving(true);
    try {
      const draft = toDraft(form);
      if (item) {
        await updateInventoryItem(item.id, draft);
        toast.success("Repuesto actualizado");
      } else {
        await createInventoryItem(tenantId, draft);
        toast.success("Repuesto creado");
      }
      onSaved();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "No se pudo guardar el repuesto.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={item ? "Editar repuesto" : "Nuevo repuesto"}
      description="El stock se descuenta automáticamente cuando el repuesto se usa en una orden."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="inventory-form" disabled={saving}>
            {saving ? "Guardando..." : item ? "Guardar cambios" : "Crear repuesto"}
          </Button>
        </>
      }
    >
      <form
        id="inventory-form"
        onSubmit={handleSubmit}
        className="grid gap-4 sm:grid-cols-2"
      >
        <Field label="SKU *">
          <Input
            value={form.sku}
            onChange={(event) => update("sku", event.target.value)}
            placeholder="CAD-325-72"
            autoFocus
          />
        </Field>
        <Field label="Nombre *">
          <Input
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder='Cadena 325" 72 eslabones'
          />
        </Field>
        <Field label="Categoría">
          <Input
            value={form.category}
            onChange={(event) => update("category", event.target.value)}
            placeholder="Cadena"
          />
        </Field>
        <Field label="Unidad">
          <Select
            value={form.unit}
            onChange={(event) =>
              update("unit", event.target.value as InventoryUnit)
            }
          >
            <option value="unidad">Unidad</option>
            <option value="litro">Litro</option>
            <option value="metro">Metro</option>
            <option value="kit">Kit</option>
            <option value="otro">Otro</option>
          </Select>
        </Field>
        <Field label="Marca">
          <Input
            value={form.brand}
            onChange={(event) => update("brand", event.target.value)}
            placeholder="Oregon"
          />
        </Field>
        <Field label="Modelo">
          <Input
            value={form.model}
            onChange={(event) => update("model", event.target.value)}
            placeholder="325-72"
          />
        </Field>
        <Field label="Costo (CLP)">
          <Input
            type="number"
            min="0"
            step="1"
            value={form.costPrice}
            onChange={(event) => update("costPrice", event.target.value)}
            placeholder="12000"
          />
        </Field>
        <Field label="Precio de venta (CLP)">
          <Input
            type="number"
            min="0"
            step="1"
            value={form.salePrice}
            onChange={(event) => update("salePrice", event.target.value)}
            placeholder="18990"
          />
        </Field>
        <Field label="Stock actual">
          <Input
            type="number"
            min="0"
            step="any"
            value={form.stock}
            onChange={(event) => update("stock", event.target.value)}
          />
        </Field>
        <Field label="Stock mínimo">
          <Input
            type="number"
            min="0"
            step="any"
            value={form.minStock}
            onChange={(event) => update("minStock", event.target.value)}
          />
        </Field>
        <Field label="Ubicación">
          <Input
            value={form.location}
            onChange={(event) => update("location", event.target.value)}
            placeholder="Estante A3"
          />
        </Field>
        <Field label="Código de barras">
          <Input
            value={form.barcode}
            onChange={(event) => update("barcode", event.target.value)}
            placeholder="7801234567890"
          />
        </Field>

        {error ? (
          <p className="sm:col-span-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
