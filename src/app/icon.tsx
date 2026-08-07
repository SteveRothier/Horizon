import { ImageResponse } from "next/og";
import { HorizonAppIconMark } from "@/components/brand/HorizonAppIconMark";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<HorizonAppIconMark size={32} />, { ...size });
}
