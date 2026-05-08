import { db } from "@/lib/db";
import { place, placeVisit } from "@/lib/db/schema";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { InferSelectModel } from "drizzle-orm";

export type Place = InferSelectModel<typeof place>;
export type PlaceVisit = InferSelectModel<typeof placeVisit>;

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
