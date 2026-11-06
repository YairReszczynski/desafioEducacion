"use client";

import { PuenteLogo } from "@/components/brand/logo";
import { BackButton } from "@/components/ui/back-button";
import {
  clearAllLiveCheckIns,
  removeLiveCheckInByToken,
} from "@/lib/checkin-store";
import {
  clearAllInvited,
  createInvitedStudent,
  deleteInvitedByToken,
  loadInvited,
  perpetualUrl,
  type InviteDraft,
} from "@/lib/invite-store";
import type { Student, YearLevel } from "@/lib/types";
import { Check, Copy, Plus, Share2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const CAREERS = [
  "Ingeniería en Informática",
  "Técnico en Enfermería",
  "Ingeniería Comercial",
  "Trabajo Social",
  "Pedagogía Básica",
  "Administración de Empresas",
];

const INSTITUTIONS = [
  "Duoc UC",
  "INACAP",
  "AIEP",
  "USACH",
  "U. de Chile",
  "CFT Santo Tomás",
];

export default function InvitarPage() {
  const [draft, setDraft] = useState<InviteDraft>({
    firstName: "Yair",
    lastName: "Demo",
    career: CAREERS[0]!,
    institution: INSTITUTIONS[0]!,
    year: 1,
    works: true,
    jornada: "vespertina",
  });
  const [created, setCreated] = useState<Student | null>(null);
  const [list, setList] = useState<Student[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Limpia links viejos de demos anteriores una sola vez
    const flag = "puente-links-wiped-20261106";
    if (!sessionStorage.getItem(flag)) {
      clearAllInvited();
      clearAllLiveCheckIns();
      sessionStorage.setItem(flag, "1");
      setList([]);
      setCreated(null);
      return;
    }
    setList(loadInvited());
  }, [created]);

  const url = useMemo(
    () => (created ? perpetualUrl(created.token) : ""),
    [created]
  );

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.firstName.trim()) return;
    const s = createInvitedStudent(draft);
    setCreated(s);
    setCopied(false);
  }

  function removeOne(token: string) {
    const next = deleteInvitedByToken(token);
    removeLiveCheckInByToken(token);
    setList(next);
    if (created?.token === token) setCreated(null);
  }

  function removeAll() {
    clearAllInvited();
    clearAllLiveCheckIns();
    setList([]);
    setCreated(null);
  }

  async function copyLink() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <BackButton href="/" label="Volver al inicio" />
        <PuenteLogo variant="color" className="!h-12" />
      </div>

      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-coral">
        Link perpetuo · zero fricción
      </p>
      <h1 className="display mt-1 text-3xl font-bold sm:text-4xl">
        Generar link perpetuo
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        El tutor crea al becario una vez. Le manda el link por WhatsApp. El
        alumno abre, hace check-in, ve la Caja de Cristal y recibe su plan —
        <b> sin app store, sin contraseña</b>. El mismo URL muta después del
        envío.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={onCreate} className="panel space-y-3 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold uppercase text-muted">
              Nombre
              <input
                className="mt-1 w-full border border-line bg-white px-3 py-2 text-sm text-ink"
                value={draft.firstName}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, firstName: e.target.value }))
                }
                required
              />
            </label>
            <label className="block text-xs font-bold uppercase text-muted">
              Apellido
              <input
                className="mt-1 w-full border border-line bg-white px-3 py-2 text-sm text-ink"
                value={draft.lastName}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, lastName: e.target.value }))
                }
              />
            </label>
          </div>

          <label className="block text-xs font-bold uppercase text-muted">
            Carrera
            <select
              className="mt-1 w-full border border-line bg-white px-3 py-2 text-sm"
              value={draft.career}
              onChange={(e) =>
                setDraft((d) => ({ ...d, career: e.target.value }))
              }
            >
              {CAREERS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-bold uppercase text-muted">
            Institución
            <select
              className="mt-1 w-full border border-line bg-white px-3 py-2 text-sm"
              value={draft.institution}
              onChange={(e) =>
                setDraft((d) => ({ ...d, institution: e.target.value }))
              }
            >
              {INSTITUTIONS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-xs font-bold uppercase text-muted">
              Año
              <select
                className="mt-1 w-full border border-line bg-white px-3 py-2 text-sm"
                value={draft.year}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    year: Number(e.target.value) as YearLevel,
                  }))
                }
              >
                {[1, 2, 3, 4, 5].map((y) => (
                  <option key={y} value={y}>
                    {y}°
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold uppercase text-muted">
              Jornada
              <select
                className="mt-1 w-full border border-line bg-white px-3 py-2 text-sm"
                value={draft.jornada}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    jornada: e.target.value as "diurna" | "vespertina",
                  }))
                }
              >
                <option value="vespertina">Vespertina</option>
                <option value="diurna">Diurna</option>
              </select>
            </label>
            <label className="flex items-end gap-2 pb-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={draft.works}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, works: e.target.checked }))
                }
              />
              Trabaja
            </label>
          </div>

          <button type="submit" className="btn btn-primary w-full">
            <Plus size={16} />
            Crear alumno y link
          </button>
        </form>

        <aside className="panel p-5">
          {created ? (
            <div className="space-y-3 border border-signal bg-[#fff9e6] p-3 rise">
              <p className="text-sm font-bold">
                Listo: {created.name} · {created.year}° año
              </p>
              <code className="block break-all rounded-sm bg-white p-2 text-[11px]">
                {url}
              </code>
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn btn-accent"
                  type="button"
                  onClick={copyLink}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copiado" : "Copiar link"}
                </button>
                <Link href={`/p/${created.token}`} className="btn btn-primary">
                  <Share2 size={16} />
                  Abrir ahora
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">
              Completa el formulario y crea el link del alumno.
            </p>
          )}
        </aside>
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="display text-xl font-bold">Links de este navegador</h3>
          {list.length > 0 ? (
            <button
              type="button"
              className="btn btn-ghost text-xs text-bad"
              onClick={removeAll}
            >
              <Trash2 size={14} />
              Borrar todos
            </button>
          ) : null}
        </div>
        {list.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No hay links guardados. Crea uno arriba para la demo.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {list.map((s) => (
              <div
                key={s.token}
                className="panel flex flex-wrap items-center justify-between gap-2 p-3"
              >
                <div>
                  <p className="font-bold">{s.name}</p>
                  <p className="text-xs text-muted">
                    {s.career} · {s.year}° · {s.jornada}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/p/${s.token}`}
                    className="btn btn-ghost text-xs"
                  >
                    Abrir link
                  </Link>
                  <button
                    type="button"
                    className="btn btn-ghost text-xs text-bad"
                    onClick={() => removeOne(s.token)}
                  >
                    <Trash2 size={14} />
                    Borrar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
