import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PreferenceBootScript } from "@/components/theme/PreferenceBootScript";

export const metadata: Metadata = {
  title: { default: "WordleStyle", template: "%s | WordleStyle" },
  description:
    "A phoneme-based classroom activity builder for Wordle and Word Search activities.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <PreferenceBootScript />
      </head>
      <body>
        <div className="app-shell">
          <Header />
          <main>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
