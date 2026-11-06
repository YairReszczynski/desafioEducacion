"use client";

import {
  EQUIPO_STORAGE,
  lockEquipoClient,
  readEquipoFromDocument,
} from "@/lib/app-mode";
import { DEMO_STUDENT_TOKEN } from "@/lib/magic-token";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type NavItem = { href: string; label: string; match?: "exact" | "prefix" };

const GROUPS: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { href: "/", label: "Inicio", match: "exact" },
      { href: "/diapos-entrada.html", label: "Entrada" },
      { href: "/pitch", label: "Guion" },
      { href: "/qr", label: "QR" },
    ],
  },
  {
    title: "Alumno",
    items: [{ href: `/p/${DEMO_STUDENT_TOKEN}`, label: "Su link", match: "prefix" }],
  },
  {
    title: "Equipo",
    items: [
      { href: "/invitar", label: "Crear" },
      { href: "/dashboard", label: "Radar", match: "exact" },
      { href: "/dashboard/historial", label: "Historial", match: "prefix" },
      { href: "/dashboard/digitize", label: "Pauta", match: "prefix" },
    ],
  },
  {
    items: [{ href: "/etica", label: "Ética" }],
  },
];

function isActive(pathname: string, item: NavItem) {
  if (item.match === "exact") return pathname === item.href;
  if (item.match === "prefix") {
    if (item.href.startsWith("/p/")) return pathname.startsWith("/p/");
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** Barra compacta del equipo. Invisible para el público/jurado. */
export function DemoSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const [equipo, setEquipo] = useState(false);

  useEffect(() => {
    setEquipo(readEquipoFromDocument());
    const onStorage = (e: StorageEvent) => {
      if (e.key === EQUIPO_STORAGE) setEquipo(readEquipoFromDocument());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [pathname]);

  if (!equipo) return null;

  return (
    <div className="demo-switcher sticky top-0 z-50 border-b border-line bg-[#1c1b1a] text-white print:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-3 py-2 sm:px-5">
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-signal">
          Equipo
        </span>

        {GROUPS.map((group, gi) => (
          <div key={gi} className="flex shrink-0 items-center gap-1.5">
            {gi > 0 ? (
              <span
                className="mx-1 hidden h-4 w-px bg-white/20 sm:block"
                aria-hidden
              />
            ) : null}
            {group.title ? (
              <span className="mr-0.5 hidden text-[9px] font-bold uppercase tracking-wide text-white/40 sm:inline">
                {group.title}
              </span>
            ) : null}
            <div className="flex items-center gap-1">
              {group.items.map((item) => {
                const active = isActive(pathname, item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "whitespace-nowrap rounded-sm px-2.5 py-1.5 text-xs font-bold transition",
                      active
                        ? "bg-signal text-ink"
                        : "text-white/75 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <button
          type="button"
          className="ml-auto shrink-0 whitespace-nowrap px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white/55 hover:text-white"
          onClick={() => {
            lockEquipoClient();
            setEquipo(false);
            router.push("/");
            router.refresh();
          }}
        >
          Salir
        </button>
      </div>
    </div>
  );
}
