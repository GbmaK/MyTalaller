"use client";

import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { seedDatabase } from "@/lib/seed";

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    void seedDatabase().catch((error: unknown) => {
      console.error("No se pudo sembrar la base de datos de demo", error);
    });
  }, []);

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{ duration: 3500 }}
      />
    </>
  );
}
