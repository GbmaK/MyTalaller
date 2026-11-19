"use client";

import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { seedDatabase } from "@/lib/seed";

/** Evita un bucle si la demo no logra quedar al día. */
const REFRESH_FLAG = "talleros-demo-refreshed";

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    void seedDatabase()
      .then(({ refreshed }) => {
        if (!refreshed) return;
        if (sessionStorage.getItem(REFRESH_FLAG) === "1") return;
        sessionStorage.setItem(REFRESH_FLAG, "1");
        window.location.reload();
      })
      .catch((error: unknown) => {
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
