import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
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

  return NextResponse.redirect(new URL("/es-erp/app", req.url));
}
