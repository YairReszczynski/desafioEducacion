import { askClaude, parseJsonLoose } from "@/lib/claude";
import type { AlertLevel, DigitizeResult } from "@/lib/types";
import { NextResponse } from "next/server";

const MOCK: DigitizeResult = {
  studentNameGuess: "Camila Rojas",
  academico:
    "1° año Informática · atraso en 2 entregas · solicita flexibilidad por turnos.",
  familiaRedes: "Vive con madre y hermano menor; apoyo emocional irregular.",
  saludBienestar: "Cansancio por turnos nocturnos; sueño insuficiente.",
  economicoFamiliar: "Trabajo part-time; estrés por pasajes y materiales.",
  habitabilidad: "Espacio de estudio compartido; estudia en el trayecto.",
  fortalezas: "Alta motivación; pide ayuda con claridad; compromiso con la beca.",
  oportunidades: "Confianza tutor-alumno (años 1-2); match voluntario industria.",
  acuerdos:
    "Reactivar check-in de voz semanal · tutoría académica · validar flexibilidad con institución.",
  alertLevel: "alta",
  pillars: { academico: 4, psicologico: 5, trabajo: 3 },
  sensitiveRedacted: ["detalle clínico omitido", "RUT no almacenado en claro"],
  tutorSummary:
    "Fricción logística laboral + académica. No es un juicio de rendimiento. Requiere firma humana de Coordinación para derivar.",
};

function mockFromNotes(notes?: string, hasImage?: boolean): DigitizeResult {
  if (!notes?.trim() && hasImage) {
    return {
      ...MOCK,
      studentNameGuess: "Becario/a (desde foto)",
      tutorSummary:
        "Pauta escaneada. Claude no respondió a tiempo: usa reintento o pega notas. Este mock mantiene la demo viva para el jurado.",
      sensitiveRedacted: ["espera de OCR/visión", "RUT no almacenado en claro"],
    };
  }
  if (!notes?.trim()) return MOCK;

  const t = notes.toLowerCase();
  const nameMatch = notes.match(/Nombre[:\s]+([^\n·]+)/i);
  const name = nameMatch?.[1]?.trim().split("·")[0]?.trim() || MOCK.studentNameGuess;
  const alert: AlertLevel = /crisis|suicid/.test(t)
    ? "crisis"
    : /alto|alta|intervenci/.test(t)
      ? "alta"
      : /medio|media/.test(t)
        ? "media"
        : /baja/.test(t)
          ? "baja"
          : "alta";

  return {
    ...MOCK,
    studentNameGuess: name,
    alertLevel: alert,
    academico: sliceField(notes, /acad[eé]mico/i) || MOCK.academico,
    familiaRedes: sliceField(notes, /familia/i) || MOCK.familiaRedes,
    saludBienestar: sliceField(notes, /salud/i) || MOCK.saludBienestar,
    economicoFamiliar:
      sliceField(notes, /econ[oó]mic/i) || MOCK.economicoFamiliar,
    habitabilidad: sliceField(notes, /habitab/i) || MOCK.habitabilidad,
    fortalezas: sliceField(notes, /fortaleza/i) || MOCK.fortalezas,
    oportunidades: sliceField(notes, /oportunidad/i) || MOCK.oportunidades,
    acuerdos: sliceField(notes, /acuerdo/i) || MOCK.acuerdos,
    tutorSummary: `Pauta digitalizada (${name}). Nivel ${alert}. Revisar acuerdos y firmar derivación humana.`,
  };
}

function sliceField(notes: string, re: RegExp): string | null {
  const lines = notes.split(/\n+/);
  const idx = lines.findIndex((l) => re.test(l));
  if (idx < 0) return null;
  const line = lines[idx]!;
  const after = line.split(/[:：]/).slice(1).join(":").trim();
  if (after.length > 8) return after.slice(0, 280);
  const next = lines[idx + 1]?.trim();
  return next && next.length > 4 ? next.slice(0, 280) : after || null;
}

type BodyImage = { mediaType?: string; dataUrl?: string; data?: string };

function normalizeImages(body: {
  images?: BodyImage[];
  imageBase64?: string;
  mediaType?: string;
}): { mediaType: string; data: string }[] {
  const out: { mediaType: string; data: string }[] = [];
  if (Array.isArray(body.images)) {
    for (const img of body.images) {
      const raw = img.dataUrl || img.data;
      if (!raw) continue;
      out.push({
        mediaType: img.mediaType || "image/jpeg",
        data: raw.replace(/^data:[^;]+;base64,/, ""),
      });
    }
  }
  if (!out.length && body.imageBase64) {
    out.push({
      mediaType: body.mediaType || "image/jpeg",
      data: body.imageBase64.replace(/^data:[^;]+;base64,/, ""),
    });
  }
  return out.slice(0, 3);
}

