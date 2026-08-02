# Horizon

Application météo moderne (portfolio) — expérience glassmorphism immersive avec fonds dynamiques, prévisions, qualité de l’air et carte interactive.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** + tokens CSS (scènes météo jour/nuit)
- **TanStack Query**, **Zustand** (favoris, historique, settings + `localStorage`)
- **Framer Motion**, **Leaflet** / **react-leaflet**
- APIs : **Open-Meteo** (principal), **OpenWeather** (fallback optionnel), **Nominatim** (géocodage)

## Démarrage

```bash
npm install
cp .env.example .env.local
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

La clé OpenWeather est **optionnelle** : sans elle, Horizon tourne uniquement sur Open-Meteo.

## Variables d’environnement

| Variable | Obligatoire | Description |
| -------- | ----------- | ----------- |
| `OPENWEATHER_API_KEY` | Non | Clé [OpenWeather](https://openweathermap.org/api) pour le fallback météo / AQI si Open-Meteo échoue |

Voir `.env.example`.

## Architecture

```
UI (dashboard, carte, favoris)
  → TanStack Query  →  /api/weather | /api/geocode | /api/air-quality
  → Zustand         →  localStorage (settings, favoris, historique, ville)
API routes
  → Nominatim (ville ↔ coords)
  → Open-Meteo (current, hourly, daily, UV, AQI)
  → OpenWeather (fallback si clé présente)
```

- URLs SEO partageables : `/weather/[city]` (ex. `/weather/paris`)
- Unités : °C/°F, km/h·mph (visibilité km/mi)
- i18n UI : FR / EN (store `locale`)

## Structure

```
src/
  app/           # routes App Router + API + /weather/[city]
  components/    # layout, UI, providers
  features/      # weather, forecast, map, favorites, history, background…
  hooks/
  i18n/          # dictionnaires FR/EN
  services/      # Open-Meteo, OpenWeather, Nominatim, client-api
  stores/        # Zustand + persist
  types/
  utils/
  constants/
  styles/
```

## Scripts

| Commande        | Description        |
| --------------- | ------------------ |
| `npm run dev`   | Dev (Turbopack)    |
| `npm run build` | Build production   |
| `npm run start` | Serveur prod       |
| `npm run lint`  | ESLint             |

## Déploiement Vercel

1. Importer le dépôt sur [Vercel](https://vercel.com).
2. Framework : **Next.js** (détecté automatiquement).
3. Dans **Project Settings → Environment Variables**, ajouter si besoin :
   - `OPENWEATHER_API_KEY` = votre clé (Production / Preview / Development selon besoin)
4. Déployer. Aucune config `vercel.json` n’est requise.

L’app fonctionne **sans** `OPENWEATHER_API_KEY` (Open-Meteo seul).

## Accessibilité & responsive

- Skip link, focus visible, combobox recherche au clavier
- Sidebar en drawer mobile (`Escape` pour fermer)
- Breakpoints cibles : ~390 / 768 / 1280 / 1440
- Carte Leaflet visible à partir de 1280px
