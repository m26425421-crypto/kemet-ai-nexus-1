// Shared helpers to resolve tunable values from the app_settings table.
// Works with any supabase-js client (server route or server function).

export function settingNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getSettingNumber(
  supabase: any,
  key: string,
  fallback: number,
): Promise<number> {
  try {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    return settingNumber(data?.value, fallback);
  } catch {
    return fallback;
  }
}
