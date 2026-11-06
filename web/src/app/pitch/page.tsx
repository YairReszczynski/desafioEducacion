"use client";

import { PuenteLogo } from "@/components/brand/logo";
import { BackButton } from "@/components/ui/back-button";
import { DEMO_STUDENT_TOKEN } from "@/lib/magic-token";
import { cn } from "@/lib/utils";
import { Check, Mic, Play, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const BLOCKS = [
  {
    id: "hook",
    min: "0:00",
    maxSec: 45,
    title: "Gancho · el dolor real",
    say: `Fundación Puente acompaña 120 becarios durante 5 años. El quiebre no es “flojedad”: es el alumno que trabaja, a mitad de semestre en 1° y 2°, cuando cambian los turnos y la bola de nieve se vuelve inalcanzable. Hoy el seguimiento vive en cuadernos por privacidad, y la confianza cuesta dos años. Nosotros atacamos la fricción, no el estigma.`,
    screen: "Home → logo Puente",
    href: "/",
  },
  {
    id: "link",
    min: "0:45",
    maxSec: 60,
    title: "Link perpetuo",
    say: `Miren: cero login. Generamos un alumno, copiamos el magic link, y el becario entra desde WhatsApp. Sin App Store. Este es el onboarding.`,
    screen: "Invitar → crear → abrir link",
    href: "/invitar",
  },
  {
    id: "voice",
    min: "1:45",
    maxSec: 90,
    title: "Demo viva · voz + Caja de Cristal",
    say: `Voy a hablar 20 segundos como el alumno. La IA transcribe, yo corrijo, y ANTES de enviar me muestra qué entendió. Él es dueño del mensaje: derecho a no ser perfilado a espaldas. Eso es el 25% ético de la rúbrica, demostrado, no declarado.`,
    screen: "Link alumno → grabar / script",
    href: `/p/${DEMO_STUDENT_TOKEN}`,
  },
  {
    id: "plan",
    min: "3:15",
    maxSec: 45,
    title: "Acción · Plan de supervivencia",
    say: `El mismo link muta: micro-cápsulas según los minutos reales que tiene esta semana, y un borrador para el tutor pidiendo flexibilidad sin penalización. IA que ayuda a actuar, no a etiquetar.`,
    screen: "Plan post check-in",
    href: `/p/${DEMO_STUDENT_TOKEN}`,
  },
  {
    id: "radar",
    min: "4:00",
    maxSec: 45,
    title: "Coordinación · firma humana",
    say: `Del lado Puente: radar de 120 casos con señales silenciosas reales — no responde WhatsApp, falta a reuniones, sobrecarga laboral. Árbol de explicabilidad, badge anti-sesgo, y botón obligatorio: Validar y ejecutar con firma humana. La IA sugiere; Matías decide.`,
    screen: "Dashboard",
    href: "/dashboard",
  },
  {
    id: "close",
    min: "4:45",
    maxSec: 15,
    title: "Cierre",
    say: `Educación supera la pobreza. Multiplicamos atención humana sin reemplazarla. Checklist ético cumplido. Gracias.`,
    screen: "Ética / logo",
    href: "/etica",
  },
] as const;

const SCRIPTS = [
  {
    id: "turno",
    title: "Sobrecarga laboral (recomendado en vivo)",
    seconds: 22,
    text: `Hola, esta semana me cambiaron los turnos en la pega. Solo tengo como veinticinco minutos en el metro de ida y una hora el jueves en la noche. Tengo dos entregas y siento que se me arma una bola de nieve. Quiero seguir, pero necesito acomodar el estudio a esos huecos y que mi tutor sepa que no es flojera.`,
  },
  {
    id: "familia",
    title: "Carga familiar + Taller",
    seconds: 20,
    text: `Mi victoria fue terminar el informe. Mi dolor de cabeza es que estoy cuidando a mi hermano y duermo poco. Estoy sobrepasada con Taller y la casa. ¿Pueden marcar esto para que mi tutora de Fundación Puente me llame el lunes?`,
  },
  {
    id: "plata",
    title: "Económico (cuidado: tono de apoyo, no drama)",
    seconds: 18,
    text: `Ando mal de plata esta semana: casi no me alcanza el pasaje y me atraso en cálculo. No quiero perder la beca ni que me juzguen. Necesito saber qué apoyos hay sin sentir que me están vigilando.`,
  },
  {
    id: "ok",
    title: "Semana estable (contraste)",
    seconds: 12,
    text: `Esta semana me fue bien. Aprobé el certamen y pude ir a la reunión de la fundación. Todo tranquilo por ahora, solo quiero dejar registrado el check-in.`,
  },
] as const;

export default function PitchPage() {
  const [running, setRunning] = useState(false);
  const [sec, setSec] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const [scriptId, setScriptId] = useState<(typeof SCRIPTS)[number]["id"]>(
    "turno"
  );

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSec((s) => {
        if (s >= 300) {
          setRunning(false);
          return 300;
        }
        return s + 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const active = useMemo(() => {
    let acc = 0;
    for (const b of BLOCKS) {
      if (sec < acc + b.maxSec) return b.id;
      acc += b.maxSec;
    }
    return BLOCKS[BLOCKS.length - 1]!.id;
  }, [sec]);

  const mm = String(Math.floor(sec / 60)).padStart(1, "0");
  const ss = String(sec % 60).padStart(2, "0");
  const script = SCRIPTS.find((s) => s.id === scriptId)!;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <BackButton href="/" label="Volver al inicio" />
        <PuenteLogo variant="color" className="!h-12" />
      </div>

      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-coral">
        Bases oficiales · 5:00 pitch + demo · 3:00 Q&A
      </p>
      <h1 className="display mt-1 text-3xl font-bold sm:text-4xl">
        Guion de pitch en vivo
      </h1>
      <p className="mt-2 text-sm text-muted">
        Las bases piden <b>pitch con demostración</b>, no video obligatorio.
        Remotion solo como plan B si cae el WiFi. Ideal: demo en vivo con este
        cronómetro.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3 panel p-4">
        <p className="display text-4xl font-bold tabular-nums text-puente">
          {mm}:{ss}
        </p>
        <p className="text-sm text-muted">/ 5:00</p>
        <div className="flex gap-2">
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => setRunning(true)}
            disabled={running}
          >
            <Play size={16} /> Empezar
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => setRunning(false)}
          >
            Pausa
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              setRunning(false);
              setSec(0);
              setDone([]);
            }}
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>
        <div className="h-2 w-full bg-line">
          <div
            className="h-2 bg-puente transition-all"
            style={{ width: `${Math.min(100, (sec / 300) * 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {BLOCKS.map((b) => {
          const isActive = active === b.id;
          const isDone = done.includes(b.id);
          return (
            <article
              key={b.id}
              className={cn(
                "panel p-4 transition",
                isActive && "border-puente ring-1 ring-puente",
                isDone && "opacity-70"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-coral">
                    {b.min} · {b.maxSec}s · pantalla: {b.screen}
                  </p>
                  <h2 className="display text-xl font-bold">{b.title}</h2>
                </div>
                <div className="flex gap-2">
                  <Link href={b.href} className="btn btn-ghost text-xs">
                    Abrir
                  </Link>
                  <button
                    type="button"
                    className="btn btn-accent text-xs"
                    onClick={() =>
                      setDone((d) =>
                        d.includes(b.id) ? d : [...d, b.id]
                      )
                    }
                  >
                    <Check size={14} /> Listo
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm leading-relaxed">{b.say}</p>
            </article>
          );
        })}
      </div>

      <section className="mt-10">
        <div className="flex items-center gap-2 text-puente">
          <Mic size={18} />
          <h2 className="display text-2xl font-bold">
            Scripts para leerle a la IA (en vivo)
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted">
          Léelo natural, no robot. Después corrige 1 palabra en la transcripción
          para mostrar autonomía, y en la Caja de Cristal señala el consentimiento.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {SCRIPTS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={cn(
                "border px-3 py-1.5 text-xs font-bold",
                scriptId === s.id
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-white"
              )}
              onClick={() => setScriptId(s.id)}
            >
              {s.title}
            </button>
          ))}
        </div>

        <div className="panel mt-4 border-l-4 border-signal p-5">
          <p className="text-[11px] font-bold uppercase text-muted">
            ~{script.seconds}s · cópialo o léelo
          </p>
          <p className="mt-2 text-lg leading-relaxed font-medium">
            “{script.text}”
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => navigator.clipboard.writeText(script.text)}
            >
              Copiar texto
            </button>
            <Link
              href={`/p/${DEMO_STUDENT_TOKEN}`}
              className="btn btn-primary"
            >
              Ir al check-in de Camila
            </Link>
            <Link href="/invitar" className="btn btn-accent">
              Generar mi propio link
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
