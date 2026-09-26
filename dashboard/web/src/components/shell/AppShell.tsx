"use client";

/* Szkielet TailAdmina: zwijany pasek boczny + nagłówek + treść. Pasek pokazuje
   przełącznik domen i sekcje wybranej domeny (Content Watcher i Writer jako
   jedna pozycja „Treści"). */
import IceaLogo from "@/components/shell/IceaLogo";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/context/ThemeContext";
import type { NavDomain } from "@/lib/nav";
import { cn } from "@/lib/cn";
import {
  Bot,
  ChartNoAxesColumn,
  ChartPie,
  ChevronDown,
  Eye,
  Grid3x3,
  LayoutDashboard,
  Link2,
  Menu,
  Moon,
  MousePointerClick,
  PenLine,
  Radar,
  Search,
  Settings,
  Sparkles,
  Sun,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "": LayoutDashboard,
  senuto: ChartNoAxesColumn,
  gsc: Search,
  ga4: ChartPie,
  bing: Radar,
  ahrefs: Link2,
  clarity: MousePointerClick,
  "boty-ai": Bot,
  matrix: Grid3x3,
  asystent: Sparkles,
  "content-watcher": Eye,
  "content-writer": PenLine,
  leady: Users,
};

function useLocation(nav: NavDomain[]) {
  const pathname = usePathname();
  const [first, second = ""] = pathname.split("/").filter(Boolean);
  const domain = nav.find((d) => d.id === first) ?? null;
  return { pathname, domain, section: domain ? second : null };
}

export default function AppShell({ nav, children }: { nav: NavDomain[]; children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen, toggleMobileSidebar } = useSidebar();
  const wide = isExpanded || isHovered || isMobileOpen;

  return (
    <div className="min-h-screen xl:flex">
      <Sidebar nav={nav} />
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-gray-900/50 xl:hidden" onClick={toggleMobileSidebar} />
      )}
      <div
        className={cn(
          "min-w-0 flex-1 transition-all duration-300 ease-in-out",
          wide && !isMobileOpen ? "xl:ml-72.5" : "xl:ml-22.5",
        )}
      >
        <Header nav={nav} />
        <main className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

