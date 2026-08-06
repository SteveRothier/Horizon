import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-[var(--page-gutter)] py-10 text-[var(--text-primary)]"
      style={{
        background:
          "linear-gradient(145deg, #3d8fd9 0%, #6bb3e8 48%, #f2b45a 100%)",
      }}
    >
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-[var(--glass-radius,22px)] border border-white/20 bg-black/25 px-6 py-8 text-center shadow-lg backdrop-blur-md">
        <p className="font-[family-name:var(--font-horizon-display)] text-5xl font-light tracking-tight">
          404
        </p>
        <h1 className="text-xl font-semibold tracking-tight">Page introuvable</h1>
        <p className="max-w-sm text-sm text-white/80">
          Cette adresse n’existe pas. Cherchez une ville depuis l’accueil.
        </p>
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
        >
          Retour à Horizon
        </Link>
      </div>
    </div>
  );
}
