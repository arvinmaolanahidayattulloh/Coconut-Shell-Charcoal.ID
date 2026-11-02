"use client";

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { createChart } from "lightweight-charts";
import styles from "./PriceChart.module.css";

const OZ = 31.1034768;
const GRAMS = 5;
const BTC_FACTOR = 0.01;

const YUAN_BASE = 5000;
const USD_BASE = 500;
const JPY_BASE = 50000;
const SAR_BASE = 5000;

const WIB = 7 * 3600;
const DAY = 86400;

// ─────────────────────────────────────────────────────────────
// INTERVAL: urut dari terkecil (Tick) → Detik → Menit → Jam → Hari → Minggu → Bulan → Tahun
// pmax = batas jumlah candle prediksi (agar interval besar tidak meramal terlalu jauh)
// ─────────────────────────────────────────────────────────────
const IV = {
  "t1":    { grp: "TICK",   type: "tick", count: 1,    label: "1 Tick" },
  "t10":   { grp: "TICK",   type: "tick", count: 10,   label: "10 Tick" },
  "t100":  { grp: "TICK",   type: "tick", count: 100,  label: "100 Tick" },
  "t1000": { grp: "TICK",   type: "tick", count: 1000, label: "1000 Tick" },
  "1s":    { grp: "DETIK",  type: "sec",  step: 1,     label: "1 Sec" },
  "5s":    { grp: "DETIK",  type: "sec",  step: 5,     label: "5 Sec" },
  "10s":   { grp: "DETIK",  type: "sec",  step: 10,    label: "10 Sec" },
  "15s":   { grp: "DETIK",  type: "sec",  step: 15,    label: "15 Sec" },
  "30s":   { grp: "DETIK",  type: "sec",  step: 30,    label: "30 Sec" },
  "1m":    { grp: "MENIT",  type: "min",  step: 60,    bin: "1m",  label: "1M" },
  "5m":    { grp: "MENIT",  type: "min",  step: 300,   bin: "5m",  label: "5M" },
  "15m":   { grp: "MENIT",  type: "min",  step: 900,   bin: "15m", label: "15M" },
  "30m":   { grp: "MENIT",  type: "min",  step: 1800,  bin: "30m", label: "30M" },
  "1h":    { grp: "JAM",    type: "min",  step: 3600,  bin: "1h",  label: "1H" },
  "4h":    { grp: "JAM",    type: "min",  step: 14400, bin: "4h",  label: "4H" },
  "12h":   { grp: "JAM",    type: "min",  step: 43200, bin: "12h", label: "12H" },
  "1d":    { grp: "HARI",   type: "min",  step: DAY,   bin: "1d",  label: "1D" },
  "3d":    { grp: "HARI",   type: "min",  step: 3 * DAY, bin: "3d", label: "3D", pmax: 40 },
  "1w":    { grp: "MINGGU", type: "min",  step: 7 * DAY, off: 4 * DAY, bin: "1w", label: "1W", pmax: 26 },
  "1mo":   { grp: "BULAN",  type: "cal",  unit: "month", bin: "1M", label: "1MO", pmax: 12 },
  "1y":    { grp: "TAHUN",  type: "cal",  unit: "year",  bin: "1M", label: "1Y",  pmax: 5 }
};

// Konfigurasi bucket untuk data dasar (yang diambil dari exchange)
const BASE = {
  "1m":  { type: "min", step: 60 },
  "5m":  { type: "min", step: 300 },
  "15m": { type: "min", step: 900 },
  "30m": { type: "min", step: 1800 },
  "1h":  { type: "min", step: 3600 },
  "4h":  { type: "min", step: 14400 },
  "12h": { type: "min", step: 43200 },
  "1d":  { type: "min", step: DAY },
  "3d":  { type: "min", step: 3 * DAY },
  "1w":  { type: "min", step: 7 * DAY, off: 4 * DAY },
  "1M":  { type: "cal", unit: "month" }
};

const BS_STEP = { "1m": 60, "5m": 300, "15m": 900, "30m": 1800, "1h": 3600, "4h": 14400, "12h": 43200, "1d": DAY, "3d": 3 * DAY };

const HOSTS = ["https://data-api.binance.vision", "https://api.binance.com"];

const CURRENCIES = [
  { code: "IDR", symbol: "Rp" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "JPY", symbol: "¥" },
  { code: "SGD", symbol: "S$" },
  { code: "MYR", symbol: "RM" },
  { code: "AUD", symbol: "A$" },
  { code: "CNY", symbol: "¥" },
  { code: "SAR", symbol: "SAR" }
];

function fmt(num, dec) {
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(num);
}

function isXauMarketOpen() {
  const now = new Date();
  const day = now.getUTCDay();
  const hour = now.getUTCHours();
  if (day === 6 || day === 0 || (day === 5 && hour >= 22)) return false;
  return true;
}

async function getJson(path, attempt = 0) {
  try {
    const r = await fetch(HOSTS[attempt] + path);
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } catch (e) {
    if (attempt + 1 < HOSTS.length) return getJson(path, attempt + 1);
    throw e;
  }
}

function uniqSorted(list) {
  const seen = {};
  const out = [];
  list.forEach(c => {
    if (!seen[c.time]) { seen[c.time] = 1; out.push(c); }
  });
  return out.sort((a, b) => a.time - b.time);
}

