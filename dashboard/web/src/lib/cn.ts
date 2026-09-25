import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Łączy klasy Tailwinda z warunkami i rozwiązuje konflikty (jak `cn` w TailAdminie). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}
