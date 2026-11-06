"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPWAPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [dismissed, setDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    setIsIos(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (dismissed) return null;
  if (!deferred && !isIos) return null;

  return (
    <div className="panel mt-4 flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-bold text-ink">Fijar en pantalla de inicio</p>
        <p className="text-xs text-muted">
          Tu link perpetuo queda como app. Sin claves, sin tienda.
          {isIos ? " En iPhone: Compartir → Agregar a inicio." : null}
        </p>
      </div>
      <div className="flex gap-2">
        {deferred ? (
          <button
            className="btn btn-accent"
            onClick={async () => {
              await deferred.prompt();
              setDismissed(true);
            }}
          >
            Agregar
          </button>
        ) : null}
        <button className="btn btn-ghost" onClick={() => setDismissed(true)}>
          Ahora no
        </button>
      </div>
    </div>
  );
}
