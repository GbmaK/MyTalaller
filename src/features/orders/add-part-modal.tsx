"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Package, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { formatCLP, formatNumber } from "@/lib/format";
import { useInventory } from "@/features/inventory/use-inventory";
import type { InventoryItem } from "@/types/domain";
import { addOrderItem } from "./order-actions";

function parseNumber(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function AddPartModal({
  orderId,
  tenantId,
  onClose,
  onAdded,
}: {
  orderId: string;
  tenantId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const items = useInventory(tenantId);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (items ?? [])
      .filter((item) => item.stock > 0)
      .filter((item) => {
        if (!normalized) return true;
        const haystack =
          `${item.name} ${item.sku} ${item.brand ?? ""} ${item.model ?? ""}`.toLowerCase();
        return haystack.includes(normalized);
      })
      .slice(0, 12);
  }, [items, query]);

  function select(item: InventoryItem) {
    setSelected(item);
    setQuantity("1");
    setUnitPrice(String(item.salePrice));
    setUnitCost(String(item.costPrice));
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) {
      setError("Selecciona un repuesto.");
      return;
    }

    const parsedQuantity = parseNumber(quantity);
    if (parsedQuantity <= 0) {
      setError("La cantidad debe ser mayor que cero.");
      return;
    }
    if (parsedQuantity > selected.stock) {
      setError(
        `Solo hay ${formatNumber(selected.stock)} ${selected.unit} disponibles.`,
      );
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await addOrderItem({
        orderId,
        inventoryItemId: selected.id,
        quantity: parsedQuantity,
        unitPrice: parseNumber(unitPrice),
        unitCost: parseNumber(unitCost),
      });
      toast.success("Repuesto agregado a la orden");
      onAdded();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo agregar el repuesto.",
      );
    } finally {
      setSaving(false);
    }
  }

  const lineTotal = parseNumber(quantity) * parseNumber(unitPrice);
  const lineCost = parseNumber(quantity) * parseNumber(unitCost);

  return (
    <Modal
      open
      onClose={onClose}
      title="Agregar repuesto"
      description="El stock se descuenta al agregar el repuesto a la orden."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="add-part-form"
            disabled={saving || !selected}
          >
            {saving ? "Agregando..." : "Agregar repuesto"}
          </Button>
        </>
      }
    >
      <form id="add-part-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, SKU, marca o modelo..."
            className="pl-9"
            autoFocus
          />
        </div>

        {items === undefined ? (
          <p className="py-6 text-center text-xs text-slate-500">
            Cargando inventario...
          </p>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
            <Package className="h-5 w-5 text-slate-300" />
            <p className="text-xs text-slate-500">
              No hay repuestos con stock que coincidan con la búsqueda.
            </p>
          </div>
        ) : (
          <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
            {results.map((item) => {
              const active = selected?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => select(item)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                    active
                      ? "border-amber-400 bg-amber-50"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {item.name}
                    </p>
                    <p className="font-mono text-[11px] text-slate-400">
                      {item.sku}
                      {item.location ? ` · ${item.location}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCLP(item.salePrice)}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Stock: {formatNumber(item.stock)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {selected ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <p className="text-xs font-medium text-slate-700">
              {selected.name} · stock disponible {formatNumber(selected.stock)}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <label className="space-y-1">
                <span className="text-[11px] font-medium text-slate-600">
                  Cantidad
                </span>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                />
              </label>
              <label className="space-y-1">
                <span className="text-[11px] font-medium text-slate-600">
                  Precio cobrado
                </span>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={unitPrice}
                  onChange={(event) => setUnitPrice(event.target.value)}
                />
              </label>
              <label className="space-y-1">
                <span className="text-[11px] font-medium text-slate-600">
                  Costo interno
                </span>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={unitCost}
                  onChange={(event) => setUnitCost(event.target.value)}
                />
              </label>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>
                Total línea:{" "}
                <span className="font-semibold text-slate-800">
                  {formatCLP(lineTotal)}
                </span>
              </span>
              <span>
                Margen línea:{" "}
                <span className="font-semibold text-slate-800">
                  {formatCLP(lineTotal - lineCost)}
                </span>
              </span>
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
