"use client";

import { PuenteLogo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const SLIDES = [
  {
    id: 1,
    eyebrow: "El problema",
    title: "El quiebre no es flojera.",
    titleAccent: "Es fricción.",
    body: "Fundación Puente acompaña 120 becarios durante 5 años. El riesgo real aparece en 1° y 2° año, a mitad de semestre: cambian los turnos, dejan de responder WhatsApp, faltan a reuniones… y el seguimiento aún vive en cuadernos.",
    points: [
      "120 casos activos · confianza lenta en los primeros 2 años",
      "Señales silenciosas: silencio, inasistencia, sobrecarga laboral",
      "Prioridad: que estudien, sin consumir su tiempo libre",
    ],
    script: `Fundación Puente acompaña a 120 becarios durante cinco años con una idea clara: la educación supera la pobreza. El problema no es que el alumno sea flojo. El quiebre suele llegar en primero y segundo año, a mitad de semestre, cuando cambian los turnos o se acumulan las entregas. Hoy las señales silenciosas —no responde WhatsApp, falta a reuniones— se pierden entre cuadernos y WhatsApp, porque la privacidad obliga a trabajar casi a mano. Nosotros atacamos esa fricción, sin estigmatizar.`,
  },
  {
    id: 2,
    eyebrow: "La solución",
    title: "Un link perpetuo.",
    titleAccent: "Cero login.",
    body: "El alumno abre su link, habla 30 segundos, ve qué entendió la IA (Caja de Cristal) y decide si compartir. El mismo link muta a un plan de micro-cápsulas según los minutos reales que tiene esa semana.",
    points: [
      "Check-in de voz · el alumno es dueño del mensaje",
      "Plan de supervivencia en micro-ventanas (trayecto / noche)",
      "Si autoriza, el equipo ve la alerta explicable de inmediato",
    ],
    script: `La solución es un link perpetuo, como un acceso directo: sin app store y sin contraseña. El becario graba media minuta: victoria y dolor de cabeza. Antes de enviar, la Caja de Cristal le muestra qué entendió la IA y él decide si compartir. Si dice que sí, Claude arma un plan de supervivencia partido en los minutos reales que tiene —por ejemplo el trayecto y una hora el jueves— y ese mismo link queda como su panel de la semana.`,
  },
  {
    id: 3,
    eyebrow: "Impacto + ética",
    title: "La IA sugiere.",
    titleAccent: "El humano firma.",
    body: "En la consola de Coordinación aparecen 120 casos con radar de mitad de año. Check-ins en vivo con nivel de prioridad, árbol de explicabilidad, badge anti-sesgo y firma humana obligatoria. Cumple el 25% ético de la rúbrica: derecho a no ser perfilado a espaldas.",
    points: [
      "Radar equipo · prioridad humana, no “desertor”",
      "Firma “REVISADO” · la IA nunca cierra sola",
      "Eslogan vivo: Educación supera la pobreza",
    ],
    script: `Del lado Fundación Puente, el equipo ve un radar de ciento veinte casos. Cuando el alumno autoriza el check-in, aparece en vivo con su nivel de prioridad —alta, media o atención puntual— y un árbol que explica por qué, sin sesgo por género, sede u origen. La IA solo sugiere; Coordinación firma “Revisado” y activa el contacto humano. Así multiplicamos atención sin reemplazar al tutor. Ahora les mostramos la demo en vivo.`,
  },
] as const;

export function SlidesDeck() {
  const [i, setI] = useState(0);
  const [showScript, setShowScript] = useState(true);
  const slide = SLIDES[i]!;

  const next = useCallback(() => {
    setI((x) => Math.min(SLIDES.length - 1, x + 1));
  }, []);
  const prev = useCallback(() => {
    setI((x) => Math.max(0, x - 1));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-48px)] max-w-6xl flex-col px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <PuenteLogo variant="color" className="!h-12 sm:!h-14" priority />
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted">
          <span>
            Diapo {i + 1} / {SLIDES.length}
          </span>
          <button
            type="button"
            className="border border-line bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-ink"
            onClick={() => setShowScript((s) => !s)}
          >
            {showScript ? "Ocultar guion" : "Ver guion"}
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden border border-line bg-white/80 shadow-[0_20px_60px_rgba(28,27,26,0.06)]">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28 }}
            className="relative z-10 flex flex-1 flex-col justify-between p-6 sm:p-10 lg:p-14"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-coral">
                {slide.eyebrow}
              </p>
              <h1 className="display mt-3 max-w-4xl text-3xl font-extrabold leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
                {slide.title}{" "}
                <span className="text-puente">{slide.titleAccent}</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base text-muted sm:text-lg">
                {slide.body}
              </p>
              <ul className="mt-8 space-y-3">
                {slide.points.map((p) => (
                  <li
                    key={p}
                    className="flex gap-3 border-l-4 border-puente bg-paper/80 px-4 py-3 text-sm font-medium text-ink sm:text-base"
                  >
                    {slide.id === 1 ? (
                      <Users className="mt-0.5 shrink-0 text-puente" size={18} />
                    ) : slide.id === 2 ? (
                      <Sparkles
                        className="mt-0.5 shrink-0 text-puente"
                        size={18}
                      />
                    ) : (
                      <Shield
                        className="mt-0.5 shrink-0 text-puente"
                        size={18}
                      />
                    )}
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {showScript ? (
              <div className="mt-8 border border-dashed border-line bg-[#fff9e6] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-warn">
                  Guion para leer · diapo {slide.id}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink sm:text-[15px]">
                  {slide.script}
                </p>
              </div>
            ) : null}

            {i === SLIDES.length - 1 ? (
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/invitar" className="btn btn-primary">
                  <Play size={16} />
                  Pasar a la demo en vivo
                </Link>
                <Link href="/dashboard" className="btn btn-accent">
                  Abrir radar equipo
                </Link>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={prev}
          disabled={i === 0}
        >
          <ArrowLeft size={16} />
          Anterior
        </button>
        <div className="flex gap-2">
          {SLIDES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Ir a diapo ${idx + 1}`}
              onClick={() => setI(idx)}
              className={cn(
                "h-2.5 w-8 transition",
                idx === i ? "bg-puente" : "bg-line hover:bg-ink/30"
              )}
            />
          ))}
        </div>
        {i < SLIDES.length - 1 ? (
          <button type="button" className="btn btn-primary" onClick={next}>
            Siguiente
            <ArrowRight size={16} />
          </button>
        ) : (
          <Link href="/invitar" className="btn btn-primary">
            Demo
            <ArrowRight size={16} />
          </Link>
        )}
      </div>
      <p className="mt-3 text-center text-[11px] text-muted">
        Flechas ← → o barra espaciadora para avanzar · Fundación Puente
      </p>
    </div>
  );
}

export { SLIDES };
