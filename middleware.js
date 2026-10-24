import { NextResponse } from "next/server";

export function middleware(req) {
    const token = req.cookies.get("admin_token")?.value;
    const { pathname } = req.nextUrl;

    // Redirect old /mediator public route → /introducer (and sub-paths)
    // Must come BEFORE the admin checks, and must exclude /admin/mediator.
    if (
        (pathname === "/mediator" || pathname.startsWith("/mediator/")) &&
        !pathname.startsWith("/admin")
    ) {
        const url = req.nextUrl.clone();
        url.pathname = pathname.replace(/^\/mediator/, "/introducer");
        return NextResponse.redirect(url, 308);
    }

    // Allow login page
    if (pathname.startsWith("/admin/login")) {
        return NextResponse.next();
    }

    // Protect admin pages ONLY (not API)
    if (pathname.startsWith("/admin") && !pathname.startsWith("/api")) {
        if (!token) {
            return NextResponse.redirect(new URL("/admin/login", req.url));
        }
    }

    return NextResponse.next();
}