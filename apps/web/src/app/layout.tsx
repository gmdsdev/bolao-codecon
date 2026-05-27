import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";

import Providers from "@/components/providers";
import { cn } from "@codecon/ui/lib/utils";
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

export const metadata: Metadata = {
  title: "Bolão da Codecon",
  description: "Sistema de bolão para Copa do Mundo FIFA 2026",
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
      </body>
    </html>
  );
}
