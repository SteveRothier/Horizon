# Horizon

Application météo moderne (portfolio) — Next.js 15, React 19, TypeScript, Tailwind CSS.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS**
- **Framer Motion**, **TanStack Query**, **Zustand**
- **Recharts**, **Leaflet** / **react-leaflet**
- APIs : Open-Meteo, OpenWeather (fallback), Nominatim

## Démarrage

```bash
npm install
cp .env.example .env.local
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Structure

```
src/
  app/           # routes App Router + API
  components/    # UI partagée
  features/      # modules métier (weather, forecast, map…)
  hooks/
  services/      # clients API
  stores/        # Zustand
  types/
  utils/
  constants/
  styles/
public/
  assets/
```

## Scripts

| Commande     | Description        |
| ------------ | ------------------ |
| `npm run dev`   | Dev (Turbopack) |
| `npm run build` | Build production |
| `npm run start` | Serveur prod     |
| `npm run lint`  | ESLint           |
