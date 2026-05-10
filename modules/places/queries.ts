import { db } from "@/lib/db";
import { place, placeVisit, trip } from "@/lib/db/schema";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { InferSelectModel } from "drizzle-orm";

export type Place = InferSelectModel<typeof place>;
export type PlaceVisit = InferSelectModel<typeof placeVisit>;
export type Trip = InferSelectModel<typeof trip>;

export type PlaceWithStats = Place & {
  visitCount: number;
  lastVisitedOn: string | null;
};

export async function getPlacesByUser(
  userId: string
): Promise<PlaceWithStats[]> {
  const rows = await db
    .select({
      p: place,
      visitCount: sql<number>`count(${placeVisit.id})`,
      lastVisitedOn: sql<string | null>`max(${placeVisit.startedOn})`,
    })
    .from(place)
    .leftJoin(placeVisit, eq(placeVisit.placeId, place.id))
    .where(eq(place.userId, userId))
    .groupBy(place.id)
    .orderBy(desc(sql`max(${placeVisit.startedOn})`), asc(place.name));

  return rows.map((r) => ({
    ...r.p,
    visitCount: Number(r.visitCount),
    lastVisitedOn: r.lastVisitedOn,
  }));
}

export async function getPlaceById(
  id: string,
  userId: string
): Promise<Place | null> {
  const row = await db.query.place.findFirst({
    where: (p, { and: a, eq: e }) => a(e(p.id, id), e(p.userId, userId)),
  });
  return row ?? null;
}

export async function getVisitsForPlace(
  placeId: string,
  userId: string
): Promise<PlaceVisit[]> {
  return db
    .select()
    .from(placeVisit)
    .where(and(eq(placeVisit.placeId, placeId), eq(placeVisit.userId, userId)))
    .orderBy(desc(placeVisit.startedOn), desc(placeVisit.createdAt));
}

export type PlacesStats = {
  placesTotal: number;
  countriesVisited: number;
  countryCodes: string[];
  visitsTotal: number;
  visitsThisYear: number;
};

export type HikeStats = {
  hikesCount: number;
  hikePlacesCount: number;
  totalKm: number;
  totalElevation: number;
  longestKm: number;
  highestElevation: number;
};

export async function getHikeStats(userId: string): Promise<HikeStats> {
  const hikes = await db
    .select()
    .from(place)
    .where(and(eq(place.userId, userId), eq(place.type, "hike")));
  if (hikes.length === 0) {
    return {
      hikesCount: 0,
      hikePlacesCount: 0,
      totalKm: 0,
      totalElevation: 0,
      longestKm: 0,
      highestElevation: 0,
    };
  }
  const ids = hikes.map((h) => h.id);
  const visits = await db
    .select()
    .from(placeVisit)
    .where(
      and(
        eq(placeVisit.userId, userId),
        inArray(placeVisit.placeId, ids)
      )
    );
  const distById = new Map<string, number>();
  const elevById = new Map<string, number>();
  for (const h of hikes) {
    if (h.distanceKm != null) distById.set(h.id, h.distanceKm);
    if (h.elevationM != null) elevById.set(h.id, h.elevationM);
  }
  let totalKm = 0;
  let totalElevation = 0;
  for (const v of visits) {
    totalKm += distById.get(v.placeId) ?? 0;
    totalElevation += elevById.get(v.placeId) ?? 0;
  }
  return {
    hikesCount: visits.length,
    hikePlacesCount: hikes.length,
    totalKm,
    totalElevation,
    longestKm: Math.max(0, ...hikes.map((h) => h.distanceKm ?? 0)),
    highestElevation: Math.max(0, ...hikes.map((h) => h.elevationM ?? 0)),
  };
}

export async function getPlacesStats(userId: string): Promise<PlacesStats> {
  const rows = await db
    .select({
      countryCode: place.countryCode,
      countryName: place.countryName,
    })
    .from(place)
    .where(eq(place.userId, userId));

  const countrySet = new Set<string>();
  for (const r of rows) {
    if (r.countryCode) countrySet.add(r.countryCode);
  }

  const visits = await db
    .select({ startedOn: placeVisit.startedOn })
    .from(placeVisit)
    .where(eq(placeVisit.userId, userId));

  const thisYear = String(new Date().getFullYear());
  const visitsThisYear = visits.filter((v) =>
    v.startedOn.startsWith(thisYear)
  ).length;

  return {
    placesTotal: rows.length,
    countriesVisited: countrySet.size,
    countryCodes: Array.from(countrySet),
    visitsTotal: visits.length,
    visitsThisYear,
  };
}