function Sidebar({ nav }: { nav: NavDomain[] }) {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { pathname, domain, section } = useLocation(nav);
  const current = domain ?? nav[0];
  const wide = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-50 flex h-full flex-col border-r border-white/5 bg-gray-950 px-4 text-white/90 transition-all duration-300 ease-in-out",
        wide ? "w-72.5" : "w-22.5",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        "xl:translate-x-0",
      )}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn("flex items-center gap-3 py-7", !wide && "xl:justify-center")}>
        <Link href="/" className="flex flex-col gap-2 text-gray-50" aria-label="Dashboard zaplecza – strona główna">
          <IceaLogo className={wide ? "h-6 w-auto" : "h-3 w-auto"} />
          {wide && <span className="text-theme-sm text-gray-400">Dashboard zaplecza SEO</span>}
        </Link>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto pb-6">
        {wide && <DomainSwitcher nav={nav} current={current} section={section} />}

        <nav className="mt-5">
          <h2
            className={cn(
              "mb-3 flex text-theme-xs leading-5 text-gray-400",
              !wide && "xl:justify-center",
            )}
          >
            {wide ? `Sekcje · ${current.name}` : "•••"}
          </h2>
          <ul className="flex flex-col gap-1">
            {current.sections.map((item) => {
              const Icon = ICONS[item.slug] ?? LayoutDashboard;
              const active = domain?.id === current.id && section !== null && item.match.includes(section);
              return (
                <li key={item.slug}>
                  <Link
                    href={item.href}
                    title={wide ? undefined : item.label}
                    className={cn(
                      "group menu-item",
                      active ? "menu-item-active" : "menu-item-inactive",
                      !wide && "xl:justify-center",
                    )}
                  >
                    <Icon
                      className={cn("size-5 shrink-0", active ? "menu-item-icon-active" : "menu-item-icon-inactive")}
                    />
                    {wide && (
                      <>
                        <span className="menu-item-text">{item.label}</span>
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <h2
            className={cn(
              "mt-7 mb-3 flex text-theme-xs leading-5 text-gray-400",
              !wide && "xl:justify-center",
            )}
          >
            {wide ? "Konto" : "•••"}
          </h2>
          <ul className="flex flex-col gap-1">
            <li>
              <Link
                href="/"
                title={wide ? undefined : "Domeny i kredyty"}
                className={cn(
                  "group menu-item",
                  pathname === "/" ? "menu-item-active" : "menu-item-inactive",
                  !wide && "xl:justify-center",
                )}
              >
                <Wallet
                  className={cn(
                    "size-5 shrink-0",
                    pathname === "/" ? "menu-item-icon-active" : "menu-item-icon-inactive",
                  )}
                />
                {wide && <span className="menu-item-text">Domeny i kredyty</span>}
              </Link>
            </li>
            <li>
              <Link
                href="/system/"
                title={wide ? undefined : "System i limity"}
                className={cn(
                  "group menu-item",
                  pathname === "/system/" || pathname === "/system" ? "menu-item-active" : "menu-item-inactive",
                  !wide && "xl:justify-center",
                )}
              >
                <Settings
                  className={cn(
                    "size-5 shrink-0",
                    pathname.startsWith("/system") ? "menu-item-icon-active" : "menu-item-icon-inactive",
                  )}
                />
                {wide && <span className="menu-item-text">System i limity</span>}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
}

/* Przełącznik domen – przenosi na tę samą sekcję drugiej domeny, jeśli ją ma. */
function DomainSwitcher({
  nav,
  current,
  section,
}: {
  nav: NavDomain[];
  current: NavDomain;
  section: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const target = (domain: NavDomain) => {
    const same = domain.sections.find((s) => s.match.includes(section ?? ""));
    return same?.href ?? `/${domain.id}/`;
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded border border-white/10 bg-white/5 px-3 py-2.5 text-left transition hover:border-white/20"
      >
        <DomainAvatar id={current.id} />
        <span className="min-w-0 flex-1">
          <span className="block text-theme-xs text-gray-400">Domena</span>
          <span className="block truncate text-sm font-medium text-white">{current.name}</span>
        </span>
        <ChevronDown className={cn("size-4 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="absolute inset-x-0 top-full z-10 mt-2 rounded border border-white/10 bg-gray-900 p-1.5 shadow-theme-lg">
          {nav.map((domain) => (
            <li key={domain.id}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push(target(domain));
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm",
                  domain.id === current.id ? "bg-white/8 text-white" : "text-gray-300 hover:bg-white/5 hover:text-white",
                )}
              >
                <DomainAvatar id={domain.id} small />
                {domain.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DomainAvatar({ id, small = false }: { id: string; small?: boolean }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded bg-brand-500 font-medium text-gray-950 uppercase",
        small ? "size-6 text-xs" : "size-8 text-sm",
      )}
    >
      {id.charAt(0)}
    </span>
  );
}

function Header({ nav }: { nav: NavDomain[] }) {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const { domain, section } = useLocation(nav);
  const sectionLabel = domain?.sections.find((s) => s.match.includes(section ?? ""))?.label;

  return (
    <header className="sticky top-0 z-30 flex w-full border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
      <div className="flex w-full items-center gap-3 px-3 py-3 sm:gap-4 xl:px-6 xl:py-4">
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 lg:size-11 dark:border-gray-800 dark:text-gray-400"
          onClick={() => (window.innerWidth >= 1280 ? toggleSidebar() : toggleMobileSidebar())}
          aria-label="Przełącz pasek boczny"
        >
          {isMobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <nav className="min-w-0 flex-1 text-sm" aria-label="Okruszki">
          <ol className="flex items-center gap-1.5 truncate">
            <li>
              <Link href="/" className="text-gray-500 hover:text-brand-500 dark:text-gray-400">
                Zaplecze
              </Link>
            </li>
            {domain && (
              <>
                <li className="text-gray-300 dark:text-gray-600">/</li>
                <li>
                  <Link href={`/${domain.id}/`} className="text-gray-500 hover:text-brand-500 dark:text-gray-400">
                    {domain.name}
                  </Link>
                </li>
              </>
            )}
            {sectionLabel && section && (
              <>
                <li className="text-gray-300 dark:text-gray-600">/</li>
                <li className="truncate font-medium text-gray-800 dark:text-white/90">{sectionLabel}</li>
              </>
            )}
          </ol>
        </nav>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Włącz jasny motyw" : "Włącz ciemny motyw"}
          className="flex size-11 items-center justify-center rounded border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
      </div>
    </header>
  );
}
