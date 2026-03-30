import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { isSubscriptionActive } from "@/utils/subscription"

const ALLOWED_PATHS = new Set([
    "/subscription-expired",
    "/favicon.ico",
])

export function proxy(request: NextRequest) {
    if (isSubscriptionActive()) {
        return NextResponse.next()
    }

    const { pathname } = request.nextUrl

    if (
        ALLOWED_PATHS.has(pathname) ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/images") ||
        pathname.startsWith("/api")
    ) {
        return NextResponse.next()
    }

    const expiredUrl = new URL("/subscription-expired", request.url)
    return NextResponse.redirect(expiredUrl)
}

export const config = {
    matcher: ["/((?!.*\\.).*)"],
}
