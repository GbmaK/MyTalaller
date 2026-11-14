"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Building2,
  Cloud,
  CloudOff,
  Database,
  Download,
  HardDrive,
  RefreshCw,
  RotateCcw,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import {
  useOnlineStatus,
  usePendingSyncCount,
  useTenant,
} from "@/lib/hooks";
import { formatDate, formatDateTime } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase";
import { syncPendingChanges } from "@/lib/sync";
import type { Tenant, TenantPlan } from "@/types/domain";
import {
  estimateStorage,
  exportDatabase,
  resetDemoData,
  updateTenant,
} from "./settings-actions";

const planLabels: Record<TenantPlan, string> = {
  basic: "Básico",
  pro: "Pro",
  premium: "Premium",
};

const planPrices: Record<TenantPlan, string> = {
  basic: "$15.000 CLP / mes",
  pro: "$25.000 CLP / mes",
  premium: "$35.000 – $50.000 CLP / mes",
};

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function TenantForm({ tenant }: { tenant: Tenant }) {
  const [name, setName] = useState(tenant.name);
  const [plan, setPlan] = useState<TenantPlan>(tenant.plan);
  const [saving, setSaving] = useState(false);

  const dirty = name.trim() !== tenant.name || plan !== tenant.plan;

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await updateTenant(tenant.id, { name, plan });
      toast.success("Datos del taller actualizados");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudieron guardar los cambios.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <Field label="Nombre del taller">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Taller Los Robles"
        />
      </Field>
      <Field
        label="Plan"
        hint="En el piloto puedes cambiarlo libremente para probar."
      >
        <Select
          value={plan}
          onChange={(event) => setPlan(event.target.value as TenantPlan)}
        >
          <option value="basic">Básico — $15.000 / mes</option>
          <option value="pro">Pro — $25.000 / mes</option>
          <option value="premium">Premium — $35.000 a $50.000 / mes</option>
        </Select>
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="text-[11px] text-slate-400">
          <p>Creado {formatDate(tenant.createdAt)}</p>
          <p>Actualizado {formatDateTime(tenant.updatedAt)}</p>
        </div>
        <Button type="submit" disabled={saving || !dirty}>
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}

export function SettingsView() {
  const tenant = useTenant();
  const pending = usePendingSyncCount();
  const online = useOnlineStatus();
  const cloud = isSupabaseConfigured();

  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(
    null,
  );

  useEffect(() => {
    void estimateStorage()
      .then(setStorage)
      .catch(() => setStorage(null));
  }, [pending]);

  if (!tenant) {
    return (
      <div className="space-y-6">
        <div className="h-16 animate-pulse rounded-2xl bg-slate-200/60" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-200/60" />
      </div>
    );
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const result = await syncPendingChanges();
      if (!cloud) {
        toast.info(
          "Demo local: configura Supabase para sincronizar con la nube.",
        );
      } else if (result.pushed === 0 && result.failed === 0) {
        toast.success("No hay cambios pendientes");
      } else {
        toast.success(
          `${result.pushed} cambios sincronizados${
            result.failed > 0 ? ` · ${result.failed} con error` : ""
          }`,
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo sincronizar.",
      );
    } finally {
      setSyncing(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const summary = await exportDatabase();
      toast.success(
        `Respaldo descargado: ${summary.serviceOrders} órdenes y ${summary.inventoryItems} repuestos.`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo exportar la base local.",
      );
    } finally {
      setExporting(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    try {
      await resetDemoData();
      toast.success("Demo restaurada. Recargando...");
      window.setTimeout(() => window.location.reload(), 600);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo reiniciar la demo.",
      );
      setResetting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuración"
        title="Taller y datos"
        description="Datos del negocio, estado de sincronización y respaldo local."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Plan"
          value={planLabels[tenant.plan]}
          hint={planPrices[tenant.plan]}
          icon={<Building2 className="h-4 w-4" />}
          tone="info"
        />
        <StatCard
          label="Conexión"
          value={online ? "En línea" : "Sin internet"}
          hint={online ? "Puede sincronizar" : "Trabajando offline"}
          icon={
            online ? (
              <Cloud className="h-4 w-4" />
            ) : (
              <CloudOff className="h-4 w-4" />
            )
          }
          tone={online ? "success" : "warning"}
        />
        <StatCard
          label="Cambios pendientes"
          value={String(pending)}
          hint={cloud ? "En cola para Supabase" : "Solo en este equipo"}
          icon={<RefreshCw className="h-4 w-4" />}
          tone={pending > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Almacenamiento local"
          value={storage ? formatBytes(storage.usage) : "—"}
          hint={
            storage
              ? `de ${formatBytes(storage.quota)} disponibles`
              : "IndexedDB"
          }
          icon={<HardDrive className="h-4 w-4" />}
          tone="default"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Datos del taller</CardTitle>
            <p className="text-xs text-slate-500">
              Este nombre aparece en la barra lateral y en los avisos.
            </p>
          </CardHeader>
          <CardContent>
            <TenantForm key={tenant.id} tenant={tenant} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sincronización</CardTitle>
            <p className="text-xs text-slate-500">
              La app funciona sin internet. Los cambios se guardan en este
              equipo y se envían cuando vuelve la conexión.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                {cloud ? (
                  <Cloud className="h-4 w-4 text-emerald-600" />
                ) : (
                  <CloudOff className="h-4 w-4 text-amber-600" />
                )}
                {cloud ? "Supabase configurado" : "Demo local (sin nube)"}
              </div>
              <Badge
                className={
                  cloud
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-600"
                }
              >
                {cloud ? "Nube" : "Local"}
              </Badge>
            </div>

            <p className="text-xs leading-relaxed text-slate-500">
              {cloud
                ? "Los cambios se empujan a la tabla correspondiente. Si falta una sesión válida, RLS rechazará el envío y quedará en la cola."
                : "Para conectar la nube, copia .env.example a .env.local, completa las credenciales de Supabase y ejecuta la migración SQL."}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleSync}
                disabled={syncing || pending === 0}
                variant="secondary"
              >
                <RefreshCw
                  className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
                />
                {syncing ? "Sincronizando..." : "Sincronizar ahora"}
              </Button>
              <span className="text-[11px] text-slate-400">
                {pending === 0
                  ? "No hay cambios pendientes"
                  : `${pending} cambio${pending === 1 ? "" : "s"} en cola`}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos y respaldo</CardTitle>
          <p className="text-xs text-slate-500">
            Exporta un respaldo JSON o vuelve a los datos de demostración.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <Database className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-800">
                Base local en IndexedDB
              </p>
              <p className="text-xs text-slate-500">
                Todo vive en este navegador. El respaldo incluye clientes,
                equipos, inventario y órdenes.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport} disabled={exporting}>
              <Download className="h-4 w-4" />
              {exporting ? "Exportando..." : "Exportar JSON"}
            </Button>
            <Button
              variant="danger"
              onClick={() => setResetOpen(true)}
              disabled={resetting}
            >
              <RotateCcw className="h-4 w-4" />
              Reiniciar demo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reiniciar datos de demo"
        description="Se borran todos los datos locales y se vuelve a sembrar el taller de ejemplo."
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setResetOpen(false)}
              disabled={resetting}
            >
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleReset} disabled={resetting}>
              {resetting ? "Reiniciando..." : "Sí, reiniciar"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Esta acción no se puede deshacer. Si tienes datos reales, exporta un
          respaldo JSON antes de continuar.
        </p>
      </Modal>
    </div>
  );
}
