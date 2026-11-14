import { Suspense } from "react";
import { OrderDetailView } from "@/features/orders/order-detail";

async function OrderDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetailView orderId={id} />;
}

export default function OrderDetailPage({
  params,
}: PageProps<"/ordenes/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-16 animate-pulse rounded-2xl bg-slate-200/60" />
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200/60" />
        </div>
      }
    >
      <OrderDetailContent params={params} />
    </Suspense>
  );
}
