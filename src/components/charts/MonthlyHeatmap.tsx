"use client";

import type { MonthlyStats } from "../../lib/analytics/aggregator";

interface MonthlyHeatmapProps {
  data: MonthlyStats[];
}

export function MonthlyHeatmap({ data }: MonthlyHeatmapProps) {
  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center rounded-xl border border-dashed border-[#1e2235]">
        <p className="text-sm text-slate-400">Belum ada data bulanan</p>
      </div>
    );
  }

  const currentMonth = data[data.length - 1];
  const daysInMonth = new Date(
    Number(currentMonth.month.split("-")[0]),
    Number(currentMonth.month.split("-")[1]),
    0
  ).getDate();

  const dayMap = new Map(
    currentMonth.dailyBreakdown.map((d) => [d.date, d])
  );

  const maxPages = Math.max(
    ...currentMonth.dailyBreakdown.map((d) => d.pages),
    1
  );

  const cells = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentMonth.month}-${String(day).padStart(2, "0")}`;
    const dayData = dayMap.get(dateStr);
    const intensity = dayData ? dayData.pages / maxPages : 0;
    const bgColor = dayData
      ? `rgba(99, 102, 241, ${0.2 + intensity * 0.8})`
      : "#1e2235";

    cells.push({
      day,
      dateStr,
      pages: dayData?.pages || 0,
      minutes: dayData?.minutes || 0,
      bgColor,
    });
  }

  const monthLabel = new Date(currentMonth.month + "-01").toLocaleDateString(
    "id-ID",
    { month: "long", year: "numeric" }
  );

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">{monthLabel}</h3>
      <div
        className="grid grid-cols-7 gap-1.5"
        role="grid"
        aria-label={`Heatmap membaca ${monthLabel}`}
      >
        {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
          <div
            key={d}
            className="text-center text-[10px] text-slate-500 font-medium py-1"
            role="columnheader"
          >
            {d}
          </div>
        ))}
        {cells.map((cell) => (
          <div
            key={cell.dateStr}
            role="gridcell"
            aria-label={`${cell.day}: ${cell.pages} halaman`}
            className="aspect-square rounded-md flex items-center justify-center text-[10px] font-mono tabular-nums transition-colors hover:ring-1 hover:ring-indigo-400"
            style={{ backgroundColor: cell.bgColor }}
            title={`${cell.day} ${monthLabel}: ${cell.pages} hlm, ${cell.minutes} menit`}
          >
            <span className={cell.pages > 0 ? "text-white" : "text-slate-600"}>
              {cell.day}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-4 text-[10px] text-slate-500">
        <span>Sedikit</span>
        <div className="flex gap-1">
          {[0.2, 0.4, 0.6, 0.8, 1].map((opacity) => (
            <div
              key={opacity}
              className="w-4 h-4 rounded-sm"
              style={{ backgroundColor: `rgba(99, 102, 241, ${opacity})` }}
            />
          ))}
        </div>
        <span>Banyak</span>
      </div>
    </div>
  );
}
