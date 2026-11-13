import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

const publicRoutes = ["/login"];

/**
 * Un JWT vencido debe tratarse como ausencia de sesión. Si no, el proxy redirige
 * `/login` → `/` (porque ve la cookie) y las páginas redirigen `/` → `/login`
 * (porque el token no es válido), provocando un bucle.
 */
function isExpiredJwt(token: string): boolean {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return false;
    const payload = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString("utf-8")
    ) as { exp?: number };
    return Boolean(payload.exp && payload.exp * 1000 < Date.now());
  } catch {
    return false;
  }
}

// Chequeo optimista: verifica que exista una cookie de sesión vigente.
// La autorización real la hace el backend con el token.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = publicRoutes.includes(pathname);

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const expired = Boolean(token && isExpiredJwt(token));
  const hasSession = Boolean(token) && !expired;

  let response: NextResponse;

  if (!isPublicRoute && !hasSession) {
    response = NextResponse.redirect(new URL("/login", request.nextUrl));
  } else if (isPublicRoute && hasSession) {
    response = NextResponse.redirect(new URL("/", request.nextUrl));
  } else {
    response = NextResponse.next();
  }

  // Limpia la cookie vencida para que `/login` deje de redirigir al panel.
  if (expired) response.cookies.delete(SESSION_COOKIE);

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
