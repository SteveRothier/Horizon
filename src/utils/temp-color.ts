/** White → yellow → orange stroke for the glass theme. */
const STOPS: { t: number; r: number; g: number; b: number }[] = [
  { t: 0, r: 255, g: 255, b: 255 },
  { t: 0.3, r: 250, g: 240, b: 200 },
  { t: 0.55, r: 250, g: 204, b: 21 },
  { t: 0.75, r: 251, g: 146, b: 60 },
  { t: 1, r: 249, g: 115, b: 22 },
];

function lerpChannel(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

export function tempStrokeColor(
  temp: number,
  min: number,
  max: number,
): string {
  const span = max - min || 1;
  const norm = Math.min(1, Math.max(0, (temp - min) / span));

  let lower = STOPS[0];
  let upper = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (norm >= STOPS[i].t && norm <= STOPS[i + 1].t) {
      lower = STOPS[i];
      upper = STOPS[i + 1];
      break;
    }
  }

  const local =
    upper.t === lower.t ? 0 : (norm - lower.t) / (upper.t - lower.t);

  const r = lerpChannel(lower.r, upper.r, local);
  const g = lerpChannel(lower.g, upper.g, local);
  const b = lerpChannel(lower.b, upper.b, local);
  return `rgb(${r}, ${g}, ${b})`;
}
