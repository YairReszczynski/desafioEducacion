"use client";

import { PuenteLogo } from "@/components/brand/logo";
import { BackButton } from "@/components/ui/back-button";
import {
  createInvitedStudent,
  type InviteDraft,
} from "@/lib/invite-store";
import type { YearLevel } from "@/lib/types";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const CAREERS = [
  "Diseño Industrial",
  "Ingeniería en Informática",
  "Técnico en Enfermería",
  "Ingeniería Comercial",
  "Trabajo Social",
  "Pedagogía Básica",
  "Administración de Empresas",
];

function ProbarForm() {
  const router = useRouter();
  const params = useSearchParams();
  const asTutor = params.get("rol") === "tutor";

  const [firstName, setFirstName] = useState("");
  const [career, setCareer] = useState(CAREERS[0]!);
  const [busy, setBusy] = useState(false);

  function start(e: React.FormEvent) {
    e.preventDefault();
    const name = firstName.trim() || "Invitado";
    setBusy(true);
    const draft: InviteDraft = {
      firstName: name,
      lastName: "",
      career,
      institution: "Duoc UC",
      year: 1 as YearLevel,
      works: true,
      jornada: "vespertina",
    };
    const student = createInvitedStudent(draft);
    if (asTutor) {
      router.push(`/dashboard?live=${student.token}`);
    } else {
      router.push(`/p/${student.token}`);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-0px)] max-w-lg flex-col px-5 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <BackButton href="/" label="Inicio" />
        <PuenteLogo variant="color" className="!h-10" />
      </div>

      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-coral">
        {asTutor ? "Vista tutor · después del check-in" : "Tu link · 2 minutos"}
      </p>
      <h1 className="display mt-2 text-3xl font-bold leading-tight">
        {asTutor
          ? "Primero creá un alumno de prueba"
          : "Empezá tu check-in"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {asTutor
          ? "Te llevamos al radar del equipo. Completá el check-in del alumno en otra pestaña si querés verlo en vivo."
          : "Solo pedimos tu nombre y carrera. El link queda en este celular."}
      </p>

      <form onSubmit={start} className="mt-8 space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-muted">
            Tu nombre
          </label>
          <input
            className="mt-1 w-full border border-line bg-white px-3 py-3 text-base"
            placeholder="Ej. Yair"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            autoFocus
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-muted">
            Carrera
          </label>
          <select
            className="mt-1 w-full border border-line bg-white px-3 py-3 text-base"
            value={career}
            onChange={(e) => setCareer(e.target.value)}
          >
            {CAREERS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="btn btn-primary min-h-14 w-full text-base"
          disabled={busy}
        >
          {asTutor ? "Ir al radar" : "Abrir mi check-in"}
          <ArrowRight size={18} />
        </button>
      </form>

      {!asTutor ? (
        <p className="mt-6 text-center text-xs text-muted">
          ¿Querés ver el lado tutor?{" "}
          <Link href="/probar?rol=tutor" className="font-bold text-puente underline">
            Continuar como tutor
          </Link>
        </p>
      ) : (
        <p className="mt-6 text-center text-xs text-muted">
          El radar completo pide PIN de equipo. Si te redirige, pedíselo a
          Fundación Puente en el stand.
        </p>
      )}
    </main>
  );
}

export default function ProbarPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg px-5 py-10 text-sm text-muted">
          Cargando…
        </main>
      }
    >
      <ProbarForm />
    </Suspense>
  );
}
