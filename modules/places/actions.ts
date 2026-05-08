"use server";

import { db } from "@/lib/db";
import { place, placeVisit } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { geocode, reverseGeocode, type GeocodeResult } from "@/lib/geocode";

/** Forward-geocode helper exposed to client search dialogs. */
export async function searchPlaces(query: string): Promise<GeocodeResult[]> {
  await requireSession();
  return geocode(query, 6);
}

/** Reverse-geocode a lat/lng — what's at this point? Used by click-to-add
 * on the world map. */
export async function lookupCoords(
  lat: number,
  lng: number
): Promise<GeocodeResult | null> {
  await requireSession();
  return reverseGeocode(lat, lng);
}

export async function createPlace(data: {
  name: string;
  type?: "spot" | "city" | "region" | "country";
  countryCode?: string | null;
  countryName?: string | null;
  region?: string | null;
  lat?: number | null;
  lng?: number | null;
  notes?: string | null;
}) {
  const session = await requireSession();
  const [row] = await db
    .insert(place)
    .values({
      userId: session.user.id,
      name: data.name.trim(),
      type: data.type ?? "spot",
      countryCode: data.countryCode ?? null,
      countryName: data.countryName ?? null,
      region: data.region ?? null,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      notes: data.notes?.trim() || null,
    })
    .returning();
  revalidatePath("/places");
  return row;
}

/** Convenience: pick from a geocoder result and add it. The geocoder's
 * buildName() already returns a tidy "Café, City, Country" string, so we
 * keep it whole and let the user rename later if they like. */
export async function addPlaceFromGeocode(g: GeocodeResult, notes?: string) {
  return createPlace({
    name: g.name,
    type: g.kind,
    countryCode: g.countryCode,
    countryName: g.countryName,
    region: g.region,
    lat: g.lat,
    lng: g.lng,
    notes: notes ?? null,
  });
}

export async function updatePlace(
  id: string,
  data: {
    name?: string;
    type?: "spot" | "city" | "region" | "country";
    notes?: string | null;
    coverImage?: string | null;
    lat?: number | null;
    lng?: number | null;
    countryCode?: string | null;
    countryName?: string | null;
    region?: string | null;
  }
) {
  const session = await requireSession();
  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) updates[k] = typeof v === "string" ? v.trim() || null : v;
  }
  updates.updatedAt = new Date();
  await db
    .update(place)
    .set(updates)
    .where(and(eq(place.id, id), eq(place.userId, session.user.id)));
  revalidatePath("/places");
  revalidatePath(`/places/${id}`);
}

export async function deletePlace(id: string) {
  const session = await requireSession();
  await db
    .delete(place)
    .where(and(eq(place.id, id), eq(place.userId, session.user.id)));
  revalidatePath("/places");
}

export async function logVisit(data: {
  placeId: string;
  startedOn: string;
  endedOn?: string | null;
  rating?: number | null;
  notes?: string | null;
}) {
  const session = await requireSession();
  await db.insert(placeVisit).values({
    userId: session.user.id,
    placeId: data.placeId,
    startedOn: data.startedOn,
    endedOn: data.endedOn ?? null,
    rating: data.rating ?? null,
    notes: data.notes?.trim() || null,
  });
  revalidatePath("/places");
  revalidatePath(`/places/${data.placeId}`);
  revalidatePath("/account");
}

export async function deleteVisit(id: string) {
  const session = await requireSession();
  const row = await db.query.placeVisit.findFirst({
    where: (v, { and: a, eq: e }) => a(e(v.id, id), e(v.userId, session.user.id)),
  });
  if (!row) return;
  await db.delete(placeVisit).where(eq(placeVisit.id, id));
  revalidatePath("/places");
  revalidatePath(`/places/${row.placeId}`);
}
