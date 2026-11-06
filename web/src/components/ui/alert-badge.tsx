import type { AlertLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAP: Record<AlertLevel, { label: string; className: string }> = {
  crisis: {
    label: "Atención inmediata",
    className: "bg-bad text-white",
  },
  alta: {
    label: "Prioridad alta",
    className: "bg-[#f8e4e7] text-bad",
  },
  media: {
    label: "Atención puntual",
    className: "bg-[#fff4d6] text-warn",
  },
  baja: {
    label: "Seguimiento estándar",
    className: "bg-[#e7f2ea] text-ok",
  },
};

export function AlertBadge({
  level,
  className,
}: {
  level: AlertLevel;
  className?: string;
}) {
  const m = MAP[level];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        m.className,
        className
      )}
    >
      {m.label}
    </span>
  );
}
