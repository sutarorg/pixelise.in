import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Proxy (Next 16's replacement for `middleware.ts`).
 *
 * Two jobs, both cheap:
 *  1. refresh the Supabase session cookie so a user is not signed out mid-session;
 *  2. keep signed-out visitors out of the private app shell, and add the security
 *     headers that belong on every response.
 *
 * It is deliberately *not* an authorization layer: every page and every API route
 * re-checks the session server-side. This exists so the customer sees a sign-in
 * page instead of an empty dashboard, not to protect data.
 */

/** Pages that only make sense signed out. */
const AUTH_PATHS = ["/login", "/signup", "/forgot-password"] as const;

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/studio",
  "/creations",
  "/credits",
  "/transactions",
  "/settings",
  "/admin",
];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isPrivate = PROTECTED_PREFIXES.some(
    (prefix) => request.nextUrl.pathname === prefix || request.nextUrl.pathname.startsWith(`${prefix}/`),
  );

  const isAuthPage = (AUTH_PATHS as readonly string[]).includes(request.nextUrl.pathname);

  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && isPrivate) {
      const signIn = request.nextUrl.clone();
      signIn.pathname = "/login";
      signIn.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
      return withSecurityHeaders(NextResponse.redirect(signIn));
    }

    /* Someone already signed in has no use for the sign-in door. The recovery
       mode is the exception: there the customer holds a session *because* they
       clicked a reset link, and still needs the form to choose a password. */
    const recoveryMode = request.nextUrl.searchParams.get("mode") === "recovery";
    if (user && isAuthPage && !recoveryMode) {
      const dashboard = request.nextUrl.clone();
      dashboard.pathname = "/dashboard";
      dashboard.search = "";
      const redirect = NextResponse.redirect(dashboard);
      /* Carry over any refreshed session cookies, or the redirect would hand the
         browser a stale session. */
      for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
      return withSecurityHeaders(redirect);
    }
  }

  return withSecurityHeaders(response);
}

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image optimisation, which never need a
     * session check and would make the proxy a bottleneck.
     */
    "/((?!_next/static|_next/image|favicon.ico|images|fonts|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|css|js|woff2?)$).*)",
  ],
};
