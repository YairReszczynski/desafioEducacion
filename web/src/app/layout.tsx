import { DemoSwitcher } from "@/components/demo-switcher";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Lato, M_PLUS_Rounded_1c } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

const body = Lato({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const display = M_PLUS_Rounded_1c({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
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
