/**
 * Tiny wrapper around the OpenStreetMap Nominatim geocoder. Free, no API key,
 * but bound by a 1 req/sec usage policy and a User-Agent requirement.
 *
 * https://operations.osmfoundation.org/policies/nominatim/
 *
 * Callers should still cache the result in our `place` table so we don't
 * round-trip the network for known places.
 */

export type GeocodeResult = {
  name: string;
  lat: number;
  lng: number;
  countryCode: string | null;
  countryName: string | null;
  region: string | null;
  /** Best-guess type bucket, normalised. */
  kind: "country" | "city" | "region" | "spot";
};

const USER_AGENT = "gameoflife-app/1.0 (self-hosted)";

type NominatimRow = {
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
  address?: {
    country_code?: string;
    country?: string;
    state?: string;
    region?: string;
    province?: string;
    county?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
  };
};

function pickKind(row: NominatimRow): GeocodeResult["kind"] {
  const t = (row.type ?? "").toLowerCase();
  const c = (row.class ?? "").toLowerCase();
  if (t === "country" || c === "country") return "country";
  if (t === "state" || t === "region" || t === "province" || t === "county")
    return "region";
  if (t === "city" || t === "town" || t === "village" || t === "municipality")
    return "city";
  return "spot";
}

/** Forward-geocode a free-text query — returns up to `limit` candidates. */
export async function geocode(
  query: string,
  limit = 5
): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", trimmed);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "en");

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
      cache: "no-store",
    });
  } catch {
    return [];
  }
  if (!res.ok) return [];
  const rows = (await res.json()) as NominatimRow[];
  return rows.map((row) => ({
    name: row.display_name,
    lat: Number(row.lat),
    lng: Number(row.lon),
    countryCode: row.address?.country_code?.toUpperCase() ?? null,
    countryName: row.address?.country ?? null,
    region:
      row.address?.state ??
      row.address?.region ??
      row.address?.province ??
      row.address?.county ??
      null,
    kind: pickKind(row),
  }));
}

/** A short label suitable for display: "Lisbon, Portugal" not the full path. */
export function shortLabel(r: GeocodeResult): string {
  const parts: string[] = [];
  // Take the first chunk of the display_name (usually city / spot name)
  const first = r.name.split(",")[0]?.trim();
  if (first) parts.push(first);
  if (r.countryName && first !== r.countryName) parts.push(r.countryName);
  return parts.join(", ");
}
