"use server";

import { db } from "@/lib/db";
import { place, placeVisit, trip } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { geocode, reverseGeocode, type GeocodeResult } from "@/lib/geocode";
import { writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { checkPlaceAchievements } from "@/lib/places-achievements";

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
  await checkPlaceAchievements(session.user.id);
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
  await checkPlaceAchievements(session.user.id);
}

export async function deletePlace(id: string) {
  const session = await requireSession();
  await db
    .delete(place)
    .where(and(eq(place.id, id), eq(place.userId, session.user.id)));
  revalidatePath("/places");
  await checkPlaceAchievements(session.user.id);
}

export async function logVisit(data: {
  placeId: string;
  startedOn: string;
  endedOn?: string | null;
  rating?: number | null;
  notes?: string | null;
  tripId?: string | null;
  isHike?: boolean;
  distanceKm?: number | null;
  elevationM?: number | null;
}) {
  const session = await requireSession();
  const [row] = await db
    .insert(placeVisit)
    .values({
      userId: session.user.id,
      placeId: data.placeId,
      tripId: data.tripId ?? null,
      startedOn: data.startedOn,
      endedOn: data.endedOn ?? null,
      rating: data.rating ?? null,
      notes: data.notes?.trim() || null,
      isHike: data.isHike ?? false,
      distanceKm: data.isHike ? (data.distanceKm ?? null) : null,
      elevationM: data.isHike ? (data.elevationM ?? null) : null,
    })
    .returning();
  revalidatePath("/places");
  revalidatePath(`/places/${data.placeId}`);
  revalidatePath("/account");
  await checkPlaceAchievements(session.user.id);
  return row;
}

export async function updateVisit(
  id: string,
  data: {
    startedOn?: string;
    endedOn?: string | null;
    rating?: number | null;
    notes?: string | null;
    tripId?: string | null;
    isHike?: boolean;
    distanceKm?: number | null;
    elevationM?: number | null;
  }
) {
  const session = await requireSession();
  const row = await db.query.placeVisit.findFirst({
    where: (v, { and: a, eq: e }) =>
      a(e(v.id, id), e(v.userId, session.user.id)),
  });
  if (!row) throw new Error("Visit not found");
  const updates: Record<string, unknown> = {};
  if (data.startedOn !== undefined) updates.startedOn = data.startedOn;
  if (data.endedOn !== undefined) updates.endedOn = data.endedOn;
  if (data.rating !== undefined) updates.rating = data.rating;
  if (data.notes !== undefined)
    updates.notes = data.notes?.trim() || null;
  if (data.tripId !== undefined) updates.tripId = data.tripId;
  if (data.isHike !== undefined) {
    updates.isHike = data.isHike;
    if (!data.isHike) {
      // Clear km/elev when un-marking as a hike unless caller explicitly
      // sets them. Keeps stats clean.
      if (data.distanceKm === undefined) updates.distanceKm = null;
      if (data.elevationM === undefined) updates.elevationM = null;
    }
  }
  if (data.distanceKm !== undefined) updates.distanceKm = data.distanceKm;
  if (data.elevationM !== undefined) updates.elevationM = data.elevationM;
  await db.update(placeVisit).set(updates).where(eq(placeVisit.id, id));
  revalidatePath("/places");
  revalidatePath(`/places/${row.placeId}`);
  await checkPlaceAchievements(session.user.id);
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
  await checkPlaceAchievements(session.user.id);
}

// =====================
// PHOTO UPLOADS
// =====================

const PHOTO_DIR = path.join(process.cwd(), "public", "places");
const ALLOWED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_PHOTO_BYTES = 15 * 1024 * 1024; // 15 MB — slightly looser than friends

async function writePhoto(
  prefix: string,
  formData: FormData
): Promise<string> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file uploaded");
  }
  if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
    throw new Error("Unsupported image type — use JPG, PNG, WebP, or GIF");
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("Image too large (max 15 MB)");
  }
  await mkdir(PHOTO_DIR, { recursive: true });
  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";
  const filename = `${prefix}-${Date.now()}.${ext}`;
  const dest = path.join(PHOTO_DIR, filename);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(dest, bytes);
  return `/places/${filename}`;
}

async function deletePhotoFile(publicUrl: string | null | undefined) {
  if (!publicUrl) return;
  if (!publicUrl.startsWith("/places/")) return;
  try {
    await unlink(path.join(process.cwd(), "public", publicUrl));
  } catch {
    // already gone
  }
}

