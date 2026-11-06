"use client";

import { DEMO_STUDENT_TOKEN } from "@/lib/magic-token";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const VIEWS = [
  {
    href: `/`,
    label: "Inicio",
    hint: "Home",
    group: "nav" as const,
  },
  {
    href: `/slides`,
    label: "3 Diapos",
    hint: "Pitch",
    group: "nav" as const,
  },
  {
    href: `/p/${DEMO_STUDENT_TOKEN}`,
    label: "Alumno",
    hint: "Su link",
    group: "alumno" as const,
  },
  {
    href: `/invitar`,
    label: "Crear link",
    hint: "Nuevo alumno",
    group: "equipo" as const,
  },
  {
    href: "/dashboard",
    label: "Equipo Puente",
    hint: "Radar 120",
    group: "equipo" as const,
  },
  {
    href: "/dashboard/digitize",
    label: "Pauta papel",
    hint: "Tutores",
    group: "equipo" as const,
  },
  {
    href: "/etica",
    label: "Ética",
    hint: "Caja cristal",
    group: "nav" as const,
  },
  {
    href: "/pitch",
    label: "Pitch 5′",
    hint: "Guion",
    group: "nav" as const,
  },
] as const;

export function DemoSwitcher() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-50 border-b border-line bg-[#1c1b1a] text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-3 py-2 sm:px-5">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
          Demo jurado
        </span>
        {VIEWS.map((v, idx) => {
          const active =
            pathname === v.href ||
            (v.href.startsWith("/p/") && pathname.startsWith("/p/")) ||
            (v.href === "/dashboard" &&
              pathname.startsWith("/dashboard") &&
              !pathname.includes("digitize"));
          const prev = VIEWS[idx - 1];
          const showGroup =
            v.group !== "nav" && (!prev || prev.group !== v.group);
          return (
            <span key={v.href} className="contents">
              {showGroup ? (
                <span className="ml-1 hidden text-[9px] font-bold uppercase tracking-[0.14em] text-signal/80 sm:inline">
                  {v.group === "alumno" ? "→ Alumno" : "→ Equipo"}
                </span>
              ) : null}
              <Link
                href={v.href}
                className={cn(
                  "inline-flex items-center gap-2 border px-2.5 py-1.5 text-xs transition",
                  active
                    ? "border-signal bg-signal text-ink"
                    : "border-white/15 text-white/80 hover:border-white/40"
                )}
              >
                <span className="font-bold">{v.label}</span>
                <span className="hidden text-[10px] opacity-70 sm:inline">
                  {v.hint}
                </span>
              </Link>
            </span>
          );
        })}
      </div>
    </div>
  );
}
