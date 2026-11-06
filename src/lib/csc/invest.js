// [CSC:INVEST] total stok investor. Memakai koneksi Neon yang sama dengan db.js (bukan @vercel/postgres).
import { sql } from "./db";

let _skema = false;
export async function ensureInvestSchema() {
  if (_skema) return;
  await sql`
    CREATE TABLE IF NOT EXISTS investasi (
      id         BIGSERIAL PRIMARY KEY,
      email      TEXT NOT NULL,
      nama       TEXT,
      ton        NUMERIC(14,3) NOT NULL CHECK (ton > 0),
      dibuat     TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  _skema = true;
}

export async function totalStockInvestor() {
  await ensureInvestSchema();
  const rows = await sql`
    SELECT COALESCE(SUM(ton), 0) AS total_ton,
           COUNT(DISTINCT lower(email)) AS jumlah_investor
    FROM investasi`;
  return {
    totalTon: Number(rows[0].total_ton) || 0,
    jumlahInvestor: Number(rows[0].jumlah_investor) || 0,
  };
}
// [/CSC:INVEST]
