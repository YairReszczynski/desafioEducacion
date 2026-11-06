"use client";

import { PuenteLogo } from "@/components/brand/logo";
import { AlertBadge } from "@/components/ui/alert-badge";
import { BackButton } from "@/components/ui/back-button";
import { LoadMeter, loadColor } from "@/components/ui/load-meter";
import { RoleBanner } from "@/components/ui/role-banner";
import { publishLiveCheckIn } from "@/lib/checkin-store";
import { compressDataUrl, fileToDataUrl } from "@/lib/image-compress";
import { loadInvited, saveInvited } from "@/lib/invite-store";
import type { DigitizeResult, GlassBoxSummary, Student } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Camera,
  CheckCircle2,
  FileDown,
  Loader2,
  Printer,
  Radio,
  Shield,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const SAMPLE_NOTES = `Registro de Entrevista Becados/as
Nombre: Camila Rojas · Duoc UC · Ing. Informática · 1° año · Año en Puente: 1
Tipo: Seguimiento · Modalidad presencial

Ámbito académico: Atraso en 2 entregas de Taller. Pide flexibilidad por turnos.
Familia y redes: Vive con madre y hermano menor. Apoyo irregular.
Salud y bienestar: Cansancio, duerme poco por turnos.
Situación económica: Trabajo part-time. Estrés por pasajes.
Habitabilidad: Estudia en el trayecto / espacios compartidos.
Fortalezas: Motivada, pide ayuda con claridad.
Oportunidades: Generar confianza rápido (1°-2° año).
Acuerdos: Check-in semanal + voluntario industria + contactar institución.
Nivel de alerta: Alto`;

type Shot = {
  dataUrl: string;
  mediaType: string;
  label: string;
};

function makeToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `paper-${Date.now()}`;
}

