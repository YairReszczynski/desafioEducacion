"use client";

import { PuenteLogo } from "@/components/brand/logo";
import { BackButton } from "@/components/ui/back-button";
import { Printer } from "lucide-react";
import Link from "next/link";

function Lines({ n = 4 }: { n?: number }) {
  return (
    <div className="mt-1 space-y-3">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="border-b border-ink/40 pt-4" />
      ))}
    </div>
  );
}

function Field({
  label,
  wide,
}: {
  label: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-ink/70">
        {label}
      </p>
      <div className="mt-1 min-h-8 border-b border-ink/50" />
    </div>
  );
}

function Check({ label }: { label: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="inline-block size-4 border border-ink" />
      {label}
    </label>
  );
}

export function PautaPrint() {
  return (
    <div className="mx-auto max-w-[210mm] px-4 py-6 print:max-w-none print:p-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <BackButton href="/dashboard/digitize" label="Volver a digitalizar" />
        <div className="flex flex-wrap gap-2">
          <a
            className="btn btn-ghost text-xs"
            href="/pauta/registro-entrevista-becados.pdf"
            target="_blank"
            rel="noreferrer"
          >
            PDF oficial
          </a>
          <button
            type="button"
            className="btn btn-primary text-xs"
            onClick={() => window.print()}
          >
            <Printer size={16} />
            Imprimir pauta
          </button>
          <Link href="/dashboard/digitize" className="btn btn-accent text-xs">
            Luego escanear foto →
          </Link>
        </div>
      </div>

      <article className="pauta-sheet bg-white p-6 text-ink shadow-sm print:shadow-none sm:p-8">
        <header className="flex items-start justify-between gap-4 border-b-2 border-puente pb-3">
          <div>
            <PuenteLogo variant="color" className="!h-10 print:!h-9" />
            <h1 className="display mt-2 text-2xl font-bold">
              Registro de Entrevista Becados/as
            </h1>
            <p className="text-xs text-muted">
              Fundación Puente · Pauta oficial · Uso interno tutores
            </p>
          </div>
          <div className="text-right text-[10px] font-bold uppercase tracking-wide text-coral">
            Confidencial
          </div>
        </header>

        <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nombre estudiante" wide />
          <Field label="RUT" />
          <Field label="Institución de ed. superior" />
          <Field label="Carrera" />
          <Field label="Año estudio" />
          <Field label="Año en Puente" />
          <Field label="Fecha entrevista" />
          <Field label="Modalidad" />
        </section>

        <section className="mt-5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink/70">
            Tipo de entrevista
          </p>
          <div className="mt-2 flex flex-wrap gap-4">
            <Check label="Primera" />
            <Check label="Seguimiento" />
            <Check label="Cierre" />
            <Check label="Otra: ____________" />
          </div>
        </section>

        <section className="mt-6 break-inside-avoid">
          <h2 className="text-sm font-bold text-puente">
            Ámbito académico / trayectoria educación superior
          </h2>
          <Lines n={5} />
        </section>

        <section className="mt-5 break-inside-avoid">
          <h2 className="text-sm font-bold text-puente">Familia y redes de apoyo</h2>
          <Lines n={4} />
        </section>

        <section className="mt-5 break-inside-avoid">
          <h2 className="text-sm font-bold text-puente">Salud y bienestar</h2>
          <Lines n={4} />
        </section>

        <section className="mt-5 break-inside-avoid">
          <h2 className="text-sm font-bold text-puente">
            Situación económica y familiar
          </h2>
          <Lines n={3} />
        </section>

        <section className="mt-5 break-inside-avoid">
          <h2 className="text-sm font-bold text-puente">
            Habitabilidad y condiciones para el estudio
          </h2>
          <Lines n={3} />
        </section>

        <section className="mt-5 break-inside-avoid">
          <h2 className="text-sm font-bold text-puente">Vinculación con el entorno</h2>
          <Lines n={2} />
        </section>

        <section className="mt-5 break-inside-avoid">
          <h2 className="text-sm font-bold text-puente">Relaciones interpersonales</h2>
          <Lines n={2} />
        </section>

        <section className="mt-5 break-inside-avoid">
          <h2 className="text-sm font-bold text-puente">
            Fortalezas y desarrollo personal
          </h2>
          <Lines n={2} />
        </section>

        <section className="mt-5 break-inside-avoid">
          <h2 className="text-sm font-bold text-puente">Oportunidades a trabajar</h2>
          <Lines n={2} />
        </section>

        <section className="mt-5 break-inside-avoid">
          <h2 className="text-sm font-bold text-puente">Otras observaciones</h2>
          <Lines n={2} />
        </section>

        <section className="mt-5 break-inside-avoid">
          <h2 className="text-sm font-bold text-puente">
            Acuerdos / Compromisos / Plan de acción
          </h2>
          <Lines n={3} />
        </section>

        <section className="mt-5 break-inside-avoid">
          <h2 className="text-sm font-bold text-puente">
            Próxima sesión (mes, días y/u horarios)
          </h2>
          <Lines n={2} />
        </section>

        <section className="mt-6 break-inside-avoid border border-ink/30 p-3">
          <h2 className="text-sm font-bold text-puente">Nivel de alerta</h2>
          <div className="mt-3 space-y-2 text-sm">
            <Check label="Baja: seguimiento estándar" />
            <Check label="Medio: requerimiento atención en puntos específicos" />
            <Check label="Alto: intervención inmediata / caso crítico" />
          </div>
        </section>

        <footer className="mt-8 grid grid-cols-2 gap-8 text-xs text-muted">
          <div>
            <div className="border-b border-ink/40 pt-10" />
            <p className="mt-1">Firma tutor/a</p>
          </div>
          <div>
            <div className="border-b border-ink/40 pt-10" />
            <p className="mt-1">Firma Coordinación (decisión humana)</p>
          </div>
        </footer>
      </article>

      <p className="mt-4 text-center text-xs text-muted print:hidden">
        Tip demo: rellená a mano 1 página, sacá foto en{" "}
        <Link href="/dashboard/digitize" className="underline">
          Digitalizar
        </Link>{" "}
        y Claude estructura los campos.
      </p>
    </div>
  );
}
