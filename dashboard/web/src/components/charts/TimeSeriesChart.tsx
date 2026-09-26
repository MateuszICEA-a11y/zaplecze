"use client";

/* Wykres serii czasowych na ApexCharts (TailAdmin „StatisticsChart"):
   oś dat, wiele serii, opcjonalna druga oś Y, odwrócona oś (pozycja w Google). */
import { Card, EmptyState } from "@/components/ui";
import { useTheme } from "@/context/ThemeContext";
import type { ApexOptions } from "apexcharts";

type YAxis = Exclude<NonNullable<ApexOptions["yaxis"]>, unknown[]>;
import dynamic from "next/dynamic";
import { useMemo } from "react";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <div className="h-full animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />,
});

export interface ChartSeries {
  label: string;
  values: (number | null)[];
  color: string;
  /** Wypełnienie gradientem pod linią (seria główna). */
  fill?: boolean;
  dashed?: boolean;
}

export interface TimeSeriesChartProps {
  title: string;
  meta?: string;
  /** Uniksowe sekundy. */
  timestamps: number[];
  series: ChartSeries[];
  precision?: number;
  secondaryAxis?: boolean;
  invert?: boolean;
  unit?: string;
  height?: number;
  /** Miesięczne punkty – etykiety osi i tooltipa bez dnia. */
  monthly?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

const fmt = (value: number, precision: number) =>
  value.toLocaleString("pl-PL", { maximumFractionDigits: precision, useGrouping: "always" });

const MONTHS = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

export default function TimeSeriesChart({
  title,
  meta,
  timestamps,
  series,
  precision = 0,
  secondaryAxis = false,
  invert = false,
  unit = "",
  height = 260,
  monthly = false,
  emptyTitle,
  emptyDescription,
}: TimeSeriesChartProps) {
  const { theme } = useTheme();
  const points = series.reduce((n, s) => n + s.values.filter((v) => typeof v === "number").length, 0);
  const hasData = points >= 2 * Math.max(1, series.filter((s) => s.values.some((v) => typeof v === "number")).length);

  const options = useMemo<ApexOptions>(() => {
    const label = (value: number) => `${fmt(value, precision)}${unit ? ` ${unit}` : ""}`;
    const axis = (index: number): YAxis => ({
      seriesName: secondaryAxis ? series[index]?.label : undefined,
      opposite: index === 1,
      reversed: invert,
      forceNiceScale: true,
      // Liczniki od zera – inaczej mała zmiana wygląda na przepaść. Pozycja (invert) nie.
      min: invert ? undefined : 0,
      labels: {
        formatter: (v: number) => (typeof v === "number" ? fmt(v, v < 10 ? precision : 0) : ""),
        style: { fontSize: "12px" },
      },
    });
    return {
      chart: {
        type: "area",
        fontFamily: "inherit",
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: false },
        background: "transparent",
        parentHeightOffset: 0,
      },
      theme: { mode: theme },
      colors: series.map((s) => s.color),
      stroke: { curve: monthly ? "straight" : "smooth", width: series.map((s) => (s.fill ? 2.4 : 1.8)), dashArray: series.map((s) => (s.dashed ? 5 : 0)) },
      fill: {
        type: series.map((s) => (s.fill ? "gradient" : "solid")),
        opacity: series.map((s) => (s.fill ? 1 : 0)),
        gradient: { opacityFrom: 0.35, opacityTo: 0, stops: [0, 95] },
      },
      markers: { size: monthly ? 3.5 : 0, strokeWidth: 2, strokeColors: theme === "dark" ? "#000623" : "#fff", hover: { size: 5 } },
      grid: {
        borderColor: theme === "dark" ? "#1b2143" : "#f0f1f5",
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { left: 4, right: 8 },
      },
      dataLabels: { enabled: false },
      legend: {
        show: series.length > 1,
        position: "top",
        horizontalAlign: "left",
        fontSize: "12px",
        markers: { size: 5, offsetX: -2 },
        itemMargin: { horizontal: 8 },
      },
      xaxis: {
        type: "datetime",
        axisBorder: { show: false },
        axisTicks: { show: false },
        tooltip: { enabled: false },
        labels: {
          datetimeUTC: true,
          style: { fontSize: "12px" },
          formatter: (_value: string, ts?: number) => {
            if (typeof ts !== "number") return "";
            const d = new Date(ts);
            return monthly
              ? `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`
              : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
          },
        },
      },
      yaxis: secondaryAxis ? series.map((_, i) => ({ ...axis(Math.min(i, 1)), show: i < 2 })) : axis(0),
      tooltip: {
        shared: true,
        intersect: false,
        theme,
        x: {
          formatter: (ts: number) =>
            new Date(ts).toLocaleDateString("pl-PL", {
              timeZone: "UTC",
              ...(monthly ? { month: "long", year: "numeric" } : { day: "numeric", month: "long", year: "numeric" }),
            }),
        },
        y: { formatter: (v: number) => (typeof v === "number" ? label(v) : "–") },
      },
    };
  }, [theme, series, precision, secondaryAxis, invert, unit, monthly]);

  const apexSeries = useMemo(
    () =>
      series.map((s) => ({
        name: s.label,
        data: timestamps.map((ts, i) => [ts * 1000, s.values[i] ?? null] as [number, number | null]),
      })),
    [series, timestamps],
  );

  return (
    <Card className="flex min-w-0 flex-col px-5 pt-5 pb-3">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h3 className="text-base font-medium text-gray-800 dark:text-white/90">{title}</h3>
        {meta && <span className="text-theme-xs text-gray-500 dark:text-gray-400">{meta}</span>}
      </div>
      <div style={{ height }} className="-mx-2">
        {hasData ? (
          <Chart key={theme} options={options} series={apexSeries} type="area" height={height} />
        ) : (
          <EmptyState title={emptyTitle ?? "Za mało danych"}>
            {emptyDescription ?? "Wykres pojawi się po kolejnych pomiarach collectora."}
          </EmptyState>
        )}
      </div>
    </Card>
  );
}
