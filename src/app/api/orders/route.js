// [FILE: src/app/api/orders/route.js]
// POST multipart/form-data → simpan order dengan status "pending" (menunggu validasi).
//   order            : JSON data order
//   bukti            : file bukti pembayaran (gambar / PDF, maks 3 MB)
//   metode           : password | passkey | authenticator | email | wa
//   bukti_verifikasi : token dari /api/verifikasi/* (WAJIB untuk authenticator, email, wa)
//   email            : email akun pemesan
import { NextResponse } from "next/server";
import { ensureOrderSchema, simpanOrder } from "@/lib/csc/db";
import { cekBukti } from "@/lib/csc/verifikasi";

export const runtime = "nodejs";

const MAKS_BUKTI = 3 * 1024 * 1024;
const METODE = ["password", "passkey", "authenticator", "email", "wa"];
const DIVERIFIKASI_SERVER = ["authenticator", "email", "wa"];

const galat = (pesan, status = 400) => NextResponse.json({ ok: false, pesan }, { status });
const teks = (v, maks = 500) => String(v ?? "").trim().slice(0, maks);
// IP perangkat dibaca server dari header proxy (tidak dipercaya dari klien)
const ipDariHeader = (req) => teks((req.headers.get("x-forwarded-for") || "").split(",")[0] || req.headers.get("x-real-ip"), 60);

export async function POST(req) {
  try {
    let form;
    try { form = await req.formData(); } catch { return galat("Data tidak valid"); }

    let o;
    try { o = JSON.parse(String(form.get("order") || "")); } catch { return galat("Data order tidak valid"); }

    const metode = String(form.get("metode") || "");
    if (!METODE.includes(metode)) return galat("Metode verifikasi tidak dikenal");

    // verifikasi yang bisa dibuktikan server (OTP email/WhatsApp, Authenticator) harus membawa token valid
    let verifikasiServer = false;
    if (DIVERIFIKASI_SERVER.includes(metode)) {
      const b = cekBukti(String(form.get("bukti_verifikasi") || ""));
      if (!b || b.metode !== metode) return galat("Verifikasi tidak valid atau sudah kedaluwarsa. Ulangi verifikasi.", 403);
      verifikasiServer = true;
    }

    // validasi dasar + hanya field yang dikenal yang disimpan
    if (!/^INV-\d{8}-[A-Z0-9]{4}$/.test(String(o?.id))) return galat("Nomor invoice tidak valid");
    if (!teks(o.nama) || !teks(o.alamat) || String(o.wa || "").replace(/\D/g, "").length < 9) return galat("Data penerima belum lengkap");
    if (!(Number(o.qty) > 0) || !(Number(o.harga?.total) > 0)) return galat("Jumlah atau harga tidak valid");
    if (o.setuju !== true) return galat("Syarat dan Ketentuan harus disetujui");

    const bukti = form.get("bukti");
    if (!bukti || typeof bukti === "string" || typeof bukti.arrayBuffer !== "function") return galat("Bukti pembayaran wajib diunggah");
    if (bukti.size > MAKS_BUKTI) return galat("Ukuran bukti pembayaran maksimal 3 MB");
    if (!/^(image\/|application\/pdf$)/.test(bukti.type)) return galat("Bukti harus berupa gambar atau PDF");
    const buktiB64 = Buffer.from(await bukti.arrayBuffer()).toString("base64");

    const data = {
      id: o.id, pembeli: { id: teks(o.pembeli?.id, 120), userId: teks(o.pembeli?.userId, 40), username: teks(o.pembeli?.username, 120), nickname: teks(o.pembeli?.nickname, 120), ip: ipDariHeader(req), email: teks(form.get("email"), 200).toLowerCase() }, tanggal: teks(o.tanggal, 60), jenis: teks(o.jenis, 30),
      nama: teks(o.nama, 120), wa: String(o.wa).replace(/\D/g, ""), alamat: teks(o.alamat, 500), catatan: teks(o.catatan, 500),
      lokasi: o.lokasi && Number.isFinite(Number(o.lokasi.lat)) && Number.isFinite(Number(o.lokasi.lng))
        ? { lat: Number(o.lokasi.lat), lng: Number(o.lokasi.lng), akurasi: o.lokasi.akurasi ?? null, sumber: teks(o.lokasi.sumber, 20), waktu: o.lokasi.waktu ?? null }
        : null,
      mitra: teks(o.mitra, 120), ahu: teks(o.ahu, 80), nib: teks(o.nib, 40),
      pj: teks(o.pj, 120), pjJabatan: teks(o.pjJabatan, 60), pjWa: teks(o.pjWa, 30),
      produk: teks(o.produk, 60), grade: o.grade ? teks(o.grade, 5) : null,
      qty: Number(o.qty), satuan: teks(o.satuan, 10), harga: o.harga, metodeBayar: teks(o.metode, 20),
      dana: o.dana ? { jenis: teks(o.dana.jenis, 10), nama: teks(o.dana.nama, 60), nomor: teks(o.dana.nomor, 40), atasNama: null, cekPemilik: "menunggu" } : null,
      setuju: true,
    };

    await ensureOrderSchema();
    await simpanOrder({
      id: data.id,
      email: teks(form.get("email"), 200).toLowerCase() || null,
      data,
      buktiNama: teks(bukti.name, 200), buktiMime: bukti.type, buktiB64,
      metode, verifikasiServer,
    });

    return NextResponse.json({ ok: true, id: data.id, status: "pending" });
  } catch (e) {
    if (e?.code === "23505") return galat("Order ini sudah tersimpan sebelumnya", 409);
    return galat(e?.message || "Gagal menyimpan order", 500);
  }
}
