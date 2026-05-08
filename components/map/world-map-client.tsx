"use client";

import dynamic from "next/dynamic";
import type { MapPin, MapClickInfo } from "./world-map";

/**
 * Dynamic-import wrapper so Leaflet's window-only code never hits SSR.
 * Use this from any server component instead of importing WorldMap directly.
 */
const WorldMap = dynamic(
  () => import("./world-map").then((m) => m.WorldMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full rounded-lg border border-border bg-card flex items-center justify-center text-xs font-mono text-muted-foreground"
        style={{ height: "480px" }}
      >
        Loading map…
      </div>
    ),
  }
);

export function WorldMapClient(props: {
  pins: MapPin[];
  height?: number;
  initialZoom?: number;
  onMapClick?: (info: MapClickInfo) => void;
  addMode?: boolean;
}) {
  return <WorldMap {...props} />;
}

export type { MapPin, MapClickInfo };
