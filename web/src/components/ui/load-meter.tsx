"use client";

import { cn } from "@/lib/utils";

/** 1 = muy cargado (rojo) · 10 = estable (verde) */
export function loadColor(value: number, min = 1, max = 10): string {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  // rojo → ámbar → verde
  if (t < 0.5) {
    const u = t / 0.5;
    const r = Math.round(158 + (218 - 158) * u);
    const g = Math.round(17 + (165 - 17) * u);
    const b = Math.round(39 + (32 - 39) * u);
    return `rgb(${r},${g},${b})`;
  }
  const u = (t - 0.5) / 0.5;
  const r = Math.round(218 + (47 - 218) * u);
  const g = Math.round(165 + (107 - 165) * u);
  const b = Math.round(32 + (69 - 32) * u);
  return `rgb(${r},${g},${b})`;
}

const HEAT_TRACK =
  "linear-gradient(90deg, #9e1127 0%, #c44a2f 28%, #daa520 52%, #6b9b4c 78%, #2f6b45 100%)";

type MeterProps = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (v: number) => void;
  className?: string;
  /** Solo lectura (barra en ficha tutor) */
  readOnly?: boolean;
  showEnds?: boolean;
  lowLabel?: string;
  highLabel?: string;
  "aria-label"?: string;
};

export function LoadMeter({
  value,
  min = 1,
  max = 10,
  step = 1,
  onChange,
  className,
  readOnly = false,
  showEnds = true,
  lowLabel = "Cargado",
  highLabel = "Estable",
  "aria-label": ariaLabel,
}: MeterProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const color = loadColor(value, min, max);

  if (readOnly) {
    return (
      <div className={cn("w-full", className)}>
        <div
          className="relative h-2.5 w-full overflow-hidden rounded-sm"
          style={{ background: HEAT_TRACK }}
          role="meter"
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-label={ariaLabel}
        >
          <div
            className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
            style={{ left: `${pct}%`, background: color }}
          />
        </div>
        {showEnds ? (
          <div className="mt-1 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-muted">
            <span className="text-bad">{lowLabel}</span>
            <span className="text-ok">{highLabel}</span>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 rounded-sm"
          style={{ background: HEAT_TRACK }}
          aria-hidden
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={ariaLabel}
          onChange={(e) => onChange?.(Number(e.target.value))}
          className="heat-range relative z-10 w-full"
          style={{ color }}
        />
      </div>
      {showEnds ? (
        <div className="mt-1 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-muted">
          <span className="text-bad">{lowLabel}</span>
          <span className="text-ok">{highLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
