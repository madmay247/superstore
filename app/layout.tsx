import type { Metadata, Viewport } from "next";
import { Hind_Madurai } from "next/font/google";
import AppShell from "./AppShell";
import "./globals.css";
import "./store/store.css";

const hind = Hind_Madurai({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-hind" });

export const metadata: Metadata = {
  title: "AI Storefront Generator",
  description: "Turn a few lines about you into a ready-to-share creator store, with products and INR pricing.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0c1014",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={hind.variable}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
