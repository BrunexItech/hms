"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MonthlyRevenuePoint } from "@/lib/types";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(ym: string): string {
  const [, m] = ym.split("-");
  return MONTH_LABELS[parseInt(m, 10) - 1];
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return `${Math.round(n)}`;
}

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((n) => normalized <= n) ?? 10;
  return step * magnitude;
}

const DEFAULT_WIDTH = 560;
const HEIGHT = 180;
const PADDING_LEFT = 42;
const PADDING_RIGHT = 8;
const PADDING_TOP = 24;
const PADDING_BOTTOM = 26;

export function BarTrendChart({ data }: { data: MonthlyRevenuePoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const wrapRef = useRef<HTMLDivElement>(null);
  const gradientId = useId();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWidth(Math.max(260, Math.floor(el.clientWidth)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const plotWidth = width - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const baselineY = PADDING_TOP + plotHeight;

  const max = useMemo(() => niceMax(Math.max(...data.map((d) => d.collected), 1)), [data]);
  const ticks = [0, max / 2, max];

  const bandWidth = plotWidth / data.length;
  const barWidth = Math.min(28, bandWidth * 0.5);

  const lastIndex = data.length - 1;
  const activeIndex = hovered ?? lastIndex;
  const active = data[activeIndex];

  return (
    <div ref={wrapRef}>
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-xs text-muted">Rent collected, last 6 months</p>
        <p className="font-display text-lg font-bold tabular-nums text-foreground">
          {active.collected.toLocaleString()}
          <span className="ml-1.5 text-xs font-normal text-muted">{monthLabel(active.month)}</span>
        </p>
      </div>
      <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} className="block" role="img" aria-label="Rent collected per month, last 6 months">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--primary-2)" />
          </linearGradient>
        </defs>

        {ticks.map((t) => {
          const y = baselineY - (t / max) * plotHeight;
          return (
            <g key={t}>
              <line x1={PADDING_LEFT} x2={width - PADDING_RIGHT} y1={y} y2={y} stroke="var(--border)" strokeWidth={1} />
              <text x={PADDING_LEFT - 8} y={y} textAnchor="end" dominantBaseline="middle" className="fill-muted" fontSize={10}>
                {formatCompact(t)}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const bandX = PADDING_LEFT + i * bandWidth;
          const x = bandX + (bandWidth - barWidth) / 2;
          const barHeight = Math.max((d.collected / max) * plotHeight, d.collected > 0 ? 3 : 0);
          const yTop = baselineY - barHeight;
          const r = Math.min(4, barHeight);
          const isActive = i === activeIndex;

          const path =
            barHeight > 0
              ? `M ${x},${yTop + r} Q ${x},${yTop} ${x + r},${yTop} L ${x + barWidth - r},${yTop} Q ${x + barWidth},${yTop} ${x + barWidth},${yTop + r} L ${x + barWidth},${baselineY} L ${x},${baselineY} Z`
              : "";

          return (
            <g
              key={d.month}
              onPointerEnter={() => setHovered(i)}
              onPointerLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              <rect x={bandX} y={PADDING_TOP} width={bandWidth} height={plotHeight} fill="transparent" />
              {path && <path d={path} fill={`url(#${gradientId})`} opacity={isActive ? 1 : 0.55} />}
              {i === lastIndex && d.collected > 0 && (
                <text x={x + barWidth / 2} y={yTop - 8} textAnchor="middle" className="fill-foreground" fontSize={11} fontWeight={600}>
                  {formatCompact(d.collected)}
                </text>
              )}
              <text
                x={bandX + bandWidth / 2}
                y={baselineY + 16}
                textAnchor="middle"
                className={isActive ? "fill-foreground" : "fill-muted"}
                fontSize={10}
                fontWeight={isActive ? 600 : 400}
              >
                {monthLabel(d.month)}
              </text>
            </g>
          );
        })}

        <line x1={PADDING_LEFT} x2={width - PADDING_RIGHT} y1={baselineY} y2={baselineY} stroke="var(--border)" strokeWidth={1} />
      </svg>
    </div>
  );
}
