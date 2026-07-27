import type { Metadata } from "next";
import { Outfit, Manrope } from "next/font/google";
import { SkipLink } from "@/components/a11y/SkipLink";
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
        <QueryProvider>
          <DocumentLang />
          <SkipLink />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
