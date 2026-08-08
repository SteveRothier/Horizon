/**
 * RainViewer public radar tiles (no API key).
 * @see https://www.rainviewer.com/api.html
 */

export const RAINVIEWER_MAPS_URL =
  "https://api.rainviewer.com/public/weather-maps.json";

/** Universal Blue palette — readable on dark basemap. */
export const RAINVIEWER_COLOR_SCHEME = 2;

export const RAINVIEWER_TILE_SIZE = 256;

/** Smooth + snow mixed into rain colors. */
export const RAINVIEWER_OPTIONS = "1_1";

export const RAINVIEWER_OPACITY = 0.65;

/** Free tier only serves real radar tiles through zoom 7. */
export const RAINVIEWER_MAX_NATIVE_ZOOM = 7;

/** Allow map zoom beyond native; Leaflet upscales z7 tiles. */
export const RAINVIEWER_MAX_ZOOM = 18;

export const RAINVIEWER_REFRESH_MS = 5 * 60 * 1000;

export const RAINVIEWER_ATTRIBUTION =
  '<a href="https://www.rainviewer.com/" target="_blank" rel="noreferrer">RainViewer</a>';

export type RainViewerFrame = {
  time: number;
  path: string;
};

export type RainViewerMapsResponse = {
  version: string;
  generated: number;
  host: string;
  radar: {
    past: RainViewerFrame[];
    nowcast: RainViewerFrame[];
  };
};

/** Latest past frame path, or null if unavailable. */
export function latestRadarFrame(
  data: RainViewerMapsResponse,
): RainViewerFrame | null {
  const past = data.radar.past;
  if (!past.length) return null;
  return past[past.length - 1] ?? null;
}

/** Leaflet TileLayer URL template for a RainViewer radar frame. */
export function rainviewerTileUrl(
  host: string,
  framePath: string,
  colorScheme = RAINVIEWER_COLOR_SCHEME,
): string {
  const base = host.replace(/\/$/, "");
  const path = framePath.startsWith("/") ? framePath : `/${framePath}`;
  return `${base}${path}/${RAINVIEWER_TILE_SIZE}/{z}/{x}/{y}/${colorScheme}/${RAINVIEWER_OPTIONS}.png`;
}

export async function fetchRainViewerMaps(
  signal?: AbortSignal,
): Promise<RainViewerMapsResponse> {
  const res = await fetch(RAINVIEWER_MAPS_URL, {
    signal,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`RainViewer maps HTTP ${res.status}`);
  }
  return (await res.json()) as RainViewerMapsResponse;
}
