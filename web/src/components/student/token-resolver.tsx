"use client";

import { PerpetualLinkApp } from "@/components/student/perpetual-link-app";
import { findInvitedByToken } from "@/lib/invite-store";
import type { Student } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

export function TokenResolver({
  token,
  seeded,
}: {
  token: string;
  seeded?: Student;
}) {
  const [student, setStudent] = useState<Student | undefined>(seeded);
  const [ready, setReady] = useState(!!seeded);

  useEffect(() => {
    if (seeded) {
      setStudent(seeded);
      setReady(true);
      return;
    }
    setStudent(findInvitedByToken(token));
    setReady(true);
  }, [token, seeded]);

  if (!ready) {
    return (
      <main className="mx-auto max-w-md px-5 py-20 text-center text-sm text-muted">
        Abriendo link perpetuo…
      </main>
    );
  }

  if (!student) {
    return (
      <main className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="display text-2xl font-bold">Link no válido</h1>
        <p className="mt-2 text-sm text-muted">
          Este magic link no está en el seed ni en alumnos invitados de este
          navegador.
        </p>
        <Link href="/invitar" className="btn btn-primary mt-6 inline-flex">
          Generar nuevo alumno
        </Link>
      </main>
    );
  }

  return (
    <main>
      <PerpetualLinkApp student={student} />
    </main>
  );
}
