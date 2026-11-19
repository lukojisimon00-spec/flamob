import { NextResponse, type NextRequest } from "next/server";

/**
 * Première barrière : sans cookie de session, les espaces protégés redirigent vers la connexion.
 * La vérification réelle (validité de la session, rôle, permissions) est faite côté serveur
 * dans chaque layout/action (src/lib/auth/session.ts).
 */
export function middleware(req: NextRequest) {
  if (!req.cookies.get("flamob_session")?.value) {
    const url = req.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = `?suite=${encodeURIComponent(req.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/app/:path*", "/agent/:path*", "/admin/:path*"] };
