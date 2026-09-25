import AppShell from "@/components/shell/AppShell";
import { SidebarProvider } from "@/context/SidebarContext";
import { THEME_INIT_SCRIPT, ThemeProvider } from "@/context/ThemeContext";
import { LEGACY_URL, loadNav } from "@/lib/nav";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin", "latin-ext"], variable: "--font-outfit-next" });

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
      <body className={`${outfit.className} bg-gray-50 dark:bg-gray-950`}>
        <ThemeProvider>
          <SidebarProvider>
            <AppShell nav={loadNav()} legacyUrl={LEGACY_URL}>
              {children}
            </AppShell>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