export async function uploadPlacePhoto(
  placeId: string,
  formData: FormData
) {
  const session = await requireSession();
  const row = await db.query.place.findFirst({
    where: (p, { and: a, eq: e }) =>
      a(e(p.id, placeId), e(p.userId, session.user.id)),
  });
  if (!row) throw new Error("Place not found");
  const url = await writePhoto(`p-${placeId}`, formData);
  await deletePhotoFile(row.coverImage);
  await db
    .update(place)
    .set({ coverImage: url, updatedAt: new Date() })
    .where(eq(place.id, placeId));
  revalidatePath("/places");
  revalidatePath(`/places/${placeId}`);
  return { coverImage: url };
}

export async function clearPlacePhoto(placeId: string) {
  const session = await requireSession();
  const row = await db.query.place.findFirst({
    where: (p, { and: a, eq: e }) =>
      a(e(p.id, placeId), e(p.userId, session.user.id)),
  });
  if (!row) return;
  await deletePhotoFile(row.coverImage);
  await db
    .update(place)
    .set({ coverImage: null, updatedAt: new Date() })
    .where(eq(place.id, placeId));
  revalidatePath("/places");
  revalidatePath(`/places/${placeId}`);
}

export async function uploadVisitPhoto(
  visitId: string,
  formData: FormData
) {
  const session = await requireSession();
  const row = await db.query.placeVisit.findFirst({
    where: (v, { and: a, eq: e }) =>
      a(e(v.id, visitId), e(v.userId, session.user.id)),
  });
  if (!row) throw new Error("Visit not found");
  const url = await writePhoto(`v-${visitId}`, formData);
  await deletePhotoFile(row.photoUrl);
  await db
    .update(placeVisit)
    .set({ photoUrl: url })
    .where(eq(placeVisit.id, visitId));
  revalidatePath("/places");
  revalidatePath(`/places/${row.placeId}`);
  return { photoUrl: url };
}

export async function clearVisitPhoto(visitId: string) {
  const session = await requireSession();
  const row = await db.query.placeVisit.findFirst({
    where: (v, { and: a, eq: e }) =>
      a(e(v.id, visitId), e(v.userId, session.user.id)),
  });
  if (!row) return;
  await deletePhotoFile(row.photoUrl);
  await db
    .update(placeVisit)
    .set({ photoUrl: null })
    .where(eq(placeVisit.id, visitId));
  revalidatePath("/places");
  revalidatePath(`/places/${row.placeId}`);
}

// =====================
// TRIPS
// =====================

export async function createTrip(data: {
  name: string;
  description?: string | null;
  startedOn?: string | null;
  endedOn?: string | null;
}) {
  const session = await requireSession();
  const [row] = await db
    .insert(trip)
    .values({
      userId: session.user.id,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      startedOn: data.startedOn ?? null,
      endedOn: data.endedOn ?? null,
    })
    .returning();
  revalidatePath("/places");
  revalidatePath("/places/trips");
  return row;
}

export async function updateTrip(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    startedOn?: string | null;
    endedOn?: string | null;
  }
) {
  const session = await requireSession();
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.description !== undefined)
    updates.description = data.description?.trim() || null;
  if (data.startedOn !== undefined) updates.startedOn = data.startedOn;
  if (data.endedOn !== undefined) updates.endedOn = data.endedOn;
  await db
    .update(trip)
    .set(updates)
    .where(and(eq(trip.id, id), eq(trip.userId, session.user.id)));
  revalidatePath("/places");
  revalidatePath(`/places/trips/${id}`);
}

export async function deleteTrip(id: string) {
  const session = await requireSession();
  // Visits already have ON DELETE SET NULL via the FK so they survive.
  await db
    .delete(trip)
    .where(and(eq(trip.id, id), eq(trip.userId, session.user.id)));
  revalidatePath("/places");
  revalidatePath("/places/trips");
}

export async function setVisitTrip(visitId: string, tripId: string | null) {
  const session = await requireSession();
  const row = await db.query.placeVisit.findFirst({
    where: (v, { and: a, eq: e }) =>
      a(e(v.id, visitId), e(v.userId, session.user.id)),
  });
  if (!row) throw new Error("Visit not found");
  await db
    .update(placeVisit)
    .set({ tripId })
    .where(eq(placeVisit.id, visitId));
  revalidatePath("/places");
  revalidatePath(`/places/${row.placeId}`);
}
