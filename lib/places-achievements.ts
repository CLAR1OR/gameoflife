import { db } from "@/lib/db";
import { achievement, place, placeVisit } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type PlaceAchievementSpec = {
  name: string;
  description: string;
  icon: string;
  triggerType:
    | "places_count"
    | "countries_visited"
    | "hikes_count"
    | "hike_total_km"
    | "hike_total_elevation"
    | "hike_single_max_km"
    | "hike_single_max_elevation";
  triggerCount: number;
};

const PLACE_ACHIEVEMENTS: PlaceAchievementSpec[] = [
  // Place + country counts
  { name: "First Pin", description: "Add your first place to the map", icon: "📍", triggerType: "places_count", triggerCount: 1 },
  { name: "Wanderer", description: "Add 10 places", icon: "🗺️", triggerType: "places_count", triggerCount: 10 },
  { name: "Globe-trotter", description: "Add 50 places", icon: "🌍", triggerType: "places_count", triggerCount: 50 },
  { name: "Cartographer", description: "Add 100 places", icon: "🧭", triggerType: "places_count", triggerCount: 100 },

  { name: "Crossing Borders", description: "Visit 2 countries", icon: "✈️", triggerType: "countries_visited", triggerCount: 2 },
  { name: "Five Flags", description: "Visit 5 countries", icon: "🚩", triggerType: "countries_visited", triggerCount: 5 },
  { name: "Decade of Countries", description: "Visit 10 countries", icon: "🛫", triggerType: "countries_visited", triggerCount: 10 },
  { name: "Quarter of a Hundred", description: "Visit 25 countries", icon: "🌏", triggerType: "countries_visited", triggerCount: 25 },
  { name: "World Citizen", description: "Visit 50 countries", icon: "🌐", triggerType: "countries_visited", triggerCount: 50 },
  { name: "Centennial Traveller", description: "Visit 100 countries", icon: "👑", triggerType: "countries_visited", triggerCount: 100 },

  // Hike-specific counts
  { name: "First Steps", description: "Log your first hike", icon: "🥾", triggerType: "hikes_count", triggerCount: 1 },
  { name: "Trail Hunter", description: "10 hikes logged", icon: "⛰️", triggerType: "hikes_count", triggerCount: 10 },
  { name: "Trail Veteran", description: "50 hikes logged", icon: "🏔️", triggerType: "hikes_count", triggerCount: 50 },
  { name: "Trail Master", description: "100 hikes logged", icon: "🪨", triggerType: "hikes_count", triggerCount: 100 },

  // Total km hiked
  { name: "10 km Club", description: "10 km hiked total", icon: "👣", triggerType: "hike_total_km", triggerCount: 10 },
  { name: "50 km Club", description: "50 km hiked total", icon: "🚶", triggerType: "hike_total_km", triggerCount: 50 },
  { name: "Marathon Distance", description: "42 km hiked total", icon: "🏃", triggerType: "hike_total_km", triggerCount: 42 },
  { name: "Century", description: "100 km hiked total", icon: "💯", triggerType: "hike_total_km", triggerCount: 100 },
  { name: "GR-class Hiker", description: "500 km hiked total", icon: "🥇", triggerType: "hike_total_km", triggerCount: 500 },
  { name: "Pilgrim", description: "1000 km hiked total", icon: "🧘", triggerType: "hike_total_km", triggerCount: 1000 },

  // Cumulative elevation gain
  { name: "Vertical Mile", description: "Climbed 1,609 m total elevation", icon: "📐", triggerType: "hike_total_elevation", triggerCount: 1609 },
  { name: "Sky Walker", description: "Climbed 5,000 m total elevation", icon: "☁️", triggerType: "hike_total_elevation", triggerCount: 5000 },
  { name: "Everest Equivalent", description: "Climbed 8,848 m total elevation", icon: "🏔️", triggerType: "hike_total_elevation", triggerCount: 8848 },
  { name: "Twice Everest", description: "Climbed 17,696 m total elevation", icon: "🏔", triggerType: "hike_total_elevation", triggerCount: 17696 },

  // Single-hike feats
  { name: "Day Hike", description: "A single hike of 10 km or more", icon: "🌲", triggerType: "hike_single_max_km", triggerCount: 10 },
  { name: "Marathon Hike", description: "A single hike of 25 km or more", icon: "🏞️", triggerType: "hike_single_max_km", triggerCount: 25 },
  { name: "Ultra", description: "A single hike of 50 km or more", icon: "⚡", triggerType: "hike_single_max_km", triggerCount: 50 },

  { name: "Hill Climber", description: "A single hike with 500 m elevation gain", icon: "⛰", triggerType: "hike_single_max_elevation", triggerCount: 500 },
  { name: "Alpine Day", description: "A single hike with 1,000 m elevation gain", icon: "🗻", triggerType: "hike_single_max_elevation", triggerCount: 1000 },
  { name: "Vertical Beast", description: "A single hike with 2,000 m elevation gain", icon: "🪂", triggerType: "hike_single_max_elevation", triggerCount: 2000 },
];

