import * as jose from "jose";
import { NextRequest, NextResponse } from "next/server";
import { JWKS } from "./lib/auth";

async function verifyJWT(token: string) {
  await jose.jwtVerify(token, JWKS);
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("es-erp-jwt")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/es-erp/auth/error", req.url));
  }

  try {
    await verifyJWT(token);
    return NextResponse.next();
  } catch (error) {
    console.error("JWT verification failed:", error);
    return NextResponse.redirect(new URL("/es-erp/auth/error", req.url));
  }
}

export const config = {
  matcher: ["/app/:path*"], // Protects all routes under /app
};
