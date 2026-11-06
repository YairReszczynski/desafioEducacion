"use client";

import { PuenteLogo } from "@/components/brand/logo";
import { AlertBadge } from "@/components/ui/alert-badge";
import { BackButton } from "@/components/ui/back-button";
import type { DigitizeResult } from "@/lib/types";
import { Camera, FileText, Loader2 } from "lucide-react";
import { useState } from "react";

const SAMPLE_NOTES = `Registro de Entrevista Becados/as
Nombre: Camila Rojas · Duoc UC · Ing. Informática · 1° año · Año en Puente: 1
Tipo: Seguimiento · Modalidad presencial

Ámbito académico: Atraso en 2 entregas de Taller. Pide flexibilidad por turnos.
Familia y redes: Vive con madre y hermano menor. Apoyo irregular.
Salud y bienestar: Cansancio, duerme poco por turnos.
Situación económica: Trabajo part-time. Estrés por pasajes.
Habitabilidad: Estudia en el metro / espacios compartidos.
Fortalezas: Motivada, pide ayuda con claridad.
Oportunidades: Generar confianza rápido (1°-2° año).
Acuerdos: Check-in semanal + voluntario industria + contactar institución.
Nivel de alerta: Alto`;

export function DigitizePanel() {
  const [notes, setNotes] = useState(SAMPLE_NOTES);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState("image/jpeg");
  const [result, setResult] = useState<DigitizeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  function onFile(file: File | null) {
    if (!file) return;
    setMediaType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function digitize() {
    setLoading(true);
    setWarning(null);
    try {
      const res = await fetch("/api/claude/digitize-paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          imageBase64: preview || undefined,
          mediaType,
        }),
      });
      const json = await res.json();
      setResult(json.data);
      if (json.warning) setWarning(json.warning);
    } catch (e) {
      setWarning(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <BackButton href="/dashboard" label="Atrás al radar" />
        <PuenteLogo variant="color" className="!h-12" />
      </div>
      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-coral">
          Del cuaderno a datos seguros
        </p>
        <h1 className="display mt-1 text-3xl font-bold sm:text-4xl">
          Digitalizar pauta de entrevista
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Los tutores anotan en papel por privacidad. Claude Vision estructura
          los campos oficiales de Fundación Puente y anonimiza lo sensible. La
          Coordinación sigue firmando a mano digital.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <label className="flex items-center gap-2 text-sm font-bold">
            <FileText size={16} /> Notas / pauta (texto)
          </label>
          <textarea
            className="mt-2 min-h-56 w-full border border-line bg-white p-3 font-mono text-xs"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <label className="mt-4 flex cursor-pointer items-center gap-2 border border-dashed border-line p-4 text-sm hover:border-ink">
            <Camera size={16} />
            Foto de la pauta escrita a mano
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] || null)}
            />
          </label>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Vista previa pauta"
              className="mt-3 max-h-48 w-full object-contain border border-line"
            />
          ) : null}

          <button
            className="btn btn-primary mt-4 w-full"
            disabled={loading}
            onClick={digitize}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Digitalizando…
              </>
            ) : (
              "Extraer con Claude Haiku 5.5"
            )}
          </button>
          {warning ? (
            <p className="mt-2 text-xs text-warn">{warning}</p>
          ) : null}
        </div>

        <div className="panel p-4">
          {!result ? (
            <p className="text-sm text-muted">
              El resultado estructurado aparecerá aquí: 3 pilares, acuerdos y
              nivel de alerta con datos sensibles redactados.
            </p>
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
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="border border-line p-2">
                  <p className="display text-xl font-bold">
                    {result.pillars.academico}
                  </p>
                  <p className="text-[10px] text-muted">Académico</p>
                </div>
                <div className="border border-line p-2">
                  <p className="display text-xl font-bold">
                    {result.pillars.psicologico}
                  </p>
                  <p className="text-[10px] text-muted">Psico/fam</p>
                </div>
                <div className="border border-line p-2">
                  <p className="display text-xl font-bold">
                    {result.pillars.trabajo}
                  </p>
                  <p className="text-[10px] text-muted">Trabajo</p>
                </div>
              </div>
              {result.sensitiveRedacted?.length ? (
                <p className="text-xs text-muted">
                  Redactado: {result.sensitiveRedacted.join(" · ")}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
