import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ScrollEffects } from "./scroll-effects";

export const metadata: Metadata = {
  title: {
    default: "APTIVIO | Learn, Think, Improve",
    template: "%s | APTIVIO",
  },
  description:
    "Explore useful knowledge, practise reasoning and track your progress with APTIVIO.",
  applicationName: "APTIVIO",
  openGraph: {
    type: "website",
    siteName: "APTIVIO",
    title: "APTIVIO | Knowledge That Moves You Forward",
    description: "Learn more. Think better. Go further.",
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
      <body><ScrollEffects />{children}</body>
    </html>
  );
}
