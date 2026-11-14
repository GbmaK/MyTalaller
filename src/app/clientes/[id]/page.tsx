import { Suspense } from "react";
import { CustomerDetailView } from "@/features/customers/customer-detail";

async function CustomerDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomerDetailView customerId={id} />;
}

export default function CustomerDetailPage({
  params,
}: PageProps<"/clientes/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-16 animate-pulse rounded-2xl bg-slate-200/60" />
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200/60" />
        </div>
      }
    >
      <CustomerDetailContent params={params} />
    </Suspense>
  );
}
