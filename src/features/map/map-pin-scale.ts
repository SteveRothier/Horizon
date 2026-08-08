/** Scale factor for map pins from Leaflet zoom (smaller when zoomed out). */
export function pinScaleForZoom(zoom: number): number {
  if (zoom >= 12) return 1;
  if (zoom >= 10) return 0.9;
  if (zoom >= 8) return 0.78;
  if (zoom >= 6) return 0.65;
  return 0.52;
}
