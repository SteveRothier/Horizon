import type { Map as LeafletMap, ZoomPanOptions } from "leaflet";

/** Leaflet throws "Invalid LatLng (NaN, NaN)" when size is 0 or coords are bad. */
export function flyToSafe(
  map: LeafletMap,
  lat: number,
  lon: number,
  options?: ZoomPanOptions & { duration?: number },
) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
  const size = map.getSize();
  if (!size.x || !size.y) {
    map.invalidateSize({ animate: false });
  }
  const zoom = map.getZoom();
  const targetZoom = Number.isFinite(zoom) ? Math.max(zoom, 10) : 10;
  try {
    map.flyTo([lat, lon], targetZoom, options);
  } catch {
    /* ignore mid-layout / zero-size flyTo */
  }
}
