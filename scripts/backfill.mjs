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
