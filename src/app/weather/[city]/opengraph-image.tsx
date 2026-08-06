import { ImageResponse } from "next/og";
import { titleFromSlug } from "@/utils/city-url";

export const runtime = "edge";
export const alt = "Horizon météo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = {
  params: Promise<{ city: string }>;
};

export default async function OpenGraphImage({ params }: Props) {
  const { city } = await params;
  const name = titleFromSlug(city);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(145deg, #3d8fd9 0%, #6bb3e8 48%, #f2b45a 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 36,
            fontWeight: 600,
            letterSpacing: -1,
          }}
        >
          Horizon
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 28, opacity: 0.85 }}>Météo</div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 600,
              letterSpacing: -2,
              lineHeight: 1.05,
            }}
          >
            {name}
          </div>
          <div style={{ fontSize: 28, opacity: 0.8 }}>
            Prévisions · Air · UV · Carte
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
