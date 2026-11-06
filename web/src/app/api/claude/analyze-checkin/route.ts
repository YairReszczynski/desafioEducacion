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
- Los 3 pilares de Puente: académico, psicológico/familiar, trabajo/económico (1 = muy cargado, 10 = estable).
- alertLevel: baja | media | alta | crisis. crisis SOLO si hay intención de autolesión o peligro inmediato.
- CRÍTICO alertLevel: los pilares pesan más que keywords del texto. Si los 3 pilares están en 8–10, NO uses "alta" (máximo "media" si el relato menciona fricción laboral). Si algún pilar está en 1–3, prioriza "alta".
- Lenguaje cálido, concreto, en español neutro profesional (tratamiento de tú). Sin voseo ni regionalismos (nada de pega, andá, querés, acá, altiro).
- CRÍTICO: Usa SIEMPRE el nombre de pila real del estudiante. NUNCA inventes otro nombre.
- CRÍTICO: summaryForStudent, victory y headache van en SEGUNDA persona (tú/tu) hacia el alumno.
- CRÍTICO: proposedShare es una NOTA BREVE PARA EL TUTOR en tercera persona, usando solo el nombre de pila (ej. "Camila reporta cambios de turno…"). No uses apellido completo. Basado SOLO en la transcripción.`;

const CRISIS_RE =
  /suicid|matarme|autolesi|quitarme la vida|no quiero vivir|hacerme daño|me quiero morir/;

export function isCrisisTranscript(text: string) {
  return CRISIS_RE.test(text.toLowerCase());
}

const ALERT_LEVELS = new Set(["baja", "media", "alta", "crisis"]);

function normalizeAlertLevel(
  value: unknown,
  fallback: GlassBoxSummary["alertLevel"]
): GlassBoxSummary["alertLevel"] {
  const v = String(value ?? "")
    .toLowerCase()
    .trim();
  if (ALERT_LEVELS.has(v)) return v as GlassBoxSummary["alertLevel"];
  if (v.includes("crisis")) return "crisis";
  if (v.includes("alta")) return "alta";
  if (v.includes("media")) return "media";
  if (v.includes("baja")) return "baja";
  return fallback;
}

type AlertLevel = GlassBoxSummary["alertLevel"];

/** Prioridad: pilares pesan más que keywords del texto. Crisis siempre gana. */
export function resolveAlertLevel(payload: CheckInPayload): AlertLevel {
  const raw = payload.transcript.trim();
  const t = raw.toLowerCase();
  if (isCrisisTranscript(t)) return "crisis";

  const { academico, psicologico, trabajo } = payload.pillars;
  const minP = Math.min(academico, psicologico, trabajo);
  const avgP = (academico + psicologico + trabajo) / 3;

  const labourText =
    /turno|pega|trabajo|empleo|vega|local|jornada|sobrecarga laboral|entregas|trayecto/.test(
      t
    );
  const family = /hermano|familia|casa|cuidar|mamá|papá|mama|papa/.test(t);
  const money = /plata|pasaje|congelar|beca|dinero/.test(t);
  const stress = /bola de nieve|no doy|atraso|sobrecarga|no alcanzo/.test(t);

  // Termómetro en rojo → prioridad alta
  if (minP <= 2 || psicologico <= 2) return "alta";
  if (minP <= 4 && (labourText || money || stress || trabajo <= 4)) return "alta";
  if (money && /congelar/.test(t) && minP <= 6) return "alta";

  // Termómetro en verde (todo estable): el relato solo no dispara "alta"
  if (minP >= 8 && avgP >= 8.5) {
    if (money && /congelar/.test(t)) return "media";
    if (labourText || stress) return "media";
    return "baja";
  }

  if (minP >= 7) {
    if (labourText || money || stress) return "media";
    return "baja";
  }

  if (minP <= 5 || avgP <= 5.5) {
    if (labourText || money || stress) return "alta";
    return "media";
  }

  if (labourText || money || stress) return "media";
  if (family) return "media";
  return "baja";
}

/** Si Claude ignora los pilares, recalibra sin bajar una crisis. */
export function calibrateAlertLevel(
  fromModel: AlertLevel,
  payload: CheckInPayload
): AlertLevel {
  if (fromModel === "crisis" || isCrisisTranscript(payload.transcript)) {
    return "crisis";
  }
  const fromPillars = resolveAlertLevel(payload);
  const order: AlertLevel[] = ["baja", "media", "alta", "crisis"];
  // Con pilares muy estables, no dejar que el modelo fuerce "alta"
  const minP = Math.min(
    payload.pillars.academico,
    payload.pillars.psicologico,
    payload.pillars.trabajo
  );
  if (minP >= 8 && fromModel === "alta") return fromPillars;
  // Con pilares muy cargados, subir si el modelo bajó de más
  if (minP <= 3 && order.indexOf(fromModel) < order.indexOf("alta")) {
    return "alta";
  }
  // Preferir la lectura combinada de pilares+texto
  return fromPillars;
}

function mockSummary(payload: CheckInPayload): GlassBoxSummary {
  const name =
    payload.firstName?.trim() ||
    payload.studentName?.split(" ")[0] ||
    "El/la estudiante";
  const raw = payload.transcript.trim();
  const t = raw.toLowerCase();
  const crisis = isCrisisTranscript(t);
  const labour =
    /turno|pega|trabajo|empleo|hora|vega|local|jornada|sobrecarga laboral|entregas|trayecto/.test(
      t
    ) || payload.pillars.trabajo <= 4;
  const family = /hermano|familia|casa|cuidar|mamá|papá|mama|papa/.test(t);
  const level = resolveAlertLevel(payload);

  const snippet = raw.length > 160 ? `${raw.slice(0, 157)}…` : raw;

  if (crisis) {
    return {
      summaryForStudent: `${name}, escuché que estás pasando por un momento muy duro. No estás solo/a: lo prioritario ahora es que una persona de Fundación Puente (o tu red de apoyo) te contacte. Este resumen no reemplaza ayuda humana.`,
      victory: "Haber pedido ayuda escribiendo cómo te sientes.",
      headache: "Un momento de mucho dolor o peligro que requiere acompañamiento humano ya.",
      pillarsTouched: ["psicologico", "academico"],
      proposedShare: `${name} expresa señales de crisis en el check-in. DERIVACIÓN HUMANA INMEDIATA — no automatizar. Contactar con cercanía y activar protocolo de contención.`,
      askConsentQuestion: `¿Autorizas que tu tutor/a vea esta alerta ahora para poder acompañarte?`,
      suggestedActions: [
        "Contacto humano inmediato del tutor Puente",
        "Activar protocolo de contención / red de apoyo",
        "No dejar solo el seguimiento a la IA",
      ],
      alertLevel: "crisis",
      silentSignals: ["nucleo_familiar"],
      tutorBrief:
        "CRISIS: el alumno usó lenguaje de autolesión o peligro. Decisión 100% humana. Llamar / WhatsApp ya. La IA solo avisa.",
      ethicalNote:
        "La IA no hace contención clínica: prioriza derivación humana. Sin sesgo por origen, género o jornada.",
    };
  }

  const tutorBriefByLevel: Record<Exclude<AlertLevel, "crisis">, string> = {
    alta: "Alerta de fricción logística (no de rendimiento). Pilares o relato indican sobrecarga. Contacto humano con cercanía.",
    media:
      "Atención puntual: hay señales en el relato o termómetro medio. Revisar con cercanía; no automatizar sanción.",
    baja: "Seguimiento estándar. El alumno auto-reportó pilares estables; el relato se registra sin prioridad urgente.",
  };

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
    tutorBrief: tutorBriefByLevel[level === "crisis" ? "alta" : level],
    ethicalNote:
      "Auditoría ética: la alerta combina lo que el alumno contó + el termómetro de 3 pilares. Sin sesgo por origen, género o jornada.",
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

    // Crisis: no mandar a Claude (puede rechazar/romper JSON y colgar la demo).
    // Mock inmediato + derivación humana.
    if (isCrisisTranscript(payload.transcript)) {
      return NextResponse.json({
        data: bindStudentName(mockSummary(payload), payload),
        mock: true,
        crisis: true,
      });
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
      timeoutMs: 12_000,
    });
    const parsed = parseJsonLoose<GlassBoxSummary>(text);
    const fallbackLevel = resolveAlertLevel(payload);
    const modelLevel = normalizeAlertLevel(parsed.alertLevel, fallbackLevel);
    const data = bindStudentName(
      {
        ...parsed,
        alertLevel: calibrateAlertLevel(modelLevel, payload),
        pillarsTouched: Array.isArray(parsed.pillarsTouched)
          ? parsed.pillarsTouched
          : ["academico"],
        suggestedActions: Array.isArray(parsed.suggestedActions)
          ? parsed.suggestedActions
          : [],
        silentSignals: Array.isArray(parsed.silentSignals)
          ? parsed.silentSignals
          : [],
        summaryForStudent:
          parsed.summaryForStudent || mockSummary(payload).summaryForStudent,
        proposedShare:
          parsed.proposedShare || mockSummary(payload).proposedShare,
        askConsentQuestion:
          parsed.askConsentQuestion || mockSummary(payload).askConsentQuestion,
        tutorBrief: parsed.tutorBrief || mockSummary(payload).tutorBrief,
        ethicalNote: parsed.ethicalNote || mockSummary(payload).ethicalNote,
      },
      payload
    );
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