export function DigitizePanel() {
  const [notes, setNotes] = useState("");
  const [shots, setShots] = useState<Shot[]>([]);
  const [result, setResult] = useState<DigitizeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamOn(false);
  }

  async function startCamera() {
    setCamError(null);
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      setCamOn(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setCamError(
        "No se pudo abrir la cámara. Usa “Subir foto” o la cámara del teléfono."
      );
      setCamOn(false);
    }
  }

  async function addShotFromDataUrl(raw: string, label: string) {
    try {
      const { dataUrl, mediaType } = await compressDataUrl(raw, {
        maxWidth: 1600,
        quality: 0.74,
      });
      setShots((prev) => {
        const next = [...prev, { dataUrl, mediaType, label }];
        return next.slice(0, 3);
      });
      setResult(null);
      setPublished(false);
      setCamError(null);
      setWarning(null);
    } catch (e) {
      setCamError(
        e instanceof Error
          ? e.message
          : "No se pudo cargar la imagen. Prueba JPG o PNG."
      );
    }
  }

  async function captureFrame() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setCamError("Espera un segundo a que la cámara enfoque e inténtalo de nuevo.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const raw = canvas.toDataURL("image/jpeg", 0.92);
    await addShotFromDataUrl(raw, `Foto ${shots.length + 1}`);
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setCamError(null);
    const list = Array.from(files).slice(0, Math.max(0, 3 - shots.length));
    if (!list.length) {
      setCamError("Ya tienes 3 fotos. Quita una para agregar otra.");
      return;
    }
    for (let i = 0; i < list.length; i++) {
      const file = list[i]!;
      try {
        const raw = await fileToDataUrl(file);
        await addShotFromDataUrl(
          raw,
          file.name?.trim() || `Foto ${shots.length + i + 1}`
        );
      } catch {
        setCamError(
          `No se pudo leer “${file.name || "la imagen"}”. Usa JPG o PNG.`
        );
      }
    }
  }

  function removeShot(idx: number) {
    setShots((prev) => prev.filter((_, i) => i !== idx));
    setResult(null);
    setPublished(false);
  }

  async function digitize() {
    if (!shots.length && !notes.trim()) {
      setWarning("Sube al menos una foto de la pauta o pega notas.");
      return;
    }
    setLoading(true);
    setWarning(null);
    setPublished(false);
    const ctrl = new AbortController();
    const kill = window.setTimeout(() => ctrl.abort(), 25_000);
    try {
      const res = await fetch("/api/claude/digitize-paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          notes: notes.trim() || undefined,
          images: shots.map((s) => ({
            mediaType: s.mediaType,
            dataUrl: s.dataUrl,
          })),
          // compat API anterior
          imageBase64: shots[0]?.dataUrl,
          mediaType: shots[0]?.mediaType,
        }),
      });
      const json = await res.json();
      if (!json.data) throw new Error(json.error || "Sin resultado");
      setResult(json.data as DigitizeResult);
      if (json.warning) setWarning(json.warning);
      if (json.mock) {
        setWarning(
          (json.warning ? `${json.warning} · ` : "") +
            "Resultado con respaldo local (demo)."
        );
      }
    } catch (e) {
      const msg =
        e instanceof Error && e.name === "AbortError"
          ? "Tardó demasiado. Inténtalo de nuevo con una foto más nítida o usa el PDF relleno + notas."
          : e instanceof Error
            ? e.message
            : "Error";
      setWarning(msg);
    } finally {
      window.clearTimeout(kill);
      setLoading(false);
    }
  }

  function publishToRadar() {
    if (!result) return;
    const first =
      result.studentNameGuess?.trim().split(/\s+/)[0] || "Becario/a";
    const name = result.studentNameGuess?.trim() || first;
    const token = makeToken();
    const student: Student = {
      id: `paper-${token}`,
      token,
      name,
      firstName: first,
      career: "Desde pauta papel",
      institution: "Fundación Puente",
      year: 1,
      yearInPuente: 1,
      jornada: "diurna",
      works: true,
      tutor: "Coordinación",
      city: "Chile",
      alertLevel: result.alertLevel,
      signals: ["sobrecarga_academica"],
      pillars: result.pillars,
      lastCheckInDaysAgo: 0,
      missedMeetings: 0,
      unansweredMessages: 0,
      quote: result.tutorSummary.slice(0, 180),
      suggestedAction: result.acuerdos.slice(0, 120),
      midYearRisk: result.alertLevel !== "baja",
    };

    const glass: GlassBoxSummary = {
      summaryForStudent: result.tutorSummary,
      victory: result.fortalezas.slice(0, 120),
      headache: result.academico.slice(0, 120),
      pillarsTouched: ["academico", "psicologico", "trabajo"],
      proposedShare: `${first} — pauta papel digitalizada. ${result.tutorSummary}`,
      askConsentQuestion: "Registro de entrevista tutor (papel → digital).",
      suggestedActions: [result.acuerdos],
      alertLevel: result.alertLevel,
      silentSignals: ["sobrecarga_academica", "sobrecarga_laboral"],
      tutorBrief: result.tutorSummary,
      ethicalNote:
        "Origen: pauta oficial escaneada. Datos sensibles redactados. Firma humana pendiente.",
    };

    saveInvited([student, ...loadInvited().filter((s) => s.token !== token)]);
    publishLiveCheckIn({
      student,
      transcript: [
        notes.trim() || "(desde foto de pauta)",
        result.academico,
        result.familiaRedes,
        result.acuerdos,
      ]
        .filter(Boolean)
        .join(" · ")
        .slice(0, 900),
      glass,
      pillars: result.pillars,
      requestedSupport: null,
      source: "papel",
    });
    setPublished(true);
  }

  const canDigitize = shots.length > 0 || notes.trim().length > 12;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <BackButton href="/dashboard" label="Atrás al radar" />
        <PuenteLogo variant="color" className="!h-12" />
      </div>
      <RoleBanner
        role="equipo"
        title="Herramienta de tutores / Coordinación"
        subtitle="Imprime la pauta oficial, rellénala a mano y escanéala con foto. El alumno no usa esta pantalla."
      />

      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-coral">
          Del cuaderno a datos seguros · demo en vivo
        </p>
        <h1 className="display mt-1 text-3xl font-bold sm:text-4xl">
          Pauta papel → digital
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Flujo: 1) imprimir pauta oficial · 2) rellenar a mano · 3) foto con
          cámara · 4) Claude Vision estructura los campos · 5) publicar al radar
          para firma humana.
        </p>
      </header>

      {/* Paso 1: imprimir */}
      <section className="panel mb-4 p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-coral">
          1 · Imprimir pauta oficial
        </p>
        <p className="mt-1 text-sm text-muted">
          Misma estructura que el PDF de Fundación Puente (académico, familia,
          salud, económico, habitabilidad, acuerdos, nivel de alerta).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/dashboard/digitize/imprimir" className="btn btn-primary">
            <Printer size={16} />
            Abrir e imprimir
          </Link>
          <a
            className="btn btn-ghost"
            href="/pauta/registro-entrevista-becados.pdf"
            target="_blank"
            rel="noreferrer"
          >
            <FileDown size={16} />
            PDF oficial
          </a>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {[1, 2, 3].map((n) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={n}
              src={`/pauta/pagina-${n}.png`}
              alt={`Pauta página ${n}`}
              className="border border-line bg-white object-contain"
            />
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          {/* Paso 2: escanear */}
          <section className="panel p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-coral">
              2 · Escanear con foto (hasta 3 páginas)
            </p>
            <p className="mt-1 text-sm text-muted">
              Enfoca el papel con buena luz. La foto se comprime sola antes de
              enviarla a Claude.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {!camOn ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={startCamera}
                >
                  <Camera size={16} />
                  Abrir cámara
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-accent"
                    onClick={captureFrame}
                    disabled={shots.length >= 3}
                  >
                    <Camera size={16} />
                    Capturar página
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={stopCamera}
                  >
                    Cerrar cámara
                  </button>
                </>
              )}
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => fileRef.current?.click()}
                disabled={shots.length >= 3}
              >
                <Upload size={16} />
                Subir foto
              </button>
              <label
                htmlFor="pauta-cam-capture"
                className={cn(
                  "btn btn-ghost cursor-pointer",
                  shots.length >= 3 && "pointer-events-none opacity-45"
                )}
              >
                <Camera size={16} />
                Cámara del teléfono
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  void onFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              {/* Input aparte solo cámara (móvil) */}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                id="pauta-cam-capture"
                onChange={(e) => {
                  void onFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {camError ? (
              <p className="mt-2 text-xs text-bad">{camError}</p>
            ) : null}

            {camOn ? (
              <div className="mt-3 overflow-hidden border border-puente bg-black">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="max-h-72 w-full object-contain"
                />
              </div>
            ) : null}

            {shots.length ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {shots.map((s, i) => (
                  <div key={i} className="relative border border-line bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.dataUrl}
                      alt={s.label}
                      className="aspect-[3/4] w-full object-cover"
                    />
                    <button
                      type="button"
                      className="absolute right-1 top-1 bg-ink/80 p-1 text-white"
                      onClick={() => removeShot(i)}
                      aria-label="Quitar foto"
                    >
                      <X size={12} />
                    </button>
                    <p className="truncate px-1 py-0.5 text-[10px] text-muted">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 border border-dashed border-line p-3 text-xs text-muted">
                Todavía no hay fotos. Captura la pauta rellena o sube una imagen.
              </p>
            )}
          </section>

          {/* Notas opcionales */}
          <section className="panel p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-coral">
              3 · Notas opcionales (si la foto no alcanza)
            </p>
            <textarea
              className="mt-2 min-h-28 w-full border border-line bg-white p-3 font-mono text-xs"
              placeholder="Pega lo que alcanzó a leer el tutor, o usa el ejemplo de demo…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-ghost mt-2 text-xs"
              onClick={() => setNotes(SAMPLE_NOTES)}
            >
              Pegar ejemplo demo (Camila)
            </button>
          </section>

          <button
            className="btn btn-primary w-full"
            disabled={loading || !canDigitize}
            onClick={digitize}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Leyendo pauta con
                Claude…
              </>
            ) : (
              <>
                <Shield size={16} />
                4 · Digitalizar pauta
              </>
            )}
          </button>
          {warning ? (
            <p className="text-xs text-warn">{warning}</p>
          ) : null}
        </div>

        {/* Resultado */}
        <div className="panel p-4">
          {!result ? (
            <div className="space-y-3 text-sm text-muted">
              <p className="font-bold text-ink">Resultado estructurado</p>
              <p>
              Aquí aparecen los campos oficiales: académico, familia, salud,
              económico, habitabilidad, fortalezas, acuerdos, nivel de alerta
              y termómetro de 3 pilares — con datos sensibles redactados.
              </p>
              <ol className="list-decimal space-y-1 pl-5">
                <li>Imprime y rellena a mano</li>
                <li>Foto nítida de cada hoja</li>
                <li>Digitalizar</li>
                <li>Publicar al radar (firma humana)</li>
              </ol>
            </div>
          ) : (
            <div className="space-y-3 rise">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="display text-xl font-bold">
                  {result.studentNameGuess || "Becario/a"}
                </h2>
                <AlertBadge level={result.alertLevel} />
              </div>
              <p className="border-l-4 border-signal bg-[#fff9e6] p-3 text-sm">
                {result.tutorSummary}
              </p>
              {(
                [
                  ["Académico", result.academico],
                  ["Familia / redes", result.familiaRedes],
                  ["Salud / bienestar", result.saludBienestar],
                  ["Económico / familiar", result.economicoFamiliar],
                  ["Habitabilidad", result.habitabilidad],
                  ["Fortalezas", result.fortalezas],
                  ["Oportunidades", result.oportunidades],
                  ["Acuerdos", result.acuerdos],
                ] as const
              ).map(([k, v]) => (
                <div key={k}>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-coral">
                    {k}
                  </p>
                  <p className="text-sm">{v}</p>
                </div>
              ))}

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {(
                  [
                    ["Académico", result.pillars.academico],
                    ["Psico/fam", result.pillars.psicologico],
                    ["Trabajo", result.pillars.trabajo],
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

              {result.sensitiveRedacted?.length ? (
                <p className="text-xs text-muted">
                  Redactado: {result.sensitiveRedacted.join(" · ")}
                </p>
              ) : null}

              <div className="flex flex-col gap-2 pt-2">
                {!published ? (
                  <button
                    type="button"
                    className="btn btn-primary w-full"
                    onClick={publishToRadar}
                  >
                    <Radio size={16} />
                    5 · Publicar al radar (decisión humana)
                  </button>
                ) : (
                  <div className="border-2 border-ok bg-[#e7f2ea] p-3 text-sm text-ok">
                    <p className="flex items-center gap-2 font-bold">
                      <CheckCircle2 size={18} /> En vivo en el radar
                    </p>
                    <Link
                      href="/dashboard"
                      className="mt-2 inline-flex text-xs font-bold underline"
                    >
                      Abrir radar del equipo →
                    </Link>
                  </div>
                )}
                <button
                  type="button"
                  className={cn("btn btn-ghost w-full text-xs")}
                  onClick={() => {
                    setResult(null);
                    setPublished(false);
                  }}
                >
                  Digitalizar otra pauta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
