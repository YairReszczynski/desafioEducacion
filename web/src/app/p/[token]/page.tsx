import { TokenResolver } from "@/components/student/token-resolver";
import { normalizeMagicToken } from "@/lib/magic-token";
import { getStudentByToken } from "@/lib/students";

export default async function PerpetualPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token: raw } = await params;
  const token = normalizeMagicToken(raw);

  if (!token) {
    return <TokenResolver token={raw} />;
  }

  const seeded = getStudentByToken(token);
  return <TokenResolver token={token} seeded={seeded} />;
}
