import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";

export type StatTone = "default" | "warning" | "success" | "danger" | "info";

const toneClasses: Record<StatTone, string> = {
  default: "bg-slate-100 text-slate-600",
  warning: "bg-amber-100 text-amber-700",
  success: "bg-emerald-100 text-emerald-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-sky-100 text-sky-700",
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  tone?: StatTone;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="truncate text-xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
          {hint ? (
            <p className="truncate text-xs text-slate-400">{hint}</p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            toneClasses[tone],
          )}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}
