import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes, createHash, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { sql } from "@/lib/csc/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const scrypt = promisify(scryptCallback);
const EXCHANGE_ENV = process.env.CSCID_EXCHANGE_ENV === "real" ? "real" : "demo";
const COOKIE = EXCHANGE_ENV === "real" ? "cscid_real_session" : "cscid_demo_session";
const INITIAL_BALANCE_CENTS = EXCHANGE_ENV === "real" ? 0 : 1000000;
const SESSION_SECONDS = 60 * 60 * 24 * 30;

async function schema() {
  await sql`CREATE TABLE IF NOT EXISTS cscid_demo_users (
    id text PRIMARY KEY,
    username text NOT NULL,
    username_norm text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    password_salt text NOT NULL,
    balance_cents bigint NOT NULL DEFAULT 0,
    shares bigint NOT NULL DEFAULT 0,
    is_founder boolean NOT NULL DEFAULT false,
    must_change_password boolean NOT NULL DEFAULT false,
    phone_number text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`ALTER TABLE cscid_demo_users ADD COLUMN IF NOT EXISTS is_founder boolean NOT NULL DEFAULT false`;
  await sql`ALTER TABLE cscid_demo_users ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false`;
  await sql`ALTER TABLE cscid_demo_users ADD COLUMN IF NOT EXISTS phone_number text`;
  await sql`CREATE TABLE IF NOT EXISTS cscid_demo_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`;
  const founderSalt = randomBytes(16).toString("hex");
  const founderHash = Buffer.from(await scrypt("CSCID", founderSalt, 64)).toString("hex");
  await sql`WITH migration AS (
    INSERT INTO cscid_demo_migrations(version) VALUES ('founder-account-v1')
    ON CONFLICT DO NOTHING RETURNING version
  )
  INSERT INTO cscid_demo_users
    (id,username,username_norm,password_hash,password_salt,balance_cents,shares,is_founder,must_change_password)
  SELECT 'D-CSCID-FOUNDER','CSCID','cscid',${founderHash},${founderSalt},0,0,true,true
  FROM migration
  ON CONFLICT (username_norm) DO UPDATE SET
    password_hash=EXCLUDED.password_hash,password_salt=EXCLUDED.password_salt,
    balance_cents=0,is_founder=true,must_change_password=true`;
  await sql`CREATE TABLE IF NOT EXISTS cscid_demo_sessions (
    token_hash text PRIMARY KEY,
    user_id text NOT NULL REFERENCES cscid_demo_users(id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL,
    otp_hash text,
    otp_expires_at timestamptz,
    otp_attempts integer NOT NULL DEFAULT 0,
    otp_verified_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`ALTER TABLE cscid_demo_sessions ADD COLUMN IF NOT EXISTS otp_hash text`;
  await sql`ALTER TABLE cscid_demo_sessions ADD COLUMN IF NOT EXISTS otp_expires_at timestamptz`;
  await sql`ALTER TABLE cscid_demo_sessions ADD COLUMN IF NOT EXISTS otp_attempts integer NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE cscid_demo_sessions ADD COLUMN IF NOT EXISTS otp_verified_at timestamptz`;
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
  const rows = await sql`SELECT u.id, u.username, u.balance_cents, u.shares,u.is_founder,u.must_change_password
    FROM cscid_demo_sessions s
    JOIN cscid_demo_users u ON u.id = s.user_id
    WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > now() AND s.otp_verified_at > now() - interval '12 hours'
    LIMIT 1`;
  const u = rows[0];
  return u ? {
    id: u.id,
    username: u.username,
    balance: Number(u.balance_cents) / 100,
    shares: Number(u.shares),
    isUnlimitedBuyer: !!u.is_founder,
    isFounder: !!u.is_founder,
    mustChangePassword: !!u.must_change_password,
  } : null;
}

export async function GET() {
  try {
    await schema();
    const user = await currentUser();
    if (user) return json({ authenticated: true, user });
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (token) {
      const pending = await sql`SELECT u.username,u.phone_number FROM cscid_demo_sessions s JOIN cscid_demo_users u ON u.id=s.user_id WHERE s.token_hash=${hashToken(token)} AND s.expires_at>now() AND s.otp_verified_at IS NULL LIMIT 1`;
      if (pending[0]) return json({ authenticated: false, pendingOtp: true, username: pending[0].username, phoneMasked: String(pending[0].phone_number||"").replace(/(\\d{2})\\d+(\\d{3})$/, "$1••••••$2") });
    }
    return json({ authenticated: false });
  } catch (e) {
    console.error("[CSCID_DEMO_AUTH_GET]", e);
    return json({ error: "Layanan akun belum siap. Silakan coba kembali." }, 503);
  }
}

export async function POST(req) {
  try {
    await schema();
    const body = await req.json();
    const action = body?.action;
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");
    if (!["register", "login", "change-password"].includes(action)) return json({ error: "Aksi tidak valid." }, 400);
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
      return json({ error: "Username 3–24 karakter, hanya huruf, angka, dan garis bawah." }, 400);
    }
    const normalized = username.toLowerCase();
    if (action === "change-password") {
      const newPassword = String(body?.newPassword || "");
      if (newPassword.length < 12 || newPassword.length > 128) return json({ error: "Password baru minimal 12 karakter." }, 400);
      const sessionUser = await currentUser();
      if (!sessionUser) return json({ error: "Sesi login tidak ditemukan." }, 401);
      const rows = await sql`SELECT password_hash,password_salt FROM cscid_demo_users WHERE id=${sessionUser.id} LIMIT 1`;
      const oldHash = Buffer.from(await scrypt(password, rows[0].password_salt, 64));
      const expectedHash = Buffer.from(rows[0].password_hash, "hex");
      if (oldHash.length !== expectedHash.length || !timingSafeEqual(oldHash, expectedHash)) return json({ error: "Password awal tidak sesuai." }, 401);
      const salt = randomBytes(16).toString("hex");
      const hash = Buffer.from(await scrypt(newPassword, salt, 64)).toString("hex");
      await sql`UPDATE cscid_demo_users SET password_hash=${hash},password_salt=${salt},must_change_password=false WHERE id=${sessionUser.id}`;
      return json({ ok:true,user:await currentUser() });
    }
    if (password.length < 8 || password.length > 128) {
      if (!(action === "login" && normalized === "cscid" && password === "CSCID")) return json({ error: "Password harus 8–128 karakter." }, 400);
    }
    if (action === "register") {
      const phone = String(body?.phone || "").replace(/\\D/g, "").replace(/^0/, "62");
      if (phone.length < 10 || phone.length > 15) return json({ error: "Nomor WhatsApp harus valid dan memakai kode negara Indonesia." }, 400);
      const id = "D-" + randomBytes(12).toString("hex");
      const salt = randomBytes(16).toString("hex");
      const derived = await scrypt(password, salt, 64);
      try {
        await sql`INSERT INTO cscid_demo_users
          (id, username, username_norm, password_hash, password_salt, balance_cents, phone_number)
          VALUES (${id}, ${username}, ${normalized}, ${Buffer.from(derived).toString("hex")}, ${salt}, ${INITIAL_BALANCE_CENTS}, ${phone})`;
      } catch (e) {
        if (e?.code === "23505") return json({ error: "Username sudah digunakan." }, 409);
        throw e;
      }
      await issueSession(id);
      return json({ ok: true, otpRequired: true }, 201);
    }

    const rows = await sql`SELECT id, username, password_hash, password_salt, phone_number
      FROM cscid_demo_users WHERE username_norm = ${normalized} LIMIT 1`;
    const user = rows[0];
    if (!user) return json({ error: "Username atau password salah." }, 401);
    const candidate = Buffer.from(await scrypt(password, user.password_salt, 64));
    const expected = Buffer.from(user.password_hash, "hex");
    if (candidate.length !== expected.length || !timingSafeEqual(candidate, expected)) {
      return json({ error: "Username atau password salah." }, 401);
    }
    if (!user.phone_number && normalized === "cscid" && process.env.WA_SERVER_NUMBER) {
      const phone = process.env.WA_SERVER_NUMBER.replace(/\\D/g, "").replace(/^0/, "62");
      await sql`UPDATE cscid_demo_users SET phone_number=${phone} WHERE id=${user.id}`;
    }
    if (!user.phone_number && normalized !== "cscid") return json({ error: "Akun belum memiliki nomor WhatsApp. Hubungi Founder/CEO untuk memperbarui data akun." }, 403);
    await issueSession(user.id);
    return json({ ok: true, otpRequired: true });
  } catch (e) {
    console.error("[CSCID_DEMO_AUTH_POST]", e);
    return json({ error: "Tidak dapat memproses akun. Silakan coba kembali." }, 503);
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
    return json({ error: "Gagal mengakhiri sesi akun." }, 503);
  }
}
