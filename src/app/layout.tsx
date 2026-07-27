import type { Metadata } from "next";
import { Outfit, Manrope } from "next/font/google";
import { DocumentLang } from "@/components/providers/DocumentLang";
import { QueryProvider } from "@/components/providers/QueryProvider";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-horizon-display",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-horizon",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Horizon",
    template: "%s | Horizon",
  },
  description:
    "Application météo moderne — expérience immersive glassmorphism",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${outfit.variable} ${manrope.variable} font-sans antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-zinc-900"
        >
          Aller au contenu
        </a>
        <QueryProvider>
          <DocumentLang />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
