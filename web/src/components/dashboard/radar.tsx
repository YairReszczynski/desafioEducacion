"use client";

import { PuenteLogo } from "@/components/brand/logo";
import { AlertBadge } from "@/components/ui/alert-badge";
import { BackButton } from "@/components/ui/back-button";
import { RoleBanner } from "@/components/ui/role-banner";
import {
  clearAllLiveCheckIns,
  getLatestLiveForToken,
  hasLiveCheckIn,
  isLiveStudentId,
  loadLiveCheckIns,
  mergeStudentsWithLive,
  type LiveCheckIn,
} from "@/lib/checkin-store";
import { clearAllInvited } from "@/lib/invite-store";
import {
  getDashboardStats,
  getPriorityQueue,
} from "@/lib/students";
import type { Student } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  MessageCircleWarning,
  Phone,
  Radio,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SIGNAL_LABEL: Record<string, string> = {
  sin_whatsapp: "No responde WhatsApp",
  falta_reunion: "Falta a reuniones",
  sobrecarga_laboral: "Sobrecarga laboral",
  sobrecarga_academica: "Sobrecarga académica",
  nucleo_familiar: "Núcleo familiar",
  checkin_atrasado: "Check-in atrasado",
};

export function DashboardRadar({ students: seed }: { students: Student[] }) {
  const [roster, setRoster] = useState<Student[]>(seed);
  const [liveFeed, setLiveFeed] = useState<LiveCheckIn[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [validated, setValidated] = useState<
    Record<string, { at: string; action: string; next: string }>
  >({});
  const [filter, setFilter] = useState<"live" | "priority" | "y12" | "all">(
    "priority"
  );

  function refresh() {
    const merged = mergeStudentsWithLive(seed);
    const live = loadLiveCheckIns();
    setRoster(merged);
    setLiveFeed(live);
    setFilter((f) => (f === "live" && live.length === 0 ? "priority" : f));
    setSelectedId((prev) => {
      if (live[0]) {
        return (
          merged.find((s) => s.token === live[0]!.token)?.id ?? prev ?? null
        );
      }
      // Si el seleccionado era solo "en vivo", soltarlo
      if (prev && isLiveStudentId(prev) && live.length === 0) {
        return (
          merged.find(
            (s) => s.alertLevel === "alta" || s.alertLevel === "crisis"
          )?.id ?? null
        );
      }
      if (prev && merged.some((s) => s.id === prev)) return prev;
      return (
        merged.find(
          (s) => s.alertLevel === "alta" || s.alertLevel === "crisis"
        )?.id ?? null
      );
    });
  }

  function wipeDemoLive() {
    clearAllLiveCheckIns();
    clearAllInvited();
    setValidated({});
    setLiveFeed([]);
    setRoster(seed);
    setFilter("priority");
    const fallback =
      seed.find((s) => s.alertLevel === "alta" || s.alertLevel === "crisis") ??
      seed[0];
    setSelectedId(fallback?.id ?? null);
  }

  useEffect(() => {
    refresh();
    const onLive = () => refresh();
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === "puente-live-checkins" ||
        e.key === "puente-invited-students"
      ) {
        refresh();
      }
    };
    window.addEventListener("puente-live-checkin", onLive);
    window.addEventListener("storage", onStorage);
    const poll = window.setInterval(refresh, 2500);
    return () => {
      window.removeEventListener("puente-live-checkin", onLive);
      window.removeEventListener("storage", onStorage);
      window.clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  const stats = useMemo(() => getDashboardStats(roster), [roster]);
  const queue = useMemo(() => getPriorityQueue(roster), [roster]);
  const selected = selectedId
    ? roster.find((s) => s.id === selectedId)
    : undefined;
  const liveDetail = selected
    ? getLatestLiveForToken(selected.token)
    : undefined;

  const visible = queue.filter((s) => {
    if (filter === "live") return hasLiveCheckIn(s.token) || isLiveStudentId(s.id);
    if (filter === "priority")
      return s.alertLevel === "crisis" || s.alertLevel === "alta";
    if (filter === "y12") return s.year <= 2;
    return true;
  });

  const chart = [
    { name: "Crisis", n: stats.crisis },
    { name: "Alta", n: stats.alta },
    { name: "Media", n: stats.media },
    { name: "Baja", n: stats.baja },
  ];

  const topLive = liveFeed[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <BackButton href="/" label="Volver al inicio" />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-ghost text-xs text-bad"
            onClick={wipeDemoLive}
          >
            <Trash2 size={14} />
            Limpiar demo en vivo
          </button>
          <PuenteLogo variant="color" className="!h-12" />
        </div>
      </div>
      <RoleBanner
        role="equipo"
        title="Consola de Coordinación / tutores"
        subtitle="Aquí NO estudia el alumno. Aquí el equipo ve alertas en vivo, decide y firma derivaciones humanas."
      />

      {topLive ? (
        <button
          type="button"
          onClick={() => {
            const s = roster.find((x) => x.token === topLive.token);
            if (s) {
              setSelectedId(s.id);
              setFilter("live");
            }
          }}
          className="mb-6 w-full border-2 border-puente bg-[#fff5f6] p-4 text-left transition hover:bg-[#ffecee]"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-puente px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              <Radio size={12} className="animate-pulse" /> Check-in en vivo
            </span>
            <AlertBadge level={topLive.glass.alertLevel} />
            <span className="text-xs text-muted">
              {new Date(topLive.at).toLocaleTimeString("es-CL", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <p className="display mt-2 text-2xl font-bold">{topLive.student.name}</p>
          <p className="mt-1 text-sm italic text-ink/80">
            “{topLive.transcript.slice(0, 200)}
            {topLive.transcript.length > 200 ? "…" : ""}”
          </p>
          <p className="mt-2 text-sm font-medium text-puente">
            Prioridad {topLive.glass.alertLevel.toUpperCase()} ·{" "}
            {topLive.glass.tutorBrief}
          </p>
        </button>
      ) : (
        <div className="mb-6 border border-dashed border-line bg-white/60 p-4 text-sm text-muted">
          Aún no hay check-ins en vivo. En la demo: abre un{" "}
          <b>link de alumno</b>, completa Caja de Cristal con “Compartir”, y
          vuelve acá — aparece arriba con su nivel de riesgo.
        </div>
      )}

      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-coral">
          Equipo Fundación Puente · {roster.length} fichas
        </p>
        <h1 className="display mt-1 text-3xl font-bold sm:text-4xl">
          Radar de mitad de año
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Los casos <b>en vivo</b> vienen del check-in que el alumno autorizó.
          Seed de 120 + overrides de la demo.
        </p>
      </header>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Casos en roster", value: stats.total, tone: "border-t-ink" },
          {
            label: "Check-ins en vivo",
            value: liveFeed.length,
            tone: "border-t-puente",
          },
          {
            label: "Prioridad alta / crisis",
            value: stats.alta + stats.crisis,
            tone: "border-t-coral",
          },
          {
            label: "Señal silenciosa",
            value: stats.silent,
            tone: "border-t-signal",
          },
          {
            label: "1°–2° mitad semestre",
            value: stats.midYear,
            tone: "border-t-ink",
          },
        ].map((k) => (
          <div key={k.label} className={cn("panel border-t-4 p-4", k.tone)}>
            <p className="display text-3xl font-bold">{k.value}</p>
            <p className="text-xs text-muted">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 panel p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
          Distribución de prioridad humana
        </p>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="n" fill="#9e1127" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {(
          [
            ["live", `En vivo (${liveFeed.length})`],
            ["priority", "Cola urgente"],
            ["y12", "1° y 2° año"],
            ["all", "Todos"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            className={cn(
              "border px-3 py-1.5 text-xs font-bold",
              filter === id
                ? "border-ink bg-ink text-white"
                : "border-line bg-white text-ink"
            )}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-2">
          {visible.length === 0 ? (
            <div className="panel p-4 text-sm text-muted">
              No hay casos en este filtro. Cambia a “Cola urgente” o completa un
              check-in compartido.
            </div>
          ) : null}
          {visible.slice(0, 20).map((s) => {
            const isLive =
              isLiveStudentId(s.id) ||
              liveFeed.some((c) => c.token === s.token);
            const isReviewed = !!validated[s.id];
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedId(s.id)}
                className={cn(
                  "panel w-full p-3 text-left transition hover:border-ink",
                  selected?.id === s.id && "border-ink ring-1 ring-ink",
                  isLive && "border-l-4 border-l-puente",
                  isReviewed && "border-ok/50 bg-[#f3faf5]"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{s.name}</p>
                      {isLive ? (
                        <span className="inline-flex items-center gap-1 bg-puente px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                          <Radio size={10} /> En vivo
                        </span>
                      ) : null}
                      {isReviewed ? (
                        <span className="inline-flex items-center gap-1 bg-ok px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                          <CheckCircle2 size={10} /> Revisado
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted">
                      {s.career} · {s.year}° · {s.jornada}
                      {s.works ? " · trabaja" : ""}
                    </p>
                  </div>
                  <AlertBadge level={s.alertLevel} />
                </div>
                <p className="mt-2 line-clamp-2 text-sm italic text-ink/80">
                  “{s.quote}”
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {s.signals.map((sig) => (
                    <span
                      key={sig}
                      className="bg-paper px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted"
                    >
                      {SIGNAL_LABEL[sig] || sig}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {selected ? (
          <motion.aside
            key={selected.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="panel sticky top-16 h-fit p-5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-coral">
                  Ficha equipo · decisión humana
                </p>
                <h2 className="display text-2xl font-bold">{selected.name}</h2>
                <p className="text-sm text-muted">
                  Tutor: {selected.tutor} · {selected.city}
                </p>
              </div>
              <UserRound className="text-puente" />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <AlertBadge level={selected.alertLevel} />
              {liveDetail ? (
                <span className="inline-flex items-center gap-1 bg-puente px-2 py-0.5 text-[11px] font-bold uppercase text-white">
                  <Radio size={12} /> Riesgo desde check-in vivo
                </span>
              ) : null}
            </div>

            {liveDetail ? (
              <div className="mt-4 border border-puente/30 bg-[#fff5f6] p-3 text-sm">
                <p className="text-[11px] font-bold uppercase text-puente">
                  Palabras del alumno (autorizadas)
                </p>
                <p className="mt-1 italic">“{liveDetail.transcript}”</p>
                <p className="mt-2 text-xs text-muted">
                  Victoria: {liveDetail.glass.victory || "—"} · Dolor:{" "}
                  {liveDetail.glass.headache || "—"}
                </p>
              </div>
            ) : null}

            <div className="mt-4 space-y-3 border border-line bg-paper/70 p-3 text-sm">
              <p className="flex items-center gap-2 font-bold">
                <MessageCircleWarning size={16} /> Árbol de explicabilidad
              </p>
              <ul className="list-disc space-y-1 pl-5 text-muted">
                <li>
                  Por qué se activó:{" "}
                  {selected.signals.map((s) => SIGNAL_LABEL[s]).join(" · ") ||
                    "Check-in reciente"}
                </li>
                <li>
                  Pilar más afectado:{" "}
                  {Object.entries(selected.pillars).sort(
                    (a, b) => a[1] - b[1]
                  )[0]?.[0] || "—"}
                </li>
                <li>
                  En sus palabras: <em>“{selected.quote}”</em>
                </li>
              </ul>
              <div className="flex items-center gap-2 border border-ok/30 bg-[#e7f2ea] p-2 text-xs text-ok">
                <ShieldCheck size={14} />
                Badge ético: sin sesgo por género, sede, origen ni jornada.
                Consentimiento del alumno.
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-[11px] font-bold uppercase text-muted">
                Carga auto-reportada (1 = muy cargado · 10 = estable)
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {(
                  [
                    ["Académico", selected.pillars.academico],
                    ["Psico/fam", selected.pillars.psicologico],
                    ["Trabajo", selected.pillars.trabajo],
                  ] as const
                ).map(([l, v]) => (
                  <div key={l} className="border border-line p-2">
                    <p className="display text-xl font-bold">{v}/10</p>
                    <p className="text-muted">{l}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 border border-line p-3">
              <p className="text-[11px] font-bold uppercase text-muted">
                Qué sugiere la IA (borrador — no se envía sola)
              </p>
              <p className="mt-1 text-sm font-medium">
                {selected.suggestedAction}
              </p>
            </div>

            {!validated[selected.id] ? (
              <>
                <button
                  className="btn btn-primary mt-5 w-full"
                  type="button"
                  onClick={() =>
                    setValidated((v) => ({
                      ...v,
                      [selected.id]: {
                        at: new Date().toLocaleString("es-CL"),
                        action:
                          selected.suggestedAction ||
                          "Contacto humano de contención",
                        next: `Llamar o escribir a ${selected.firstName} hoy · avisar a ${selected.tutor}`,
                      },
                    }))
                  }
                >
                  Firmar · marcar como REVISADO
                </button>
                <p className="mt-2 text-[11px] text-muted">
                  Sin esta firma el caso no avanza. La IA no sanciona ni cierra.
                </p>
              </>
            ) : (
              <div className="mt-5 space-y-3 border-2 border-ok bg-[#e7f2ea] p-4 text-sm">
                <p className="flex items-center gap-2 text-base font-bold text-ok">
                  <CheckCircle2 size={20} /> REVISADO · caso en gestión
                </p>
                <p className="text-xs text-ok">
                  Estado visible en la lista de la izquierda. Auditoría humana
                  registrada.
                </p>
                <ol className="list-decimal space-y-2 pl-5 text-ink">
                  <li>
                    <b>Firmado:</b> {validated[selected.id]!.at}
                  </li>
                  <li>
                    <b>Acción:</b> {validated[selected.id]!.action}
                  </li>
                  <li className="flex gap-2">
                    <Phone size={14} className="mt-0.5 shrink-0" />
                    <span>
                      <b>Siguiente paso humano:</b>{" "}
                      {validated[selected.id]!.next}
                    </span>
                  </li>
                </ol>
              </div>
            )}
          </motion.aside>
        ) : null}
      </div>
    </div>
  );
}
