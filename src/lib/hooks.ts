"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import type { Tenant } from "@/types/domain";

export function useTenant(): Tenant | undefined {
  return useLiveQuery(async () => {
    const db = getDb();
    return db.tenants.toCollection().first();
  }, []);
}

export function usePendingSyncCount(): number {
  return (
    useLiveQuery(async () => {
      const db = getDb();
      return db.syncQueue.count();
    }, []) ?? 0
  );
}

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    function update() {
      setOnline(navigator.onLine);
    }

    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return online;
}
