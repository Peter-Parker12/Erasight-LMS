import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

const PUBLIC_PATHS = ["/sign-in", "/invite"];

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/api/auth")
  );
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    if (req.auth && pathname === "/sign-in") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (!req.auth) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
