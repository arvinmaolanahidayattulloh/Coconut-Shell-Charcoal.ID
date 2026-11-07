import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { sql } from "@/lib/csc/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const COOKIE = process.env.CSCID_EXCHANGE_ENV === "real" ? "cscid_real_session" : "cscid_demo_session";
const hashToken = (v) => createHash("sha256").update(v).digest("hex");
const hashOtp = (sessionToken, code) => createHash("sha256").update(`${sessionToken}:${code}:${process.env.AUTH_SECRET || ""}`).digest("hex");
const json = (body, status = 200) => NextResponse.json(body, { status });

async function getPending() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const rows = await sql`SELECT s.token_hash,u.id,u.username,u.phone_number,s.otp_expires_at,s.otp_attempts,s.otp_verified_at
    FROM cscid_demo_sessions s JOIN cscid_demo_users u ON u.id=s.user_id
    WHERE s.token_hash=${hashToken(token)} AND s.expires_at>now() LIMIT 1`;
  return rows[0] ? { ...rows[0], token } : null;
}

export async function POST(req) {
  try {
    const { action, code } = await req.json();
    const session = await getPending();
    if (!session) return json({ error: "Sesi login tidak ditemukan. Silakan masuk kembali." }, 401);
    if (session.otp_verified_at && new Date(session.otp_verified_at).getTime() > Date.now() - 12 * 60 * 60 * 1000) {
      return json({ ok: true, verified: true });
    }
    if (!session.phone_number) return json({ error: "Nomor WhatsApp belum terdaftar pada akun ini." }, 400);

    if (action === "send") {
      if (!process.env.WA_API_TOKEN) return json({ error: "WA_API_TOKEN belum dikonfigurasi di Vercel." }, 503);
      const cooldown = await sql`SELECT created_at FROM cscid_demo_sessions WHERE token_hash=${hashToken(session.token)} LIMIT 1`;
      const recent = await sql`SELECT otp_expires_at FROM cscid_demo_sessions WHERE token_hash=${hashToken(session.token)} AND otp_expires_at>now() LIMIT 1`;
      if (recent.length && session.otp_attempts === 0) return json({ error: "OTP masih berlaku. Periksa WhatsApp Anda." }, 429);
      const otp = String(randomInt(0, 1000000)).padStart(6, "0");
      const response = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: { Authorization: process.env.WA_API_TOKEN, "Content-Type": "application/json" },
        body: JSON.stringify({
          target: session.phone_number,
          message: `*CSCID — Verifikasi Login*\n\nKode OTP Anda: *${otp}*\nBerlaku 5 menit. Jangan bagikan kode ini kepada siapa pun.`,
        }),
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.status) return json({ error: result.reason || result.message || "WhatsApp gagal mengirim OTP." }, 502);
      await sql`UPDATE cscid_demo_sessions SET otp_hash=${hashOtp(session.token, otp)},otp_expires_at=now()+interval '5 minutes',otp_attempts=0,otp_verified_at=NULL WHERE token_hash=${hashToken(session.token)}`;
      return json({ ok: true, phoneMasked: String(session.phone_number).replace(/^(\\d{2})\\d+(\\d{3})$/, "$1••••••$2") });
    }

    if (action === "verify") {
      const entered = String(code || "").trim();
      if (!/^\\d{6}$/.test(entered)) return json({ error: "Masukkan OTP 6 digit." }, 400);
      const rows = await sql`SELECT otp_hash,otp_expires_at,otp_attempts FROM cscid_demo_sessions WHERE token_hash=${hashToken(session.token)} LIMIT 1`;
      const challenge = rows[0];
      if (!challenge?.otp_hash || !challenge.otp_expires_at || new Date(challenge.otp_expires_at).getTime() <= Date.now()) return json({ error: "OTP sudah kedaluwarsa. Minta kode baru." }, 401);
      if (Number(challenge.otp_attempts) >= 5) return json({ error: "Terlalu banyak percobaan. Kirim OTP baru." }, 429);
      const actual = Buffer.from(hashOtp(session.token, entered));
      const expected = Buffer.from(challenge.otp_hash);
      const valid = actual.length === expected.length && timingSafeEqual(actual, expected);
      if (!valid) {
        await sql`UPDATE cscid_demo_sessions SET otp_attempts=otp_attempts+1 WHERE token_hash=${hashToken(session.token)}`;
        return json({ error: "Kode OTP salah." }, 401);
      }
      await sql`UPDATE cscid_demo_sessions SET otp_verified_at=now(),otp_hash=NULL,otp_expires_at=NULL,otp_attempts=0 WHERE token_hash=${hashToken(session.token)}`;
      return json({ ok: true, verified: true });
    }
    return json({ error: "Aksi OTP tidak dikenal." }, 400);
  } catch (error) {
    console.error("[CSCID_EXCHANGE_OTP]", error);
    return json({ error: "Verifikasi OTP gagal diproses." }, 503);
  }
}
