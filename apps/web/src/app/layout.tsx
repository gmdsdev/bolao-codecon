import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import Providers from "@/components/providers";
import { cn } from "@codecon/ui/lib/utils";
import bolaoLogo from "../assets/images/bolao/bolao-logo.png";
import faviconDark from "../assets/images/favicons/favicon-dark.png";
import faviconLight from "../assets/images/favicons/favicon-light.png";
import "../index.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = (
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined) ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
  "https://bolao.codecon.dev"
).replace(/\/$/, "");

const title = "Bolão da Codecon";
const description =
  "Participe do Bolão da Codecon para a Copa do Mundo FIFA 2026. Crie palpites, acompanhe a classificação em tempo real e dispute com a comunidade Codecon.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: `%s | ${title}`,
  },
  description,
  applicationName: title,
  generator: "Next.js",
  keywords: [
    "Bolão da Codecon",
    "bolão Copa do Mundo 2026",
    "Copa do Mundo FIFA 2026",
    "palpites futebol",
    "bolão online",
    "Codecon",
  ],
  authors: [{ name: "Codecon" }],
  creator: "Codecon",
  publisher: "Codecon",
  category: "sports",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      {
        url: faviconDark.src,
        media: "(prefers-color-scheme: light)",
        type: "image/png",
      },
      {
        url: faviconLight.src,
        media: "(prefers-color-scheme: dark)",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: title,
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: bolaoLogo.src,
        width: bolaoLogo.width,
        height: bolaoLogo.height,
        alt: "Logo do Bolão da Codecon para a Copa do Mundo FIFA 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [
      {
        url: bolaoLogo.src,
        alt: "Logo do Bolão da Codecon para a Copa do Mundo FIFA 2026",
      },
    ],
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={cn("dark font-mono", jetbrainsMono.variable)}
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