const binOf = (ivKey) => IV[ivKey].bin || "1m";

// ─────────────────────────────────────────────────────────────
// BUCKET WAKTU (tanpa animasi range → tidak ada efek "pusing")
// ─────────────────────────────────────────────────────────────
function bucketOf(t, cfg) {
  const u = t - WIB;
  if (cfg.type === "cal") {
    const d = new Date(u * 1000);
    if (cfg.unit === "month") return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) / 1000 + WIB;
    return Date.UTC(d.getUTCFullYear(), 0, 1) / 1000 + WIB;
  }
  const off = cfg.off || 0;
  return Math.floor((u - off) / cfg.step) * cfg.step + off + WIB;
}

function nextTime(t, cfg, tickStep) {
  if (cfg.type === "cal") {
    const d = new Date((t - WIB) * 1000);
    if (cfg.unit === "month") return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) / 1000 + WIB;
    return Date.UTC(d.getUTCFullYear() + 1, 0, 1) / 1000 + WIB;
  }
  if (cfg.type === "tick") return t + tickStep;
  return t + cfg.step;
}

function medianStep(cs) {
  const diffs = [];
  for (let i = Math.max(1, cs.length - 20); i < cs.length; i++) diffs.push(cs[i].time - cs[i - 1].time);
  if (!diffs.length) return 1;
  diffs.sort((a, b) => a - b);
  return Math.max(1, diffs[Math.floor(diffs.length / 2)]);
}

function aggregate(rows, cfg) {
  if (!rows.length) return [];
  if (cfg.type === "tick") {
    const out = [];
    const n = cfg.count;
    for (let i = 0; i < rows.length; i += n) {
      const end = Math.min(i + n, rows.length);
      let hi = -Infinity, lo = Infinity;
      for (let j = i; j < end; j++) {
        if (rows[j].high > hi) hi = rows[j].high;
        if (rows[j].low < lo) lo = rows[j].low;
      }
      out.push({ time: rows[i].time, open: rows[i].open, high: hi, low: lo, close: rows[end - 1].close });
    }
    return out;
  }
  const out = [];
  let cur = null;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const b = bucketOf(r.time, cfg);
    if (cur && cur.time === b) {
      if (r.high > cur.high) cur.high = r.high;
      if (r.low < cur.low) cur.low = r.low;
      cur.close = r.close;
    } else {
      cur = { time: b, open: r.open, high: r.high, low: r.low, close: r.close };
      out.push(cur);
    }
  }
  return out;
}

// Di bawah 1 menit: candle disambung ke close sebelumnya dan diberi body minimum
// supaya tidak jadi garis tipis. Close tetap = harga terbaru.
const MIN_BODY_PCT = 0.00006;
function fixThin(cs, cfg) {
  if ((cfg.type !== "tick" && cfg.type !== "sec") || cs.length < 2) return cs;
  let prevDir = 1;
  for (let i = 1; i < cs.length; i++) {
    const k = cs[i];
    k.open = cs[i - 1].close;
    const minBody = Math.abs(k.close) * MIN_BODY_PCT;
    let d = k.close - k.open;
    if (Math.abs(d) < minBody) {
      const dir = d > 0 ? 1 : d < 0 ? -1 : prevDir;
      k.open = k.close - dir * minBody;
      d = k.close - k.open;
    }
    prevDir = d >= 0 ? 1 : -1;
    const hiB = Math.max(k.open, k.close), loB = Math.min(k.open, k.close);
    if (k.high < hiB) k.high = hiB;
    if (k.low > loB) k.low = loB;
  }
  return cs;
}

// Sumber data: untuk Tick/Detik gunakan sampel live per-detik, selain itu candle dasar
function srcOf(d, cfg) {
  if ((cfg.type === "tick" || cfg.type === "sec") && d.sec.length) {
    const t0 = d.sec[0].time;
    return d.raw.filter(r => r.time < t0).concat(d.sec);
  }
  return d.raw;
}

function toUsd(r, code, fb) {
  return r && r[code] ? 1 / r[code] : fb;
}

function modeMult(mode, r, rate) {
  switch (mode) {
    case "usd":  return USD_BASE * rate;
    case "yuan": return YUAN_BASE * toUsd(r, "CNY", 0.1501) * rate;
    case "jpy":  return JPY_BASE * toUsd(r, "JPY", 0.0067) * rate;
    case "sar":  return SAR_BASE * toUsd(r, "SAR", 0.2666) * rate;
    case "gold": return GRAMS / OZ * rate;
    case "btc":  return BTC_FACTOR * rate;
    default:     return 1;
  }
}