export async function POST(req: Request) {
  let notes: string | undefined;
  let hasImage = false;
  try {
    const body = (await req.json()) as {
      notes?: string;
      imageBase64?: string;
      mediaType?: string;
      images?: BodyImage[];
    };
    notes = body.notes;
    const images = normalizeImages(body);
    hasImage = images.length > 0;

    if (!notes?.trim() && !hasImage) {
      return NextResponse.json(
        { error: "Falta foto de la pauta o notas" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        data: mockFromNotes(notes, hasImage),
        mock: true,
      });
    }

    const text = await askClaude({
      system: `Eres el digitalizador de la PAUTA OFICIAL "Registro de Entrevista Becados/as" de Fundación Puente.

Campos a extraer (aunque la letra sea manuscrita o la foto incluya varias páginas):
- Identificación: nombre (sin RUT completo), institución, carrera, año, tipo de entrevista
- Ámbito académico / trayectoria
- Familia y redes de apoyo
- Salud y bienestar (resumir; no copiar diagnósticos clínicos crudos)
- Situación económica y familiar
- Habitabilidad y condiciones para el estudio
- Fortalezas y desarrollo personal
- Oportunidades a trabajar
- Acuerdos / compromisos / plan de acción
- Nivel de alerta: baja | media | alta | crisis (si marca Alto → alta; crisis solo si hay peligro inmediato)

Privacidad por diseño:
- NO copies RUT completo ni datos clínicos sensibles; resume y lista qué redactaste en sensitiveRedacted.
- No inventes hechos que no estén en la foto/notas. Si un campo no se lee, escribe "No legible en la foto".
- Estilo: español neutro profesional (tú). Sin voseo ni regionalismos.

Pilares 1-10 (1=muy cargado, 10=estable) estimados SOLO desde lo escrito.
Devuelve SOLO JSON DigitizeResult válido.`,
      user: `Digitaliza esta pauta de entrevista (foto manuscrita y/o notas). Responde SOLO JSON:
{
  "studentNameGuess": string,
  "academico": string,
  "familiaRedes": string,
  "saludBienestar": string,
  "economicoFamiliar": string,
  "habitabilidad": string,
  "fortalezas": string,
  "oportunidades": string,
  "acuerdos": string,
  "alertLevel": "baja"|"media"|"alta"|"crisis",
  "pillars": {"academico":1-10,"psicologico":1-10,"trabajo":1-10},
  "sensitiveRedacted": string[],
  "tutorSummary": string
}

Notas del tutor (pueden estar vacías si hay foto):
"""${notes || "(sin notas — leer solo la imagen)"}"""

Hay ${images.length} foto(s) adjunta(s) de la pauta impresa.`,
      images: images.length
        ? images.map((i) => ({ mediaType: i.mediaType, data: i.data }))
        : undefined,
      maxTokens: 2200,
      timeoutMs: 18_000,
    });

    const data = parseJsonLoose<DigitizeResult>(text);
    const safe: DigitizeResult = {
      studentNameGuess: data.studentNameGuess || "Becario/a",
      academico: data.academico || "No legible en la foto",
      familiaRedes: data.familiaRedes || "No legible en la foto",
      saludBienestar: data.saludBienestar || "No legible en la foto",
      economicoFamiliar: data.economicoFamiliar || "No legible en la foto",
      habitabilidad: data.habitabilidad || "No legible en la foto",
      fortalezas: data.fortalezas || "No legible en la foto",
      oportunidades: data.oportunidades || "No legible en la foto",
      acuerdos: data.acuerdos || "No legible en la foto",
      alertLevel: (["baja", "media", "alta", "crisis"] as const).includes(
        data.alertLevel as AlertLevel
      )
        ? (data.alertLevel as AlertLevel)
        : "media",
      pillars: {
        academico: clampPillar(data.pillars?.academico),
        psicologico: clampPillar(data.pillars?.psicologico),
        trabajo: clampPillar(data.pillars?.trabajo),
      },
      sensitiveRedacted: Array.isArray(data.sensitiveRedacted)
        ? data.sensitiveRedacted
        : ["RUT no almacenado en claro"],
      tutorSummary:
        data.tutorSummary ||
        "Pauta digitalizada. Requiere firma humana de Coordinación.",
    };
    return NextResponse.json({ data: safe, mock: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({
      data: mockFromNotes(notes, hasImage),
      mock: true,
      warning: message,
    });
  }
}

function clampPillar(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 5;
  return Math.max(1, Math.min(10, Math.round(v)));
}
