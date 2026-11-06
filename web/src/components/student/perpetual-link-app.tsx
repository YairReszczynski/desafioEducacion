"use client";

import { PuenteLogo } from "@/components/brand/logo";
import { InstallPWAPrompt } from "@/components/pwa/install-prompt";
import { AlertBadge } from "@/components/ui/alert-badge";
import { BackButton } from "@/components/ui/back-button";
import { LoadMeter, loadColor } from "@/components/ui/load-meter";
import { RoleBanner } from "@/components/ui/role-banner";
import {
  publishLiveCheckIn,
  setLiveRequestedSupport,
} from "@/lib/checkin-store";
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
  Radio,
  Shield,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import Link from "next/link";
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
  const [requestedSupport, setRequestedSupport] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
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
    // No borramos la transcripción previa: el alumno puede regrabar encima
    // solo si quiere; al detener se conserva lo dicho.
    setSeconds(0);
    setRecording(true);
    const baseText = transcript.trim();
    let finals = "";

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
        let interim = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const piece = ev.results[i]![0]!.transcript;
          if (ev.results[i]!.isFinal) {
            finals += `${piece} `;
          } else {
            interim += piece;
          }
        }
        const merged = [baseText, finals.trim(), interim.trim()]
          .filter(Boolean)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        setTranscript(merged);
      };
      rec.onerror = () => {
        /* el texto ya escrito se mantiene */
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

  function useExampleVoice() {
    const example = `Hola, soy ${student.firstName}. Esta semana me cambiaron los turnos en la pega. Solo tengo como veinticinco minutos en el trayecto y una hora el jueves en la noche. Tengo entregas y siento que se me arma una bola de nieve. Quiero seguir, pero necesito acomodar el estudio a esos huecos.`;
    setTranscript(example);
    setError(null);
  }

  async function analyze() {
    setLoading(true);
    setError(null);
    const locked = transcript.trim();
    if (!locked) {
      setError("Falta la transcripción");
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    const kill = window.setTimeout(() => ctrl.abort(), 18_000);
    try {
      const res = await fetch("/api/claude/analyze-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          token: student.token,
          studentName: student.name,
          firstName: student.firstName,
          career: student.career,
          transcript: locked,
          pillars,
          availableMinutes: minutes,
          energy,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error");
      const data = json.data as GlassBoxSummary | undefined;
      if (!data?.summaryForStudent || !data?.proposedShare) {
        throw new Error("Respuesta incompleta de la IA");
      }
      if (data.proposedShare) {
        // Blindaje: nombre del link + tono de nota al tutor
        data.proposedShare = data.proposedShare
          .replace(/\bCamila Rojas\b/gi, student.firstName)
          .replace(/\bCamila\b/gi, student.firstName)
          .replace(/^El\/la estudiante/i, student.firstName);
        if (
          !data.proposedShare
            .toLowerCase()
            .includes(student.firstName.toLowerCase())
        ) {
          data.proposedShare = `${student.firstName} reporta: ${data.proposedShare}`;
        }
      }
      setTranscript(locked);
      setGlass(data);
      setStep("glass");
    } catch (e) {
      const msg =
        e instanceof Error && e.name === "AbortError"
          ? "La IA tardó demasiado. Reintenta — si sigue lento, pega el ejemplo y vuelve a pulsar."
          : e instanceof Error
            ? e.message
            : "Error al analizar";
      setError(msg);
    } finally {
      window.clearTimeout(kill);
      setLoading(false);
    }
  }

  async function confirmAndPlan() {
    setLoading(true);
    setError(null);
    try {
      if (consentShare && glass) {
        publishLiveCheckIn({
          student,
          transcript,
          glass,
          pillars,
          minutes,
          energy,
        });
        setPublished(true);
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

      <RoleBanner
        role="alumno"
        title={`Hola, ${student.firstName} — este es TU link`}
        subtitle="Solo tú ves el check-in y el plan. El equipo Puente ve un resumen si tú lo autorizas."
      />

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
              Máximo 30 segundos. Tu texto se conserva editable hasta que lo
              envíes. Si no hay micrófono, puedes pegar un ejemplo con tu nombre.
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
                type="button"
                onClick={useExampleVoice}
              >
                Pegar ejemplo ({student.firstName})
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
              ¿Cómo vas en cada área? <b>1 = muy cargado</b> ·{" "}
              <b>10 = estable</b>. Sirve para priorizar apoyo, no para
              “calificarte”.
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
                  <span
                    className="display text-2xl font-bold"
                    style={{ color: loadColor(pillars[key]) }}
                  >
                    {pillars[key]}
                    <span className="text-xs font-bold text-muted"> /10</span>
                  </span>
                </div>
                <LoadMeter
                  className="mt-2"
                  value={pillars[key]}
                  aria-label={label}
                  onChange={(v) =>
                    setPillars((p) => ({
                      ...p,
                      [key]: v,
                    }))
                  }
                />
              </div>
            ))}

            <div className="mt-6 border border-signal/60 bg-[#fff9e6] p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-ink">
                Para armar tu plan de estudio
              </p>
              <p className="mt-1 text-sm text-muted">
                Los <b>minutos</b> son el tiempo real que tienes esta semana
                (metro, noche libre, etc.). Claude parte ese bloque en cápsulas
                cortas. La <b>energía</b> define si el plan queda liviano o más
                exigente.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-muted">
                    Minutos libres para estudiar
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
                  <p className="display text-lg font-bold">
                    {minutes} min totales
                  </p>
                </div>
                <div>
                  <div className="flex items-end justify-between">
                    <label className="text-xs font-bold uppercase tracking-wide text-muted">
                      Energía hoy
                    </label>
                    <span
                      className="display text-lg font-bold"
                      style={{ color: loadColor(energy) }}
                    >
                      {energy}/10
                    </span>
                  </div>
                  <LoadMeter
                    className="mt-1"
                    value={energy}
                    lowLabel="Baja"
                    highLabel="Alta"
                    aria-label="Energía hoy"
                    onChange={setEnergy}
                  />
                </div>
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
                {loading
                  ? "Analizando… (hasta ~12s)"
                  : "Ver qué entendió la IA"}
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

            <div className="mt-4 border border-line bg-white p-3 text-sm">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
                Tu transcripción (sin cambios)
              </p>
              <p className="mt-1 italic text-ink/90">“{transcript}”</p>
            </div>

            <div className="mt-3 border-l-4 border-signal bg-[#fff9e6] p-4 text-sm">
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

            <div className="mt-4 border border-line bg-paper/80 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">
                Nota para tu tutor/a (editable)
              </p>
              <p className="mt-1 text-xs text-muted">
                Esto <b>no es un mensaje para ti</b>: lo lee el equipo Puente. Por
                eso habla de {student.firstName} en tercera persona. Puedes
                corregirlo antes de compartir.
              </p>
              <textarea
                className="mt-2 min-h-24 w-full border border-line bg-white p-3 text-sm"
                value={glass.proposedShare}
                onChange={(e) =>
                  setGlass({ ...glass, proposedShare: e.target.value })
                }
              />
            </div>

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
            <div className="panel border-l-4 border-coral p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-coral">
                1 · Para ti (alumno)
              </p>
              <div className="mt-1 flex items-center gap-2 text-puente">
                <Sparkles size={18} />
                <h2 className="display text-xl font-bold">{plan.headline}</h2>
              </div>
              <p className="mt-1 text-sm text-muted">
                Cápsulas armadas con el tiempo que declaraste. Esto es tu plan
                de la semana.
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
                <Upload size={14} /> Opcional: pegar apunte para rearmar cápsulas
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
              <p className="text-[11px] font-bold uppercase tracking-wide text-coral">
                2 · ¿Necesitas algo más? (tú eliges)
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Users size={18} className="text-puente" />
                <h3 className="display text-lg font-bold">Red Fundación Puente</h3>
              </div>
              <p className="mt-2 text-sm text-muted">
                Un toque deja constancia. El equipo humano decide el contacto; no
                es automático.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {[
                  "Voluntario industria",
                  "Apoyo psicológico",
                  "Núcleo familiar / CAI",
                  "No necesito ayuda, gracias",
                ].map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={cn(
                      "btn text-xs",
                      requestedSupport === a ? "btn-primary" : "btn-ghost"
                    )}
                    onClick={() => {
                      setRequestedSupport(a);
                      // Publica al radar del equipo (si ya había check-in vivo)
                      const updated = setLiveRequestedSupport(student.token, a);
                      if (!updated && consentShare && glass) {
                        publishLiveCheckIn({
                          student,
                          transcript,
                          glass,
                          pillars,
                          minutes,
                          energy,
                          requestedSupport: a,
                        });
                        setPublished(true);
                      }
                    }}
                  >
                    {requestedSupport === a ? `✓ ${a}` : a}
                  </button>
                ))}
              </div>
              {requestedSupport === "No necesito ayuda, gracias" ? (
                <p className="mt-3 border border-ok/30 bg-[#e7f2ea] p-3 text-sm text-ok">
                  Perfecto. Queda registrado que esta semana estás ok con el plan
                  y no pides contacto extra. Tu tutor igual puede ver el check-in
                  si lo autorizaste.
                </p>
              ) : requestedSupport ? (
                <p className="mt-3 border border-ok/30 bg-[#e7f2ea] p-3 text-sm text-ok">
                  Listo. Pediste <b>{requestedSupport}</b>. El equipo Puente lo ve
                  ahora mismo en el radar y te contacta una persona (no un bot).
                </p>
              ) : (
                <p className="mt-3 text-xs text-muted">
                  Elige una opción para que el tutor vea qué pediste.
                </p>
              )}
            </div>

            {consentShare ? (
              <div className="panel border-dashed p-5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
                  3 · Ya llegó al equipo Puente
                </p>
                {published && glass ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 bg-puente px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                      <Radio size={12} /> En vivo en el radar
                    </span>
                    <AlertBadge level={glass.alertLevel} />
                  </div>
                ) : null}
                <p className="mt-2 text-sm text-muted">
                  Autorizaste compartir: Coordinación ya ve tu caso con el nivel
                  de prioridad que salió de este check-in. Tú sigues en tu plan;
                  ellos deciden el contacto humano.
                </p>
                <p className="mt-3 border border-line bg-paper p-3 text-sm">
                  {plan.tutorNoteDraft}
                </p>
                <Link href="/dashboard" className="btn btn-primary mt-3 text-xs">
                  Abrir radar del equipo (demo) →
                </Link>
              </div>
            ) : (
              <div className="panel p-4 text-sm text-muted">
                Elegiste no compartir con el tutor. Tu plan queda solo en este
                link y no aparece en el radar.
              </div>
            )}

            <button
              className="btn btn-ghost"
              type="button"
              onClick={goBack}
            >
              <ArrowLeft size={16} />
              Atrás
            </button>
            <button
              className="btn btn-ghost w-full"
              type="button"
              onClick={() => {
                stopRecording();
                setRequestedSupport(null);
                setStep("welcome");
              }}
            >
              Reiniciar demo
            </button>
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
