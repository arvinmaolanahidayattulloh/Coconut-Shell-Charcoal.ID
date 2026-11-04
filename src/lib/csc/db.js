// [CSC:DB] koneksi Neon + skema + query
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// Waktu disimpan UTC detik (TANPA offset WIB). Browser menambah WIB seperti sekarang.
export async function ensureSchema() {
  await sql`CREATE TABLE IF NOT EXISTS raw_candles (
    symbol text NOT NULL, iv text NOT NULL, t bigint NOT NULL,
    o double precision, h double precision, l double precision, c double precision,
    PRIMARY KEY (symbol, iv, t)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS csc_candles (
    iv text NOT NULL, t bigint NOT NULL,
    o double precision, h double precision, l double precision, c double precision,
    formula_version int NOT NULL,
    PRIMARY KEY (iv, t)
  )`;
  // [PATCH:FX-TABLE] kurs per waktu, dipakai saat menghitung candle
  await sql`CREATE TABLE IF NOT EXISTS fx_rates (
    t bigint PRIMARY KEY, cny double precision, jpy double precision, source text
  )`;
  // [/PATCH:FX-TABLE]
}

// [CSC:DB-UPSERT] idempoten: aman dijalankan berulang
export async function upsertRaw(symbol, iv, rows) {
  for (const r of rows) {
    await sql`INSERT INTO raw_candles (symbol, iv, t, o, h, l, c)
      VALUES (${symbol}, ${iv}, ${r.t}, ${r.o}, ${r.h}, ${r.l}, ${r.c})
      ON CONFLICT (symbol, iv, t) DO UPDATE SET o=EXCLUDED.o, h=EXCLUDED.h, l=EXCLUDED.l, c=EXCLUDED.c`;
  }
}

export async function upsertCsc(iv, rows, version) {
  for (const r of rows) {
    await sql`INSERT INTO csc_candles (iv, t, o, h, l, c, formula_version)
      VALUES (${iv}, ${r.t}, ${r.o}, ${r.h}, ${r.l}, ${r.c}, ${version})
      ON CONFLICT (iv, t) DO UPDATE SET o=EXCLUDED.o, h=EXCLUDED.h, l=EXCLUDED.l, c=EXCLUDED.c, formula_version=EXCLUDED.formula_version`;
  }
}
// [/CSC:DB-UPSERT]

// [PATCH:DB-BULK] insert massal lewat unnest, idempoten
const CHUNK = 2000;

export async function upsertRawBulk(symbol, iv, rows) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    const p = rows.slice(i, i + CHUNK);
    await sql`INSERT INTO raw_candles (symbol, iv, t, o, h, l, c)
      SELECT ${symbol}::text, ${iv}::text, x.t, x.o, x.h, x.l, x.c
      FROM unnest(${p.map(r => r.t)}::bigint[], ${p.map(r => r.o)}::float8[], ${p.map(r => r.h)}::float8[], ${p.map(r => r.l)}::float8[], ${p.map(r => r.c)}::float8[]) AS x(t, o, h, l, c)
      ON CONFLICT (symbol, iv, t) DO UPDATE SET o=EXCLUDED.o, h=EXCLUDED.h, l=EXCLUDED.l, c=EXCLUDED.c`;
  }
}

export async function upsertCscBulk(iv, rows, version) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    const p = rows.slice(i, i + CHUNK);
    await sql`INSERT INTO csc_candles (iv, t, o, h, l, c, formula_version)
      SELECT ${iv}::text, x.t, x.o, x.h, x.l, x.c, ${version}::int
      FROM unnest(${p.map(r => r.t)}::bigint[], ${p.map(r => r.o)}::float8[], ${p.map(r => r.h)}::float8[], ${p.map(r => r.l)}::float8[], ${p.map(r => r.c)}::float8[]) AS x(t, o, h, l, c)
      ON CONFLICT (iv, t) DO UPDATE SET o=EXCLUDED.o, h=EXCLUDED.h, l=EXCLUDED.l, c=EXCLUDED.c, formula_version=EXCLUDED.formula_version`;
  }
}

export async function upsertFxBulk(rows) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    const p = rows.slice(i, i + CHUNK);
    await sql`INSERT INTO fx_rates (t, cny, jpy, source)
      SELECT x.t, x.cny, x.jpy, 'ecb'
      FROM unnest(${p.map(r => r.t)}::bigint[], ${p.map(r => r.cny)}::float8[], ${p.map(r => r.jpy)}::float8[]) AS x(t, cny, jpy)
      ON CONFLICT (t) DO UPDATE SET cny=EXCLUDED.cny, jpy=EXCLUDED.jpy, source=EXCLUDED.source`;
  }
}
// [/PATCH:DB-BULK]

export async function getRaw(symbol, iv) {
  return sql`SELECT t, o, h, l, c FROM raw_candles WHERE symbol=${symbol} AND iv=${iv} ORDER BY t`;
}

export async function lastRawTime(symbol, iv) {
  const r = await sql`SELECT max(t) AS t FROM raw_candles WHERE symbol=${symbol} AND iv=${iv}`;
  return r[0]?.t ? Number(r[0].t) : null;
}

// Untuk /api/csc: ambil `limit` candle terbaru sebelum `before` (UTC detik)
export async function getCsc(iv, limit = 1000, before = null) {
  const b = before ?? 9999999999;
  const rows = await sql`SELECT t, o, h, l, c FROM csc_candles
    WHERE iv=${iv} AND t < ${b} ORDER BY t DESC LIMIT ${limit}`;
  return rows.reverse();
}
// [/CSC:DB]
