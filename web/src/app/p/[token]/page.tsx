import { PerpetualLinkApp } from "@/components/student/perpetual-link-app";
import { normalizeMagicToken } from "@/lib/magic-token";
import { getStudentByToken } from "@/lib/students";
import Link from "next/link";

export default async function PerpetualPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token: raw } = await params;
  const token = normalizeMagicToken(raw);
  const student = token ? getStudentByToken(token) : undefined;

  if (!student) {
    return (
      <main className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="display text-2xl font-bold">Link no válido</h1>
        <p className="mt-2 text-sm text-muted">
          Este magic link no corresponde a un becario activo.
        </p>
        <Link href="/" className="btn btn-primary mt-6 inline-flex">
          Volver
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
