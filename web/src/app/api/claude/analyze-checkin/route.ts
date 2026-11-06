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
- Lenguaje cálido, concreto, en español chileno neutro/profesional.
- CRÍTICO: Usa SIEMPRE el nombre de pila real del estudiante. NUNCA inventes otro nombre.
- CRÍTICO: summaryForStudent, victory y headache van en SEGUNDA persona (tú/tu) hacia el alumno.
- CRÍTICO: proposedShare es una NOTA BREVE PARA EL TUTOR en tercera persona, usando solo el nombre de pila (ej. "Camila reporta cambios de turno…"). No uses apellido completo. Basado SOLO en la transcripción.`;

function mockSummary(payload: CheckInPayload): GlassBoxSummary {
  const name = payload.firstName?.trim() || payload.studentName?.split(" ")[0] || "El/la estudiante";
  const full = payload.studentName?.trim() || name;
  const raw = payload.transcript.trim();
  const t = raw.toLowerCase();
  const labour =
    /turno|pega|metro|trabajo|hora|vega|local|jornada/.test(t) ||
    payload.pillars.trabajo <= 4;
  const family = /hermano|familia|casa|cuidar|mamá|papá|mama|papa/.test(t);
  const money = /plata|pasaje|congelar|beca|dinero|plata/.test(t);
  const level =
    /congelar|no doy más|suicid|matarme/.test(t)
      ? ("crisis" as const)
      : labour || money
        ? ("alta" as const)
        : family
          ? ("media" as const)
          : ("baja" as const);

  const snippet = raw.length > 160 ? `${raw.slice(0, 157)}…` : raw;

  return {
    summaryForStudent: `Esto es lo que escuché de tu semana, ${name}: «${snippet}». ¿Lo ves bien así o quieres ajustar algo antes de compartirlo?`,
    victory: labour
      ? "Seguir buscando acomodar el semestre pese a la carga de esta semana."
      : "Haber dejado registrado cómo te fue.",
    headache: labour
      ? "La fricción de tiempo/trabajo frente a lo académico."
      : family
        ? "La carga en casa o redes de apoyo."
        : "Lo que más te pesó según tus propias palabras.",
    pillarsTouched: [
      ...(labour ? (["trabajo"] as const) : []),
      "academico",
      ...(family ? (["psicologico"] as const) : []),
    ],
    proposedShare: `${name} reporta esta semana: «${snippet}». Sugiero contacto con cercanía y, si aplica, micro-bloques de estudio o flexibilidad puntual — sin sanción.`,
    askConsentQuestion: `¿Quieres compartir este resumen con tu tutor/a de Fundación Puente o prefieres editarlo primero?`,
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

function bindStudentName(
  data: GlassBoxSummary,
  payload: CheckInPayload
): GlassBoxSummary {
  const first = payload.firstName?.trim();
  const full = payload.studentName?.trim();
  if (!first && !full) return data;

  let proposed = data.proposedShare || "";
  const safe = first || full?.split(" ")[0] || "El/la estudiante";
  proposed = proposed
    .replace(/\bCamila Rojas\b/gi, safe)
    .replace(/\bCamila\b/gi, safe)
    .replace(/^El\/la estudiante/i, safe);
  if (first && !proposed.toLowerCase().includes(first.toLowerCase())) {
    proposed = `${first} reporta: ${proposed}`;
  }

  return {
    ...data,
    proposedShare: proposed,
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
      return NextResponse.json({
        data: mockSummary(payload),
        mock: true,
      });
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

Nombre completo del estudiante (OBLIGATORIO en proposedShare): ${payload.studentName}
Nombre de pila: ${payload.firstName}
Carrera: ${payload.career ?? "n/d"}
Token: ${payload.token}
Pilares (1-10, menor = más carga): ${JSON.stringify(payload.pillars)}
Minutos disponibles: ${payload.availableMinutes ?? "n/d"}
Energía: ${payload.energy ?? "n/d"}
Transcripción exacta (no inventes hechos fuera de esto):
"""${payload.transcript}"""`;

    const text = await askClaude({
      system: SYSTEM,
      user,
      maxTokens: 1800,
    });
    const data = bindStudentName(parseJsonLoose<GlassBoxSummary>(text), payload);
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
