import { NextResponse } from "next/server";

/** Shared Cache-Control for weather-related Route Handlers. */
export function cachedJson<T>(
  data: T,
  sMaxAgeSeconds: number,
  init?: ResponseInit,
) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "Cache-Control": `public, s-maxage=${sMaxAgeSeconds}, stale-while-revalidate=${sMaxAgeSeconds * 2}`,
    },
  });
}
