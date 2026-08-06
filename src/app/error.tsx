"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-[var(--page-gutter)] py-10 text-[var(--text-primary)]"
      style={{
        background:
          "linear-gradient(145deg, #3d8fd9 0%, #6bb3e8 48%, #f2b45a 100%)",
      }}
    >
      <div
        className="flex w-full max-w-md flex-col items-center gap-4 rounded-[var(--glass-radius,22px)] border border-white/20 bg-black/25 px-6 py-8 text-center shadow-lg backdrop-blur-md"
        role="alert"
      >
        <AlertCircle className="h-8 w-8 text-red-200" aria-hidden />
        <h1 className="font-[family-name:var(--font-horizon-display)] text-xl font-semibold tracking-tight">
          Une erreur est survenue
        </h1>
        <p className="max-w-sm text-sm text-white/80">
          Impossible d’afficher cette page. Réessayez ou revenez à l’accueil.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Réessayer
          </button>
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
          >
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
