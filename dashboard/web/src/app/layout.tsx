import AppShell from "@/components/shell/AppShell";
import { SidebarProvider } from "@/context/SidebarContext";
import { THEME_INIT_SCRIPT, ThemeProvider } from "@/context/ThemeContext";
import { loadNav } from "@/lib/nav";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

/* Roobert – jedyny krój identyfikacji iCEA: 400 tekst, 500 nagłówki i liczby. */
const roobert = localFont({
  src: [
    { path: "../fonts/Roobert-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Roobert-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-roobert",
  fallback: ["Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: { default: "Dashboard zaplecza", template: "%s · Dashboard zaplecza" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${roobert.variable} bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-white/90`}>
        <ThemeProvider>
          <SidebarProvider>
            <AppShell nav={loadNav()}>
              {children}
            </AppShell>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
