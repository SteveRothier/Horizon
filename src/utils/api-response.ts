import { NextResponse } from "next/server";
import type { ApiErrorBody } from "@/types/api";
import { AppApiError } from "@/types/api";

export function jsonError(error: unknown): NextResponse<ApiErrorBody> {
  if (error instanceof AppApiError) {
    return NextResponse.json(
      { error: true, code: error.code, message: error.message },
      { status: error.status },
    );
  }

  console.error(error);
  return NextResponse.json(
    {
      error: true,
      code: "UNKNOWN",
      message: "Une erreur inattendue est survenue.",
    },
    { status: 500 },
  );
}

export function parseCoord(value: string | null, name: string): number {
  if (value == null || value === "") {
    throw new AppApiError(
      "BAD_REQUEST",
      `Paramètre « ${name} » requis.`,
      400,
    );
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new AppApiError(
      "BAD_REQUEST",
      `Paramètre « ${name} » invalide.`,
      400,
    );
  }
  return n;
}
