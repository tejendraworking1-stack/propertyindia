import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./home.css"; // original homepage stylesheet, carried over verbatim
import "./part1-overrides.css"; // approved Part 1 deviations (Featured: 4 cards at >=1280px)

const TITLE = "PropertyIndia – Rent, PG & Land Lease | Zero Brokerage";
const DESCRIPTION =
  "Find rental homes, PGs and land/plot leases directly from verified owners. Zero brokerage.";
const SITE = "https://www.propertyindia.com/";
const OG_IMAGE = "https://www.propertyindia.com/og-image.jpg";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: SITE },
  icons: {
    icon: { url: "/favicon.svg", type: "image/svg+xml" },
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  openGraph: {
    type: "website",
    siteName: "PropertyIndia",
    locale: "en_IN",
    url: SITE,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "only light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
