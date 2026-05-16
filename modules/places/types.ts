import { InferSelectModel } from "drizzle-orm";
import { place, placeVisit, trip } from "@/lib/db/schema";

export type Place = InferSelectModel<typeof place>;
export type PlaceVisit = InferSelectModel<typeof placeVisit>;
export type Trip = InferSelectModel<typeof trip>;

export type PlaceWithStats = Place & {
  visitCount: number;
  hikeCount: number;
  lastVisitedOn: string | null;
};

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

export type HikeOuting = { visit: PlaceVisit; place: Place };

export type CountrySummary = {
  countryCode: string;
  countryName: string;
  placesCount: number;
  visitsCount: number;
  firstVisitedOn: string | null;
  lastVisitedOn: string | null;
};

export type TripWithStats = Trip & {
  visitsCount: number;
  placesCount: number;
  countryCodes: string[];
};
