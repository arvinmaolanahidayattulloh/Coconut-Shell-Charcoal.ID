// [CSC:UPDATE] pembaruan berkala: ambil candle baru, isi lubang, hitung CSC, simpan.
// Idempoten: aman dijalankan berulang atau tumpang tindih. Dipakai oleh
//   - scripts/update.mjs  (GitHub Actions, tiap 5 menit)
//   - /api/cron/update    (pemicu manual / cadangan, dilindungi CRON_SECRET)
import { ensureSchema, upsertRawBulk, upsertCscBulk, lastRawTime, getFxRecent, upsertFxOne } from "./db.js";
import { cscCalc, EUR_DIV, FORMULA_VERSION, INTERVALS } from "./formula.js";
import { fetchFx } from "./fx.js";

const HOSTS = ["https://data-api.binance.vision", "https://api.binance.com"];
const SYM = { gold: "PAXGUSDT", btc: "BTCUSDT", usd: "EURUSDT" };

// Panjang satu candle (detik). 1M tidak tetap, pakai perkiraan 31 hari.
const STEP = {
  "1m": 60, "5m": 300, "15m": 900, "30m": 1800, "1h": 3600, "4h": 14400,
  "12h": 43200, "1d": 86400, "3d": 259200, "1w": 604800, "1M": 31 * 86400,
};
const OVERLAP = 3; // ambil ulang 3 candle terakhir (candle yang masih berjalan ikut diperbarui)
const MAX_PAGES = 20; // maksimal 20.000 candle per interval per proses (mengejar lubang panjang)
const DAY = 86400;

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

// semua candle sejak startSec (UTC detik) sampai sekarang
async function klinesSince(symbol, iv, startSec, deadline) {
  const out = [];
  let from = Math.max(0, startSec) * 1000;
  for (let page = 0; page < MAX_PAGES; page++) {
    const rows = await getJson(`/api/v3/klines?symbol=${symbol}&interval=${iv}&limit=1000&startTime=${from}`);
    if (!rows.length) break;
    for (const r of rows) out.push({ t: Math.floor(r[0] / 1000), o: +r[1], h: +r[2], l: +r[3], c: +r[4] });
    if (rows.length < 1000) break;
    from = rows[rows.length - 1][0] + 1;
    if (Date.now() > deadline) break;
  }
  return out;
}

// kurs terakhir yang <= t (akhir pekan ikut kurs Jumat); sebelum kurs pertama pakai kurs pertama
export function makeRateAt(fx) {
  return (t) => {
    let lo = 0, hi = fx.length - 1, ans = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (fx[mid].t <= t) { ans = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return fx[ans];
  };
}

// Sama dengan buildCsc di scripts/backfill.mjs, tanpa batas awal t0 (jendela pendek):
// bar dilewati sampai ketiga komponen ada; komponen tanpa candle = candle datar di penutupan terakhir.
export function buildRows(g, b, f, rateAt) {
  const mg = new Map(g.map((x) => [x.t, x]));
  const mb = new Map(b.map((x) => [x.t, x]));
  const mf = new Map(f.map((x) => [x.t, x]));
  const times = [...new Set([...mg.keys(), ...mb.keys(), ...mf.keys()])].sort((x, y) => x - y);
  const flat = (x) => (x ? { t: x.t, o: x.c, h: x.c, l: x.c, c: x.c } : x);
  const out = [];
  let lg, lb, lf;
  for (const t of times) {
    lg = mg.get(t) || flat(lg); lb = mb.get(t) || flat(lb); lf = mf.get(t) || flat(lf);
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

// Kurs harian: ambil sekali per hari (UTC). Google Finance dulu, cadangan Frankfurter (lihat fx.js).
async function refreshFx(errors) {
  const today = Math.floor(Date.now() / 1000 / DAY) * DAY;
  try {
    const recent = await getFxRecent(today);
    if (recent.some((r) => r.t >= today)) return;
    const fx = await fetchFx();
    await upsertFxOne(today, fx.cny, fx.jpy, fx.source);
  } catch (e) {
    errors.push("kurs: " + e.message); // bila gagal, kurs terakhir di database tetap dipakai
  }
}

export async function runUpdate({ budgetMs = 45000 } = {}) {
  const t0 = Date.now();
  const deadline = t0 + budgetMs;
  const errors = [];
  const updated = {};
  const skipped = [];

  await ensureSchema();
  await refreshFx(errors);

  const nowSec = Math.floor(Date.now() / 1000);
  const fxRows = await getFxRecent(nowSec - 40 * DAY);
  if (!fxRows.length) {
    errors.push("tabel fx_rates kosong: jalankan backfill dulu");
    return { ok: false, updated, skipped, errors, ms: Date.now() - t0 };
  }
  const rateAt = makeRateAt(fxRows);

  for (const iv of INTERVALS) {
    if (Date.now() > deadline) { skipped.push(iv + " (waktu habis)"); continue; }
    try {
      const last = await Promise.all([SYM.gold, SYM.btc, SYM.usd].map((s) => lastRawTime(s, iv)));
      if (last.some((x) => x === null)) { skipped.push(iv + " (belum ada backfill)"); continue; }

      // mulai dari candle terakhir yang tersimpan dikurangi OVERLAP candle -> menutup lubang & memperbarui candle berjalan
      const start = Math.min(...last) - OVERLAP * STEP[iv];
      const [g, b, f] = await Promise.all(
        [SYM.gold, SYM.btc, SYM.usd].map((s) => klinesSince(s, iv, start, deadline))
      );
      if (!g.length || !b.length || !f.length) { skipped.push(iv + " (data kosong)"); continue; }

      await upsertRawBulk(SYM.gold, iv, g);
      await upsertRawBulk(SYM.btc, iv, b);
      await upsertRawBulk(SYM.usd, iv, f);

      const csc = buildRows(g, b, f, rateAt);
      await upsertCscBulk(iv, csc, FORMULA_VERSION);
      updated[iv] = { raw: [g.length, b.length, f.length], csc: csc.length };
    } catch (e) {
      errors.push(iv + ": " + e.message);
    }
  }

  return { ok: Object.keys(updated).length > 0, updated, skipped, errors, ms: Date.now() - t0 };
}
// [/CSC:UPDATE]
