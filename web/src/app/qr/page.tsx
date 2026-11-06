"use client";

import { PuenteLogo } from "@/components/brand/logo";
import { BackButton } from "@/components/ui/back-button";
import { useEffect, useMemo, useState } from "react";

/** Página para imprimir / mostrar el QR del stand (modo equipo). */
export default function QrPage() {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const publicUrl = origin || "https://…";
  const qrSrc = useMemo(() => {
    if (!origin) return "";
    const data = encodeURIComponent(origin);
    return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=12&data=${data}`;
  }, [origin]);

  return (
    <main className="mx-auto max-w-lg px-5 py-8 print:py-4">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <BackButton href="/" label="Inicio" />
        <button
          type="button"
          className="btn btn-primary text-xs"
          onClick={() => window.print()}
        >
          Imprimir QR
        </button>
      </div>

      <div className="panel flex flex-col items-center p-6 text-center">
        <PuenteLogo variant="color" className="!h-12" />
        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-coral">
          Escanea y prueba
        </p>
        <h1 className="display mt-2 text-3xl font-bold">Puente Semanal</h1>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Check-in del alumno · Caja de Cristal · plan en minutos reales
        </p>

        {qrSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrSrc}
            alt="QR a la app pública"
            className="mt-6 size-64 border border-line bg-white p-2 sm:size-72"
          />
        ) : (
          <div className="mt-6 size-64 animate-pulse bg-line/40" />
        )}

        <p className="mt-4 break-all font-mono text-xs text-ink">{publicUrl}</p>
        <p className="mt-3 text-xs text-muted">
          El QR abre la vista pública (sin diapos ni herramientas del equipo).
        </p>
      </div>
    </main>
  );
}
