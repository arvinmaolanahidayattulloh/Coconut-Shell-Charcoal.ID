// [AUTH:OIDC] verifikasi id_token (RS256) di server: tanda tangan, issuer, audience, masa berlaku.
// Dipakai untuk Microsoft dan Apple. Tanpa dependensi tambahan.
import crypto from "node:crypto";

const cache = new Map(); // jwksUrl -> { keys, exp }

async function getKeys(url, force = false) {
  const hit = cache.get(url);
  if (!force && hit && hit.exp > Date.now()) return hit.keys;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("gagal mengambil kunci penyedia (" + res.status + ")");
  const { keys } = await res.json();
  cache.set(url, { keys, exp: Date.now() + 60 * 60 * 1000 });
  return keys;
}

const b64u = (s) => Buffer.from(s, "base64url");

function issuerOk(iss, expected) {
  if (typeof expected === "function") return expected(iss);
  if (expected instanceof RegExp) return expected.test(iss);
  return iss === expected;
}

export async function verifyIdToken(token, { jwksUrl, audience, issuer }) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) throw new Error("token tidak valid");

  let header, payload;
  try {
    header = JSON.parse(b64u(parts[0]).toString("utf8"));
    payload = JSON.parse(b64u(parts[1]).toString("utf8"));
  } catch {
    throw new Error("token tidak valid");
  }
  if (header.alg !== "RS256") throw new Error("algoritma token tidak didukung");

  let keys = await getKeys(jwksUrl);
  let jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) {
    keys = await getKeys(jwksUrl, true); // kunci mungkin baru diganti
    jwk = keys.find((k) => k.kid === header.kid);
  }
  if (!jwk) throw new Error("kunci token tidak dikenal");

  const key = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const valid = crypto.verify("RSA-SHA256", Buffer.from(parts[0] + "." + parts[1]), key, b64u(parts[2]));
  if (!valid) throw new Error("tanda tangan token salah");

  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(audience)) throw new Error("token bukan untuk aplikasi ini");
  if (!issuerOk(payload.iss, issuer)) throw new Error("penerbit token tidak sesuai");

  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < now - 60) throw new Error("token sudah kedaluwarsa");
  if (payload.nbf && payload.nbf > now + 60) throw new Error("token belum berlaku");

  return payload;
}
// [/AUTH:OIDC]
