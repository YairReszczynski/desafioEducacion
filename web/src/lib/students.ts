import { DEMO_STUDENT_TOKEN } from "@/lib/magic-token";
import type { AlertLevel, SilentSignal, Student, YearLevel } from "@/lib/types";
import { mulberry32, pick } from "@/lib/utils";

const FIRST = [
  "Camila",
  "Diego",
  "Ámbar",
  "Joaquín",
  "Valentina",
  "Matías",
  "Francisca",
  "Benjamín",
  "Constanza",
  "Sebastián",
  "Javiera",
  "Tomás",
  "Antonia",
  "Nicolás",
  "Isidora",
  "Felipe",
  "Catalina",
  "Ignacio",
  "Paula",
  "Martín",
];

const LAST = [
  "Rojas",
  "González",
  "Muñoz",
  "Silva",
  "Contreras",
  "Vargas",
  "Espinoza",
  "Castro",
  "Reyes",
  "Morales",
  "Herrera",
  "Fuentes",
  "Soto",
  "Pizarro",
  "Navarro",
];

const CAREERS = [
  "Diseño Industrial",
  "Ingeniería Comercial",
  "Técnico en Enfermería",
  "Ingeniería en Informática",
  "Trabajo Social",
  "Pedagogía en Educación Básica",
  "Administración de Empresas",
  "Psicología",
  "Técnico en Administración",
  "Derecho",
  "Kinesiología",
  "Diseño Gráfico",
  "Contador Auditor",
];

const INSTITUTIONS = [
  "Duoc UC",
  "INACAP",
  "AIEP",
  "U. de Chile",
  "USACH",
  "U. Católica",
  "U. Andrés Bello",
  "CFT Santo Tomás",
];

const TUTORS = [
  "Matías · Trabajo Social",
  "Carolina · Psicología",
  "Andrea · Coordinación",
  "Pablo · Tutoría académica",
  "Fernanda · Acompañamiento",
];

const CITIES = [
  "Santiago",
  "Puente Alto",
  "Maipú",
  "San Bernardo",
  "La Florida",
  "Valparaíso",
  "Concepción",
  "Antofagasta",
];

const QUOTES: Record<AlertLevel, string[]> = {
  crisis: [
    "No sé si llego a fin de mes y la U se me está yendo de las manos.",
    "Estoy pensando en congelar porque no doy más con los turnos.",
  ],
  alta: [
    "Me cambiaron los turnos; solo tengo 25 min en el trayecto y una hora el jueves.",
    "No respondí WhatsApp porque estoy agotado entre el trabajo y los cuidados en casa.",
    "Falté a la tutoría: tenía prueba y turno de noche el mismo día.",
  ],
  media: [
    "Voy al día, pero el Taller me está costando más de lo esperado.",
    "Esta semana dormí poco cuidando a mi hermano.",
  ],
  baja: [
    "Semana tranquila: aprobé el certamen y pude ir a la reunión.",
    "Todo estable; pedí ayudantía solo por si acaso.",
  ],
};

const ACTIONS: Record<AlertLevel, string[]> = {
  crisis: [
    "Llamada de contención + revisar apoyo económico/transporte con Coordinación",
    "Entrevista presencial urgente + derivación CAI (psicológico/familiar)",
  ],
  alta: [
    "Asignar Voluntario de Industria + flexibilizar entrega vía institución",
    "Contacto humano amable (no sanción) por inasistencia a reunión",
    "Activar red de tutoría académica en ramo crítico",
  ],
  media: [
    "Seguimiento semanal por link perpetuo + oferta de tutoría atractiva",
    "Revisar pilares laboral/familiar en próxima entrevista presencial",
  ],
  baja: ["Seguimiento estándar · mantener ritual de check-in"],
};

function uuidFromIndex(i: number): string {
  const hex = (i + 1).toString(16).padStart(12, "0");
  return `b0000000-0000-4000-8000-${hex}`;
}

