/* Kolory serii i źródeł (hex – ApexCharts wpisuje je w atrybuty SVG, gdzie
   zmienne CSS nie działają). Wartości z palety TailAdmina (globals.css). */
export const C = {
  brand: "#465fff",
  brandLight: "#9cb9ff",
  sky: "#0ba5ec",
  violet: "#7a5af8",
  orange: "#fb6514",
  success: "#12b76a",
  warning: "#f79009",
  error: "#f04438",
  pink: "#ee46bc",
  teal: "#15b79e",
  gray: "#98a2b3",
} as const;

/** Kolor przypisany źródłu danych – kropki na kartach, sparkline'y. */
export const SOURCE_COLOR = {
  senuto: C.violet,
  gsc: C.brand,
  ga4: C.sky,
  ahrefs: C.orange,
  bing: C.teal,
  clarity: C.pink,
  leads: C.success,
} as const;
