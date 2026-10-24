import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  // Graceful editorial fallback if Google Fonts is unreachable.
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const metadata: Metadata = {
  title: "TrendLens — See through the hype",
  description:
    "Multi-marketplace fashion shopping intelligence. TrendLens reads listings and reviews across Daraz, Amazon, AliExpress and Instagram/TikTok, filters fake hype, and hands you a balanced verdict.",
  keywords: [
    "TrendLens",
    "shopping intelligence",
    "fake review detection",
    "price intelligence",
    "fashion",
  ],
  openGraph: {
    title: "TrendLens — See through the hype",
    description:
      "Sentiment, fake-review radar, price intelligence, fit signals and a balanced verdict for fashion products.",
    siteName: "TrendLens",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
