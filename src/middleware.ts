import { NextResponse, type NextRequest } from "next/server";

/**
 * One canonical host. Both www and the apex resolve to Railway, so www is
 * redirected permanently rather than served — two hostnames serving identical
 * pages would split the ranking signal the old site spent a decade building.
 */
export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  if (host.startsWith("www.")) {
    const url = req.nextUrl.clone();
    url.host = host.slice(4);
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 301);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
