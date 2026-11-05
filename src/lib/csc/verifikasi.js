// [FILE: src/lib/csc/verifikasi.js]  (SERVER ONLY — jangan di-import dari komponen "use client")
// Alat verifikasi order: OTP tanpa penyimpanan (stateless, ditandatangani HMAC), TOTP (RFC 6238),
// dan token bukti verifikasi. Memerlukan env AUTH_SECRET (acak, minimal 16 karakter).
import crypto from "node:crypto";

// [SECTION: DASAR]
function rahasia() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET belum diatur di server (minimal 16 karakter)");
  return s;
}
const hmac = (data) => crypto.createHmac("sha256", rahasia()).update(data).digest("base64url");
const enc = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
const dec = (str) => { try { return JSON.parse(Buffer.from(str, "base64url").toString()); } catch { return null; } };
const samaAman = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
// [/SECTION: DASAR]

// [SECTION: OTP] kode TIDAK pernah dikirim ke browser; token hanya bisa dicocokkan dengan kode yang benar
export const buatKode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");

export function buatTantangan(kanal, tujuan, kode, menit = 5) {
  const payload = enc({ k: kanal, t: tujuan, e: Date.now() + menit * 60_000 });
  return `${payload}.${hmac(`otp|${payload}|${kode}`)}`;
}

export function cekTantangan(token, kanal, tujuan, kode) {
  const [payload, sig] = String(token || "").split(".");
  if (!payload || !sig) return false;
  const d = dec(payload);
  if (!d || d.k !== kanal || d.t !== tujuan || !(d.e > Date.now())) return false;
  return samaAman(sig, hmac(`otp|${payload}|${String(kode || "").trim()}`));
}
// [/SECTION: OTP]

// [SECTION: BUKTI] token "sudah terverifikasi", diminta oleh /api/orders
export function buatBukti(metode, subjek, menit = 15) {
  const payload = enc({ m: metode, s: subjek, e: Date.now() + menit * 60_000 });
  return `${payload}.${hmac(`bukti|${payload}`)}`;
}

export function cekBukti(token) {
  const [payload, sig] = String(token || "").split(".");
  if (!payload || !sig || !samaAman(sig, hmac(`bukti|${payload}`))) return null;
  const d = dec(payload);
  return d && d.e > Date.now() ? { metode: d.m, subjek: d.s } : null;
}
// [/SECTION: BUKTI]

// [SECTION: TOTP] Authenticator (Google Authenticator, Authy, dsb.): SHA-1, 6 digit, 30 detik
const ABJAD = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function keBase32(buf) {
  let bits = 0, val = 0, out = "";
  for (const b of buf) {
    val = (val << 8) | b;
    bits += 8;
    while (bits >= 5) { out += ABJAD[(val >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += ABJAD[(val << (5 - bits)) & 31];
  return out;
}

function dariBase32(str) {
  let bits = 0, val = 0;
  const out = [];
  for (const ch of String(str).toUpperCase()) {
    const i = ABJAD.indexOf(ch);
    if (i < 0) continue;
    val = (val << 5) | i;
    bits += 5;
    if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}

export const buatSecretTotp = () => keBase32(crypto.randomBytes(20));

function hotp(kunci, counter) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac("sha1", kunci).update(buf).digest();
  const o = h[19] & 15;
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1_000_000).padStart(6, "0");
}

// toleransi ±1 langkah (30 dtk) untuk selisih jam
export function cekTotp(secret, kode) {
  const kunci = dariBase32(secret);
  const t = Math.floor(Date.now() / 30_000);
  const k = String(kode || "").replace(/\s/g, "");
  return [-1, 0, 1].some((d) => samaAman(hotp(kunci, t + d), k));
}

export const uriTotp = (email, secret) =>
  `otpauth://totp/${encodeURIComponent(`CSCID:${email}`)}?secret=${secret}&issuer=CSCID&digits=6&period=30`;
// [/SECTION: TOTP]
