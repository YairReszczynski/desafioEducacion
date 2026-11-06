import { EQUIPO_COOKIE, isEquipoOnlyPath } from "@/lib/app-mode";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!isEquipoOnlyPath(pathname)) {
    return NextResponse.next();
  }

  const unlocked = req.cookies.get(EQUIPO_COOKIE)?.value === "1";
  if (unlocked) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/equipo";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/slides",
    "/slides/:path*",
    "/pitch",
    "/pitch/:path*",
    "/etica",
    "/etica/:path*",
    "/invitar",
    "/invitar/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/qr",
    "/qr/:path*",
  ],
};
