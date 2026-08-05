import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { WeatherDashboard } from "@/features/weather/WeatherDashboard";
import { dehydrateCityWeather } from "@/features/weather/dehydrateCityWeather";
import { titleFromSlug } from "@/utils/city-url";

type PageProps = {
  params: Promise<{ city: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { city } = await params;
  const name = titleFromSlug(city);

  return {
    title: `Météo ${name}`,
    description: `Prévisions météo actuelles, horaires et sur 7 jours pour ${name}. Air quality, UV et carte interactive.`,
    openGraph: {
      title: `Météo ${name} | Horizon`,
      description: `Prévisions météo pour ${name}`,
      type: "website",
    },
  };
}

export default async function CityWeatherPage({ params }: PageProps) {
  const { city } = await params;
  const state = await dehydrateCityWeather(city);

  const dashboard = <WeatherDashboard citySlug={city} />;

  if (!state) return dashboard;

  return (
    <HydrationBoundary state={state}>{dashboard}</HydrationBoundary>
  );
}
