"use client";

import { PuenteLogo } from "@/components/brand/logo";
import { BackButton } from "@/components/ui/back-button";
import {
  EQUIPO_PIN,
  readEquipoFromDocument,
  unlockEquipoClient,
} from "@/lib/app-mode";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function EquipoForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/diapos-entrada.html";
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (readEquipoFromDocument()) {
      router.replace(next.startsWith("/") ? next : "/diapos-entrada.html");
    }
  }, [next, router]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.trim() !== EQUIPO_PIN) {
      setError("PIN incorrecto");
      return;
    }
    unlockEquipoClient();
    router.replace(next.startsWith("/") ? next : "/diapos-entrada.html");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-md flex-col px-5 py-10">
      <div className="mb-6 flex items-center justify-between">
        <BackButton href="/" label="Inicio público" />
        <PuenteLogo variant="color" className="!h-10" />
      </div>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-coral">
        Solo equipo · no es para el jurado
      </p>
      <h1 className="display mt-2 text-3xl font-bold">Modo equipo</h1>
      <p className="mt-2 text-sm text-muted">
        Aquí están la entrada del pitch, el guion, el radar, el historial y la
        pauta papel. El público que escanea el QR no ve esto.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-muted">
            PIN del stand
          </label>
          <input
            type="password"
            inputMode="text"
            autoComplete="off"
            className="mt-1 w-full border border-line bg-white px-3 py-3 text-lg tracking-widest"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(null);
            }}
            placeholder="••••••••"
          />
        </div>
        {error ? <p className="text-sm text-bad">{error}</p> : null}
        <button type="submit" className="btn btn-primary w-full min-h-12">
          Entrar al modo equipo
        </button>
      </form>
    </main>
  );
}

export default function EquipoPage() {
  return (
    <Suspense fallback={<main className="p-8 text-sm text-muted">Cargando…</main>}>
      <EquipoForm />
    </Suspense>
  );
}
