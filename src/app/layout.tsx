import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "CostoReal — Calculá el precio justo de tus productos",
    template: "%s · CostoReal",
  },
  description:
    "Calculá el precio de venta de tus productos con margen real, costos fijos y punto de equilibrio. Gratis, en pesos argentinos.",
  metadataBase: new URL("https://calculadora-precios-delta.vercel.app"),
  openGraph: {
    type: "website",
    url: "https://calculadora-precios-delta.vercel.app",
    siteName: "CostoReal",
    locale: "es_AR",
    title: "CostoReal — Calculá el precio justo de tus productos",
    description:
      "Ingresá tus costos y conocé tu precio de venta con margen real, costos fijos y punto de equilibrio. Gratis, en pesos argentinos.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CostoReal — Calculá el precio justo de tus productos",
    description:
      "Ingresá tus costos y conocé tu precio de venta con margen real, costos fijos y punto de equilibrio.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
      <Analytics />
    </html>
  );
}
