import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "APTIVIO | Knowledge That Moves You Forward",
    template: "%s | APTIVIO",
  },
  description:
    "Build practical skills through structured, accessible online learning with APTIVIO.",
  applicationName: "APTIVIO",
  metadataBase: new URL("https://aptivio.com"),
  openGraph: {
    type: "website",
    siteName: "APTIVIO",
    title: "APTIVIO | Knowledge That Moves You Forward",
    description: "Practical learning. Clear progress. A stronger future.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#101c2c",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
