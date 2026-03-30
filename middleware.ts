import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      return res;
    }

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data: { session } } = await supabase.auth.getSession();
    const pathname = req.nextUrl.pathname;

    // Public routes (no login required)
    if (pathname === "/setup") return res;

    // Block /register — redirect to login (registration is invitation-only)
    if (pathname.startsWith("/register")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const isAuthPage =
      pathname.startsWith("/login") ||
      pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password");
    const isAppRoute =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/tasks") ||
      pathname.startsWith("/leads") ||
      pathname.startsWith("/team") ||
      pathname.startsWith("/reports") ||
      pathname.startsWith("/commission") ||
      pathname.startsWith("/sticky-notes") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/admin");

    if (!session && isAppRoute) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (session && isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  } catch {
    // If Supabase or auth fails, let the request proceed so pages still load
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - api routes
     * - static assets (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
