// utils/normalize.ts (o al inicio de cada route)
export function normalizeInv(s: string) {
  return s.trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}
export function splitAndNormalize(csv: string) {
  return Array.from(
    new Set(
      csv
        .split(/[,\s]+/)
        .map(normalizeInv)
        .filter(Boolean)
    )
  );
}
