/* Kolory serii i źródeł (hex – ApexCharts wpisuje je w atrybuty SVG, gdzie
   zmienne CSS nie działają). Paleta iCEA: Blue jako główna seria, Orange jako
   seria porównawcza / alarmowa, odcienie Blue i szarości Midnight dla reszty.
   Zielony/czerwony tylko tam, gdzie znaczą „dobrze/źle" (stany, nie marka). */
export const C = {
  brand: "#5768ff",
  brandDark: "#3540c2",
  brandLight: "#a3abff",
  sky: "#8b95ff",
  orange: "#f6704c",
  gray: "#9a9fb5",
  grayDark: "#666c8a",
  success: "#12b76a",
  warning: "#f79009",
  error: "#f04438",
  /* Zgodność z wcześniejszymi nazwami serii – mapowane na paletę marki. */
  violet: "#3540c2",
  teal: "#666c8a",
  pink: "#f6704c",
} as const;

/** Kolor przypisany źródłu danych – kropki na kartach, sparkline'y. */
export const SOURCE_COLOR = {
  senuto: C.brandDark,
  gsc: C.brand,
  ga4: C.sky,
  ahrefs: C.orange,
  bing: C.grayDark,
  clarity: C.brandLight,
  leads: C.orange,
} as const;
