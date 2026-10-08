import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/admin/secret";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Inject the canonical path so the root layout can emit a correct
  // <link rel="canonical" href="https://imprimelle.com{pathname}" /> for every page.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-canonical-path", pathname);

  // Protect admin pages
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = request.cookies.get("admin_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next({ request: { headers: requestHeaders } });
    } catch {
      const response = NextResponse.redirect(new URL("/admin/login", request.url));
      response.cookies.delete("admin_token");
      return response;
    }
  }

  // Protect admin API routes (exclude login/logout)
  if (pathname.startsWith("/api/admin/") && !pathname.startsWith("/api/admin/login") && !pathname.startsWith("/api/admin/logout")) {
    const token = request.cookies.get("admin_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next({ request: { headers: requestHeaders } });
    } catch {
      return NextResponse.json({ error: "Session expirée" }, { status: 401 });
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
