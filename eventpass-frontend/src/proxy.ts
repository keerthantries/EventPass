import { NextResponse, type NextRequest } from "next/server";

const ADMIN_ROLES = new Set(["organizer", "super_admin"]);

const PUBLIC_PATHS = new Set(["/login", "/register"]);
const PUBLIC_PREFIXES = ["/i/", "/family/"];

const SUPER_ADMIN_PATHS = new Set(["/users"]);
const ADMIN_PATHS = new Set(["/team", "/reports", "/events/new"]);
const EVENT_ADMIN_SEGMENTS = new Set([
  "forms",
  "invitations",
  "categories",
  "reports",
  "settings",
]);

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function isDenied(pathname: string, role: string): boolean {
  if (SUPER_ADMIN_PATHS.has(pathname)) return role !== "super_admin";
  if (ADMIN_PATHS.has(pathname)) return !ADMIN_ROLES.has(role);
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "events" && segments.length >= 3 && EVENT_ADMIN_SEGMENTS.has(segments[2])) {
    return !ADMIN_ROLES.has(role);
  }
  return false;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const session = request.cookies.get("ep_session")?.value;
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = request.cookies.get("ep_role")?.value;
  if (role && isDenied(pathname, role)) {
    return NextResponse.redirect(new URL("/events", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
