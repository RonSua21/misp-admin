import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Required by @supabase/ssr — refreshes the session cookie on every request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // DO NOT remove — keeps the session alive.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Root redirect — no root page in the admin portal.
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(user ? "/admin" : "/login", request.url)
    );
  }

  // Unauthenticated users cannot access admin or super-admin routes.
  if (
    !user &&
    (pathname.startsWith("/admin") || pathname.startsWith("/super-admin"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logged-in users on the login page go straight to admin.
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Role enforcement (ADMIN vs SUPER_ADMIN vs residents) is handled by
  // layout.tsx — no DB queries in proxy keeps every route fast.

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
