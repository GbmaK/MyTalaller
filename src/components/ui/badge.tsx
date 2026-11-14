import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ORDER_STATUS_META, type OrderStatus } from "@/types/domain";

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS_META[status];
  return (
    <Badge className={meta.badgeClassName}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClassName)} />
      {meta.label}
    </Badge>
  );
}

export function StockBadge({
  stock,
  minStock,
}: {
  stock: number;
  minStock: number;
}) {
  const isOut = stock <= 0;
  const isLow = !isOut && stock <= minStock;

  if (isOut) {
    return <Badge className="border-red-200 bg-red-50 text-red-700">Sin stock</Badge>;
  }
  if (isLow) {
    return (
      <Badge className="border-amber-200 bg-amber-50 text-amber-700">
        Stock bajo
      </Badge>
    );
  }
  return (
    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
      Disponible
    </Badge>
  );
}
