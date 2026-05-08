// Server component — renders the choropleth as inline SVG so there's
// no client-side fetch and no hydration cost.

import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import worldTopo from "world-atlas/countries-110m.json";
import type {
  Topology,
  GeometryCollection as TopoGeometryCollection,
} from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";
import { alpha2FromNumeric } from "@/lib/iso-numeric-to-alpha2";

type CountryProps = { name: string };

// Convert TopoJSON → GeoJSON FeatureCollection once at module load.
const collection = feature(
  worldTopo as unknown as Topology,
  (worldTopo as unknown as Topology).objects.countries as TopoGeometryCollection
) as unknown as FeatureCollection<Geometry, CountryProps>;

/**
 * Equal-Earth choropleth. Equal Earth is an equal-area projection
 * (introduced 2018) with much friendlier proportions than Mercator —
 * Greenland looks like Greenland, not South America. Used by NASA EOSDIS.
 */
export function DashboardCountryFill({
  countryCodes,
}: {
  countryCodes: string[];
}) {
  if (countryCodes.length === 0) return null;

  const visited = new Set(countryCodes.map((c) => c.toUpperCase()));

  // Tighter aspect ratio than Mercator — Equal Earth is 2.05:1.
  const width = 1024;
  const height = 500;

  const projection = geoEqualEarth().fitSize([width, height], collection);
  const path = geoPath(projection);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto block"
        aria-label="World map showing visited countries"
      >
        {/* Subtle ocean / outline of the world's edge — gives the map a
         * frame against the dark card. */}
        <defs>
          <path id="gol-graticule" d={path({ type: "Sphere" }) ?? undefined} />
        </defs>
        <use
          href="#gol-graticule"
          fill="color-mix(in srgb, var(--muted-foreground) 6%, transparent)"
          stroke="color-mix(in srgb, var(--muted-foreground) 25%, transparent)"
          strokeWidth={0.6}
        />

        {collection.features.map((f) => {
          const numericId = String(f.id ?? "");
          const a2 = alpha2FromNumeric(numericId);
          const isVisited = a2 ? visited.has(a2) : false;
          const d = path(f);
          if (!d) return null;
          return (
            <path
              key={numericId || f.properties.name}
              d={d}
              fill={isVisited ? "var(--glow)" : "var(--muted-foreground)"}
              fillOpacity={isVisited ? 0.85 : 0.12}
              stroke={isVisited ? "var(--glow)" : "var(--muted-foreground)"}
              strokeOpacity={isVisited ? 0.7 : 0.25}
              strokeWidth={0.4}
            >
              <title>
                {f.properties.name}
                {isVisited ? " · visited" : ""}
              </title>
            </path>
          );
        })}
      </svg>
    </div>
  );
}
