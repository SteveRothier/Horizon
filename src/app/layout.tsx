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

/** Inlined so it paints before any CSS chunk (App Router may drop a manual <head>). */
const CRITICAL_SCROLL_CSS = `
html,body{margin:0;height:100%;max-height:100dvh;overflow:hidden!important;scrollbar-width:none!important;-ms-overflow-style:none!important}
html::-webkit-scrollbar,body::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}
#main-content,.app-shell{scrollbar-width:none!important;-ms-overflow-style:none!important}
#main-content::-webkit-scrollbar,.app-shell::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className="h-full overflow-hidden"
      style={{ height: "100%", overflow: "hidden" }}
    >
      <body
        className={`${outfit.variable} ${manrope.variable} h-full overflow-hidden font-sans antialiased`}
        style={{ margin: 0, overflow: "hidden", height: "100%" }}
      >
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_SCROLL_CSS }} />
        <QueryProvider>
          <DocumentLang />
          <SkipLink />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
