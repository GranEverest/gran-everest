// web/app/api/subscribe/route.ts
import { NextResponse } from "next/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const emailRaw = typeof body.email === "string" ? body.email.trim() : "";

    if (!EMAIL_REGEX.test(emailRaw)) {
      return NextResponse.json(
        { ok: false, error: "Invalid email" },
        { status: 400 }
      );
    }

    // TODO: Persistir email en una base / lista real.
    // Por ahora queda log en el server (útil mientras desarrollás).
    console.log("GranEverest new subscriber:", emailRaw);

    // Ejemplo futuro:
    // await saveEmailToDb(emailRaw);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("subscribe API error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error" },
      { status: 500 }
    );
  }
}
