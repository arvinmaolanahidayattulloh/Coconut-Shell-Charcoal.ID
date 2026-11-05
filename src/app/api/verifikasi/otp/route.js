// [FILE: src/app/api/verifikasi/otp/route.js]
// POST { aksi: "kirim", kanal: "email"|"wa", tujuan }              → { ok, token }   (kode dikirim ke email / WhatsApp)
// POST { aksi: "cek",   kanal, tujuan, kode, token }               → { ok, bukti }
// Kode OTP TIDAK dikembalikan ke browser.
import { NextResponse } from "next/server";
import { buatKode, buatTantangan, cekTantangan, buatBukti } from "@/lib/csc/verifikasi";

export const runtime = "nodejs";

const jawab = (body, status = 200) => NextResponse.json(body, { status });
const galat = (pesan, status = 400) => jawab({ ok: false, pesan }, status);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const normalWa = (v) => {
  const d = String(v || "").replace(/\D/g, "");
  return d.startsWith("0") ? "62" + d.slice(1) : d;
};

async function kirimEmail(email, kode) {
  if (!process.env.RESEND_API_KEY) throw new Error("Pengiriman email belum dikonfigurasi (RESEND_API_KEY)");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({
      from: "Customer Service <CostumerService@coconutshellcharcoal.id>",
      to: [email],
      subject: "Kode Verifikasi Order - PT Tunas Kembar Abadi",
      html: `<div style="font-family:Arial,sans-serif;padding:24px;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#c45e20;margin-top:0">PT Tunas Kembar Abadi</h2>
        <p>Gunakan kode berikut untuk memverifikasi order Anda:</p>
        <div style="background:#f3f4f6;padding:16px;text-align:center;border-radius:8px;margin:20px 0">
          <span style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#111827">${kode}</span></div>
        <p style="font-size:14px;color:#6b7280">Berlaku 5 menit. Jangan berikan kode ini kepada siapa pun.</p></div>`,
    }),
  });
  if (!res.ok) throw new Error("Gagal mengirim email. Coba lagi beberapa saat.");
}

async function kirimWa(nomor, kode) {
  if (!process.env.WA_API_TOKEN) throw new Error("Pengiriman WhatsApp belum dikonfigurasi (WA_API_TOKEN)");
  const res = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: { Authorization: process.env.WA_API_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify({
      target: nomor,
      message: `*PT Tunas Kembar Abadi*\n\nKode verifikasi order Anda: *${kode}*\n\nBerlaku 5 menit. Jangan bagikan kode ini kepada siapa pun.`,
    }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.status) throw new Error("Gagal mengirim WhatsApp. Periksa nomor lalu coba lagi.");
}

export async function POST(req) {
  try {
    const { aksi, kanal, tujuan: tujuanMentah, kode, token } = await req.json();
    if (kanal !== "email" && kanal !== "wa") return galat("Kanal tidak dikenal");

    const tujuan = kanal === "email" ? String(tujuanMentah || "").trim().toLowerCase() : normalWa(tujuanMentah);
    if (kanal === "email" && !EMAIL.test(tujuan)) return galat("Alamat email tidak valid");
    if (kanal === "wa" && (tujuan.length < 10 || tujuan.length > 15)) return galat("Nomor WhatsApp tidak valid");

    if (aksi === "kirim") {
      const kodeBaru = buatKode();
      const tantangan = buatTantangan(kanal, tujuan, kodeBaru);
      if (kanal === "email") await kirimEmail(tujuan, kodeBaru);
      else await kirimWa(tujuan, kodeBaru);
      return jawab({ ok: true, token: tantangan });
    }

    if (aksi === "cek") {
      if (!/^\d{6}$/.test(String(kode || "").trim())) return galat("Kode harus 6 digit");
      if (!cekTantangan(token, kanal, tujuan, kode)) return galat("Kode salah atau sudah kedaluwarsa", 401);
      return jawab({ ok: true, bukti: buatBukti(kanal, tujuan) });
    }

    return galat("Aksi tidak dikenal");
  } catch (e) {
    return galat(e?.message || "Terjadi kesalahan di server", 500);
  }
}
