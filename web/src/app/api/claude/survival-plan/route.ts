import { askClaude, parseJsonLoose } from "@/lib/claude";
import type { SurvivalPlan } from "@/lib/types";
import { NextResponse } from "next/server";


function mockPlan(minutes: number, materialHint: string): SurvivalPlan {
  const metro = Math.min(12, Math.max(8, Math.round(minutes * 0.35)));
  return {
    headline: "Plan de supervivencia de bolsillo · esta semana",
    capsules: [
      {
        title: "Cápsula metro · conceptos base",
        minutes: metro,
        when: "Ida al trabajo / U",
        type: "lectura",
        content:
          materialHint ||
          "3 ideas clave del PDF: definiciones, ejemplo y error típico. Léelas una vez y márcalas.",
      },
      {
        title: "Ejercicio ancla",
        minutes: Math.max(20, Math.round(minutes * 0.4)),
        when: "Bloque nocturno disponible",
        type: "ejercicio",
        content:
          "Resuelve 2 ejercicios representativos de la rúbrica (no todos). Anota dónde te trabas.",
      },
      {
        title: "Repaso express",
        minutes: 10,
        when: "Antes de dormir o en la vuelta",
        type: "repaso",
        content:
          "Ficha de 5 líneas: qué entendí / qué no / qué preguntarle al voluntario o tutor.",
      },
    ],
    tutorNoteDraft:
      "El/la estudiante tuvo sobrecarga laboral esta semana; completó conceptos base en formato micro. Sugiero mover la entrega sin penalización y activar Voluntario de Industria si hay evaluación crítica.",
    industryVolunteer:
      "Solicitar match con Voluntario de Industria para el ramo de esta semana",
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      studentName?: string;
      availableMinutes?: number;
      energy?: number;
      materialText?: string;
      transcript?: string;
      career?: string;
    };

    const minutes = body.availableMinutes ?? 90;
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        data: mockPlan(minutes, body.materialText?.slice(0, 280) || ""),
        mock: true,
      });
    }

    const text = await askClaude({
      system: `Eres el Compilador de Micro-Ventanas de Fundación Puente.
Re-empaquetas materia académica en cápsulas reales según el tiempo del alumno que trabaja.
No juzgas. No hablas de deserción. Devuelves SOLO JSON.`,
      user: `Genera un SurvivalPlan JSON:
{
  "headline": string,
  "capsules": [{"title":string,"minutes":number,"when":string,"content":string,"type":"lectura"|"ejercicio"|"repaso"}],
  "tutorNoteDraft": string,
  "industryVolunteer": string
}

Alumno: ${body.studentName ?? "Becario/a"}
Carrera: ${body.career ?? "n/d"}
Minutos totales disponibles: ${minutes}
Energía 1-10: ${body.energy ?? 5}
Contexto semana: ${body.transcript ?? "n/d"}
Material / apunte (recorta a lo esencial):
"""${(body.materialText || "Guía semanal genérica de ramos de 1er año").slice(0, 6000)}"""`,
      maxTokens: 2000,
    });

    const data = parseJsonLoose<SurvivalPlan>(text);
    return NextResponse.json({ data, mock: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json(
      {
        data: mockPlan(90, ""),
        mock: true,
        warning: message,
      },
      { status: 200 }
    );
  }
}
