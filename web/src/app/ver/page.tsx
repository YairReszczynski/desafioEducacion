"use client";

import { PuenteLogo } from "@/components/brand/logo";
import { AlertBadge } from "@/components/ui/alert-badge";
import { BackButton } from "@/components/ui/back-button";
import { LoadMeter, loadColor } from "@/components/ui/load-meter";
import {
  loadLiveCheckIns,
  type LiveCheckIn,
} from "@/lib/checkin-store";
import { Phone, Radio } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

/** Vista pública del tutor: solo check-ins en vivo de este celular. */
export default function VerTutorPage() {
  const [feed, setFeed] = useState<LiveCheckIn[]>([]);
  const [selected, setSelected] = useState<LiveCheckIn | null>(null);

  useEffect(() => {
    const refresh = () => {
      const list = loadLiveCheckIns();
      setFeed(list);
      setSelected((prev) => {
        if (prev && list.some((c) => c.id === prev.id)) {
          return list.find((c) => c.id === prev.id) || list[0] || null;
        }
        return list[0] || null;
      });
    };
    refresh();
    const onLive = () => refresh();
    window.addEventListener("puente-live-checkin", onLive);
    window.addEventListener("storage", onLive);
    const poll = window.setInterval(refresh, 2000);
    return () => {
      window.removeEventListener("puente-live-checkin", onLive);
      window.removeEventListener("storage", onLive);
      window.clearInterval(poll);
    };
  }, []);

  return (
    <main className="mx-auto max-w-lg px-5 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <BackButton href="/" label="Inicio" />
        <PuenteLogo variant="color" className="!h-10" />
      </div>

      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-coral">
        Así lo ve el tutor
      </p>
      <h1 className="display mt-2 text-3xl font-bold">Radar en vivo</h1>
      <p className="mt-2 text-sm text-muted">
        Solo aparecen check-ins que autorizaste compartir en{" "}
        <b>este mismo celular</b>. Completá el flujo alumno y volvé acá.
      </p>

      {!feed.length ? (
        <div className="mt-8 border border-dashed border-line bg-white/70 p-5 text-sm text-muted">
          <p className="font-bold text-ink">Todavía no hay casos en vivo</p>
          <p className="mt-2">
            1. Andá a “Probar como alumno” · 2. Completá Caja de Cristal con
            “Compartir” · 3. Pedí apoyo si querés · 4. Volvé a esta pantalla.
          </p>
          <Link href="/probar" className="btn btn-primary mt-4 w-full">
            Probar como alumno
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {feed.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c)}
              className={`panel w-full p-3 text-left ${
                selected?.id === c.id ? "border-ink ring-1 ring-ink" : ""
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-puente px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                  <Radio size={10} /> En vivo
                </span>
                <AlertBadge level={c.glass.alertLevel} />
              </div>
              <p className="mt-2 font-bold">{c.student.name}</p>
              <p className="text-xs text-muted">
                {c.student.career} ·{" "}
                {new Date(c.at).toLocaleTimeString("es-CL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {c.requestedSupport ? (
                <p className="mt-2 text-xs font-bold text-puente">
                  Solicitó: {c.requestedSupport}
                </p>
              ) : null}
            </button>
          ))}
        </div>
      )}

      {selected ? (
        <aside className="panel mt-6 space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="display text-xl font-bold">
              {selected.student.name}
            </h2>
            <AlertBadge level={selected.glass.alertLevel} />
          </div>

          {selected.requestedSupport ? (
            <div className="border-2 border-puente bg-[#fff5f6] p-3">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase text-puente">
                <Phone size={14} /> Pedido del alumno
              </p>
              <p className="display mt-1 text-lg font-bold">
                {selected.requestedSupport}
              </p>
            </div>
          ) : null}

          <div className="border border-line bg-paper/70 p-3 text-sm">
            <p className="text-[11px] font-bold uppercase text-muted">
              Palabras autorizadas
            </p>
            <p className="mt-1 italic">“{selected.transcript}”</p>
          </div>

          <p className="text-sm">{selected.glass.tutorBrief}</p>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {(
              [
                ["Académico", selected.pillars.academico],
                ["Psico/fam", selected.pillars.psicologico],
                ["Trabajo", selected.pillars.trabajo],
              ] as const
            ).map(([l, v]) => (
              <div key={l} className="border border-line p-2">
                <p
                  className="display text-xl font-bold"
                  style={{ color: loadColor(v) }}
                >
                  {v}/10
                </p>
                <p className="text-muted">{l}</p>
                <LoadMeter
                  className="mt-2"
                  value={v}
                  readOnly
                  showEnds={false}
                  aria-label={l}
                />
              </div>
            ))}
          </div>

          <p className="text-xs text-muted">{selected.glass.ethicalNote}</p>
        </aside>
      ) : null}
    </main>
  );
}
