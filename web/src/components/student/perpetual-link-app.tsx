"use client";

import { PuenteLogo } from "@/components/brand/logo";
import { InstallPWAPrompt } from "@/components/pwa/install-prompt";
import { AlertBadge } from "@/components/ui/alert-badge";
import { BackButton } from "@/components/ui/back-button";
import type {
  GlassBoxSummary,
  Student,
  SurvivalPlan,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Mic,
  Pause,
  Shield,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Step = "welcome" | "voice" | "pillars" | "glass" | "plan";

const STEPS: Step[] = ["welcome", "voice", "pillars", "glass", "plan"];

export function PerpetualLinkApp({ student }: { student: Student }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [consentTranscribe, setConsentTranscribe] = useState(false);
  const [consentShare, setConsentShare] = useState(true);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [pillars, setPillars] = useState(student.pillars);
  const [minutes, setMinutes] = useState(85);
  const [energy, setEnergy] = useState(4);
  const [glass, setGlass] = useState<GlassBoxSummary | null>(null);
  const [plan, setPlan] = useState<SurvivalPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [material, setMaterial] = useState("");
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  function goBack() {
    stopRecording();
    const i = STEPS.indexOf(step);
    if (i <= 0) {
      router.push("/");
      return;
    }
    const prev = STEPS[i - 1]!;
    if (prev === "glass" && !glass) {
      setStep("pillars");
      return;
    }
    if (prev === "plan" && !plan) {
      setStep(glass ? "glass" : "pillars");
      return;
    }
    setStep(prev);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      recognitionRef.current?.stop();
    };
  }, []);

  async function startRecording() {
    setError(null);
    setTranscript("");
    setSeconds(0);
    setRecording(true);
    timerRef.current = window.setInterval(() => {
      setSeconds((s) => {
        if (s >= 29) {
          stopRecording();
          return 30;
        }
        return s + 1;
      });
    }, 1000);

    const SR =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;

    if (SR) {
      const rec = new SR();
      rec.lang = "es-CL";
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (ev: SpeechRecognitionEvent) => {
        let text = "";
        for (let i = 0; i < ev.results.length; i++) {
          text += ev.results[i]![0]!.transcript + " ";
        }
        setTranscript(text.trim());
      };
      rec.onerror = () => {
        /* fallback demo below */
      };
      recognitionRef.current = rec;
      rec.start();
    }
  }

  function stopRecording() {
    setRecording(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
    recognitionRef.current?.stop();
  }

  async function useDemoVoice() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/asr/parakeet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoCase: "camila" }),
      });
      const json = await res.json();
      setTranscript(json.text);
      setStep("pillars");
    } catch {
      setError("No se pudo cargar el audio demo");
    } finally {
      setLoading(false);
    }
  }

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/claude/analyze-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: student.token,
          transcript,
          pillars,
          availableMinutes: minutes,
          energy,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error");
      setGlass(json.data);
      setStep("glass");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al analizar");
    } finally {
      setLoading(false);
    }
  }

  async function confirmAndPlan() {
    setLoading(true);
    setError(null);
    try {
      if (consentShare && typeof window !== "undefined") {
        const key = "puente-checkins";
        const prev = JSON.parse(localStorage.getItem(key) || "[]");
        prev.unshift({
          token: student.token,
          name: student.name,
          at: new Date().toISOString(),
          glass,
          pillars,
        });
        localStorage.setItem(key, JSON.stringify(prev.slice(0, 40)));
      }
      const res = await fetch("/api/claude/survival-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: student.name,
          career: student.career,
          availableMinutes: minutes,
          energy,
          materialText: material,
          transcript,
        }),
      });
      const json = await res.json();
      setPlan(json.data);
      setStep("plan");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-16 pt-6 sm:px-0">
      <div className="mb-4 flex items-center justify-between gap-3">
        <BackButton
          label={step === "welcome" ? "Volver al inicio" : "Atrás"}
          onClick={goBack}
        />
        <PuenteLogo variant="color" className="!h-11 sm:!h-12" priority />
      </div>

      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-coral">
          Link perpetuo · semanal
        </p>
        <h1 className="display mt-1 text-3xl font-bold text-ink sm:text-4xl">
          Hola, {student.firstName}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {student.career} · {student.year}° año · {student.institution}
        </p>
      </header>

      <InstallPWAPrompt />

      <div className="mb-4 flex gap-1">
        {STEPS.map((s, i) => {
          const current = STEPS.indexOf(step);
          const reached = i <= current;
          const canJump =
            i < current &&
            (s !== "glass" || !!glass) &&
            (s !== "plan" || !!plan);
          return (
            <button
              key={s}
              type="button"
              aria-label={`Ir al paso ${i + 1}`}
              disabled={!canJump}
              onClick={() => {
                if (!canJump) return;
                stopRecording();
                setStep(s);
              }}
              className={cn(
                "h-1 flex-1 transition",
                reached ? "bg-puente" : "bg-line",
                canJump && "cursor-pointer hover:opacity-80"
              )}
            />
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {step === "welcome" && (
          <motion.section
            key="welcome"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="panel p-5"
          >
            <h2 className="display text-xl font-bold">
              Check-in de 30 segundos
            </h2>
            <p className="mt-2 text-sm text-muted">
              Una sola pregunta: ¿cuál fue tu mayor victoria y tu mayor dolor de
              cabeza esta semana en la U? Sin formularios eternos. Tú decides qué
              se comparte.
            </p>
            <div className="mt-4 space-y-3 border border-line bg-paper/60 p-3 text-sm">
              <label className="flex gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={consentTranscribe}
                  onChange={(e) => setConsentTranscribe(e.target.checked)}
                />
                <span>
                  Acepto que mi audio se transforme en texto.{" "}
                  <b>El audio se borra</b> al terminar.
                </span>
              </label>
              <label className="flex gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={consentShare}
                  onChange={(e) => setConsentShare(e.target.checked)}
                />
                <span>
                  Podré revisar el resumen antes de compartirlo con mi tutor/a
                  (Caja de Cristal).
                </span>
              </label>
            </div>
            <button
              className="btn btn-primary mt-5 w-full"
              disabled={!consentTranscribe}
              onClick={() => setStep("voice")}
            >
              Comenzar
            </button>
          </motion.section>
        )}

        {step === "voice" && (
          <motion.section
            key="voice"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="panel p-5"
          >
            <h2 className="display text-xl font-bold">Tu nota de voz</h2>
            <p className="mt-1 text-sm text-muted">
              Máximo 30 segundos. Si no hay micrófono, usa el caso demo de
              Camila.
            </p>

            <div className="mt-6 flex flex-col items-center gap-3 border border-dashed border-line py-8">
              <div
                className={cn(
                  "flex h-24 w-24 items-center justify-center rounded-full border-2 border-puente text-puente",
                  recording && "rec-live bg-puente text-white"
                )}
              >
                {recording ? <Pause size={28} /> : <Mic size={28} />}
              </div>
              <p className="display text-3xl font-bold tabular-nums">
                0:{String(seconds).padStart(2, "0")}
              </p>
              {!recording ? (
                <button className="btn btn-primary" onClick={startRecording}>
                  Grabar
                </button>
              ) : (
                <button className="btn btn-ghost" onClick={stopRecording}>
                  Detener
                </button>
              )}
              <button
                className="btn btn-accent"
                disabled={loading}
                onClick={useDemoVoice}
              >
                Usar audio demo (Camila)
              </button>
            </div>

            <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-muted">
              Transcripción editable
            </label>
            <textarea
              className="mt-1 min-h-28 w-full border border-line bg-white p-3 text-sm outline-none focus:border-ink"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="O escribe aquí…"
            />
            <div className="mt-4 flex gap-2">
              <button className="btn btn-ghost" type="button" onClick={goBack}>
                <ArrowLeft size={16} />
                Atrás
              </button>
              <button
                className="btn btn-primary flex-1"
                disabled={!transcript.trim()}
                onClick={() => setStep("pillars")}
              >
                Continuar
              </button>
            </div>
          </motion.section>
        )}

        {step === "pillars" && (
          <motion.section
            key="pillars"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="panel p-5"
          >
            <h2 className="display text-xl font-bold">
              Termómetro · 3 pilares Puente
            </h2>
            <p className="mt-1 text-sm text-muted">
              1 = muy cargado · 10 = estable. Toca rápido y listo.
            </p>

            {(
              [
                ["academico", "Académico", "Pruebas, notas, entregas"],
                ["psicologico", "Psicológico / familiar", "Ánimo, casa, sueño"],
                ["trabajo", "Trabajo / económico", "Turnos, pasaje, presupuesto"],
              ] as const
            ).map(([key, label, hint]) => (
              <div key={key} className="mt-5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm font-bold">{label}</p>
                    <p className="text-xs text-muted">{hint}</p>
                  </div>
                  <span className="display text-2xl font-bold">
                    {pillars[key]}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={pillars[key]}
                  onChange={(e) =>
                    setPillars((p) => ({
                      ...p,
                      [key]: Number(e.target.value),
                    }))
                  }
                  className="mt-2 w-full accent-[#9e1127]"
                />
              </div>
            ))}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted">
                  Minutos reales esta semana
                </label>
                <input
                  type="range"
                  min={20}
                  max={240}
                  step={5}
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="mt-2 w-full accent-[#e7ce4f]"
                />
                <p className="display text-lg font-bold">{minutes} min</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted">
                  Energía
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="mt-2 w-full accent-[#d35c6d]"
                />
                <p className="display text-lg font-bold">{energy}/10</p>
              </div>
            </div>

            {error ? (
              <p className="mt-3 text-sm text-bad">{error}</p>
            ) : null}

            <div className="mt-5 flex gap-2">
              <button className="btn btn-ghost" type="button" onClick={goBack}>
                <ArrowLeft size={16} />
                Atrás
              </button>
              <button
                className="btn btn-primary flex-1"
                disabled={loading}
                onClick={analyze}
              >
                {loading ? "Claude está escuchando…" : "Ver qué entendió la IA"}
              </button>
            </div>
          </motion.section>
        )}

        {step === "glass" && glass && (
          <motion.section
            key="glass"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="panel p-5"
          >
            <div className="flex items-center gap-2 text-puente">
              <Shield size={18} />
              <h2 className="display text-xl font-bold">Caja de Cristal</h2>
            </div>
            <p className="mt-1 text-sm text-muted">
              Esto es lo que entendí. Tú decides si se comparte.
            </p>

            <div className="mt-4 border-l-4 border-signal bg-[#fff9e6] p-4 text-sm">
              {glass.summaryForStudent}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="border border-line p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-ok">
                  Victoria
                </p>
                <p className="mt-1 text-sm">{glass.victory}</p>
              </div>
              <div className="border border-line p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-coral">
                  Dolor de cabeza
                </p>
                <p className="mt-1 text-sm">{glass.headache}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <AlertBadge level={glass.alertLevel} />
              {glass.pillarsTouched.map((p) => (
                <span
                  key={p}
                  className="border border-line px-2 py-0.5 text-[11px] font-semibold uppercase"
                >
                  {p}
                </span>
              ))}
            </div>

            <label className="mt-4 block text-xs font-bold uppercase text-muted">
              Texto propuesto para tu tutor/a (editable)
            </label>
            <textarea
              className="mt-1 min-h-24 w-full border border-line bg-white p-3 text-sm"
              value={glass.proposedShare}
              onChange={(e) =>
                setGlass({ ...glass, proposedShare: e.target.value })
              }
            />

            <p className="mt-3 text-xs text-muted">{glass.ethicalNote}</p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={goBack}
              >
                <ArrowLeft size={16} />
                Atrás
              </button>
              <button
                className="btn btn-primary flex-1"
                disabled={loading}
                onClick={confirmAndPlan}
              >
                <Check size={16} />
                {consentShare
                  ? "Compartir y armar mi plan"
                  : "Solo armar mi plan (privado)"}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setStep("pillars")}
              >
                Editar
              </button>
            </div>
          </motion.section>
        )}

        {step === "plan" && plan && (
          <motion.section
            key="plan"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="panel p-5">
              <div className="flex items-center gap-2 text-puente">
                <Sparkles size={18} />
                <h2 className="display text-xl font-bold">{plan.headline}</h2>
              </div>
              <p className="mt-1 text-sm text-muted">
                El mismo link mutó: ahora es tu panel de supervivencia de la
                semana.
              </p>

              <div className="mt-4 space-y-3">
                {plan.capsules.map((c) => (
                  <div
                    key={c.title}
                    className="grid grid-cols-[auto_1fr] gap-3 border border-line p-3"
                  >
                    <div className="bg-ink px-2 py-3 text-center text-white">
                      <p className="display text-xl font-bold">{c.minutes}</p>
                      <p className="text-[10px] uppercase">min</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-coral">
                        {c.type} · {c.when}
                      </p>
                      <p className="font-bold">{c.title}</p>
                      <p className="mt-1 text-sm text-muted">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <label className="mt-5 flex items-center gap-2 text-xs font-bold uppercase text-muted">
                <Upload size={14} /> Pegar apunte / guía para recompilar
              </label>
              <textarea
                className="mt-1 min-h-20 w-full border border-line bg-white p-3 text-sm"
                placeholder="Pega un fragmento de la guía o rúbrica…"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
              />
              <button
                className="btn btn-accent mt-2"
                disabled={loading || !material.trim()}
                onClick={confirmAndPlan}
              >
                Recompilar con Claude
              </button>
            </div>

            <div className="panel p-5">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-puente" />
                <h3 className="display text-lg font-bold">Red Puente · 1 clic</h3>
              </div>
              <p className="mt-2 text-sm text-muted">
                {plan.industryVolunteer}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {[
                  "Voluntario industria",
                  "Apoyo psicológico",
                  "Núcleo familiar / CAI",
                ].map((a) => (
                  <button key={a} className="btn btn-ghost text-xs">
                    {a}
                  </button>
                ))}
              </div>
              <div className="mt-4 border border-line bg-paper p-3 text-sm">
                <p className="text-[11px] font-bold uppercase text-muted">
                  Borrador para tutor / institución
                </p>
                <p className="mt-1">{plan.tutorNoteDraft}</p>
              </div>
              <button
                className="btn btn-ghost mt-4"
                type="button"
                onClick={goBack}
              >
                <ArrowLeft size={16} />
                Atrás
              </button>
              <button
                className="btn btn-ghost mt-2 w-full"
                type="button"
                onClick={() => {
                  stopRecording();
                  setStep("welcome");
                }}
              >
                Reiniciar demo
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}
