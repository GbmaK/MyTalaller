"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Cloud,
  CloudOff,
  LayoutDashboard,
  Package,
  Settings,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  useOnlineStatus,
  usePendingSyncCount,
  useTenant,
} from "@/lib/hooks";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { TenantPlan } from "@/types/domain";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventario", label: "Inventario", icon: Package },
  { href: "/ordenes", label: "Órdenes", icon: ClipboardList },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

const planLabel: Record<TenantPlan, string> = {
  basic: "Plan Básico",
  pro: "Plan Pro",
  premium: "Plan Premium",
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  pathname,
  compact = false,
}: {
  item: NavItem;
  pathname: string;
  compact?: boolean;
}) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        compact ? "shrink-0" : "",
        active
          ? "bg-white/10 text-white"
          : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "text-amber-400" : "text-slate-500",
        )}
      />
      <span>{item.label}</span>
    </Link>
  );
}

function SyncIndicator() {
  const online = useOnlineStatus();
  const pending = usePendingSyncCount();
  const cloud = isSupabaseConfigured();

  return (
    <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-slate-400">
      <span className="flex items-center gap-1.5">
        {online ? (
          <Cloud className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <CloudOff className="h-3.5 w-3.5 text-amber-400" />
        )}
        {online ? "En línea" : "Sin internet"}
      </span>
      <span>
        {cloud
          ? pending > 0
            ? `${pending} por sincronizar`
            : "Sincronizado"
          : "Demo local"}
      </span>
    </div>
  );
}

function DemoBanner() {
  if (isSupabaseConfigured()) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-amber-900 sm:text-xs">
        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-950">
          Demo
        </span>
        <span className="font-medium">
          Datos de ejemplo guardados solo en este navegador.
        </span>
        <Link
          href="/configuracion"
          className="font-semibold underline underline-offset-2 hover:text-amber-950"
        >
          Reiniciar demo
        </Link>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tenant = useTenant();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 lg:flex">
        <div className="flex flex-1 flex-col gap-6 px-4 py-5">
          <Link href="/" className="flex items-center gap-3 px-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-white">
                TallerOS
              </p>
              <p className="text-[11px] text-slate-400">Gestión de taller</p>
            </div>
          </Link>

          <nav className="flex flex-col gap-1">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Operación
            </p>
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>

          <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-xs font-bold text-slate-950">
                {tenant?.name.charAt(0).toUpperCase() ?? "T"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-white">
                  {tenant?.name ?? "Cargando taller..."}
                </p>
                <p className="text-[11px] text-slate-400">
                  {tenant ? planLabel[tenant.plan] : "—"}
                </p>
              </div>
            </div>
            <SyncIndicator />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-950 px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-slate-950">
                <Wrench className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">TallerOS</p>
                <p className="text-[10px] text-slate-400">
                  {tenant?.name ?? "Taller"}
                </p>
              </div>
            </Link>
            <span className="text-[10px] font-medium text-slate-400">
              {isSupabaseConfigured() ? "Nube" : "Demo"}
            </span>
          </div>
          <nav className="mt-3 flex gap-1 overflow-x-auto pb-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                pathname={pathname}
                compact
              />
            ))}
          </nav>
        </header>

        <DemoBanner />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
