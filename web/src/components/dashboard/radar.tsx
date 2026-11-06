"use client";

import { PuenteLogo } from "@/components/brand/logo";
import { AlertBadge } from "@/components/ui/alert-badge";
import { BackButton } from "@/components/ui/back-button";
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
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
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

export function DashboardRadar({ students }: { students: Student[] }) {
  const stats = useMemo(() => getDashboardStats(students), [students]);
  const queue = useMemo(() => getPriorityQueue(students), [students]);
  const [selected, setSelected] = useState<Student>(
    queue.find((s) => s.alertLevel === "alta") || queue[0]!
  );
  const [validated, setValidated] = useState<string[]>([]);
  const [filter, setFilter] = useState<"all" | "priority" | "y12">("priority");

  const visible = queue.filter((s) => {
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <BackButton href="/" label="Volver al inicio" />
        <PuenteLogo variant="color" className="!h-12" />
      </div>
      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-coral">
          Consola de coordinación · 120 casos activos
        </p>
        <h1 className="display mt-1 text-3xl font-bold sm:text-4xl">
          Radar de mitad de año
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Alertas de fricción logística y señales silenciosas — no puntajes de
          “posible desertor”. La IA sugiere; una persona firma.
        </p>
      </header>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Casos activos", value: stats.total, tone: "border-t-ink" },
          {
            label: "Prioridad alta / crisis",
            value: stats.alta + stats.crisis,
            tone: "border-t-puente",
          },
          {
            label: "Señal silenciosa",
            value: stats.silent,
            tone: "border-t-coral",
          },
          {
            label: "1°–2° año · mitad semestre",
            value: stats.midYear,
            tone: "border-t-signal",
          },
        ].map((k) => (
          <div
            key={k.label}
            className={cn("panel border-t-4 p-4", k.tone)}
          >
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
            ["priority", "Cola urgente"],
            ["y12", "1° y 2° año"],
            ["all", "Los 120"],
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
          {visible.slice(0, 18).map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className={cn(
                "panel w-full p-3 text-left transition hover:border-ink",
                selected.id === s.id && "border-ink ring-1 ring-ink"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{s.name}</p>
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
          ))}
        </div>

        <motion.aside
          key={selected.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel sticky top-16 h-fit p-5"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-coral">
                Ficha · decisión humana
              </p>
              <h2 className="display text-2xl font-bold">{selected.name}</h2>
              <p className="text-sm text-muted">
                Tutor: {selected.tutor} · {selected.city}
              </p>
            </div>
            <UserRound className="text-puente" />
          </div>

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
              Badge de auditoría ética: sin sesgo por género, sede, origen ni
              jornada. Solo señales conductuales + consentimiento.
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase text-muted">
              Sugerencia IA (no ejecuta sola)
            </p>
            <p className="mt-1 text-sm font-medium">{selected.suggestedAction}</p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            {(
              [
                ["Académico", selected.pillars.academico],
                ["Psico/fam", selected.pillars.psicologico],
                ["Trabajo", selected.pillars.trabajo],
              ] as const
            ).map(([l, v]) => (
              <div key={l} className="border border-line p-2">
                <p className="display text-xl font-bold">{v}</p>
                <p className="text-muted">{l}</p>
              </div>
            ))}
          </div>

          <button
            className="btn btn-primary mt-5 w-full"
            disabled={validated.includes(selected.id)}
            onClick={() =>
              setValidated((v) =>
                v.includes(selected.id) ? v : [...v, selected.id]
              )
            }
          >
            {validated.includes(selected.id) ? (
              <>
                <CheckCircle2 size={16} /> Derivación firmada
              </>
            ) : (
              "Validar y ejecutar derivación (firma humana)"
            )}
          </button>
          <p className="mt-2 text-[11px] text-muted">
            Queda registro de auditoría: quién firmó, cuándo, y qué acción. La IA
            nunca cierra el caso sola.
          </p>
        </motion.aside>
      </div>
    </div>
  );
}