function buildStudent(i: number, rng: () => number): Student {
  const firstName = pick(rng, FIRST);
  const lastName = pick(rng, LAST);
  const year = (1 + Math.floor(rng() * 5)) as YearLevel;
  const works = rng() > 0.35;
  const jornada = works && rng() > 0.4 ? "vespertina" : "diurna";
  const midYearRisk = year <= 2 && rng() > 0.45;

  const signals: SilentSignal[] = [];
  if (rng() > 0.72) signals.push("sin_whatsapp");
  if (rng() > 0.7) signals.push("falta_reunion");
  if (works && rng() > 0.55) signals.push("sobrecarga_laboral");
  if (rng() > 0.65) signals.push("sobrecarga_academica");
  if (rng() > 0.8) signals.push("nucleo_familiar");
  if (rng() > 0.75) signals.push("checkin_atrasado");

  let alertLevel: AlertLevel = "baja";
  if (signals.length >= 3 || (midYearRisk && signals.length >= 2)) {
    alertLevel = rng() > 0.85 ? "crisis" : "alta";
  } else if (signals.length >= 1 || midYearRisk) {
    alertLevel = "media";
  }

  const academico =
    alertLevel === "alta" || alertLevel === "crisis"
      ? 2 + Math.floor(rng() * 3)
      : 6 + Math.floor(rng() * 4);
  const psicologico =
    signals.includes("nucleo_familiar") || alertLevel === "crisis"
      ? 2 + Math.floor(rng() * 3)
      : 5 + Math.floor(rng() * 5);
  const trabajo = works
    ? alertLevel === "baja"
      ? 5 + Math.floor(rng() * 4)
      : 2 + Math.floor(rng() * 4)
    : 7 + Math.floor(rng() * 3);

  const lastCheckInDaysAgo =
    signals.includes("checkin_atrasado") || signals.includes("sin_whatsapp")
      ? 10 + Math.floor(rng() * 18)
      : rng() > 0.2
        ? Math.floor(rng() * 7)
        : null;

  return {
    id: `stu-${i + 1}`,
    token: i === 0 ? DEMO_STUDENT_TOKEN : uuidFromIndex(i),
    name: `${firstName} ${lastName}`,
    firstName,
    career: pick(rng, CAREERS),
    institution: pick(rng, INSTITUTIONS),
    year,
    yearInPuente: Math.min(year, 1 + Math.floor(rng() * year)),
    jornada,
    works,
    tutor: pick(rng, TUTORS),
    city: pick(rng, CITIES),
    alertLevel,
    signals,
    pillars: { academico, psicologico, trabajo },
    lastCheckInDaysAgo,
    missedMeetings: signals.includes("falta_reunion")
      ? 1 + Math.floor(rng() * 3)
      : 0,
    unansweredMessages: signals.includes("sin_whatsapp")
      ? 2 + Math.floor(rng() * 5)
      : 0,
    quote: pick(rng, QUOTES[alertLevel]),
    suggestedAction: pick(rng, ACTIONS[alertLevel]),
    midYearRisk,
  };
}

let cached: Student[] | null = null;

export function getStudents(): Student[] {
  if (cached) return cached;
  const rng = mulberry32(20261106);
  cached = Array.from({ length: 120 }, (_, i) => buildStudent(i, rng));
  // Garantizar demo Camila como caso fuerte de pitch
  cached[0] = {
    ...cached[0]!,
    name: "Camila Rojas",
    firstName: "Camila",
    career: "Ingeniería en Informática",
    institution: "Duoc UC",
    year: 1,
    yearInPuente: 1,
    jornada: "vespertina",
    works: true,
    tutor: "Matías · Trabajo Social",
    city: "Puente Alto",
    alertLevel: "alta",
    signals: ["sobrecarga_laboral", "falta_reunion", "sobrecarga_academica"],
    pillars: { academico: 4, psicologico: 5, trabajo: 2 },
    lastCheckInDaysAgo: 0,
    missedMeetings: 2,
    unansweredMessages: 1,
    quote:
      "Me cambiaron los turnos; solo tengo 25 min en el trayecto y una hora el jueves por la noche.",
    suggestedAction:
      "Asignar Voluntario de Industria en Informática + sugerir flexibilidad de entrega al jefe de carrera",
    midYearRisk: true,
  };
  return cached;
}

export function getStudentByToken(token: string): Student | undefined {
  return getStudents().find((s) => s.token === token);
}

export function getPriorityQueue(students = getStudents()) {
  const order: Record<AlertLevel, number> = {
    crisis: 0,
    alta: 1,
    media: 2,
    baja: 3,
  };
  return [...students].sort((a, b) => {
    const d = order[a.alertLevel] - order[b.alertLevel];
    if (d !== 0) return d;
    return (b.year <= 2 ? 1 : 0) - (a.year <= 2 ? 1 : 0);
  });
}

export function getDashboardStats(students = getStudents()) {
  const by = (lvl: AlertLevel) =>
    students.filter((s) => s.alertLevel === lvl).length;
  return {
    total: students.length,
    crisis: by("crisis"),
    alta: by("alta"),
    media: by("media"),
    baja: by("baja"),
    midYear: students.filter((s) => s.midYearRisk).length,
    silent: students.filter((s) => s.signals.length > 0).length,
    year12: students.filter((s) => s.year <= 2).length,
  };
}
