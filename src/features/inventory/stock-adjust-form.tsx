"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { InventoryItem } from "@/types/domain";
import { setInventoryStock } from "./inventory-actions";

export function StockAdjustForm({
  item,
  onClose,
  onSaved,
}: {
  item: InventoryItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [stock, setStock] = useState(String(item.stock));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = Number(stock.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Ingresa un stock válido (mayor o igual a 0).");
      return;
    }

    setSaving(true);
    try {
      await setInventoryStock(item.id, parsed);
      toast.success("Stock actualizado");
      onSaved();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo actualizar el stock.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Ajustar stock"
      description={`${item.name} · ${item.sku}`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="stock-form" disabled={saving}>
            {saving ? "Guardando..." : "Guardar stock"}
          </Button>
        </>
      }
    >
      <form id="stock-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
          Stock actual:{" "}
          <span className="font-semibold text-slate-900">{item.stock}</span>{" "}
          {item.unit}. Mínimo:{" "}
          <span className="font-semibold text-slate-900">{item.minStock}</span>.
        </div>

        <Field
          label="Nuevo stock"
          hint="Usa este ajuste después de contar físicamente el estante."
        >
          <Input
            type="number"
            min="0"
            step="any"
            value={stock}
            onChange={(event) => setStock(event.target.value)}
            autoFocus
          />
        </Field>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
