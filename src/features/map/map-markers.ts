import L from "leaflet";

/** Active city — Horizon brand mark as map pin. */
export const horizonActiveIcon = L.divIcon({
  className: "map-pin-horizon",
  iconSize: [28, 34],
  iconAnchor: [14, 32],
  popupAnchor: [0, -28],
  html: `<div class="map-pin-horizon-inner" aria-hidden="true">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="24" height="24">
      <defs>
        <linearGradient id="hp-bg" x1="16" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
          <stop stop-color="#1a2744"/>
          <stop offset="1" stop-color="#0b1226"/>
        </linearGradient>
        <linearGradient id="hp-sun" x1="16" y1="10" x2="16" y2="20" gradientUnits="userSpaceOnUse">
          <stop stop-color="#ffe59a"/>
          <stop offset="1" stop-color="#f0a830"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#hp-bg)"/>
      <circle cx="16" cy="20" r="6.5" fill="url(#hp-sun)"/>
      <rect x="3" y="20" width="26" height="9" rx="1.5" fill="#0b1226"/>
      <rect x="3" y="20" width="26" height="2" rx="1" fill="#9ec9f0" fill-opacity="0.9"/>
    </svg>
    <span class="map-pin-horizon-tip"></span>
  </div>`,
});

/** Preview / click pin — neutral. */
export const previewPinIcon = L.divIcon({
  className: "map-pin-preview",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10],
  html: `<div class="map-pin-preview-dot" aria-hidden="true"></div>`,
});

/** Favorite city pin — star badge. */
export const favoritePinIcon = L.divIcon({
  className: "map-pin-favorite",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
  html: `<div class="map-pin-favorite-inner" aria-hidden="true">
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.77l-5.8 3.05 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z"/>
    </svg>
  </div>`,
});
