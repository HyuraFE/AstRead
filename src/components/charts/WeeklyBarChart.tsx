"use client";

import type { WeeklyStats } from "../../lib/analytics/aggregator";
import { formatDuration } from "../../lib/analytics/calculator";

interface WeeklyBarChartProps {
  data: WeeklyStats[];
}

export function WeeklyBarChart({ data }: WeeklyBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center rounded-xl border border-dashed border-[#1e2235]">
        <p className="text-sm text-slate-400">Belum ada data mingguan</p>
      </div>
    );
  }

  const maxPages = Math.max(...data.map((d) => d.totalPages), 1);
  const chartHeight = 200;
  const barWidth = 48;
  const gap = 16;
  const chartWidth = data.length * (barWidth + gap) - gap;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={Math.max(chartWidth, 320)}
        height={chartHeight + 60}
        viewBox={`0 0 ${Math.max(chartWidth, 320)} ${chartHeight + 60}`}
        className="mx-auto"
        role="img"
        aria-label="Grafik batang halaman dibaca per minggu"
      >
        {data.map((week, i) => {
          const barHeight = (week.totalPages / maxPages) * chartHeight;
          const x = i * (barWidth + gap);
          const y = chartHeight - barHeight;
          const weekLabel = new Date(week.weekStart).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
          });

          return (
            <g key={week.weekStart}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={6}
                fill="#6366f1"
                opacity={0.85}
              >
                <title>{`${weekLabel}: ${week.totalPages} halaman, ${formatDuration(week.totalMinutes / 60)}`}</title>
              </rect>
              {/* Value label */}
              <text
                x={x + barWidth / 2}
                y={y - 8}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize={12}
                fontWeight={600}
                fontFamily="monospace"
              >
                {week.totalPages}
              </text>
              {/* Week label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 20}
                textAnchor="middle"
                fill="#64748b"
                fontSize={11}
              >
                {weekLabel}
              </text>
              {/* Speed label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 36}
                textAnchor="middle"
                fill="#475569"
                fontSize={10}
                fontFamily="monospace"
              >
                {week.avgSpeed} hlm/j
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
