"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { InventoryUnit } from "@/types/domain";
import {
  importInventoryItems,
  type InventoryItemDraft,
} from "./inventory-actions";

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function toStringValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function pick(
  data: Record<string, unknown>,
  keys: string[],
): unknown {
  for (const key of keys) {
    const value = data[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return undefined;
}

function parseNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const raw = toStringValue(value).replace(/\s/g, "").replace(/\$/g, "");
  if (!raw) return 0;

  if (raw.includes(",")) {
    const normalized = raw.replace(/\./g, "").replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parts = raw.split(".");
  if (parts.length > 1 && parts[parts.length - 1]?.length === 3) {
    const parsed = Number(raw.replace(/\./g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseUnit(value: unknown): InventoryUnit {
  const normalized = toStringValue(value).toLowerCase();
  if (!normalized) return "unidad";
  if (normalized.startsWith("litro") || normalized === "l" || normalized === "lt") {
    return "litro";
  }
  if (normalized.startsWith("metro") || normalized === "m") {
    return "metro";
  }
  if (normalized.startsWith("kit")) {
    return "kit";
  }
  if (
    normalized.startsWith("unidad") ||
    normalized === "u" ||
    normalized === "un"
  ) {
    return "unidad";
  }
  return "otro";
}

async function parseFile(file: File): Promise<{
  drafts: InventoryItemDraft[];
  errors: string[];
}> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { drafts: [], errors: ["El archivo no tiene hojas."] };
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return { drafts: [], errors: ["No se pudo leer la primera hoja."] };
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  const drafts: InventoryItemDraft[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  rows.forEach((row, index) => {
    const data = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [normalizeHeader(key), value]),
    );
    const rowNumber = index + 2;
    const sku = toStringValue(
      pick(data, ["sku", "codigo", "codigo_interno", "codigo_repuesto"]),
    );
    const name = toStringValue(
      pick(data, ["nombre", "name", "descripcion", "detalle"]),
    );

    if (!sku) {
      errors.push(`Fila ${rowNumber}: falta el SKU.`);
      return;
    }
    if (!name) {
      errors.push(`Fila ${rowNumber}: falta el nombre.`);
      return;
    }
    if (seen.has(sku.toLowerCase())) {
      errors.push(`Fila ${rowNumber}: SKU duplicado (${sku}).`);
      return;
    }
    seen.add(sku.toLowerCase());

    drafts.push({
      sku,
      name,
      category:
        toStringValue(pick(data, ["categoria", "category", "rubro"])) ||
        "General",
      brand:
        toStringValue(pick(data, ["marca", "brand", "fabricante"])) ||
        undefined,
      model: toStringValue(pick(data, ["modelo", "model"])) || undefined,
      unit: parseUnit(pick(data, ["unidad", "unit", "medida"])),
      costPrice: parseNumber(
        pick(data, [
          "costo",
          "cost",
          "costo_unitario",
          "precio_costo",
          "costo_neto",
        ]),
      ),
      salePrice: parseNumber(
        pick(data, [
          "precio",
          "price",
          "precio_venta",
          "venta",
          "precio_unitario",
        ]),
      ),
      stock: parseNumber(
        pick(data, ["stock", "cantidad", "existencia", "qty"]),
      ),
      minStock: parseNumber(
        pick(data, ["stock_minimo", "minimo", "min_stock", "stock_min", "min"]),
      ),
      location:
        toStringValue(pick(data, ["ubicacion", "location", "estante"])) ||
        undefined,
      barcode:
        toStringValue(pick(data, ["codigo_barras", "barcode", "ean", "barra"])) ||
        undefined,
    });
  });

  if (drafts.length === 0 && errors.length === 0) {
    errors.push("No se encontraron filas con datos.");
  }

  return { drafts, errors };
}

function downloadTemplate() {
  const rows: Array<Array<string | number>> = [
    [
      "sku",
      "nombre",
      "categoria",
      "marca",
      "modelo",
      "unidad",
      "costo",
      "precio",
      "stock",
      "stock_minimo",
      "ubicacion",
      "codigo_barras",
    ],
    [
      "CAD-325-72",
      'Cadena 325" 72 eslabones',
      "Cadena",
      "Oregon",
      "325-72",
      "unidad",
      12000,
      18990,
      4,
      2,
      "Estante A3",
      "7801234567890",
    ],
    [
      "FIL-001",
      "Filtro de aire universal",
      "Filtro",
      "Genérico",
      "Universal",
      "unidad",
      2500,
      4990,
      10,
      4,
      "Caja B1",
      "",
    ],
    [
      "ACE-2T-1L",
      "Aceite 2T 1 litro",
      "Insumo",
      "Motul",
      "2T",
      "litro",
      6500,
      9990,
      12,
      6,
      "Estante C2",
      "",
    ],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 16 },
    { wch: 32 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 8 },
    { wch: 12 },
    { wch: 16 },
    { wch: 18 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");
  XLSX.writeFile(workbook, "plantilla-inventario-talleros.xlsx");
}

export function ImportInventoryModal({
  tenantId,
  onClose,
  onImported,
}: {
  tenantId: string;
  onClose: () => void;
  onImported: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<InventoryItemDraft[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState<InventoryItemDraft[]>([]);
  const [importing, setImporting] = useState(false);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setDrafts([]);
    setErrors([]);
    setPreview([]);

    try {
      const result = await parseFile(file);
      setDrafts(result.drafts);
      setErrors(result.errors);
      setPreview(result.drafts.slice(0, 5));
    } catch (error) {
      setErrors([
        error instanceof Error
          ? error.message
          : "No se pudo leer el archivo.",
      ]);
    }
  }

  async function handleImport() {
    if (drafts.length === 0) return;

    setImporting(true);
    try {
      const result = await importInventoryItems(tenantId, drafts);
      toast.success(
        `Importación lista: ${result.created} creados y ${result.updated} actualizados.`,
      );
      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} filas no se pudieron importar.`);
      }
      onImported();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo importar el inventario.",
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Importar inventario"
      description="Sube un Excel con la plantilla estándar. Si el SKU ya existe, se actualiza."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={importing}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={drafts.length === 0 || importing}
          >
            {importing
              ? "Importando..."
              : `Importar ${drafts.length} repuesto${
                  drafts.length === 1 ? "" : "s"
                }`}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-700">
              ¿No tienes el archivo listo?
            </p>
            <p className="text-[11px] text-slate-500">
              Descarga la plantilla y complétala con tu inventario.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-3.5 w-3.5" />
            Descargar plantilla
          </Button>
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 py-6 text-center transition-colors hover:border-amber-400 hover:bg-amber-50/30">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Upload className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium text-slate-800">
            {fileName ?? "Seleccionar archivo Excel"}
          </span>
          <span className="text-[11px] text-slate-500">
            .xlsx, .xls o .csv · primera fila con encabezados
          </span>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFile}
          />
        </label>

        {errors.length > 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
            <p className="text-xs font-semibold text-amber-800">
              {errors.length} fila{errors.length === 1 ? "" : "s"} con
              problemas (se omitirán):
            </p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11px] text-amber-700">
              {errors.slice(0, 5).map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
            {errors.length > 5 ? (
              <p className="mt-1 text-[11px] text-amber-700">
                y {errors.length - 5} más...
              </p>
            ) : null}
          </div>
        ) : null}

        {preview.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              Vista previa ({drafts.length} filas válidas)
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[540px] text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">SKU</th>
                    <th className="px-3 py-2 font-medium">Nombre</th>
                    <th className="px-3 py-2 font-medium">Stock</th>
                    <th className="px-3 py-2 font-medium">Costo</th>
                    <th className="px-3 py-2 font-medium">Precio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.map((row) => (
                    <tr key={row.sku}>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-600">
                        {row.sku}
                      </td>
                      <td className="px-3 py-2 text-slate-800">{row.name}</td>
                      <td className="px-3 py-2 text-slate-600">{row.stock}</td>
                      <td className="px-3 py-2 text-slate-600">
                        ${row.costPrice}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        ${row.salePrice}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {drafts.length > preview.length ? (
              <p className="text-[11px] text-slate-500">
                Mostrando las primeras {preview.length} filas de {drafts.length}.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
