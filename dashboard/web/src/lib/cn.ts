import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/* tailwind-merge nie zna rozmiarów tekstu z motywu (text-theme-xs, text-title-sm…)
   i bez tej konfiguracji traktuje je jak kolor – `text-theme-xs text-success-700`
   gubiło rozmiar. */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["theme-xs", "theme-sm", "theme-xl", "title-sm", "title-md", "title-lg", "title-xl", "title-2xl"] }],
    },
  },
});

/** Łączy klasy Tailwinda z warunkami i rozwiązuje konflikty (jak `cn` w TailAdminie). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}
