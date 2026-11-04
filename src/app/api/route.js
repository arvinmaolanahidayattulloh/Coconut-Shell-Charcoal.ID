// [AUTH:PROVIDER] POST { provider, accessToken | idToken, nonce?, name? }
// Memverifikasi login Google / Microsoft / Apple di server, lalu mengembalikan identitas yang sah:
// { name, email, picture }. Tidak pernah mengembalikan identitas tanpa token yang terbukti asli.
import { NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/auth/oidc";

export const dynamic = "force-dynamic";

const GOOGLE_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "677126002730-5m6a6uge42bvk9aglki09dqkoi467tfs.apps.googleusercontent.com";
const MS_ID = process.env.NEXT_PUBLIC_MS_CLIENT_ID;
const APPLE_ID = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function google(accessToken) {
  if (!accessToken) throw new HttpError(400, "token Google kosong");
  const info = await fetch(
    "https://oauth2.googleapis.com/tokeninfo?access_token=" + encodeURIComponent(accessToken),
    { cache: "no-store" }
  );
  if (!info.ok) throw new HttpError(401, "token Google tidak valid");
  const t = await info.json();
  if ((t.aud || t.azp) !== GOOGLE_ID) throw new HttpError(401, "token Google bukan untuk aplikasi ini");

  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: "Bearer " + accessToken },
    cache: "no-store",
  });
  if (!res.ok) throw new HttpError(401, "gagal membaca akun Google");
  const u = await res.json();
  if (!u.email || u.email_verified === false) throw new HttpError(401, "email Google belum terverifikasi");
  return { name: u.name || "", email: u.email, picture: u.picture || "" };
}

async function microsoft(idToken, nonce) {
  if (!MS_ID) throw new HttpError(501, "Login Microsoft belum dikonfigurasi (NEXT_PUBLIC_MS_CLIENT_ID).");
  const p = await verifyIdToken(idToken, {
    jwksUrl: "https://login.microsoftonline.com/common/discovery/v2.0/keys",
    audience: MS_ID,
    issuer: (iss) => /^https:\/\/login\.microsoftonline\.com\/[0-9a-f-]{36}\/v2\.0$/i.test(iss || ""),
  });
  if (nonce && p.nonce !== nonce) throw new HttpError(401, "nonce tidak cocok");
  const email = p.email || p.preferred_username || "";
  if (!email.includes("@")) throw new HttpError(401, "email akun Microsoft tidak ditemukan");
  return { name: p.name || "", email, picture: "" };
}

async function apple(idToken, name) {
  if (!APPLE_ID) throw new HttpError(501, "Login Apple belum dikonfigurasi (NEXT_PUBLIC_APPLE_CLIENT_ID).");
  const p = await verifyIdToken(idToken, {
    jwksUrl: "https://appleid.apple.com/auth/keys",
    audience: APPLE_ID,
    issuer: "https://appleid.apple.com",
  });
  if (!p.email) throw new HttpError(401, "email akun Apple tidak ditemukan");
  return { name: name || "", email: p.email, picture: "" };
}

export async function POST(req) {
  try {
    const body = await req.json();
    let identity;
    if (body.provider === "Google") identity = await google(body.accessToken);
    else if (body.provider === "Microsoft") identity = await microsoft(body.idToken, body.nonce);
    else if (body.provider === "Apple") identity = await apple(body.idToken, body.name);
    else throw new HttpError(400, "penyedia login tidak dikenal");
    return NextResponse.json(identity);
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 401;
    return NextResponse.json({ error: e.message || "verifikasi gagal" }, { status });
  }
}
// [/AUTH:PROVIDER]
