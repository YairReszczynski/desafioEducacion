import { PuenteLogo } from "@/components/brand/logo";
import { DEMO_STUDENT_TOKEN } from "@/lib/magic-token";
import { getDashboardStats } from "@/lib/students";
import Link from "next/link";

export default function HomePage() {
  const stats = getDashboardStats();

  return (
    <main className="grid-bg relative overflow-hidden">
      <section className="mx-auto flex min-h-[calc(100dvh-48px)] max-w-6xl flex-col justify-center px-5 py-12">
        <PuenteLogo variant="color" className="!h-16 sm:!h-20" priority />
        <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.22em] text-coral">
          Hackathon IA · Congreso Social UC 2026 · Desafío 2
        </p>
        <h1 className="display mt-4 max-w-3xl text-4xl font-extrabold leading-[1.05] text-ink sm:text-6xl">
          La educación supera
          <br />
          la pobreza
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
          Link perpetuo para el becario que trabaja. Radar humano para la
          Coordinación. Caja de Cristal ética: el alumno es dueño de su mensaje.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/p/${DEMO_STUDENT_TOKEN}`}
            className="btn btn-primary"
          >
            Abrir link de Camila (1° año)
          </Link>
          <Link href="/dashboard" className="btn btn-accent">
            Consola · {stats.total} casos
          </Link>
          <Link href="/dashboard/digitize" className="btn btn-ghost">
            Digitalizar pauta en papel
          </Link>
        </div>

        <dl className="mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["120", "casos activos"],
            ["1°–2°", "foco de quiebre"],
            ["Mitad", "de semestre"],
            ["3", "pilares Puente"],
          ].map(([n, l]) => (
            <div key={l} className="border border-line bg-white/70 p-3">
              <dt className="display text-2xl font-bold text-puente">{n}</dt>
              <dd className="text-xs text-muted">{l}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
