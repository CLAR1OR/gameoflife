import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSession } from "@/lib/auth-server";
import { getUserSettings } from "@/modules/settings/queries";
import { DEFAULT_THEME, isValidTheme } from "@/lib/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Game of Life",
  description: "Gamify your life with skill trees, habits, and achievements",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Resolve the user's theme on the server so the right palette is in
  // place on first paint — no flash of default theme.
  let theme: string = DEFAULT_THEME;
  try {
    const session = await getSession();
    if (session) {
      const settings = await getUserSettings(session.user.id);
      if (settings.theme && isValidTheme(settings.theme)) {
        theme = settings.theme;
      }
    }
  } catch {
    // unauthenticated or DB error → default theme
  }

  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // Theme attribute is computed from the session cookie at request time.
      // Dev tools (or browsers in some configs) inject `data-*` attributes on
      // <html> after the server response, which React's strict hydration
      // diff flags as a mismatch even though our markup is correct. This is
      // the standard next-themes / nextjs theme pattern.
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
