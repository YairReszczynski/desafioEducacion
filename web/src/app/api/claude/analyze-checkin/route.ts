import { askClaude, parseJsonLoose } from "@/lib/claude";
import type { CheckInPayload, GlassBoxSummary } from "@/lib/types";
import { NextResponse } from "next/server";


const SYSTEM = `Eres el motor ético de Fundación Puente ("La educación supera la pobreza").
Acompañas a becarios de educación superior (muchos primera generación y/o que trabajan).
Tu trabajo: analizar el check-in semanal del estudiante y devolver SOLO JSON válido.

Reglas éticas obligatorias:
- Nunca etiquetes al alumno como "desertor" o "en riesgo de desertar". Habla de sobrecarga, fricción logística o necesidad de apoyo.
- No uses origen, género, sede ni jornada como factor de riesgo.
- El alumno es dueño de su mensaje: el resumen debe ser transparente y editable.
- Prioriza señales silenciosas reales: no responde WhatsApp, falta a reuniones, turnos laborales, núcleo familiar, carga académica.
- Los 3 pilares de Puente: académico, psicológico/familiar, trabajo/económico.
- alertLevel: baja | media | alta | crisis (crisis solo si hay intención de autolesión o peligro inmediato; en ese caso prioriza derivación humana).
- Lenguaje cálido, concreto, en español chileno neutro/profesional.`;

function mockSummary(payload: CheckInPayload): GlassBoxSummary {
  const t = payload.transcript.toLowerCase();
  const labour =
    /turno|pega|metro|trabajo|hora/.test(t) || payload.pillars.trabajo <= 4;
  const family = /hermano|familia|casa|cuidar|mamá|papá/.test(t);
  const money = /plata|pasaje|congelar|beca|plata/.test(t);
  const level =
    /congelar|no doy más|suicid|matarme/.test(t)
      ? ("crisis" as const)
      : labour || money
        ? ("alta" as const)
        : family
          ? ("media" as const)
          : ("baja" as const);

  return {
    summaryForStudent:
      "Noté sobrecarga de tiempo por trabajo y entregas. Entiendo que quieres seguir, pero necesitas micro-bloques de estudio y eventualmente flexibilidad.",
    victory: "Seguir intentando acomodar el semestre pese a los turnos.",
    headache: "Poco tiempo real (metro + una noche) vs. entregas acumuladas.",
    pillarsTouched: [
      "trabajo",
      "academico",
      ...(family ? (["psicologico"] as const) : []),
    ],
    proposedShare:
      "Camila tuvo sobrecarga laboral esta semana; propone estudiar en micro-ventanas. Sugiero contactar tutor y evaluar flexibilidad de entrega sin penalización.",
    askConsentQuestion:
      "¿Quieres compartir este resumen con tu tutor/a de Fundación Puente o prefieres editarlo primero?",
    suggestedActions: [
      "Compilar plan de supervivencia en micro-ventanas",
      "Solicitar Voluntario de Industria si hay prueba crítica",
      "Validación humana del tutor (no automatizada)",
    ],
    alertLevel: level,
    silentSignals: labour
      ? ["sobrecarga_laboral", "sobrecarga_academica"]
      : ["checkin_atrasado"],
    tutorBrief:
      "Alerta de fricción logística (no de rendimiento). Punto de decisión humana: contactar con cercanía, sin vigilancia.",
    ethicalNote:
      "Auditoría ética: la alerta se basa en lo que el alumno eligió contar + pilares auto-reportados. Sin sesgo por origen, género o jornada.",
  };
}

export async function POST(req: Request) {
  let payload: CheckInPayload | null = null;
  try {
    payload = (await req.json()) as CheckInPayload;
    if (!payload?.transcript?.trim()) {
      return NextResponse.json(
        { error: "Falta transcripción" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ data: mockSummary(payload), mock: true });
    }

    const user = `Analiza este check-in y responde SOLO con JSON:
{
  "summaryForStudent": string,
  "victory": string,
  "headache": string,
  "pillarsTouched": ("academico"|"psicologico"|"trabajo")[],
  "proposedShare": string,
  "askConsentQuestion": string,
  "suggestedActions": string[],
  "alertLevel": "baja"|"media"|"alta"|"crisis",
  "silentSignals": string[],
  "tutorBrief": string,
  "ethicalNote": string
}

Nombre token: ${payload.token}
Pilares (1-10, menor = más carga): ${JSON.stringify(payload.pillars)}
Minutos disponibles: ${payload.availableMinutes ?? "n/d"}
Energía: ${payload.energy ?? "n/d"}
Transcripción:
"""${payload.transcript}"""`;

    const text = await askClaude({
      system: SYSTEM,
      user,
      maxTokens: 1800,
    });
    const data = parseJsonLoose<GlassBoxSummary>(text);
    return NextResponse.json({ data, mock: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    if (payload?.transcript) {
      return NextResponse.json({
        data: mockSummary(payload),
        mock: true,
        warning: message,
      });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
