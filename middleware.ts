import { type NextRequest, NextResponse } from "next/server";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Defina rotas públicas que NÃO precisam de autenticação
  const isPublicRoute =
    pathname.includes("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.includes("/favicon.ico");

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // 2. Verificação otimista de sessão via Cookie
  // Em produção (HTTPS), o Better Auth usa o prefixo __Secure-
  const sessionToken =
    request.cookies.get("__Secure-better-auth.session_token")?.value ||
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Host-better-auth.session_token")?.value;

  if (!sessionToken) {
    // Redireciona conforme a área da aplicação
    if (pathname.startsWith("/bdc")) {
      return NextResponse.redirect(new URL("/bdc/login", request.url));
    }
    if (pathname.startsWith("/logistics")) {
      return NextResponse.redirect(new URL("/logistics/login", request.url));
    }
  }

  // 3. Validação de Papel (Role)
  // IMPORTANTE: Como o middleware roda no Edge, não acessamos o banco aqui.
  // A validação de role REAL continua acontecendo nos Server Components (requireBdc / requireLogistics).

  return NextResponse.next();
}

export const config = {
  matcher: ["/bdc/:path*", "/logistics/:path*"],
};
