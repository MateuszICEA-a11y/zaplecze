/* Zakładki sekcji „Treści": odświeżanie istniejących wpisów (Content Watcher)
   i nowe teksty (Content Writer). Jedna pozycja w menu, dwa widoki. */
import { cn } from "@/lib/cn";
import { Eye, PenLine } from "lucide-react";
import Link from "next/link";

const TABS = [
  { slug: "content-watcher", label: "Odświeżanie wpisów", hint: "Content Watcher", Icon: Eye },
  { slug: "content-writer", label: "Nowe teksty", hint: "Content Writer", Icon: PenLine },
] as const;

export default function ContentTabs({ domain, active, enabled }: { domain: string; active: string; enabled: string[] }) {
  const tabs = TABS.filter((t) => enabled.includes(t.slug));
  return (
    <>
      <div className="mb-1 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-title-sm font-medium text-gray-800 dark:text-white/90">Treści</h1>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">Odświeżanie istniejących wpisów i pisanie nowych w jednym miejscu</p>
        </div>
      </div>
      {tabs.length > 1 && (
        <nav className="mt-5 mb-6 flex gap-1 border-b border-gray-200 dark:border-gray-800" aria-label="Widoki treści">
          {tabs.map(({ slug, label, hint, Icon }) => (
            <Link
              key={slug}
              href={`/${domain}/${slug}/`}
              aria-current={active === slug ? "page" : undefined}
              className={cn(
                "-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-theme-sm font-medium",
                active === slug
                  ? "border-brand-500 text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white",
              )}
            >
              <Icon className="size-4" />
              {label}
              <span className="text-theme-xs font-normal text-gray-400">{hint}</span>
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
