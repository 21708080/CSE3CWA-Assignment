import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { SITE_NAME } from "@/app/lib/site-config";
import UsageTracker from "@/app/components/usage-tracker";

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: "Teacher-facing phoneme Wordle and Word Search activity builder.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const storedTheme = cookieStore.get("phoneme-builder-theme")?.value;
  const theme =
    storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
      ? storedTheme
      : "light";

  return (
    <html lang="en" data-site-theme={theme} suppressHydrationWarning>
      <body><UsageTracker />{children}</body>
    </html>
  );
}