// Gabung 3 deret waktu (forward-fill) lalu hitung indeks CSC
function mergeCsc(f, g, b, calc) {
  const out = [];
  let i = 0, j = 0, k = 0;
  let lf = f[0], lg = g[0], lb = b[0];
  while (i < f.length || j < g.length || k < b.length) {
    const tf = i < f.length ? f[i].time : Infinity;
    const tg = j < g.length ? g[j].time : Infinity;
    const tb = k < b.length ? b[k].time : Infinity;
    const t = Math.min(tf, tg, tb);
    if (tf === t) lf = f[i++];
    if (tg === t) lg = g[j++];
    if (tb === t) lb = b[k++];
    out.push({
      time: t,
      open: calc(lf.open, lg.open, lb.open),
      high: calc(lf.high, lg.high, lb.high),
      low: calc(lf.low, lg.low, lb.low),
      close: calc(lf.close, lg.close, lb.close)
    });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// EA BACKTEST FORECAST
// Setiap candle prediksi DIJAMIN bullish atau bearish (tidak pernah doji / body nol).
// Deterministik per candle tertutup (seeded) → tidak berkedip tiap detik.
// ─────────────────────────────────────────────────────────────
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function emaOf(v, p) {
  const k = 2 / (p + 1);
  let e = v[0];
  for (let i = 1; i < v.length; i++) e = v[i] * k + e * (1 - k);
  return e;
}

function buildForecast(cs, cfg, count, seedKey) {
  if (cs.length < 3 || count < 1) return [];
  const lastBar = cs[cs.length - 1];
  const closed = cs.length > 25 ? cs.slice(0, -1) : cs;
  const win = closed.slice(-120);
  const closes = win.map(c => c.close);
  const m = Math.min(14, win.length);

  let sum = 0;
  for (let i = win.length - m; i < win.length; i++) sum += win[i].high - win[i].low;
  const atr = Math.max(sum / m, Math.abs(lastBar.close) * 0.00003);

  const fast = emaOf(closes, 8);
  const slow = emaOf(closes, 21);
  const lb = Math.min(5, closes.length - 1);
  const mom = (closes[closes.length - 1] - closes[closes.length - 1 - lb]) / (atr * Math.max(1, lb));
  const trend = (fast - slow) / atr;
  const bias = 0.12 * Math.tanh(trend) + 0.08 * Math.tanh(mom * 3);

  const seed = (hashStr(seedKey) ^ (closed[closed.length - 1].time | 0)) >>> 0;
  const rnd = rng(seed);
  const tickStep = medianStep(cs);

  // Keputusan EA untuk 1 candle berikutnya: stabil selama candle terakhir belum tertutup
  const ref = closes[closes.length - 1];
  const dev = Math.max(-3, Math.min(3, (ref - slow) / atr));
  const score = bias - 0.03 * dev;
  const r1 = rnd();
  const dir = Math.abs(score) > 0.005 ? (score > 0 ? 1 : -1) : (r1 < 0.5 ? 1 : -1);

  const open = lastBar.close;
  const body = Math.max(atr * (0.35 + 0.5 * rnd()), Math.abs(open) * 6e-5);
  const close = open + dir * body;
  const high = Math.max(open, close) + atr * 0.25 * rnd();
  const low = Math.min(open, close) - atr * 0.25 * rnd();
  return [{ time: nextTime(lastBar.time, cfg, tickStep), open, high, low, close }];
}

// ─────────────────────────────────────────────────────────────
function useSmooth(target, ms = 300) {
  const [v, setV] = useState(target);
  const curRef = useRef(target);
  useEffect(() => {
    if (!isFinite(target)) return;
    const from = curRef.current;
    if (!from || Math.abs(target - from) > Math.abs(from) * 0.2) {
      curRef.current = target;
      setV(target);
      return;
    }
    let raf;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      const val = from + (target - from) * e;
      curRef.current = val;
      setV(val);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function Smooth({ value, render, ms }) {
  const v = useSmooth(value, ms);
  return <>{render(v)}</>;
}

export default function PriceChart() {
  const [marketClosed, setMarketClosed] = useState(false);
  const [mode, setMode] = useState("csc");
  const [containerMode, setContainerMode] = useState("T");
  const [iv, setIv] = useState("5s");
  const [type, setType] = useState("candle");
  const [forecastOn, setForecastOn] = useState(true);
  const [isFull, setIsFull] = useState(false);
  const [fade, setFade] = useState(false);

  const [cur, setCur] = useState("IDR");
  const [rates, setRates] = useState(null);

  const [curDropOpen, setCurDropOpen] = useState(false);
  const [timeDropOpen, setTimeDropOpen] = useState(false);

  const [status, setStatus] = useState({ text: "MENGHUBUNGKAN...", isLive: false, error: null });
  const [legend, setLegend] = useState({ val: 0, chg: 0, pct: 0, availText: "", isUp: true, high: 0, low: 0 });

  const chartRef = useRef(null);
  const seriesRef = useRef({ candle: null, area: null, pred: null, predLine: null });
  const chartContainerRef = useRef(null);
  const cardRef = useRef(null);
  const nowLineRef = useRef(null);

  const lastRef = useRef(null);       // harga terakhir (pusat vertikal)
  const lenRef = useRef(0);           // jumlah candle nyata
  const barsRef = useRef(40);         // setengah lebar view (bar)
  const lastBarRef = useRef(null);    // {first, len, time} untuk update inkremental
  const loadedBinRef = useRef(null);  // bin data dasar yang sedang termuat

  const modeRef = useRef("csc");
  const containerModeRef = useRef("T");
  const rateRef = useRef(1);
  const ratesRef = useRef(null);
  const ivRef = useRef("5s");
  const typeRef = useRef("candle");
  const forecastRef = useRef(true);
  const decRef = useRef(0);

  const refreshRef = useRef(() => {});
  const fitRef = useRef(() => {});

  const dsRef = useRef({
    gold: { raw: [], sec: [] },
    btc:  { raw: [], sec: [] },
    usd:  { raw: [], sec: [] }
  });

  const tokenRef = useRef(0);
  const livePrices = useRef({ gold: null, btcBn: null, eurusdt: 1.08 });
  const wsRef = useRef({ binance: null });
  const accRef = useRef({ gold: null, btc: null, usd: null });

  const rate = rates ? (cur === "USD" ? 1 : rates[cur] || 1) : 1;
  const curObj = CURRENCIES.find(c => c.code === cur) || CURRENCIES[0];
  const dec = cur === "IDR" || cur === "JPY" ? 0 : 2;
  const baseBin = binOf(iv);

  // sinkronkan ref dengan state (dibaca oleh timer & callback)
  modeRef.current = mode;
  containerModeRef.current = containerMode;
  rateRef.current = rate;
  ratesRef.current = rates;
  ivRef.current = iv;
  typeRef.current = type;
  forecastRef.current = forecastOn;
  decRef.current = dec;

  useEffect(() => { setMarketClosed(!isXauMarketOpen()); }, []);

  useEffect(() => {
    fetch("/api/prices").then(r => r.json()).then(d => {
      if (d.rates) setRates(d.rates);
    }).catch(() => {});
  }, []);

  // Garis "SEKARANG" + label prediksi mengikuti posisi candle terakhir
  const placeNow = useCallback(() => {
    const el = nowLineRef.current;
    const chart = chartRef.current;
    if (!el || !chart) return;
    const n = lenRef.current;
    const x = n ? chart.timeScale().logicalToCoordinate(n - 1) : null;
    if (x == null || !forecastRef.current) { el.style.display = "none"; return; }
    el.style.display = "block";
    el.style.left = x + "px";
  }, []);

  // ───────── Buat chart (sekali) ─────────
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Harga terakhir selalu di tengah vertikal
    const centerProvider = (orig) => {
      const res = orig();
      const last = lastRef.current;
      if (!res || !res.priceRange || last == null) return res;
      const { minValue, maxValue } = res.priceRange;
      const span = Math.max(maxValue - last, last - minValue) * 1.5 || Math.abs(last) * 0.001;
      return { ...res, priceRange: { minValue: last - span, maxValue: last + span } };
    };

    const chart = createChart(chartContainerRef.current, {
      autoSize: true,
      layout: { background: { type: "solid", color: "transparent" }, textColor: "#787b86", fontFamily: "system-ui, sans-serif", fontSize: 11 },
      grid: { vertLines: { color: "#f0f3fa" }, horzLines: { color: "#f0f3fa" } },
      rightPriceScale: { borderColor: "#e0e3eb", scaleMargins: { top: 0.15, bottom: 0.15 } },
      leftPriceScale: { visible: false },
      timeScale: {
        borderColor: "#e0e3eb",
        timeVisible: true,
        secondsVisible: true,
        rightOffset: 0,
        fixLeftEdge: false,
        fixRightEdge: false,
        shiftVisibleRangeOnNewBar: false, // posisi view diatur manual agar harga tetap di tengah
        minBarSpacing: 0.5
      },
      crosshair: { mode: 0 },
      localization: { priceFormatter: p => fmt(p, decRef.current) }
    });

    const candle = chart.addCandlestickSeries({
      upColor: "#089981", downColor: "#f23645", borderVisible: false,
      wickUpColor: "#089981", wickDownColor: "#f23645",
      autoscaleInfoProvider: centerProvider
    });

    const area = chart.addAreaSeries({
      lineColor: "#2962ff", lineWidth: 2,
      topColor: "rgba(41, 98, 255, 0.28)", bottomColor: "rgba(41, 98, 255, 0.02)",
      visible: false,
      autoscaleInfoProvider: centerProvider
    });

    // Candle prediksi EA: transparan + border → jelas beda dari data asli
    const pred = chart.addCandlestickSeries({
      upColor: "rgba(8, 153, 129, 0.28)", downColor: "rgba(242, 54, 69, 0.28)",
      borderVisible: true, borderUpColor: "#089981", borderDownColor: "#f23645",
      wickUpColor: "rgba(8, 153, 129, 0.75)", wickDownColor: "rgba(242, 54, 69, 0.75)",
      priceLineVisible: false, lastValueVisible: false,
      autoscaleInfoProvider: centerProvider
    });

    const predLine = chart.addLineSeries({
      color: "rgba(41, 98, 255, 0.8)", lineWidth: 2, lineStyle: 2,
      priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
      visible: false,
      autoscaleInfoProvider: centerProvider
    });

    chart.timeScale().subscribeVisibleLogicalRangeChange(() => placeNow());

    chartRef.current = chart;
    seriesRef.current = { candle, area, pred, predLine };

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [placeNow]);

  const applyVis = useCallback(() => {
    const s = seriesRef.current;
    if (!s.candle) return;
    const isCandle = typeRef.current === "candle";
    const fc = forecastRef.current;
    s.candle.applyOptions({ visible: isCandle });
    s.area.applyOptions({ visible: !isCandle });
    s.pred.applyOptions({ visible: isCandle && fc });
    s.predLine.applyOptions({ visible: !isCandle && fc });
  }, []);

  // Pusatkan: candle terakhir + 1 candle prediksi di kanan, harga di tengah vertikal
  const fitView = useCallback(() => {
    const chart = chartRef.current;
    const n = lenRef.current;
    if (!chart || !n) return;
    const bars = barsRef.current;
    const left = Math.min(bars, Math.max(10, n));
    chart.priceScale("right").applyOptions({ autoScale: true });
    chart.timeScale().setVisibleLogicalRange({ from: n - 1 - left, to: n + 4 });
    placeNow();
  }, [placeNow]);

  // Hitung data tampilan (mode + mata uang + kontainer + interval)
  const compute = useCallback(() => {
    const cfg = IV[ivRef.current];
    const r = ratesRef.current;
    const rt = rateRef.current;
    const m40 = containerModeRef.current === "40ft" ? 25 : 1;
    const ds = dsRef.current;
    const md = modeRef.current;
    let rows;

    if (md === "csc") {
      const f = srcOf(ds.usd, cfg), g = srcOf(ds.gold, cfg), b = srcOf(ds.btc, cfg);
      if (!f.length || !g.length || !b.length) return [];
      const mUsd = USD_BASE * rt;
      const mYuan = YUAN_BASE * toUsd(r, "CNY", 0.1501) * rt;
      const mJpy = JPY_BASE * toUsd(r, "JPY", 0.0067) * rt;
      const mSar = SAR_BASE * toUsd(r, "SAR", 0.2666) * rt;
      const mGold = GRAMS / OZ * rt;
      const mBtc = BTC_FACTOR * rt;
      const calc = (fx, au, bt) => ((fx * mUsd + fx * mYuan + fx * mJpy + fx * mSar + au * mGold + bt * mBtc) / 6) * m40;
      rows = mergeCsc(f, g, b, calc);
    } else {
      const key = md === "gold" || md === "btc" ? md : "usd";
      const src = srcOf(ds[key], cfg);
      if (!src.length) return [];
      const m = modeMult(md, r, rt) * m40;
      rows = src.map(x => ({ time: x.time, open: x.open * m, high: x.high * m, low: x.low * m, close: x.close * m }));
    }
    return fixThin(aggregate(rows, cfg), cfg);
  }, []);

  // Render ke chart. full=true → setData penuh; full=false → update inkremental (halus, tanpa reset view)
  const refresh = useCallback((full) => {
    const s = seriesRef.current;
    const chart = chartRef.current;
    if (!chart || !s.candle) return;
    if (loadedBinRef.current !== binOf(ivRef.current)) return;

    const cs = compute();
    if (!cs.length) return;

    const cfg = IV[ivRef.current];
    const w = chartContainerRef.current ? chartContainerRef.current.clientWidth : 600;
    barsRef.current = Math.max(36, Math.min(160, Math.round(w / 9)));

    const n = cs.length;
    const last = cs[n - 1];
    const prev = lastBarRef.current;
    const incremental = !full && prev && cs[0].time === prev.first &&
      ((n === prev.len && last.time === prev.time) || (n === prev.len + 1 && cs[n - 2].time === prev.time));

    if (full) {
      const sub = cfg.type === "tick" || cfg.type === "sec" || (cfg.type === "min" && cfg.step < DAY);
      chart.applyOptions({ timeScale: { timeVisible: sub, secondsVisible: cfg.type === "tick" || cfg.type === "sec" } });
    }

    if (incremental) {
      if (n === prev.len + 1) {
        s.candle.update(cs[n - 2]);
        s.area.update({ time: cs[n - 2].time, value: cs[n - 2].close });
      }
      s.candle.update(last);
      s.area.update({ time: last.time, value: last.close });
    } else {
      s.candle.setData(cs);
      s.area.setData(cs.map(x => ({ time: x.time, value: x.close })));
    }

    lastRef.current = last.close;
    lenRef.current = n;
    lastBarRef.current = { first: cs[0].time, len: n, time: last.time };

    // Prediksi EA
    let fc = [];
    if (forecastRef.current) {
      const cnt = 1;
      fc = buildForecast(cs, cfg, cnt, modeRef.current + "|" + ivRef.current + "|" + containerModeRef.current);
    }
    s.pred.setData(fc);
    s.predLine.setData(fc.length ? [{ time: last.time, value: last.close }].concat(fc.map(x => ({ time: x.time, value: x.close }))) : []);

    // Candle baru muncul → geser view 1 bar supaya harga tetap di tengah (jika user tidak menggeser jauh)
    if (incremental && prev && n === prev.len + 1) {
      const r = chart.timeScale().getVisibleLogicalRange();
      if (r && prev.len - 1 >= r.from && prev.len - 1 <= r.to) {
        chart.timeScale().setVisibleLogicalRange({ from: r.from + 1, to: r.to + 1 });
      }
    }

    // Legend: statistik 120 candle terakhir
    const win = cs.slice(-120);
    let hi = -Infinity, lo = Infinity;
    win.forEach(c => { if (c.high > hi) hi = c.high; if (c.low < lo) lo = c.low; });
    const f0 = win[0].open;
    const diff = last.close - f0;
    setLegend(p => ({ ...p, val: last.close, chg: diff, pct: f0 ? (diff / f0) * 100 : 0, isUp: diff >= 0, high: hi, low: lo }));

    placeNow();
  }, [compute, placeNow]);

  refreshRef.current = refresh;
  fitRef.current = fitView;

  // ───────── Fullscreen ─────────
  const toggleFull = useCallback(async () => {
    const el = cardRef.current;
    if (!isFull) {
      setIsFull(true);
      try {
        if (el && el.requestFullscreen) await el.requestFullscreen();
        else if (el && el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      } catch (e) {}
    } else {
      setIsFull(false);
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
      } catch (e) {}
    }
  }, [isFull]);

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) setIsFull(false);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  // Resize / rotate / fullscreen → hitung ulang lebar view & pusatkan
  useEffect(() => {
    let t;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        refreshRef.current(true);
        fitRef.current();
      }, 150);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      refreshRef.current(true);
      fitRef.current();
    }, 250);
    return () => clearTimeout(t);
  }, [isFull]);

  // ───────── Ganti tipe chart (tanpa fade) ─────────
  useEffect(() => {
    applyVis();
  }, [type, forecastOn, applyVis]);

  // ───────── Ganti toggle prediksi ─────────
  useEffect(() => {
    refreshRef.current(true);
    placeNow();
  }, [forecastOn, placeNow]);

  // ───────── Ganti mode / mata uang / kontainer / interval ─────────
  // Tanpa animasi range: fade singkat → setData → langsung pusatkan → fade in.
  useEffect(() => {
    applyVis();
    if (!chartRef.current || loadedBinRef.current !== baseBin) return;
    setFade(true);
    const t = setTimeout(() => {
      refresh(true);
      fitView();
      setFade(false);
    }, 140);
    return () => clearTimeout(t);
  }, [mode, containerMode, rate, rates, iv, cur, baseBin, applyVis, refresh, fitView]);

  // ───────── Ambil riwayat sesuai interval dasar ─────────
  useEffect(() => {
    if (!rates) return;
    tokenRef.current += 1;
    const tok = tokenRef.current;
    const bin = baseBin;
    setFade(true);

    const sub = IV[ivRef.current].type === "tick" || IV[ivRef.current].type === "sec";
    const limit = sub ? 200 : 1000;

    const fetchBinance = async (symbol) => {
      const rows = await getJson(`/api/v3/klines?symbol=${symbol}&interval=${bin}&limit=${limit}`);
      return rows.map(r => ({ time: Math.floor(r[0] / 1000) + WIB, open: +r[1], high: +r[2], low: +r[3], close: +r[4] }));
    };

    const fetchBitstamp = async (step) => {
      const r = await fetch(`https://www.bitstamp.net/api/v2/ohlc/btcusd/?step=${step}&limit=${limit}`);
      const j = await r.json();
      const rows = (j?.data?.ohlc || []).map(o => ({ time: +o.timestamp + WIB, open: +o.open, high: +o.high, low: +o.low, close: +o.close }));
      if (!rows.length) throw new Error("empty");
      return rows;
    };

    const bsStep = BS_STEP[bin];
    const btcP = bsStep
      ? fetchBitstamp(bsStep).catch(() => fetchBinance("BTCUSDT"))
      : fetchBinance("BTCUSDT");

    Promise.all([fetchBinance("PAXGUSDT"), btcP, fetchBinance("EURUSDT")]).then(res => {
      if (tok !== tokenRef.current) return;
      const ds = dsRef.current;
      ds.gold.raw = uniqSorted(res[0]);
      ds.btc.raw = uniqSorted(res[1]);
      ds.usd.raw = uniqSorted(res[2]).map(x => ({
        time: x.time, open: x.open / 1.08, high: x.high / 1.08, low: x.low / 1.08, close: x.close / 1.08
      }));
      loadedBinRef.current = bin;
      lastBarRef.current = null;
      refresh(true);
      fitView();
      setFade(false);
    }).catch(() => {
      if (tok !== tokenRef.current) return;
      setFade(false);
      setStatus(s => ({ ...s, error: "Gagal memuat riwayat harga. Coba ganti interval atau muat ulang." }));
    });
  }, [rates, baseBin, refresh, fitView]);

  // ───────── Live: WebSocket + update tiap detik ─────────
  useEffect(() => {
    if (!rates) return;
    let disposed = false;

    const connectBinance = () => {
      if (disposed) return;
      try {
        const ws = new WebSocket("wss://stream.binance.com:9443/stream?streams=btcusdt@trade/paxgusdt@trade/eurusdt@trade");
        ws.onopen = () => setStatus({ text: "LIVE", isLive: true, error: null });
        ws.onmessage = (ev) => {
          const d = JSON.parse(ev.data).data;
          if (!d || !d.p) return;
          const px = parseFloat(d.p);
          const touch = (k, v) => {
            const a = accRef.current[k];
            if (!a) accRef.current[k] = { hi: v, lo: v };
            else { if (v > a.hi) a.hi = v; if (v < a.lo) a.lo = v; }
          };
          if (d.s === "BTCUSDT") { livePrices.current.btcBn = px; touch("btc", px); }
          if (d.s === "PAXGUSDT") { livePrices.current.gold = px; touch("gold", px); }
          if (d.s === "EURUSDT") { livePrices.current.eurusdt = px; touch("usd", px / 1.08); }
        };
        ws.onclose = () => { if (!disposed) setTimeout(connectBinance, 3000); };
        wsRef.current.binance = ws;
      } catch (e) {}
    };

    connectBinance();

    const timer = setInterval(() => {
      const pGold = livePrices.current.gold;
      const pBtc = livePrices.current.btcBn;
      const pUsd = (livePrices.current.eurusdt || 1.08) / 1.08;
      const bin = loadedBinRef.current;
      if (!pGold || !pBtc || !bin) return;

      const bcfg = BASE[bin];
      const nowT = Math.floor(Date.now() / 1000) + WIB;
      const nb = bucketOf(nowT, bcfg);

      [["gold", pGold], ["btc", pBtc], ["usd", pUsd]].forEach(([k, val]) => {
        const d = dsRef.current[k];
        const ac = accRef.current[k];
        accRef.current[k] = null;
        const hi = ac ? Math.max(ac.hi, val) : val;
        const lo = ac ? Math.min(ac.lo, val) : val;

        // sampel per-detik (Tick & Detik) dengan high/low dari tiap transaksi
        const sl = d.sec[d.sec.length - 1];
        if (sl && sl.time === nowT) {
          if (hi > sl.high) sl.high = hi;
          if (lo < sl.low) sl.low = lo;
          sl.close = val;
        } else {
          const o = sl ? sl.close : val;
          d.sec.push({ time: nowT, open: o, high: Math.max(hi, o), low: Math.min(lo, o), close: val });
          if (d.sec.length > 7200) d.sec.splice(0, 1200);
        }

        // gabung ke candle dasar
        const last = d.raw[d.raw.length - 1];
        if (last && bucketOf(last.time, bcfg) === nb) {
          if (hi > last.high) last.high = hi;
          if (lo < last.low) last.low = lo;
          last.close = val;
        } else {
          d.raw.push({ time: nb, open: val, high: hi, low: lo, close: val });
        }
      });

      refresh(false);
    }, 1000);

    return () => {
      disposed = true;
      clearInterval(timer);
      const ws = wsRef.current.binance;
      if (ws) { ws.onclose = null; ws.close(); }
    };
  }, [rates, refresh]);

  const ivKeys = Object.keys(IV);

  return (
    <section className={styles.priceSection} id="harga">
      <div ref={cardRef} className={`${styles.priceCard} ${isFull ? styles.cardFull : ""}`}>
        <div className={styles.priceHeader}>
          <span className={styles.eyebrow}>Coconut Shell Charcoal .ID (CSC Index)</span>

          <div className={styles.headerRight}>
            <div className={styles.liveIndicator}>
              <span className={`${styles.liveDot} ${status.isLive ? styles.liveDotActive : ""}`}></span>
              <span className={styles.liveText} style={{ color: status.isLive ? "#22c55e" : "#9ca3af" }}>
                {status.text}
              </span>
            </div>

            <div className={styles.currencySelector}>
              <button className={styles.currencyBtn} onClick={() => setCurDropOpen(!curDropOpen)} type="button">
                {cur}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: curDropOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease" }}><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              {curDropOpen && (
                <div className={styles.currencyDropdown}>
                  {CURRENCIES.map((c) => (
                    <button key={c.code} className={`${styles.currencyOption} ${cur === c.code ? styles.currencyActive : ""}`} onClick={() => { setCur(c.code); setCurDropOpen(false); }}>
                      <span className={styles.currencyCode}>{c.code}</span>
                      <span className={styles.currencySymbol}>{c.symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {status.error && <div style={{ marginBottom: 10, padding: "10px 12px", border: "1px solid #f23645", borderRadius: 4, color: "#f23645", fontSize: 13 }}>{status.error}</div>}

        <div className={`notranslate ${styles.priceMain}`} translate="no">
          <div className={styles.bigPrice}>
            <Smooth value={legend.val} render={v => curObj.symbol + fmt(v, dec)} />
            <span className={styles.bigPriceUnit}> / {containerMode === "40ft" ? "25 TON (40FT)" : "TON"}</span>
          </div>
          <div className={styles.priceStats}>
            <div className={styles.statBox}><span className={styles.statLabel}>PERUBAHAN</span><span className={`${styles.statVal} ${legend.isUp ? styles.up : styles.down}`}>{legend.isUp ? "\u25B2" : "\u25BC"} <Smooth value={legend.chg} render={v => (v >= 0 ? "+" : "") + fmt(v, dec)} /> (<Smooth value={legend.pct} render={v => (v >= 0 ? "+" : "") + fmt(v, 2) + "%"} />)</span></div>
            <div className={styles.statBox}><span className={styles.statLabel}>TERTINGGI</span><span className={styles.statVal}><Smooth value={legend.high} render={v => curObj.symbol + fmt(v, dec)} /></span></div>
            <div className={styles.statBox}><span className={styles.statLabel}>TERENDAH</span><span className={styles.statVal}><Smooth value={legend.low} render={v => curObj.symbol + fmt(v, dec)} /></span></div>
          </div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.toolbarGroup}>
            <div className={styles.modeSwitch}>
              <button type="button" className={`${styles.modeBtn} ${mode === "csc" ? styles.modeBtnActive : ""}`} onClick={() => setMode("csc")} style={{ fontWeight: "bold" }} title="6 Market Index (USD, Yuan, Yen, Riyal, XAU, BTC)">CSC</button>
              <button type="button" className={`${styles.modeBtn} ${mode === "usd" ? styles.modeBtnActive : ""}`} onClick={() => setMode("usd")} title="USD Mode">💵</button>
              <button type="button" className={`${styles.modeBtn} ${mode === "yuan" ? styles.modeBtnActive : ""}`} onClick={() => setMode("yuan")} title="Yuan Mode">中</button>
              <button type="button" className={`${styles.modeBtn} ${mode === "jpy" ? styles.modeBtnActive : ""}`} onClick={() => setMode("jpy")} title="Yen Mode">💴</button>
              <button type="button" className={`${styles.modeBtn} ${mode === "sar" ? styles.modeBtnActive : ""}`} onClick={() => setMode("sar")} title="Riyal Mode">﷼</button>
              <button type="button" className={`${styles.modeBtn} ${mode === "gold" ? styles.modeBtnActive : ""}`} onClick={() => setMode("gold")} title="Gold Mode">{marketClosed ? "🔒" : "🔐"}</button>
              <button type="button" className={`${styles.modeBtn} ${mode === "btc" ? styles.modeBtnActive : ""}`} onClick={() => setMode("btc")} title="Bitcoin Mode">⭐</button>
            </div>

            <div className={styles.modeSwitch} style={{ marginLeft: "8px" }}>
              <button type="button" className={`${styles.modeBtn} ${containerMode === "T" ? styles.modeBtnActive : ""}`} onClick={() => setContainerMode("T")} title="Harga Per Ton (1 Ton)">T</button>
              <button type="button" className={`${styles.modeBtn} ${containerMode === "40ft" ? styles.modeBtnActive : ""}`} onClick={() => setContainerMode("40ft")} title="Harga Total Kontainer 40ft (x25 Ton)">40ft</button>
            </div>

            <button className={`${styles.currencyBtn} ${styles.smallBtn} ${type === "candle" ? styles.currencyActive : ""}`} onClick={() => setType("candle")} type="button">CANDLE</button>
            <button className={`${styles.currencyBtn} ${styles.smallBtn} ${type === "area" ? styles.currencyActive : ""}`} onClick={() => setType("area")} type="button">AREA</button>
            <button
              className={`${styles.currencyBtn} ${styles.smallBtn} ${forecastOn ? styles.currencyActive : ""}`}
              onClick={() => setForecastOn(v => !v)}
              type="button"
              title="EA: prediksi 1 candle berikutnya (pasti naik atau turun)"
            >
              EA
            </button>
          </div>

          <div className={styles.toolbarGroup}>
            <div className={styles.currencySelector}>
              <button className={`${styles.currencyBtn} ${styles.smallBtn}`} onClick={() => setTimeDropOpen(!timeDropOpen)} type="button">
                {IV[iv]?.label}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: timeDropOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease" }}><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              {timeDropOpen && (
                <div className={styles.currencyDropdown} style={{ maxHeight: 340, overflowY: "auto" }}>
                  {ivKeys.map((v, i) => {
                    const showHead = i === 0 || IV[ivKeys[i - 1]].grp !== IV[v].grp;
                    return (
                      <Fragment key={v}>
                        {showHead && <div className={styles.dropLabel}>{IV[v].grp}</div>}
                        <button className={`${styles.currencyOption} ${iv === v ? styles.currencyActive : ""}`} onClick={() => { setIv(v); setTimeDropOpen(false); }}>
                          <span>{IV[v].label}</span>
                        </button>
                      </Fragment>
                    );
                  })}
                </div>
              )}
            </div>

            <button className={`${styles.currencyBtn} ${styles.smallBtn}`} onClick={() => fitView()} type="button" title="Pusatkan harga (atau klik dua kali pada chart)">
              PUSAT
            </button>

            <button type="button" className={styles.fullBtn} onClick={toggleFull} aria-label={isFull ? "Keluar layar penuh" : "Layar penuh"}>
              {isFull ? "TUTUP" : "FULL"}
            </button>
          </div>
        </div>

        <div className={`${styles.chartContainer} ${isFull ? styles.chartInFull : ""}`}>
          <div
            className={`${styles.chartFade} ${fade ? styles.chartFadeOut : ""}`}
            onDoubleClick={() => fitView()}
            style={{
              position: "relative", width: "100%",
              ...(isFull ? { flex: 1, minHeight: 0 } : { height: "480px" }),
              opacity: fade ? 0 : 1,
              transition: "opacity 0.14s ease"
            }}
          >
            <div ref={chartContainerRef} style={{ position: "absolute", inset: 0, zIndex: 2 }}></div>

            <div
              ref={nowLineRef}
              style={{ position: "absolute", top: 0, bottom: 26, width: 0, borderLeft: "1px dashed #b0b4c0", zIndex: 3, pointerEvents: "none", display: "none" }}
            >
              <span style={{ position: "absolute", top: 6, left: 8, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#2962ff", background: "rgba(41,98,255,0.08)", padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap" }}>
                EA ▸
              </span>
            </div>
          </div>
        </div>

        {forecastOn && (
          <div style={{ marginTop: 8, fontSize: 11, color: "#9ca3af", lineHeight: 1.4 }}>
            Candle transparan di kanan = prediksi EA untuk 1 candle berikutnya (naik/turun). Simulasi statistik, bukan jaminan atau nasihat investasi.
          </div>
        )}
      </div>
    </section>
  );
}
