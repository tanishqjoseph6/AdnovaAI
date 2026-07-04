import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import RecoveryRedirectHandler from "@/components/auth/RecoveryRedirectHandler";
import { getProductionSiteUrl } from "@/lib/site-url";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#030014",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = new URL(getProductionSiteUrl());
const siteTitle = "Advora AI — AI Ad Generator for High-Converting Campaigns";
const siteDescription =
  "Generate scroll-stopping ad copy, visuals, and multi-channel campaigns in seconds. AI-powered creative for Meta, Google, TikTok, and more.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: "Advora AI",
  title: siteTitle,
  description: siteDescription,
  manifest: "/manifest.json",
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
      { url: "/favicon.ico", sizes: "16x16 32x32", type: "image/x-icon" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/",
    siteName: "Advora AI",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Advora AI - AI Ad Generator for High-Converting Campaigns",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/twitter-image.png",
        alt: "Advora AI - AI Ad Generator for High-Converting Campaigns",
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
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full overflow-x-hidden antialiased">
        <RecoveryRedirectHandler />
        {children}
      </body>
    </html>
  );
}
