import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const SETTINGS_QUERY_KEY = ["app-settings"] as const;

export type SettingsMap = Record<string, unknown>;

async function fetchSettings(): Promise<SettingsMap> {
  const { data, error } = await supabase.from("app_settings").select("key,value");
  if (error) throw new Error(error.message);
  const map: SettingsMap = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return map;
}

function toNumber(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function toBool(v: unknown, fallback: boolean): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    if (v === "true") return true;
    if (v === "false") return false;
  }
  if (typeof v === "number") return v !== 0;
  return fallback;
}

/**
 * Live app settings, driven entirely by the admin dashboard (app_settings table).
 * Refetches frequently and on window focus so admin edits show up immediately.
 */
export function useSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: fetchSettings,
    staleTime: 5_000,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Realtime updates when available (falls back silently to polling).
  useEffect(() => {
    const channel = supabase
      .channel(`app-settings-live-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings" },
        () => qc.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  const map = data ?? {};
  return {
    map,
    isLoading,
    num: (key: string, fallback: number) => toNumber(map[key], fallback),
    bool: (key: string, fallback = true) => toBool(map[key], fallback),
    str: (key: string, fallback: string) =>
      typeof map[key] === "string" ? (map[key] as string) : fallback,
  };
}
