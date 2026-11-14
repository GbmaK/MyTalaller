"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Package,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StockBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { useTenant } from "@/lib/hooks";
import {
  formatCLP,
  formatNumber,
  pluralize,
} from "@/lib/format";
import type { InventoryItem, InventoryUnit } from "@/types/domain";
import { useInventory } from "./use-inventory";
import { InventoryItemForm } from "./inventory-form";
import { StockAdjustForm } from "./stock-adjust-form";
import { ImportInventoryModal } from "./import-inventory-modal";

const unitLabel: Record<InventoryUnit, string> = {
  unidad: "unid.",
  litro: "L",
  metro: "m",
  kit: "kit",
  otro: "—",
};

export function InventoryView() {
  const tenant = useTenant();
  const items = useInventory(tenant?.id);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | undefined>(undefined);
  const [stockItem, setStockItem] = useState<InventoryItem | undefined>(
    undefined,
  );
  const [importOpen, setImportOpen] = useState(false);

  const categories = useMemo(() => {
    const unique = new Set((items ?? []).map((item) => item.category));
    return Array.from(unique).sort((a, b) => a.localeCompare(b, "es"));
  }, [items]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return (items ?? []).filter((item) => {
      const haystack =
        `${item.name} ${item.sku} ${item.brand ?? ""} ${
          item.barcode ?? ""
        }`.toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 || haystack.includes(normalizedQuery);
      const matchesCategory =
        category === "all" || item.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [items, query, category]);

  if (!tenant || !items) {
    return (
      <div className="space-y-6">
        <div className="h-16 animate-pulse rounded-2xl bg-slate-200/60" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
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

  const lowStockCount = items.filter(
    (item) => item.stock <= item.minStock,
  ).length;
  const costValue = items.reduce(
    (sum, item) => sum + item.costPrice * item.stock,
    0,
  );
  const saleValue = items.reduce(
    (sum, item) => sum + item.salePrice * item.stock,
    0,
  );

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(item: InventoryItem) {
    setEditing(item);
    setFormOpen(true);
  }

  const hasFilters = query.length > 0 || category !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventario"
        title="Repuestos y stock"
        description="Controla el costo, el precio y el stock de cada repuesto que usa el taller."
        actions={
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" />
              Importar Excel
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nuevo repuesto
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Repuestos"
          value={String(items.length)}
          hint={`${pluralize(items.length, "SKU registrado", "SKUs registrados")}`}
          icon={<Package className="h-4 w-4" />}
          tone="default"
        />
        <StatCard
          label="Stock bajo"
          value={String(lowStockCount)}
          hint="Igual o bajo el mínimo"
          icon={<AlertTriangle className="h-4 w-4" />}
          tone={lowStockCount > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Valor al costo"
          value={formatCLP(costValue)}
          hint="Inversión en stock"
          icon={<Package className="h-4 w-4" />}
          tone="info"
        />
        <StatCard
          label="Valor a venta"
          value={formatCLP(saleValue)}
          hint="Si se vende todo el stock"
          icon={<Package className="h-4 w-4" />}
          tone="success"
        />
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre, SKU, marca o código..."
                className="pl-9"
              />
            </div>
            <Select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="sm:w-56"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </Select>
          </div>
          <p className="text-xs text-slate-500">
            {filtered.length} de {items.length} repuestos
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Package className="h-5 w-5" />}
              title={
                items.length === 0
                  ? "Tu inventario está vacío"
                  : "No encontramos repuestos"
              }
              description={
                items.length === 0
                  ? "Crea tu primer repuesto o importa tu inventario desde Excel."
                  : "Prueba con otra búsqueda o cambia la categoría."
              }
              action={
                items.length === 0 ? (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button variant="outline" onClick={() => setImportOpen(true)}>
                      <Upload className="h-4 w-4" />
                      Importar Excel
                    </Button>
                    <Button onClick={openCreate}>
                      <Plus className="h-4 w-4" />
                      Nuevo repuesto
                    </Button>
                  </div>
                ) : hasFilters ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuery("");
                      setCategory("all");
                    }}
                  >
                    Limpiar filtros
                  </Button>
                ) : null
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Repuesto</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Costo</th>
                  <th className="px-4 py-3 font-medium">Precio</th>
                  <th className="px-4 py-3 font-medium">Ubicación</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="font-mono text-[11px] text-slate-400">
                        {item.sku}
                        {item.brand ? ` · ${item.brand}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.category}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">
                          {formatNumber(item.stock)}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {unitLabel[item.unit]}
                        </span>
                        <StockBadge
                          stock={item.stock}
                          minStock={item.minStock}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Mínimo: {formatNumber(item.minStock)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatCLP(item.costPrice)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {formatCLP(item.salePrice)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {item.location ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Ajustar stock"
                          onClick={() => setStockItem(item)}
                        >
                          <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {formOpen ? (
        <InventoryItemForm
          key={editing?.id ?? "new"}
          tenantId={tenant.id}
          item={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => setFormOpen(false)}
        />
      ) : null}

      {stockItem ? (
        <StockAdjustForm
          item={stockItem}
          onClose={() => setStockItem(undefined)}
          onSaved={() => setStockItem(undefined)}
        />
      ) : null}

      {importOpen ? (
        <ImportInventoryModal
          tenantId={tenant.id}
          onClose={() => setImportOpen(false)}
          onImported={() => setImportOpen(false)}
        />
      ) : null}
    </div>
  );
}
