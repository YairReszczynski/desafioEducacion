import { PuenteLogo } from "@/components/brand/logo";
import { BackButton } from "@/components/ui/back-button";
import { Shield } from "lucide-react";
import Link from "next/link";

const RULES = [
  {
    title: "Derecho a no ser perfilado a espaldas",
    body: "Antes de enviar, el alumno ve exactamente qué entendió la IA y edita o rechaza el compartir.",
  },
  {
    title: "No analizamos tono de voz ni emociones",
    body: "Solo el contenido que la persona decide contar. El audio se borra al transcribir.",
  },
  {
    title: "La IA no decide ni sanciona",
    body: "Extrae señales; la prioridad la valida un humano con firma explícita de Coordinación.",
  },
  {
    title: "Lenguaje sin estigma",
    body: "Hablamos de fricción logística y necesidad de apoyo — nunca de “posible desertor”.",
  },
  {
    title: "Sin sesgo por origen, género o jornada",
    body: "Las alertas usan señales conductuales consentidas (WhatsApp, reuniones, pilares auto-reportados).",
  },
  {
    title: "No responder no es una falta",
    body: "Dos semanas sin check-in activan un contacto humano amable, nunca una amenaza a la beca.",
  },
];

export default function EticaPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <BackButton href="/" label="Volver al inicio" />
        <PuenteLogo variant="color" className="!h-12" />
      </div>
      <div className="flex items-center gap-2 text-puente">
        <Shield size={22} />
        <p className="text-[11px] font-bold uppercase tracking-[0.18em]">
          Caja de Cristal · 25% rúbrica ética
        </p>
      </div>
      <h1 className="display mt-2 text-4xl font-bold">
        Diseño ético explícito
      </h1>
      <p className="mt-3 text-muted">
        Fundación Puente acompaña 5 años. El problema duro es la confianza en
        1° y 2° año. Esta plataforma multiplica atención humana sin sustituirla.
      </p>

      <div className="mt-8 space-y-3">
        {RULES.map((r) => (
          <article key={r.title} className="panel p-4">
            <h2 className="font-bold">{r.title}</h2>
            <p className="mt-1 text-sm text-muted">{r.body}</p>
          </article>
        ))}
      </div>

      <Link href="/dashboard" className="btn btn-primary mt-8 inline-flex">
        Ver radar de coordinación
      </Link>
    </main>
  );
}
