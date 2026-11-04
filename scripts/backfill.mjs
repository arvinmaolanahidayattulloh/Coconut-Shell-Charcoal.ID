// [CSC:BACKFILL] jalankan sekali: node --env-file=.env.local scripts/backfill.mjs
// Idempoten: aman diulang. Isi raw_candles, fx_rates, csc_candles.
import { ensureSchema, upsertRawBulk, upsertCscBulk, upsertFxBulk } from "../src/lib/csc/db.js";
import { cscCalc, EUR_DIV, FORMULA_VERSION } from "../src/lib/csc/formula.js";

const HOSTS = ["https://data-api.binance.vision", "https://api.binance.com"];
const SYM = { gold: "PAXGUSDT", btc: "BTCUSDT", usd: "EURUSDT" };
const FX_FROM = "2017-08-01"; // kurs harian dari Frankfurter (ECB), ada sejak 1999

// [CSC:BACKFILL-PLAN] berapa hari ke belakang per interval (0 = seluruh histori)
const PLAN = {
  "1M": 0, "1w": 0, "3d": 0, "1d": 0, "12h": 0, "4h": 0, "1h": 0,
  "30m": 180, "15m": 90, "5m": 30, "1m": 7,
};
// [/CSC:BACKFILL-PLAN]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(path) {
  let last;
  for (const h of HOSTS) {
    try {
      const r = await fetch(h + path);
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } catch (e) { last = e; }
  }
  throw last;
}

// [CSC:BACKFILL-KLINES] mundur dari sekarang, 1000 candle per request
async function klines(symbol, iv, days) {
  const sinceMs = days ? Date.now() - days * 86400000 : 0;
  let end = Date.now();
  const out = [];
  while (true) {
    const rows = await getJson(`/api/v3/klines?symbol=${symbol}&interval=${iv}&limit=1000&endTime=${end}`);
    if (!rows.length) break;
    for (const r of rows) out.push({ t: Math.floor(r[0] / 1000), o: +r[1], h: +r[2], l: +r[3], c: +r[4] });
    end = rows[0][0] - 1;
    if (rows.length < 1000 || (sinceMs && rows[0][0] <= sinceMs)) break;
    await sleep(250);
  }
  out.sort((a, b) => a.t - b.t);
  return out.filter((x) => x.t * 1000 >= sinceMs);
}
// [/CSC:BACKFILL-KLINES]

// [CSC:BACKFILL-FX] kurs harian USD per 1 CNY / JPY, per tahun
async function fxDaily() {
  const rows = [];
  const now = new Date();
  const y0 = Number(FX_FROM.slice(0, 4));
  for (let y = y0; y <= now.getUTCFullYear(); y++) {
    const a = y === y0 ? FX_FROM : `${y}-01-01`;
    const b = y === now.getUTCFullYear() ? now.toISOString().slice(0, 10) : `${y}-12-31`;
    const r = await fetch(`https://api.frankfurter.dev/v1/${a}..${b}?base=USD&symbols=CNY,JPY`);
    if (!r.ok) throw new Error("frankfurter " + r.status);
    const j = await r.json();
    for (const [d, v] of Object.entries(j.rates || {})) {
      if (!v.CNY || !v.JPY) continue;
      rows.push({ t: Date.parse(d + "T00:00:00Z") / 1000, cny: 1 / v.CNY, jpy: 1 / v.JPY });
    }
    await sleep(300);
  }
  rows.sort((a, b) => a.t - b.t);
  return rows;
}

// cari kurs terakhir yang <= waktu candle (akhir pekan ikut kurs Jumat)
function makeRateAt(fx) {
  return (t) => {
    let lo = 0, hi = fx.length - 1, ans = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (fx[mid].t <= t) { ans = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return fx[ans];
  };
}
// [/CSC:BACKFILL-FX]

// [CSC:BACKFILL-MERGE] indeks dimulai hanya saat ketiga komponen sudah ada
function buildCsc(g, b, f, rateAt) {
  if (!g.length || !b.length || !f.length) return [];
  const t0 = Math.max(g[0].t, b[0].t, f[0].t);
  const mg = new Map(g.map((x) => [x.t, x]));
  const mb = new Map(b.map((x) => [x.t, x]));
  const mf = new Map(f.map((x) => [x.t, x]));
  const times = [...new Set([...mg.keys(), ...mb.keys(), ...mf.keys()])].filter((t) => t >= t0).sort((x, y) => x - y);
  const out = [];
  let lg, lb, lf;
  for (const t of times) {
    lg = mg.get(t) || lg; lb = mb.get(t) || lb; lf = mf.get(t) || lf;
    if (!lg || !lb || !lf) continue;
    const rt = rateAt(t);
    const calc = (fx, au, bt) => cscCalc(fx / EUR_DIV, au, bt, rt);
    out.push({
      t,
      o: calc(lf.o, lg.o, lb.o),
      h: calc(lf.h, lg.h, lb.h),
      l: calc(lf.l, lg.l, lb.l),
      c: calc(lf.c, lg.c, lb.c),
    });
  }
  return out;
}
// [/CSC:BACKFILL-MERGE]

async function main() {
  await ensureSchema();

  console.log("Kurs harian (Frankfurter)...");
  const fx = await fxDaily();
  await upsertFxBulk(fx);
  const rateAt = makeRateAt(fx);
  console.log(`  ${fx.length} hari`);

  for (const [iv, days] of Object.entries(PLAN)) {
    console.log(`[${iv}] mengunduh...`);
    const g = await klines(SYM.gold, iv, days);
    const b = await klines(SYM.btc, iv, days);
    const f = await klines(SYM.usd, iv, days);

    await upsertRawBulk(SYM.gold, iv, g);
    await upsertRawBulk(SYM.btc, iv, b);
    await upsertRawBulk(SYM.usd, iv, f);

    const csc = buildCsc(g, b, f, rateAt);
    await upsertCscBulk(iv, csc, FORMULA_VERSION);
    console.log(`[${iv}] raw ${g.length}/${b.length}/${f.length} -> CSC ${csc.length}`);
  }
  console.log("Selesai.");
}

main().catch((e) => { console.error(e); process.exit(1); });
// [/CSC:BACKFILL]
