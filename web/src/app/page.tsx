import { PuenteLogo } from "@/components/brand/logo";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <section className="mx-auto flex min-h-[calc(100dvh-0px)] max-w-lg flex-col px-5 pb-10 pt-10 sm:max-w-xl sm:pt-14">
        <PuenteLogo variant="color" className="!h-14 sm:!h-16" priority />

        <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.2em] text-coral">
          Fundación Puente · check-in semanal
        </p>
        <h1 className="display mt-3 text-[2.35rem] font-extrabold leading-[1.05] text-ink sm:text-5xl">
          La educación supera la pobreza
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Prueba el link del alumno: voz o texto, termómetro de 3 pilares, Caja
          de Cristal y plan de estudio en minutos reales. Sin app store, sin
          contraseña.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/probar"
            className="btn btn-primary min-h-14 w-full text-base"
          >
            Probar como alumno
          </Link>
          <Link href="/ver" className="btn btn-accent min-h-12 w-full">
            Ver cómo llega al tutor
          </Link>
        </div>

        <ul className="mt-10 space-y-3 text-sm text-muted">
          <li className="border-l-4 border-puente bg-white/70 px-3 py-2">
            <b className="text-ink">1.</b> Cuentas tu semana en 30 segundos
          </li>
          <li className="border-l-4 border-coral bg-white/70 px-3 py-2">
            <b className="text-ink">2.</b> Revisas qué entendió la IA (tú
            decides qué se comparte)
          </li>
          <li className="border-l-4 border-signal bg-white/70 px-3 py-2">
            <b className="text-ink">3.</b> Recibes un plan en micro-cápsulas
          </li>
        </ul>

        <p className="mt-auto pt-12 text-center text-[11px] text-muted">
          ¿Eres del equipo Puente?{" "}
          <Link href="/equipo" className="font-bold text-puente underline">
            Entrar con PIN
          </Link>
        </p>
      </section>
    </main>
  );
}
