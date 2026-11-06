import { askClaude, parseJsonLoose } from "@/lib/claude";
import type { DigitizeResult } from "@/lib/types";
import { NextResponse } from "next/server";


const MOCK: DigitizeResult = {
  studentNameGuess: "Camila Rojas",
  academico:
    "1° año Informática · atraso en 2 entregas · solicita flexibilidad por turnos.",
  familiaRedes: "Vive con madre y hermano menor; apoyo emocional irregular.",
  saludBienestar: "Cansancio por turnos nocturnos; sueño insuficiente.",
  economicoFamiliar: "Trabajo part-time; estrés por pasajes y materiales.",
  habitabilidad: "Espacio de estudio compartido; estudia en micro/metro.",
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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      notes?: string;
      imageBase64?: string;
      mediaType?: string;
    };

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ data: MOCK, mock: true });
    }

    const images = body.imageBase64
      ? [
          {
            mediaType: body.mediaType || "image/jpeg",
            data: body.imageBase64.replace(/^data:[^;]+;base64,/, ""),
          },
        ]
      : undefined;

    const text = await askClaude({
      system: `Digitalizas la pauta oficial de entrevista de Fundación Puente.
Campos: académico, familia/redes, salud/bienestar, económico/familiar, habitabilidad, fortalezas, oportunidades, acuerdos, nivel de alerta.
Privacidad por diseño: no copies RUT completo ni datos clínicos crudos; resume y marca redacciones.
Devuelve SOLO JSON DigitizeResult.`,
      user: `Estructura esta entrevista/pauta:

Notas del tutor:
"""${body.notes || "(solo imagen)"}"""

JSON:
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
}`,
      images,
      maxTokens: 2200,
    });

    const data = parseJsonLoose<DigitizeResult>(text);
    return NextResponse.json({ data, mock: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ data: MOCK, mock: true, warning: message });
  }
}
