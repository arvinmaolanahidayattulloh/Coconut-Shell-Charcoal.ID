// [FILE: src/app/api/verifikasi/totp/route.js]
// Authenticator (TOTP).
// POST { aksi: "status", email }          → { ok, aktif }
// POST { aksi: "daftar", email }          → { ok, secret, uri }   (hanya bila belum aktif)
// POST { aksi: "cek",    email, kode }    → { ok, bukti }         (pengecekan pertama yang benar = mengaktifkan)
import { NextResponse } from "next/server";
import { ensureOrderSchema, getTotp, setTotpBaru, aktifkanTotp } from "@/lib/csc/db";
import { buatSecretTotp, cekTotp, uriTotp, buatBukti } from "@/lib/csc/verifikasi";

export const runtime = "nodejs";

const jawab = (body, status = 200) => NextResponse.json(body, { status });
const galat = (pesan, status = 400) => jawab({ ok: false, pesan }, status);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req) {
  try {
    const { aksi, email: emailMentah, kode } = await req.json();
    const email = String(emailMentah || "").trim().toLowerCase();
    if (!EMAIL.test(email)) return galat("Akun ini tidak punya email yang valid untuk Authenticator");

    await ensureOrderSchema();
    const baris = await getTotp(email);

    if (aksi === "status") return jawab({ ok: true, aktif: !!baris?.aktif });

    if (aksi === "daftar") {
      if (baris?.aktif) return galat("Authenticator sudah aktif untuk akun ini", 409);
      const secret = buatSecretTotp();
      await setTotpBaru(email, secret);
      return jawab({ ok: true, secret, uri: uriTotp(email, secret) });
    }

    if (aksi === "cek") {
      if (!baris) return galat("Authenticator belum didaftarkan", 404);
      if (!/^\d{6}$/.test(String(kode || "").replace(/\s/g, ""))) return galat("Kode harus 6 digit");
      if (!cekTotp(baris.secret, kode)) return galat("Kode salah", 401);
      if (!baris.aktif) await aktifkanTotp(email);
      return jawab({ ok: true, bukti: buatBukti("authenticator", email) });
    }

    return galat("Aksi tidak dikenal");
  } catch (e) {
    return galat(e?.message || "Terjadi kesalahan di server", 500);
  }
}
