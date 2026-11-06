"use client";

import { PuenteLogo } from "@/components/brand/logo";
import { AlertBadge } from "@/components/ui/alert-badge";
import { BackButton } from "@/components/ui/back-button";
import { LoadMeter, loadColor } from "@/components/ui/load-meter";
import { RoleBanner } from "@/components/ui/role-banner";
import {
  loadHistoryByStudent,
  type HistoryEntry,
} from "@/lib/history-store";
import { History, Radio } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HistorialPage() {
  const [groups, setGroups] = useState(loadHistoryByStudent());
  const [openToken, setOpenToken] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setGroups(loadHistoryByStudent());
    refresh();
    window.addEventListener("puente-history", refresh);
    window.addEventListener("puente-live-checkin", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("puente-history", refresh);
      window.removeEventListener("puente-live-checkin", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const open = groups.find((g) => g.token === openToken) || groups[0] || null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <BackButton href="/dashboard" label="Atrás al radar" />
        <PuenteLogo variant="color" className="!h-12" />
      </div>
      <RoleBanner
        role="equipo"
        title="Dashboard Fundación · historial"
        subtitle="Cada check-in de ~30 segundos que el alumno autoriza queda registrado aquí, semana a semana."
      />

      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-coral">
          Línea de tiempo por becario
        </p>
        <h1 className="display mt-1 text-3xl font-bold sm:text-4xl">
          Historial de check-ins
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          No reemplaza al tutor: es la memoria de lo que el alumno eligió
          compartir. Sirve para ver evolución (prioridad, pilares, pedidos) sin
          perder las semanas anteriores.
        </p>
      </header>

      {!groups.length ? (
        <div className="panel border-dashed p-6 text-sm text-muted">
          <p className="font-bold text-ink">Todavía no hay historial</p>
          <p className="mt-2">
            Cuando un alumno completa el check-in y autoriza compartir, aquí
            aparece su primer registro. Los siguientes se acumulan debajo.
          </p>
          <Link href="/probar" className="btn btn-primary mt-4 inline-flex">
            Probar un check-in
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-2">
            {groups.map((g) => (
              <button
                key={g.token}
                type="button"
                onClick={() => setOpenToken(g.token)}
                className={`panel w-full p-3 text-left transition hover:border-ink ${
                  open?.token === g.token ? "border-ink ring-1 ring-ink" : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold">{g.studentName}</p>
                  <span className="text-[11px] font-bold uppercase text-muted">
                    {g.count} registro{g.count === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="text-xs text-muted">{g.career}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <AlertBadge level={g.latest.alertLevel} />
                  <span className="text-[11px] text-muted">
                    Último:{" "}
                    {new Date(g.latest.at).toLocaleString("es-CL", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {open ? (
            <aside className="panel space-y-4 p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-coral">
                    <History size={14} /> Ficha temporal
                  </p>
                  <h2 className="display text-2xl font-bold">
                    {open.studentName}
                  </h2>
                  <p className="text-sm text-muted">{open.career}</p>
                </div>
              </div>

              <ol className="space-y-3">
                {open.entries.map((e, i) => (
                  <HistoryCard key={e.id} entry={e} latest={i === 0} />
                ))}
              </ol>
            </aside>
          ) : null}
        </div>
      )}
    </main>
  );
}

function HistoryCard({
  entry,
  latest,
}: {
  entry: HistoryEntry;
  latest?: boolean;
}) {
  return (
    <li className="border border-line bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        {latest ? (
          <span className="inline-flex items-center gap-1 bg-puente px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
            <Radio size={10} /> Más reciente
          </span>
        ) : null}
        <AlertBadge level={entry.alertLevel} />
        <span className="text-[11px] text-muted">
          {new Date(entry.at).toLocaleString("es-CL", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span className="text-[10px] font-bold uppercase text-muted">
          {entry.source === "papel" ? "Pauta papel" : "Check-in 30s"}
        </span>
      </div>
      <p className="mt-2 text-sm italic text-ink/90">
        “{entry.transcript.slice(0, 220)}
        {entry.transcript.length > 220 ? "…" : ""}”
      </p>
      {entry.requestedSupport ? (
        <p className="mt-2 text-xs font-bold text-puente">
          Solicitó: {entry.requestedSupport}
        </p>
      ) : null}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
        {(
          [
            ["Acad.", entry.pillars.academico],
            ["Psico", entry.pillars.psicologico],
            ["Trab.", entry.pillars.trabajo],
          ] as const
        ).map(([l, v]) => (
          <div key={l} className="border border-line p-1.5">
            <p className="font-bold" style={{ color: loadColor(v) }}>
              {v}/10
            </p>
            <p className="text-muted">{l}</p>
            <LoadMeter
              className="mt-1"
              value={v}
              readOnly
              showEnds={false}
              aria-label={l}
            />
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">{entry.tutorBrief}</p>
    </li>
  );
}
