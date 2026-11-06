import {
  appendHistoryEntry,
  patchLatestHistorySupport,
} from "@/lib/history-store";
import { findInvitedByToken, loadInvited, saveInvited } from "@/lib/invite-store";
import type {
  AlertLevel,
  GlassBoxSummary,
  SilentSignal,
  Student,
} from "@/lib/types";

const KEY = "puente-live-checkins";

export type LiveCheckIn = {
  id: string;
  token: string;
  at: string;
  student: Student;
  transcript: string;
  glass: GlassBoxSummary;
  pillars: Student["pillars"];
  minutes?: number;
  energy?: number;
  /** Pedido explícito del alumno al cerrar el flujo (ej. Apoyo psicológico). */
  requestedSupport?: string | null;
  live: true;
};

export function loadLiveCheckIns(): LiveCheckIn[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as LiveCheckIn[];
  } catch {
    return [];
  }
}

function saveLiveCheckIns(list: LiveCheckIn[]) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 30)));
}

export function removeLiveCheckInByToken(token: string): void {
  saveLiveCheckIns(loadLiveCheckIns().filter((c) => c.token !== token));
  try {
    window.dispatchEvent(new CustomEvent("puente-live-checkin"));
  } catch {
    /* ignore */
  }
}

export function clearAllLiveCheckIns(): void {
  saveLiveCheckIns([]);
  try {
    window.dispatchEvent(new CustomEvent("puente-live-checkin"));
  } catch {
    /* ignore */
  }
}

function mapSignals(glass: GlassBoxSummary): SilentSignal[] {
  const allowed: SilentSignal[] = [
    "sin_whatsapp",
    "falta_reunion",
    "sobrecarga_laboral",
    "sobrecarga_academica",
    "nucleo_familiar",
    "checkin_atrasado",
  ];
  const fromGlass = (glass.silentSignals || []).filter((s): s is SilentSignal =>
    (allowed as string[]).includes(s)
  );
  if (fromGlass.length) return fromGlass;
  if (glass.pillarsTouched.includes("trabajo")) return ["sobrecarga_laboral"];
  if (glass.pillarsTouched.includes("psicologico")) return ["nucleo_familiar"];
  return ["sobrecarga_academica"];
}

function bumpLiveEvent(entry?: LiveCheckIn) {
  try {
    window.dispatchEvent(
      new CustomEvent("puente-live-checkin", { detail: entry })
    );
  } catch {
    /* ignore */
  }
}

/** Persiste el check-in del alumno para que el radar del equipo lo vea de inmediato. */
export function publishLiveCheckIn(input: {
  student: Student;
  transcript: string;
  glass: GlassBoxSummary;
  pillars: Student["pillars"];
  minutes?: number;
  energy?: number;
  requestedSupport?: string | null;
  source?: "checkin" | "papel";
  /** Si false, actualiza el vivo sin agregar otra fila al historial. */
  recordHistory?: boolean;
}): LiveCheckIn {
  const alertLevel = (input.glass.alertLevel || "media") as AlertLevel;
  const signals = mapSignals(input.glass);
  const quote =
    input.transcript.trim().slice(0, 180) ||
    input.glass.headache ||
    input.glass.summaryForStudent;

  const support = input.requestedSupport?.trim() || null;
  const wantsHelp =
    !!support && !/^no necesito ayuda/i.test(support);

  const patched: Student = {
    ...input.student,
    alertLevel,
    signals,
    pillars: input.pillars,
    lastCheckInDaysAgo: 0,
    quote,
    suggestedAction: wantsHelp
      ? `Alumno pidió: ${support}`
      : input.glass.suggestedActions?.[0] ||
        input.glass.tutorBrief ||
        "Contacto humano con cercanía",
    midYearRisk: input.student.year <= 2 || alertLevel !== "baja",
  };

  // Actualiza ficha del alumno invitado si existe
  const invited = loadInvited();
  const idx = invited.findIndex((s) => s.token === patched.token);
  if (idx >= 0) {
    invited[idx] = patched;
    saveInvited(invited);
  } else if (!findInvitedByToken(patched.token)) {
    // Si es seed (Camila u otro), igual lo guardamos como override vivo
    saveInvited([patched, ...invited]);
  }

  const prevEntry = loadLiveCheckIns().find((c) => c.token === patched.token);
  const entry: LiveCheckIn = {
    id: prevEntry?.id || `live-${Date.now()}`,
    token: patched.token,
    at: new Date().toISOString(),
    student: patched,
    transcript: input.transcript,
    glass: input.glass,
    pillars: input.pillars,
    minutes: input.minutes,
    energy: input.energy,
    requestedSupport: support ?? prevEntry?.requestedSupport ?? null,
    live: true,
  };

  const prev = loadLiveCheckIns().filter((c) => c.token !== patched.token);
  saveLiveCheckIns([entry, ...prev]);

  // Historial acumulativo (una fila por check-in autorizado, no por recompilar plan)
  if (input.recordHistory !== false) {
    appendHistoryEntry({
      token: patched.token,
      student: patched,
      transcript: input.transcript,
      glass: input.glass,
      pillars: input.pillars,
      minutes: input.minutes,
      energy: input.energy,
      requestedSupport: entry.requestedSupport,
      source: input.source || "checkin",
    });
  }

  bumpLiveEvent(entry);
  return entry;
}

/** Actualiza el pedido de red Puente cuando el alumno lo elige al final. */
export function setLiveRequestedSupport(
  token: string,
  requestedSupport: string
): LiveCheckIn | null {
  const list = loadLiveCheckIns();
  const idx = list.findIndex((c) => c.token === token);
  if (idx < 0) return null;

  const support = requestedSupport.trim();
  const wantsHelp = !!support && !/^no necesito ayuda/i.test(support);
  const current = list[idx]!;
  const student: Student = {
    ...current.student,
    suggestedAction: wantsHelp
      ? `Alumno pidió: ${support}`
      : current.glass.suggestedActions?.[0] ||
        current.glass.tutorBrief ||
        "Seguimiento estándar (alumno no pidió contacto extra)",
  };

  const entry: LiveCheckIn = {
    ...current,
    at: new Date().toISOString(),
    student,
    requestedSupport: support,
  };
  list[idx] = entry;
  saveLiveCheckIns(list);
  patchLatestHistorySupport(token, support);

  const invited = loadInvited();
  const iIdx = invited.findIndex((s) => s.token === token);
  if (iIdx >= 0) {
    invited[iIdx] = student;
    saveInvited(invited);
  }

  bumpLiveEvent(entry);
  return entry;
}

/** Mezcla check-ins en vivo arriba del seed de 120. */
export function mergeStudentsWithLive(seed: Student[]): Student[] {
  const live = loadLiveCheckIns();
  if (!live.length) return seed;

  const byToken = new Map<string, Student>();
  for (const s of seed) byToken.set(s.token, s);

  const liveStudents: Student[] = [];
  for (const c of live) {
    liveStudents.push({
      ...c.student,
      // marca interna vía quote prefix no; usamos id live-
      id: c.student.id.startsWith("live-") ? c.student.id : `live-${c.student.id}`,
    });
    byToken.delete(c.token);
  }

  return [...liveStudents, ...Array.from(byToken.values())];
}

export function isLiveStudentId(id: string) {
  return id.startsWith("live-");
}

/** True si ese token tiene check-in vivo publicado. */
export function hasLiveCheckIn(token: string) {
  return loadLiveCheckIns().some((c) => c.token === token);
}

export function getLatestLiveForToken(token: string): LiveCheckIn | undefined {
  return loadLiveCheckIns().find((c) => c.token === token);
}
