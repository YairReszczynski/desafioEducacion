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
  },
  {
    href: `/p/${DEMO_STUDENT_TOKEN}`,
    label: "Link alumno",
    hint: "Check-in 30s",
  },
  {
    href: "/dashboard",
    label: "Coordinación",
    hint: "120 casos",
  },
  {
    href: "/dashboard/digitize",
    label: "Digitalizar pauta",
    hint: "Del papel",
  },
  {
    href: "/etica",
    label: "Caja de cristal",
    hint: "Ética",
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
        {VIEWS.map((v) => {
          const active =
            pathname === v.href ||
            (v.href.startsWith("/p/") && pathname.startsWith("/p/")) ||
            (v.href === "/dashboard" &&
              pathname.startsWith("/dashboard") &&
              !pathname.includes("digitize"));
          return (
            <Link
              key={v.href}
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
          );
        })}
      </div>
    </div>
  );
}
