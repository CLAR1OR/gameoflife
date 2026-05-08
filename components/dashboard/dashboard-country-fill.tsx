"use client";

import { WorldMap, type ISOCode } from "react-svg-worldmap";

/**
 * Choropleth: every country the user has visited is filled with the
 * theme accent. Built on react-svg-worldmap (~30 KB), pure SVG, no map
 * tiles to fetch. Renders to a fixed aspect ratio that scales fluidly.
 */
export function DashboardCountryFill({
  countryCodes,
}: {
  countryCodes: string[];
}) {
  if (countryCodes.length === 0) return null;

  const data = countryCodes.map((c) => ({
    country: c.toLowerCase() as ISOCode,
    value: 1,
  }));

  return (
    <div className="w-full overflow-hidden flex justify-center">
      <WorldMap
        // The library has a finicky size API; "responsive" lets it fill
        // the container width.
        size="responsive"
        // Theme accent for visited; everything else fades into card bg.
        color="var(--glow)"
        backgroundColor="transparent"
        strokeOpacity={0.4}
        // Single bucket — every visited country shares the same fill.
        valueSuffix=""
        richInteraction={false}
        data={data}
        // Slightly muted unvisited fill via low fill on baseline countries.
        styleFunction={({ countryValue, color, minValue, maxValue }) => {
          // Visited: full accent. Unvisited: a faint muted fill so the
          // outline is still visible against a dark card.
          if (countryValue) {
            return {
              fill: "var(--glow)",
              fillOpacity: 0.85,
              stroke: "var(--glow)",
              strokeOpacity: 0.6,
              strokeWidth: 0.4,
            };
          }
          // silence unused-var warning while keeping the lib API tidy
          void color;
          void minValue;
          void maxValue;
          return {
            fill: "var(--muted-foreground)",
            fillOpacity: 0.12,
            stroke: "var(--muted-foreground)",
            strokeOpacity: 0.25,
            strokeWidth: 0.3,
          };
        }}
      />
    </div>
  );
}
