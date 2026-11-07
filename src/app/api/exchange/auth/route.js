import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes, createHash, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { sql } from "@/lib/csc/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const scrypt = promisify(scryptCallback);
const COOKIE = "cscid_demo_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;

async function schema() {
  await sql`CREATE TABLE IF NOT EXISTS cscid_demo_users (
    id text PRIMARY KEY,
    username text NOT NULL,
    username_norm text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    password_salt text NOT NULL,
    balance_cents bigint NOT NULL DEFAULT 1000000,
    shares bigint NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS cscid_demo_sessions (
    token_hash text PRIMARY KEY,
    user_id text NOT NULL REFERENCES cscid_demo_users(id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS cscid_demo_sessions_user_idx ON cscid_demo_sessions(user_id)`;
}

const hashToken = (v) => createHash("sha256").update(v).digest("hex");
const json = (body, status = 200) => NextResponse.json(body, { status });

async function issueSession(userId) {
  const token = randomBytes(32).toString("base64url");
  await sql`INSERT INTO cscid_demo_sessions (token_hash, user_id, expires_at)
    VALUES (${hashToken(token)}, ${userId}, now() + interval '30 days')`;
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

async function currentUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const rows = await sql`SELECT u.id, u.username, u.balance_cents, u.shares
    FROM cscid_demo_sessions s
    JOIN cscid_demo_users u ON u.id = s.user_id
    WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > now()
    LIMIT 1`;
  const u = rows[0];
  return u ? {
    id: u.id,
    username: u.username,
    balance: Number(u.balance_cents) / 100,
    shares: Number(u.shares),
  } : null;
}

export async function GET() {
  try {
    await schema();
    const user = await currentUser();
    return json({ authenticated: !!user, user });
  } catch (e) {
    console.error("[CSCID_DEMO_AUTH_GET]", e);
    return json({ error: "Layanan akun Demo belum siap. Coba lagi sebentar." }, 503);
  }
}

export async function POST(req) {
  try {
    await schema();
    const body = await req.json();
    const action = body?.action;
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");
    if (!["register", "login"].includes(action)) return json({ error: "Aksi tidak valid." }, 400);
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
      return json({ error: "Username 3–24 karakter, hanya huruf, angka, dan garis bawah." }, 400);
    }
    if (password.length < 8 || password.length > 128) {
      return json({ error: "Password harus 8–128 karakter." }, 400);
    }

    const normalized = username.toLowerCase();
    if (action === "register") {
      const id = "D-" + randomBytes(12).toString("hex");
      const salt = randomBytes(16).toString("hex");
      const derived = await scrypt(password, salt, 64);
      try {
        await sql`INSERT INTO cscid_demo_users
          (id, username, username_norm, password_hash, password_salt)
          VALUES (${id}, ${username}, ${normalized}, ${Buffer.from(derived).toString("hex")}, ${salt})`;
      } catch (e) {
        if (e?.code === "23505") return json({ error: "Username sudah digunakan." }, 409);
        throw e;
      }
      await issueSession(id);
      return json({ ok: true, user: await currentUser() }, 201);
    }

    const rows = await sql`SELECT id, username, password_hash, password_salt
      FROM cscid_demo_users WHERE username_norm = ${normalized} LIMIT 1`;
    const user = rows[0];
    if (!user) return json({ error: "Username atau password salah." }, 401);
    const candidate = Buffer.from(await scrypt(password, user.password_salt, 64));
    const expected = Buffer.from(user.password_hash, "hex");
    if (candidate.length !== expected.length || !timingSafeEqual(candidate, expected)) {
      return json({ error: "Username atau password salah." }, 401);
    }
    await issueSession(user.id);
    return json({ ok: true, user: await currentUser() });
  } catch (e) {
    console.error("[CSCID_DEMO_AUTH_POST]", e);
    return json({ error: "Tidak dapat memproses akun Demo. Coba lagi." }, 503);
  }
}

export async function DELETE() {
  try {
    await schema();
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (token) await sql`DELETE FROM cscid_demo_sessions WHERE token_hash = ${hashToken(token)}`;
    jar.set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
    return json({ ok: true });
  } catch (e) {
    console.error("[CSCID_DEMO_AUTH_DELETE]", e);
    return json({ error: "Gagal keluar dari akun Demo." }, 503);
  }
}