/** Recent visits across all places — used on the Places list view + activity. */
export async function getRecentVisits(
  userId: string,
  limit = 30
): Promise<{ visit: PlaceVisit; place: Place }[]> {
  const rows = await db
    .select({ visit: placeVisit, place: place })
    .from(placeVisit)
    .innerJoin(place, eq(placeVisit.placeId, place.id))
    .where(eq(placeVisit.userId, userId))
    .orderBy(desc(placeVisit.startedOn), desc(placeVisit.createdAt))
    .limit(limit);
  return rows;
}

// =====================
// COUNTRY DETAIL
// =====================

export type CountrySummary = {
  countryCode: string;
  countryName: string;
  placesCount: number;
  visitsCount: number;
  firstVisitedOn: string | null;
  lastVisitedOn: string | null;
};

export async function getCountrySummary(
  userId: string,
  countryCode: string
): Promise<CountrySummary | null> {
  const code = countryCode.toUpperCase();
  const places = await db
    .select()
    .from(place)
    .where(and(eq(place.userId, userId), eq(place.countryCode, code)));
  if (places.length === 0) return null;

  const placeIds = places.map((p) => p.id);
  const visits = await db
    .select()
    .from(placeVisit)
    .where(
      and(
        eq(placeVisit.userId, userId),
        inArray(placeVisit.placeId, placeIds)
      )
    );
  const dates = visits.map((v) => v.startedOn).sort();

  return {
    countryCode: code,
    countryName: places[0].countryName ?? code,
    placesCount: places.length,
    visitsCount: visits.length,
    firstVisitedOn: dates[0] ?? null,
    lastVisitedOn: dates[dates.length - 1] ?? null,
  };
}

export async function getPlacesInCountry(
  userId: string,
  countryCode: string
): Promise<PlaceWithStats[]> {
  const code = countryCode.toUpperCase();
  const rows = await db
    .select({
      p: place,
      visitCount: sql<number>`count(${placeVisit.id})`,
      lastVisitedOn: sql<string | null>`max(${placeVisit.startedOn})`,
    })
    .from(place)
    .leftJoin(placeVisit, eq(placeVisit.placeId, place.id))
    .where(and(eq(place.userId, userId), eq(place.countryCode, code)))
    .groupBy(place.id)
    .orderBy(desc(sql`max(${placeVisit.startedOn})`), asc(place.name));
  return rows.map((r) => ({
    ...r.p,
    visitCount: Number(r.visitCount),
    lastVisitedOn: r.lastVisitedOn,
  }));
}

// =====================
// TRIPS
// =====================

export type TripWithStats = Trip & {
  visitsCount: number;
  placesCount: number;
  countryCodes: string[];
};

export async function getTripsByUser(
  userId: string
): Promise<TripWithStats[]> {
  const trips = await db
    .select()
    .from(trip)
    .where(eq(trip.userId, userId))
    .orderBy(desc(trip.startedOn), desc(trip.createdAt));
  if (trips.length === 0) return [];

  const ids = trips.map((t) => t.id);
  const visits = await db
    .select({
      tripId: placeVisit.tripId,
      placeId: placeVisit.placeId,
      countryCode: place.countryCode,
    })
    .from(placeVisit)
    .innerJoin(place, eq(placeVisit.placeId, place.id))
    .where(
      and(
        eq(placeVisit.userId, userId),
        inArray(placeVisit.tripId, ids)
      )
    );

  const byTrip = new Map<
    string,
    { visits: number; places: Set<string>; countries: Set<string> }
  >();
  for (const v of visits) {
    if (!v.tripId) continue;
    const cur = byTrip.get(v.tripId) ?? {
      visits: 0,
      places: new Set<string>(),
      countries: new Set<string>(),
    };
    cur.visits++;
    cur.places.add(v.placeId);
    if (v.countryCode) cur.countries.add(v.countryCode);
    byTrip.set(v.tripId, cur);
  }

  return trips.map((t) => {
    const stats = byTrip.get(t.id);
    return {
      ...t,
      visitsCount: stats?.visits ?? 0,
      placesCount: stats?.places.size ?? 0,
      countryCodes: stats ? Array.from(stats.countries) : [],
    };
  });
}

export async function getTripById(
  id: string,
  userId: string
): Promise<Trip | null> {
  const row = await db.query.trip.findFirst({
    where: (t, { and: a, eq: e }) => a(e(t.id, id), e(t.userId, userId)),
  });
  return row ?? null;
}

export async function getVisitsForTrip(
  tripId: string,
  userId: string
): Promise<{ visit: PlaceVisit; place: Place }[]> {
  return db
    .select({ visit: placeVisit, place: place })
    .from(placeVisit)
    .innerJoin(place, eq(placeVisit.placeId, place.id))
    .where(
      and(eq(placeVisit.userId, userId), eq(placeVisit.tripId, tripId))
    )
    .orderBy(asc(placeVisit.startedOn), asc(placeVisit.createdAt));
}
