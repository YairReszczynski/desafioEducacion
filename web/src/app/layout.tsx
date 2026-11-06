import { DemoSwitcher } from "@/components/demo-switcher";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Lato } from "next/font/google";
import localFont from "next/font/local";
import { Suspense } from "react";
import "./globals.css";

const body = Lato({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

// M PLUS Rounded 1c, subset latin autoalojado. Con next/font/google Next descarga
// cientos de fragmentos CJK de esta fuente y el build falla en redes lentas.
const display = localFont({
  variable: "--font-display",
  display: "swap",
  src: [
    { path: "./fonts/mplus-rounded-1c-700-latin.woff2", weight: "700", style: "normal" },
    { path: "./fonts/mplus-rounded-1c-800-latin.woff2", weight: "800", style: "normal" },
  ],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Puente Semanal · Fundación Puente",
  description:
    "Check-in de voz, plan de supervivencia y radar ético para prevenir la deserción temprana. Educación supera la pobreza.",
  applicationName: "Puente Semanal",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Puente Semanal",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#9E1127",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${body.variable} ${display.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Suspense fallback={<div className="h-10 bg-[#1c1b1a]" />}>
          <DemoSwitcher />
        </Suspense>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
