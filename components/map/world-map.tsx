"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
// Leaflet CSS is imported globally via app/globals.css to ensure it loads
// before any tile renders (Tailwind preflight + Turbopack interaction
// would otherwise leave us with squashed tiles + invisible cursor).

export type MapPin = {
  id: string;
  kind: "place" | "friend";
  name: string;
  subtitle?: string;
  lat: number;
  lng: number;
  href?: string;
  /** Custom marker emoji — friends often use initials, places use 📍. */
  marker?: string;
};

export type MapClickInfo = {
  lat: number;
  lng: number;
};

/**
 * Lightweight Leaflet world map. Server-rendered as an empty div, then
 * Leaflet hydrates it client-side. Only re-creates the map on first
 * mount; subsequent prop changes diff markers.
 */
export function WorldMap({
  pins,
  height = 480,
  initialZoom = 2,
  onMapClick,
  addMode = false,
}: {
  pins: MapPin[];
  height?: number;
  initialZoom?: number;
  /** Called when the user left-clicks on empty map (not on a pin). */
  onMapClick?: (info: MapClickInfo) => void;
  /** When true the cursor becomes a crosshair and the popup hint says
   * "click to drop a pin here". */
  addMode?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    // React 18+ StrictMode double-mounts in dev, leaving _leaflet_id on the
    // container after the first mount's cleanup. Calling L.map() on a
    // dirty container throws "Map container is already initialized" — which
    // would silently break the entire map. Clear the marker first.
    interface LeafletyDiv extends HTMLDivElement {
      _leaflet_id?: number;
    }
    const dirty = container as LeafletyDiv;
    if (dirty._leaflet_id) {
      // Remove existing leaflet DOM artifacts.
      while (container.firstChild) container.removeChild(container.firstChild);
      delete dirty._leaflet_id;
    }

    const map = L.map(container, {
      worldCopyJump: true,
      attributionControl: true,
      zoomControl: true,
      preferCanvas: true,
    }).setView([20, 0], initialZoom);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    map.on("click", (e: L.LeafletMouseEvent) => {
      onMapClickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    // Tile layers measure the container at init; if the container had
    // height 0 at that moment (which can happen behind dynamic-imports +
    // hydration), Leaflet draws nothing. Force a size recalc on the next
    // frame to be safe.
    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, [initialZoom]);

  // Toggle the crosshair cursor class when add-mode flips.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (addMode) {
      el.classList.add("gol-add-mode");
    } else {
      el.classList.remove("gol-add-mode");
    }
  }, [addMode]);

  // Sync pins.
  useEffect(() => {
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;

    layer.clearLayers();

    if (pins.length === 0) return;

    for (const p of pins) {
      const icon = L.divIcon({
        className: "gol-map-pin",
        html: pinHtml(p),
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });
      const marker = L.marker([p.lat, p.lng], { icon, title: p.name });
      const popup = `
        <div style="font-family: var(--font-sans); min-width: 160px;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 2px;">
            ${escapeHtml(p.name)}
          </div>
          ${
            p.subtitle
              ? `<div style="font-size: 11px; color: #94a3b8;">${escapeHtml(p.subtitle)}</div>`
              : ""
          }
          ${
            p.href
              ? `<a href="${escapeHtml(p.href)}" style="display: inline-block; margin-top: 6px; font-size: 11px; color: var(--glow);">Open →</a>`
              : ""
          }
        </div>
      `;
      marker.bindPopup(popup);
      marker.addTo(layer);
    }

    // Fit to all pins on initial pin-population.
    if (pins.length > 1) {
      const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds.pad(0.2), { animate: false });
    } else if (pins.length === 1) {
      map.setView([pins[0].lat, pins[0].lng], 4, { animate: false });
    }
  }, [pins]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg overflow-hidden border border-border bg-card"
      style={{ height: `${height}px` }}
    />
  );
}

function pinHtml(p: MapPin): string {
  const bg =
    p.kind === "friend"
      ? "color-mix(in srgb, var(--glow-purple) 80%, black)"
      : "color-mix(in srgb, var(--glow) 80%, black)";
  const ring = p.kind === "friend" ? "var(--glow-purple)" : "var(--glow)";
  const label = p.marker ?? (p.kind === "friend" ? "👤" : "📍");
  return `
    <div style="
      width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      background: ${bg};
      border: 2px solid ${ring};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    ">
      <span style="
        transform: rotate(45deg);
        font-size: 14px;
        line-height: 1;
      ">${escapeHtml(label)}</span>
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
