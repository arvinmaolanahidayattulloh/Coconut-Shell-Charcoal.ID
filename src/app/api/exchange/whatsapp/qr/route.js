import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { sql } from "@/lib/csc/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const COOKIE = process.env.CSCID_EXCHANGE_ENV === "real" ? "cscid_real_session" : "cscid_demo_session";
const hashToken = (v) => createHash("sha256").update(v).digest("hex");
const json = (body, status = 200) => NextResponse.json(body, { status });

export async function GET() {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return json({ error: "Login Founder diperlukan." }, 401);
    const rows = await sql`SELECT u.is_founder,s.otp_verified_at FROM cscid_demo_sessions s
      JOIN cscid_demo_users u ON u.id=s.user_id
      WHERE s.token_hash=${hashToken(token)} AND s.expires_at>now() LIMIT 1`;
    const user = rows[0];
    if (!user || !user.is_founder) return json({ error: "Akses QR Pairing hanya diberikan kepada Founder/CEO. Hubungi Founder/CEO untuk memperoleh izin." }, 403);
    if (!user.otp_verified_at || new Date(user.otp_verified_at).getTime() <= Date.now() - 12 * 60 * 60 * 1000) return json({ error: "Verifikasi OTP WhatsApp diperlukan sebelum membuka QR Pairing." }, 403);
    if (!process.env.WA_API_TOKEN) return json({ error: "WA_API_TOKEN belum dikonfigurasi di Vercel." }, 503);
    const phone = String(process.env.WA_SERVER_NUMBER || "").replace(/\\D/g, "").replace(/^0/, "62");
    if (!phone || phone.length < 10 || phone.length > 15) return json({ error: "WA_SERVER_NUMBER belum diatur pada environment Vercel." }, 503);

    const body = new FormData();
    body.set("type", "qr");
    body.set("whatsapp", phone);
    const response = await fetch("https://api.fonnte.com/qr", {
      method: "POST",
      headers: { Authorization: process.env.WA_API_TOKEN },
      body,
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (result.status && result.url) return json({ ok: true, connected: false, qr: `data:image/png;base64,${result.url}` });
    if (/already connect/i.test(String(result.reason || ""))) return json({ ok: true, connected: true, message: "WhatsApp Server sudah terhubung." });
    return json({ error: result.reason || "QR Pairing belum dapat dibuat. Periksa status perangkat Fonnte." }, 502);
  } catch (error) {
    console.error("[CSCID_WHATSAPP_QR]", error);
    return json({ error: "QR Pairing tidak dapat dimuat." }, 503);
  }
}