export async function ensurePlaceAchievementsSeeded(userId: string) {
  const existing = await db.query.achievement.findMany({
    where: (a, { and: _and, eq: _eq, or: _or }) =>
      _and(
        _eq(a.userId, userId),
        _or(
          _eq(a.triggerType, "places_count"),
          _eq(a.triggerType, "countries_visited"),
          _eq(a.triggerType, "hikes_count"),
          _eq(a.triggerType, "hike_total_km"),
          _eq(a.triggerType, "hike_total_elevation"),
          _eq(a.triggerType, "hike_single_max_km"),
          _eq(a.triggerType, "hike_single_max_elevation")
        )
      ),
  });
  const existingKeys = new Set(
    existing.map((a) => `${a.triggerType}:${a.triggerCount}`)
  );
  const toInsert = PLACE_ACHIEVEMENTS.filter(
    (a) => !existingKeys.has(`${a.triggerType}:${a.triggerCount}`)
  );
  if (toInsert.length === 0) return;
  await db.insert(achievement).values(
    toInsert.map((a) => ({
      userId,
      categoryId: null,
      source: "custom" as const,
      name: a.name,
      description: a.description,
      icon: a.icon,
      triggerType: a.triggerType,
      triggerCount: a.triggerCount,
    }))
  );
}

/** Re-evaluate every place / hike achievement against the user's current
 * data. Call after creating / editing / deleting places or visits. */
export async function checkPlaceAchievements(userId: string): Promise<string[]> {
  await ensurePlaceAchievementsSeeded(userId);

  // Pull the full state we need in two queries.
  const places = await db
    .select()
    .from(place)
    .where(eq(place.userId, userId));
  const visits = await db
    .select()
    .from(placeVisit)
    .where(eq(placeVisit.userId, userId));

  const hikes = places.filter((p) => p.type === "hike");
  const hikeIdSet = new Set(hikes.map((h) => h.id));
  const hikeVisits = visits.filter((v) => hikeIdSet.has(v.placeId));

  const placesCount = places.length;
  const countrySet = new Set<string>();
  for (const p of places) {
    if (p.countryCode) countrySet.add(p.countryCode);
  }
  const countriesVisited = countrySet.size;

  const hikesCount = hikeVisits.length;

  // Aggregate km / elevation by re-using the place's distance/elevation
  // for every visit. (One row per visit = one outing along that route.)
  const distByPlaceId = new Map<string, number>();
  const elevByPlaceId = new Map<string, number>();
  for (const h of hikes) {
    if (h.distanceKm != null) distByPlaceId.set(h.id, h.distanceKm);
    if (h.elevationM != null) elevByPlaceId.set(h.id, h.elevationM);
  }
  let hikeTotalKm = 0;
  let hikeTotalElevation = 0;
  for (const v of hikeVisits) {
    hikeTotalKm += distByPlaceId.get(v.placeId) ?? 0;
    hikeTotalElevation += elevByPlaceId.get(v.placeId) ?? 0;
  }

  const hikeSingleMaxKm = Math.max(
    0,
    ...hikes.map((h) => h.distanceKm ?? 0)
  );
  const hikeSingleMaxElevation = Math.max(
    0,
    ...hikes.map((h) => h.elevationM ?? 0)
  );

  const stats: Record<
    PlaceAchievementSpec["triggerType"],
    number
  > = {
    places_count: placesCount,
    countries_visited: countriesVisited,
    hikes_count: hikesCount,
    hike_total_km: hikeTotalKm,
    hike_total_elevation: hikeTotalElevation,
    hike_single_max_km: hikeSingleMaxKm,
    hike_single_max_elevation: hikeSingleMaxElevation,
  };

  const rows = await db.query.achievement.findMany({
    where: (a, { and: _and, eq: _eq, or: _or }) =>
      _and(
        _eq(a.userId, userId),
        _or(
          _eq(a.triggerType, "places_count"),
          _eq(a.triggerType, "countries_visited"),
          _eq(a.triggerType, "hikes_count"),
          _eq(a.triggerType, "hike_total_km"),
          _eq(a.triggerType, "hike_total_elevation"),
          _eq(a.triggerType, "hike_single_max_km"),
          _eq(a.triggerType, "hike_single_max_elevation")
        )
      ),
  });

  const newlyUnlocked: string[] = [];
  for (const a of rows) {
    if (a.triggerCount == null) continue;
    const value = stats[a.triggerType as keyof typeof stats] ?? 0;
    const should = value >= a.triggerCount;
    if (should && !a.isUnlocked) {
      await db
        .update(achievement)
        .set({ isUnlocked: true, unlockedAt: new Date() })
        .where(eq(achievement.id, a.id));
      newlyUnlocked.push(a.name);
    } else if (!should && a.isUnlocked) {
      await db
        .update(achievement)
        .set({ isUnlocked: false, unlockedAt: null })
        .where(eq(achievement.id, a.id));
    }
  }
  if (newlyUnlocked.length > 0) {
    revalidatePath("/achievements");
    void and; // keep import alive
  }
  return newlyUnlocked;
}
