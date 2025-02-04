import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.nextUrl);
  const jwt = searchParams.get("token");

  if (!jwt) {
    return NextResponse.json({ message: "Missing token" }, { status: 400 });
  }

  await (
    await cookies()
  ).set("es-erp-jwt", jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/es-erp",
    maxAge: 86400, // 1 day
  });

  const host = req.headers.get("host");

  return NextResponse.redirect(
    `http${host?.startsWith("localhost") ? "" : "s"}://${host}/es-erp/app`
  );
}
