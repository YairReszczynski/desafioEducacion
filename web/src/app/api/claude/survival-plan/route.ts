import { askClaude, parseJsonLoose } from "@/lib/claude";
import type { SurvivalPlan } from "@/lib/types";
import { NextResponse } from "next/server";


function mockPlan(
  minutes: number,
  materialHint: string,
  studentName?: string
): SurvivalPlan {
  const first = studentName?.trim().split(/\s+/)[0] || "El/la estudiante";
  const metro = Math.min(12, Math.max(8, Math.round(minutes * 0.35)));
  return {
    headline: "Plan de supervivencia de bolsillo · esta semana",
    capsules: [
      {
        title: "Cápsula trayecto · conceptos base",
        minutes: metro,
        when: "Trayecto al trabajo o a la universidad",
        type: "lectura",
        content:
          materialHint ||
          "3 ideas clave del material: definiciones, ejemplo y error típico. Léelas una vez y márcalas.",
      },
      {
        title: "Ejercicio ancla",
        minutes: Math.max(20, Math.round(minutes * 0.4)),
        when: "Bloque nocturno disponible",
        type: "ejercicio",
        content:
          "Resuelve 2 ejercicios representativos de la rúbrica (no todos). Anota dónde te cuesta avanzar.",
      },
      {
        title: "Repaso express",
        minutes: 10,
        when: "Antes de dormir o en el regreso",
        type: "repaso",
        content:
          "Ficha de 5 líneas: qué entendí / qué no / qué preguntarle al voluntario o tutor.",
      }
    ],
    tutorNoteDraft: `${first} armó un plan en micro-bloques con ${minutes} minutos disponibles esta semana. Sugiero revisar flexibilidad de entrega si hay sobrecarga laboral y activar Voluntario de Industria solo si hay evaluación crítica.`,
    industryVolunteer:
      "Solicitar match con Voluntario de Industria para el ramo de esta semana",
  };
}

export async function POST(req: Request) {
  let minutes = 90;
  let studentName: string | undefined;
  let materialHint = "";
  try {
    const body = (await req.json()) as {
      studentName?: string;
      availableMinutes?: number;
      energy?: number;
      materialText?: string;
      transcript?: string;
      career?: string;
    };

    minutes = body.availableMinutes ?? 90;
    studentName = body.studentName;
    materialHint = body.materialText?.slice(0, 280) || "";
    const first =
      body.studentName?.trim().split(/\s+/)[0] || "El/la estudiante";
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        data: mockPlan(minutes, materialHint, studentName),
        mock: true,
      });
    }

    const text = await askClaude({
      system: `Eres el Compilador de Micro-Ventanas de Fundación Puente.
Re-empaquetas materia académica en cápsulas reales según el tiempo del alumno que trabaja.
No juzgas. No hablas de deserción. Devuelves SOLO JSON.
Español neutro profesional (tú hacia el alumno en headline/capsules; tercera persona en tutorNoteDraft). Sin voseo ni regionalismos.
tutorNoteDraft: nota corta para el TUTOR en tercera persona usando solo el nombre de pila (${first}).`,
      user: `Genera un SurvivalPlan JSON:
{
  "headline": string,
  "capsules": [{"title":string,"minutes":number,"when":string,"content":string,"type":"lectura"|"ejercicio"|"repaso"}],
  "tutorNoteDraft": string,
  "industryVolunteer": string
}

Alumno: ${body.studentName ?? "Becario/a"} (usar nombre de pila "${first}" en tutorNoteDraft)
Carrera: ${body.career ?? "n/d"}
Minutos totales disponibles: ${minutes}
Energía 1-10: ${body.energy ?? 5}
Contexto semana: ${body.transcript ?? "n/d"}
Material / apunte (recorta a lo esencial):
"""${(body.materialText || "Guía semanal genérica de ramos de 1er año").slice(0, 6000)}"""`,
      maxTokens: 2000,
      timeoutMs: 12_000,
    });

    const data = parseJsonLoose<SurvivalPlan>(text);
    if (data.tutorNoteDraft) {
      data.tutorNoteDraft = data.tutorNoteDraft
        .replace(/\bCamila Rojas\b/gi, first)
        .replace(/\bCamila\b/gi, first)
        .replace(/^El\/la estudiante/i, first);
    }
    return NextResponse.json({ data, mock: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json(
      {
        data: mockPlan(minutes, materialHint, studentName),
        mock: true,
        warning: message,
      },
      { status: 200 }
    );
  }
}
