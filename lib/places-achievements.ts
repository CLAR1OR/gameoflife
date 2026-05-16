import { db } from "@/lib/db";
import { place, placeVisit } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  seedAchievements,
  evaluateAchievements,
  type AchievementSpec,
} from "./achievement-engine";

const PLACE_TRIGGERS = [
  "places_count",
  "countries_visited",
  "hikes_count",
  "hike_total_km",
  "hike_total_elevation",
  "hike_single_max_km",
  "hike_single_max_elevation",
] as const;

type PlaceTrigger = (typeof PLACE_TRIGGERS)[number];

const PLACE_ACHIEVEMENTS: AchievementSpec<PlaceTrigger>[] = [
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
  await seedAchievements(userId, PLACE_TRIGGERS, PLACE_ACHIEVEMENTS);
}

/** Re-evaluate every place / hike achievement against the user's current
 * data. Call after creating / editing / deleting places or visits. */
export async function checkPlaceAchievements(userId: string): Promise<string[]> {
  await ensurePlaceAchievementsSeeded(userId);

  const [places, visits] = await Promise.all([
    db.select().from(place).where(eq(place.userId, userId)),
    db.select().from(placeVisit).where(eq(placeVisit.userId, userId)),
  ]);

  const hikeVisits = visits.filter((v) => v.isHike);
  const countrySet = new Set<string>();
  for (const p of places) {
    if (p.countryCode) countrySet.add(p.countryCode);
  }

  // Hike km / elevation are stored per-visit now: each row is its own
  // outing, possibly with a different route from the same place.
  let hikeTotalKm = 0;
  let hikeTotalElevation = 0;
  let hikeSingleMaxKm = 0;
  let hikeSingleMaxElevation = 0;
  for (const v of hikeVisits) {
    if (v.distanceKm != null) {
      hikeTotalKm += v.distanceKm;
      if (v.distanceKm > hikeSingleMaxKm) hikeSingleMaxKm = v.distanceKm;
    }
    if (v.elevationM != null) {
      hikeTotalElevation += v.elevationM;
      if (v.elevationM > hikeSingleMaxElevation)
        hikeSingleMaxElevation = v.elevationM;
    }
  }

  return evaluateAchievements(userId, PLACE_TRIGGERS, {
    places_count: places.length,
    countries_visited: countrySet.size,
    hikes_count: hikeVisits.length,
    hike_total_km: hikeTotalKm,
    hike_total_elevation: hikeTotalElevation,
    hike_single_max_km: hikeSingleMaxKm,
    hike_single_max_elevation: hikeSingleMaxElevation,
  });
}
