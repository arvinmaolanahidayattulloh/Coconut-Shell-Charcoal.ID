"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

// SHA-256 dari password "coconut shell charcoal"
const PW_HASH = "113066f60804d8bc313ae94d90e236ca5e672ce32398546529e509cd5a4b2f9a";

async function sha256(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(x => x.toString(16).padStart(2, "0")).join("");
}

// URUTAN INTERVAL (Infinite paling atas)
const IV = {
  "inf":   { type: "inf",  label: "∞", bin: "1m" },
  "t1":    { type: "tick", count: 1,    label: "1 Tick" },
  "t10":   { type: "tick", count: 10,   label: "10 Tick" },
  "t100":  { type: "tick", count: 100,  label: "100 Tick" },
  "t1000": { type: "tick", count: 1000, label: "1000 Tick" },
  "1s":    { type: "sec",  step: 1,     label: "1 Sec" },
  "5s":    { type: "sec",  step: 5,     label: "5 Sec" },
  "10s":   { type: "sec",  step: 10,    label: "10 Sec" },
  "15s":   { type: "sec",  step: 15,    label: "15 Sec" },
  "30s":   { type: "sec",  step: 30,    label: "30 Sec" },
  "1m":    { type: "min",  step: 60,    bin: "1m",  label: "1M" },
  "5m":    { type: "min",  step: 300,   bin: "5m",  label: "5M" },
  "15m":   { type: "min",  step: 900,   bin: "15m", label: "15M" },
  "30m":   { type: "min",  step: 1800,  bin: "30m", label: "30M" },
  "1h":    { type: "min",  step: 3600,  bin: "1h",  label: "1H" },
  "4h":    { type: "min",  step: 14400, bin: "4h",  label: "4H" },
  "12h":   { type: "min",  step: 43200, bin: "12h", label: "12H" },
  "1d":    { type: "min",  step: DAY,   bin: "1d",  label: "1D" },
  "3d":    { type: "min",  step: 3 * DAY, bin: "3d", label: "3D" },
  "1w":    { type: "min",  step: 7 * DAY, off: 4 * DAY, bin: "1w", label: "1W" },
  "1mo":   { type: "cal",  unit: "month", bin: "1M", label: "1MO" },
  "1y":    { type: "cal",  unit: "year",  bin: "1M", label: "1Y" },
  "10y":   { type: "cal",  unit: "year",  step: 10, bin: "1M", label: "10Y" }
};

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

const BS_STEP = { "1m": 60, "5m": 300, "15m": 900, "30m": 1800, "1h": 3600, "4h": 14400, "12h": 43200, "1d": 86400, "3d": 259200 };
const HOSTS = ["https://data-api.binance.vision", "https://api.binance.com"];
const CURRENCIES = [
  { code: "IDR", symbol: "Rp" }, { code: "USD", symbol: "$" }, { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" }, { code: "JPY", symbol: "¥" }, { code: "SGD", symbol: "S$" },
  { code: "MYR", symbol: "RM" }, { code: "AUD", symbol: "A$" }, { code: "CNY", symbol: "¥" },
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

const binOf = (ivKey) => IV[ivKey].bin || "1m";

function bucketOf(t, cfg) {
  const u = t - WIB;
  if (cfg.type === "cal") {
    const d = new Date(u * 1000);
    const y = Math.floor(d.getUTCFullYear() / (cfg.step || 1)) * (cfg.step || 1);
    if (cfg.unit === "month") return Date.UTC(y, d.getUTCMonth(), 1) / 1000 + WIB;
    return Date.UTC(y, 0, 1) / 1000 + WIB;
  }
  const off = cfg.off || 0;
  return Math.floor((u - off) / cfg.step) * cfg.step + off + WIB;
}

function aggregate(rows, cfg) {
  if (!rows.length) return [];
  if (cfg.type === "inf") return rows;
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

function srcOf(d, cfg) {
  if (cfg.type === "inf") return d.inf;
  if (cfg.type === "tick" || cfg.type === "sec") return d.sec;
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

// EA — PENCETAK HARGA DI BAWAH 1 MENIT
const EA_BODY = 0.00003;
const EA_MAXROWS = 7200;

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

function gauss(r) {
  return (r() + r() + r() + r() - 2) * 1.7320508;
}

function eaSigma(raw) {
  const n = Math.min(15, raw.length);
  if (!n) return 0;
  let sum = 0;
  for (let i = raw.length - n; i < raw.length; i++) sum += raw[i].high - raw[i].low;
  const last = raw[raw.length - 1].close;
  return Math.max((sum / n) * 0.05, Math.abs(last) * 0.00001);
}

function eaFromBar(bar, n, seed) {
  if (n < 1) return [];
  const r = rng(seed);
  const steps = n * 4;
  const mid = (bar.high + bar.low) / 2 || bar.close;
  let hi = bar.high, lo = bar.low;
  const minRange = Math.abs(mid) * 0.00012;
  if (hi - lo < minRange) {
    const pad = (minRange - (hi - lo)) / 2;
    hi += pad; lo -= pad;
  }
  const lowFirst = bar.close >= bar.open ? r() < 0.65 : r() < 0.35;
  const a = Math.max(1, Math.floor(steps * (0.15 + 0.3 * r())));
  const b = Math.min(steps - 1, a + Math.max(1, Math.floor(steps * (0.2 + 0.3 * r()))));
  const keys = [[0, bar.open], [a, lowFirst ? lo : hi], [b, lowFirst ? hi : lo], [steps, bar.close]];

  const path = new Array(steps + 1);
  for (let s = 0; s < keys.length - 1; s++) {
    const [i0, p0] = keys[s];
    const [i1, p1] = keys[s + 1];
    const L = Math.max(1, i1 - i0);
    const w = [0];
    for (let i = 1; i <= L; i++) w.push(w[i - 1] + gauss(r));
    const amp = (hi - lo) * 0.3 / Math.sqrt(L);
    for (let i = 0; i <= L; i++) {
      const base = p0 + (p1 - p0) * (i / L);
      const bridge = w[i] - (i / L) * w[L];
      path[i0 + i] = Math.min(hi, Math.max(lo, base + amp * bridge));
    }
  }
  path[0] = bar.open;
  path[steps] = bar.close;

  const mb = Math.abs(mid) * EA_BODY;
  for (let i = 1; i < n; i++) path[4 * i] += (i % 2 ? 1 : -1) * mb * 0.5;

  const out = [];
  for (let i = 0; i < n; i++) {
    let h = -Infinity, l = Infinity;
    for (let j = 0; j <= 4; j++) {
      const v = path[4 * i + j];
      if (v > h) h = v;
      if (v < l) l = v;
    }
    out.push({ time: bar.time + i, open: path[4 * i], high: h, low: l, close: path[4 * i + 4] });
  }
  return out;
}

function eaNext(open, target, sigma, r) {
  let p = open, h = open, l = open;
  for (let j = 0; j < 4; j++) {
    p += (target - p) * 0.075 + gauss(r) * sigma * 0.5;
    if (p > h) h = p;
    if (p < l) l = p;
  }
  const mb = Math.abs(open) * EA_BODY;
  if (Math.abs(p - open) < mb) {
    const dir = target !== open ? Math.sign(target - open) : (r() < 0.5 ? 1 : -1);
    p = open + dir * mb;
    if (p > h) h = p;
    if (p < l) l = p;
  }
  return { open, high: h, low: l, close: p };
}

function buildEaHistory(key, raw) {
  const rows = [];
  const nowT = Math.floor(Date.now() / 1000) + WIB;
  const bars = raw.slice(-121);
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    const forming = i === bars.length - 1 && nowT - b.time < 60;
    const n = forming ? Math.max(0, nowT - b.time) : 60;
    const part = eaFromBar(b, n, hashStr(key + b.time));
    for (let j = 0; j < part.length; j++) rows.push(part[j]);
  }
  return rows.length > EA_MAXROWS ? rows.slice(-EA_MAXROWS) : rows;
}

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

// [PATCH:CENTER-PRICE] autoscale: harga terakhir selalu di tengah, zoom vertikal tetap
const makeCenterProvider = (followRef, spanRatioRef, lastRef) => (orig) => {
  const res = orig();
  const last = lastRef.current;
  if (!followRef.current || !spanRatioRef.current || !last) return res;
  // x0.7 karena scaleMargins top/bottom 0.15 menyisakan 70% tinggi
  const half = (Math.abs(last) * spanRatioRef.current * 0.7) / 2;
  return { priceRange: { minValue: last - half, maxValue: last + half }, margins: res ? res.margins : undefined };
};
// [/PATCH:CENTER-PRICE]

export default function PriceChart() {
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");
  const [pwErr, setPwErr] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);

  const [marketClosed, setMarketClosed] = useState(false);
  const [mode, setMode] = useState("csc");
  const [containerMode, setContainerMode] = useState("T");
  const [iv, setIv] = useState("1m");
  const [type, setType] = useState("candle");
  const [isFull, setIsFull] = useState(false);
  const [fade, setFade] = useState(false);

  const [cur, setCur] = useState("IDR");
  const [rates, setRates] = useState(null);

  const [curDropOpen, setCurDropOpen] = useState(false);
  const [timeDropOpen, setTimeDropOpen] = useState(false);

  const [status, setStatus] = useState({ text: "MENGHUBUNGKAN...", isLive: false, error: null });
  const [legend, setLegend] = useState({ val: 0, chg: 0, pct: 0, availText: "", isUp: true, high: 0, low: 0 });

  const chartRef = useRef(null);
  const seriesRef = useRef({ candle: null, area: null });
  const chartContainerRef = useRef(null);
  const cardRef = useRef(null);

  const lastRef = useRef(null);
  const lenRef = useRef(0);
  const lastBarRef = useRef(null);
  const loadedBinRef = useRef(null);

  const modeRef = useRef("csc");
  const containerModeRef = useRef("T");
  const rateRef = useRef(1);
  const ratesRef = useRef(null);
  const ivRef = useRef("1m");
  const typeRef = useRef("candle");
  const decRef = useRef(0);

  const refreshRef = useRef(() => {});
  const fitRef = useRef(() => {});

  // [PATCH:CENTER-PRICE] state mode "ikuti harga di tengah"
  const followRef = useRef(false);      // aktif setelah tombol + ditekan
  const spanRatioRef = useRef(null);    // lebar zoom vertikal, relatif terhadap harga terakhir
  // [/PATCH:CENTER-PRICE]

  const dsRef = useRef({
    gold: { raw: [], sec: [], inf: [] },
    btc:  { raw: [], sec: [], inf: [] },
    usd:  { raw: [], sec: [], inf: [] }
  });

  const tokenRef = useRef(0);
  const livePrices = useRef({ gold: null, btcBn: null, eurusdt: 1.08 });
  const wsRef = useRef({ binance: null });
  const accRef = useRef({ gold: null, btc: null, usd: null });

  const rate = rates ? (cur === "USD" ? 1 : rates[cur] || 1) : 1;
  const curObj = CURRENCIES.find(c => c.code === cur) || CURRENCIES[0];
  const dec = cur === "IDR" || cur === "JPY" ? 0 : 2;
  const baseBin = binOf(iv);

  modeRef.current = mode;
  containerModeRef.current = containerMode;
  rateRef.current = rate;
  ratesRef.current = rates;
  ivRef.current = iv;
  typeRef.current = type;
  decRef.current = dec;

  // ───────── Password ─────────
  useEffect(() => {
    try { if (sessionStorage.getItem("csc_unlock") === "1") setUnlocked(true); } catch (e) {}
  }, []);

  const submitPw = async (e) => {
    e.preventDefault();
    try {
      const ok = (await sha256(pw.trim().toLowerCase())) === PW_HASH;
      if (ok) {
        try { sessionStorage.setItem("csc_unlock", "1"); } catch (err) {}
        setPwErr(false);
        setUnlocked(true);
        if (pendingMode && pendingMode !== "csc_unlock") {
          setMode(pendingMode);
        }
        setPendingMode(null);
        setPw("");
      } else {
        setPwErr(true);
      }
    } catch (err) {
      setPwErr(true);
    }
  };

  const pickMode = (m) => {
    if (m === "csc" || unlocked) { setMode(m); return; }
    setPwErr(false);
    setPw("");
    setPendingMode(m);
  };

  useEffect(() => { setMarketClosed(!isXauMarketOpen()); }, []);

  useEffect(() => {
    fetch("/api/prices").then(r => r.json()).then(d => {
      if (d.rates) setRates(d.rates);
    }).catch(() => {});
  }, []);

  // ───────── Buat Chart (Zoom Vertikal Murni Bebas) ─────────
  useEffect(() => {
    if (!chartContainerRef.current) return;

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
        fixRightEdge: true,       // Mentok kanan tanpa ruang kosong masa depan
        shiftVisibleRangeOnNewBar: true,
        minBarSpacing: 0.5
      },
      crosshair: { mode: 0 },
      localization: { priceFormatter: p => fmt(p, decRef.current) }
    });

    // [PATCH:CENTER-PRICE] provider autoscale dipasang di kedua series
    const provider = makeCenterProvider(followRef, spanRatioRef, lastRef);

    const candle = chart.addCandlestickSeries({
      upColor: "#089981", downColor: "#f23645", borderVisible: false,
      wickUpColor: "#089981", wickDownColor: "#f23645",
      autoscaleInfoProvider: provider
    });

    const area = chart.addAreaSeries({
      lineColor: "#2962ff", lineWidth: 2,
      topColor: "rgba(41, 98, 255, 0.28)", bottomColor: "rgba(41, 98, 255, 0.02)",
      visible: false,
      autoscaleInfoProvider: provider
    });
    // [/PATCH:CENTER-PRICE]

    chartRef.current = chart;
    seriesRef.current = { candle, area };
    lastBarRef.current = null;

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  const applyVis = useCallback(() => {
    const s = seriesRef.current;
    if (!s.candle) return;
    s.candle.applyOptions({ visible: typeRef.current === "candle" });
    s.area.applyOptions({ visible: typeRef.current === "area" });
  }, []);

  // Dipakai resize/fit: hanya menggeser chart ke ujung kanan tanpa mengubah zoom
  const scrollToLatest = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.timeScale().scrollToPosition(0, true);
  }, []);

  // [PATCH:CENTER-PRICE] tombol +: geser ke candle terbaru + harga di tengah, zoom tidak berubah
  const centerOnPrice = useCallback(() => {
    const chart = chartRef.current;
    const s = typeRef.current === "area" ? seriesRef.current.area : seriesRef.current.candle;
    if (!chart || !s) return;
    const h = chartContainerRef.current ? chartContainerRef.current.clientHeight : 0;
    const p0 = s.coordinateToPrice(0);
    const p1 = s.coordinateToPrice(h);
    const last = lastRef.current;
    if (p0 != null && p1 != null && last) {
      spanRatioRef.current = Math.abs(p0 - p1) / Math.abs(last);
      followRef.current = true;
    }
    chart.priceScale("right").applyOptions({ autoScale: true });
    // paksa hitung ulang autoscale
    seriesRef.current.candle.applyOptions({});
    seriesRef.current.area.applyOptions({});
    chart.timeScale().scrollToPosition(0, true);
  }, []);

  // reset mode ikuti saat interval berganti (rentang candle berubah)
  useEffect(() => {
    followRef.current = false;
    if (chartRef.current) chartRef.current.priceScale("right").applyOptions({ autoScale: true });
  }, [iv]);
  // [/PATCH:CENTER-PRICE]

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
    return aggregate(rows, cfg);
  }, []);

  const refresh = useCallback((full) => {
    const s = seriesRef.current;
    const chart = chartRef.current;
    if (!chart || !s.candle) return;
    if (loadedBinRef.current !== binOf(ivRef.current) && ivRef.current !== "inf") return;

    const cs = compute();
    if (!cs.length) return;

    const cfg = IV[ivRef.current];
    const n = cs.length;
    const last = cs[n - 1];
    const prev = lastBarRef.current;

    const incremental = !full && prev && cs[0].time === prev.first &&
      ((n === prev.len && last.time === prev.time) || (n === prev.len + 1 && cs[n - 2].time === prev.time));

    if (full) {
      const sub = cfg.type === "inf" || cfg.type === "tick" || cfg.type === "sec" || (cfg.type === "min" && cfg.step < DAY);
      chart.applyOptions({ timeScale: { timeVisible: sub, secondsVisible: cfg.type === "inf" || cfg.type === "tick" || cfg.type === "sec" } });
    }

    // [PATCH:CENTER-PRICE] lastRef diperbarui SEBELUM update series agar provider memakai harga terbaru
    lastRef.current = last.close;
    // [/PATCH:CENTER-PRICE]

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

    lenRef.current = n;
    lastBarRef.current = { first: cs[0].time, len: n, time: last.time };

    const win = cs.slice(-120);
    let hi = -Infinity, lo = Infinity;
    win.forEach(c => { if (c.high > hi) hi = c.high; if (c.low < lo) lo = c.low; });
    const f0 = win[0].open;
    const diff = last.close - f0;
    setLegend(p => ({ ...p, val: last.close, chg: diff, pct: f0 ? (diff / f0) * 100 : 0, isUp: diff >= 0, high: hi, low: lo }));
  }, [compute]);

  refreshRef.current = refresh;
  fitRef.current = scrollToLatest;

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

  useEffect(() => {
    applyVis();
  }, [type, applyVis]);

  useEffect(() => {
    applyVis();
    if (!chartRef.current || (loadedBinRef.current !== baseBin && iv !== "inf")) return;
    setFade(true);
    const t = setTimeout(() => {
      refresh(true);
      fitRef.current();
      setFade(false);
    }, 140);
    return () => clearTimeout(t);
  }, [mode, containerMode, rate, rates, iv, cur, baseBin, applyVis, refresh, fitRef]);

  // ───────── Ambil Riwayat Sampai Akar ─────────
  useEffect(() => {
    if (!rates) return;
    tokenRef.current += 1;
    const tok = tokenRef.current;
    const reqBin = baseBin;

    setFade(true);

    const sub = IV[ivRef.current].type === "tick" || IV[ivRef.current].type === "sec" || IV[ivRef.current].type === "inf";
    const baseLimit = sub ? 200 : 1000;

    const fetchBinanceChunk = async (symbol, bin, limit, endTime) => {
      let url = `/api/v3/klines?symbol=${symbol}&interval=${bin}&limit=${limit}`;
      if (endTime) url += `&endTime=${endTime}`;
      const res = await getJson(url);
      if (!res || !res.length) return { data: [], end: null };
      const data = res.map(r => ({ time: Math.floor(r[0] / 1000) + WIB, open: +r[1], high: +r[2], low: +r[3], close: +r[4] }));
      return { data, end: res[0][0] - 1 };
    };

    const fetchBtcChunk = async (bin, limit, endTime) => {
      const step = BS_STEP[bin];
      if (!step) return fetchBinanceChunk("BTCUSDT", bin, limit, endTime);
      let url = `https://www.bitstamp.net/api/v2/ohlc/btcusd/?step=${step}&limit=${limit}`;
      if (endTime) url += `&end=${endTime}`;
      try {
        const r = await fetch(url);
        const j = await r.json();
        const batch = j?.data?.ohlc || [];
        if (!batch.length) return { data: [], end: null };
        const data = batch.map(o => ({ time: +o.timestamp + WIB, open: +o.open, high: +o.high, low: +o.low, close: +o.close }));
        return { data, end: Number(batch[0].timestamp) - 1 };
      } catch (e) {
        return fetchBinanceChunk("BTCUSDT", bin, limit, endTime);
      }
    };

    const loadDataProgressive = async () => {
      try {
        const [resGold, resBtc, resUsd] = await Promise.all([
          fetchBinanceChunk("PAXGUSDT", reqBin, baseLimit),
          fetchBtcChunk(reqBin, baseLimit),
          fetchBinanceChunk("EURUSDT", reqBin, baseLimit)
        ]);

        if (tok !== tokenRef.current) return;

        const ds = dsRef.current;
        ds.gold.raw = resGold.data;
        ds.btc.raw = resBtc.data;
        ds.usd.raw = resUsd.data.map(x => ({ ...x, open: x.open / 1.08, high: x.high / 1.08, low: x.low / 1.08, close: x.close / 1.08 }));

        if (baseBin === "1m") {
          const nowT = Math.floor(Date.now() / 1000) + WIB;
          ["gold", "btc", "usd"].forEach(k => {
            const raw = ds[k].raw;
            ds[k].sec = buildEaHistory(k, raw);

            if (raw.length > 0) {
              const lastClose = raw[raw.length - 1].close;
              const sigma = eaSigma(raw) || (lastClose * 0.0001);
              const infArr = [];
              let p = lastClose;
              const r = rng(hashStr(k + "inf"));
              for (let i = -120; i <= 0; i++) {
                const open = p;
                p += gauss(r) * sigma * 0.4;
                const h = Math.max(open, p) + Math.abs(gauss(r) * sigma * 0.2);
                const l = Math.min(open, p) - Math.abs(gauss(r) * sigma * 0.2);
                infArr.push({ time: nowT + i, open, high: h, low: l, close: p });
              }
              ds[k].inf = infArr;
            }
          });
        }

        loadedBinRef.current = baseBin;
        lastBarRef.current = null;
        refresh(true);
        fitRef.current();
        setFade(false);

        let endGold = resGold.end, endBtc = resBtc.end, endUsd = resUsd.end;
        const batchLimit = 1000;

        while (endGold || endBtc || endUsd) {
          if (tok !== tokenRef.current) return;

          const [nextGold, nextBtc, nextUsd] = await Promise.all([
            endGold ? fetchBinanceChunk("PAXGUSDT", reqBin, batchLimit, endGold) : { data: [], end: null },
            endBtc ? fetchBtcChunk(reqBin, batchLimit, endBtc) : { data: [], end: null },
            endUsd ? fetchBinanceChunk("EURUSDT", reqBin, batchLimit, endUsd) : { data: [], end: null }
          ]);

          if (tok !== tokenRef.current) return;
          if (!nextGold.data.length && !nextBtc.data.length && !nextUsd.data.length) break;

          ds.gold.raw = nextGold.data.concat(ds.gold.raw);
          ds.btc.raw = nextBtc.data.concat(ds.btc.raw);
          const usdMapped = nextUsd.data.map(x => ({ ...x, open: x.open / 1.08, high: x.high / 1.08, low: x.low / 1.08, close: x.close / 1.08 }));
          ds.usd.raw = usdMapped.concat(ds.usd.raw);

          const timeScale = chartRef.current?.timeScale();
          const oldRange = timeScale?.getVisibleLogicalRange();
          const oldLen = lenRef.current;
          const isAtRightEdge = oldRange && (oldRange.to >= oldLen - 2);

          refresh(false);

          const addedBars = lenRef.current - oldLen;
          if (isAtRightEdge) {
            fitRef.current();
          } else if (addedBars > 0 && oldRange) {
            timeScale?.setVisibleLogicalRange({
              from: oldRange.from + addedBars,
              to: oldRange.to + addedBars
            });
          }

          endGold = nextGold.end; endBtc = nextBtc.end; endUsd = nextUsd.end;
          await new Promise(r => setTimeout(r, 600));
        }
      } catch (e) {
        if (tok !== tokenRef.current) return;
        setFade(false);
        setStatus(s => ({ ...s, error: "Gagal memuat riwayat harga. Coba ganti interval atau muat ulang." }));
      }
    };

    loadDataProgressive();
  }, [rates, baseBin, refresh]);

  // ───────── Live: WebSocket + Animasi Ular & Interval Sangat Halus LERP ─────────
  useEffect(() => {
    if (!rates) return;
    let disposed = false;
    let lastInfTime = Math.floor(Date.now() / 1000) + WIB;

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

        const last = d.raw[d.raw.length - 1];
        if (last && bucketOf(last.time, bcfg) === nb) {
          last.close = last.close + (val - last.close) * 0.25;
          if (hi > last.high) last.high = hi;
          if (lo < last.low) last.low = lo;
          if (last.close > last.high) last.high = last.close;
          if (last.close < last.low) last.low = last.close;
        } else {
          d.raw.push({ time: nb, open: val, high: hi, low: lo, close: val });
        }

        if (bin === "1m" && d.sec.length) {
          const sigma = eaSigma(d.raw);
          let t = Math.max(d.sec[d.sec.length - 1].time + 1, nowT - 119);
          for (; t <= nowT; t++) {
            const prevRow = d.sec[d.sec.length - 1];
            const row = eaNext(prevRow.close, val, sigma, rng(hashStr(k) ^ t));
            row.time = t;
            d.sec.push(row);
          }
          if (d.sec.length > EA_MAXROWS) d.sec.splice(0, 1200);
        }
      });

      if (ivRef.current !== "inf") refresh(false);
    }, 1000);

    const fastTimer = setInterval(() => {
      if (ivRef.current !== "inf") {
        const dGold = dsRef.current.gold;
        if (dGold.inf && dGold.inf.length) lastInfTime = dGold.inf[dGold.inf.length - 1].time;
        return;
      }

      const pGold = livePrices.current.gold;
      const pBtc = livePrices.current.btcBn;
      const pUsd = (livePrices.current.eurusdt || 1.08) / 1.08;
      if (!pGold || !pBtc) return;

      lastInfTime += 1;

      [["gold", pGold], ["btc", pBtc], ["usd", pUsd]].forEach(([k, target]) => {
        const d = dsRef.current[k];
        if (!d.inf || !d.inf.length) return;
        const prevRow = d.inf[d.inf.length - 1];
        const sigma = eaSigma(d.raw) || (target * 0.0001);
        const r = rng(hashStr(k) ^ lastInfTime);

        let p = prevRow.close + (target - prevRow.close) * 0.08 + gauss(r) * sigma * 0.4;

        const open = prevRow.close;
        const h = Math.max(open, p) + Math.abs(gauss(r) * sigma * 0.2);
        const l = Math.min(open, p) - Math.abs(gauss(r) * sigma * 0.2);

        d.inf.push({ time: lastInfTime, open, high: h, low: l, close: p });

        if (d.inf.length > 300) d.inf.shift();
      });

      refresh(false);
    }, 60);

    return () => {
      disposed = true;
      clearInterval(timer);
      clearInterval(fastTimer);
      const ws = wsRef.current.binance;
      if (ws) { ws.onclose = null; ws.close(); }
    };
  }, [rates, refresh]);

  return (
    <section className={styles.priceSection} id="harga">
      <div ref={cardRef} className={`${styles.priceCard} ${isFull ? styles.cardFull : ""}`}>
        <div className={styles.priceHeader}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className={styles.eyebrow}>Index CSCID</span>
            <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Coconut Shell Charcoal Indonesia
            </span>
          </div>

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
            <div className={styles.statBox}><span className={styles.statLabel}>PERUBAHAN</span><span className={`${styles.statVal} ${legend.isUp ? styles.up : styles.down}`}>{legend.isUp ? "▲" : "▼"} <Smooth value={legend.chg} render={v => (v >= 0 ? "+" : "") + fmt(v, dec)} /> (<Smooth value={legend.pct} render={v => (v >= 0 ? "+" : "") + fmt(v, 2) + "%"} />)</span></div>
            <div className={styles.statBox}><span className={styles.statLabel}>TERTINGGI</span><span className={styles.statVal}><Smooth value={legend.high} render={v => curObj.symbol + fmt(v, dec)} /></span></div>
            <div className={styles.statBox}><span className={styles.statLabel}>TERENDAH</span><span className={styles.statVal}><Smooth value={legend.low} render={v => curObj.symbol + fmt(v, dec)} /></span></div>
          </div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.toolbarGroup}>
            <div className={styles.modeSwitch}>
              <button
                type="button"
                className={`${styles.modeBtn} ${mode === "csc" ? styles.modeBtnActive : ""}`}
                onClick={() => {
                  if (!unlocked) setPendingMode("csc_unlock");
                  else setMode("csc");
                }}
                style={{ fontWeight: "bold" }}
                title="6 Market Index (USD, Yuan, Yen, Riyal, XAU, BTC)"
              >
                CSC
              </button>

              {/* Tombol ikon mode disembunyikan secara default, terbuka jika memasukkan password: Coconut Shell Charcoal */}
              {unlocked && (
                <>
                  <button type="button" className={`${styles.modeBtn} ${mode === "usd" ? styles.modeBtnActive : ""}`} onClick={() => pickMode("usd")} title="USD Mode">💵</button>
                  <button type="button" className={`${styles.modeBtn} ${mode === "yuan" ? styles.modeBtnActive : ""}`} onClick={() => pickMode("yuan")} title="Yuan Mode">中</button>
                  <button type="button" className={`${styles.modeBtn} ${mode === "jpy" ? styles.modeBtnActive : ""}`} onClick={() => pickMode("jpy")} title="Yen Mode">💴</button>
                  <button type="button" className={`${styles.modeBtn} ${mode === "sar" ? styles.modeBtnActive : ""}`} onClick={() => pickMode("sar")} title="Riyal Mode">﷼</button>
                  <button type="button" className={`${styles.noMarketModeBtn || styles.modeBtn} ${mode === "gold" ? styles.modeBtnActive : ""}`} onClick={() => pickMode("gold")} title="Gold Mode">{marketClosed ? "🔒" : "🔐"}</button>
                  <button type="button" className={`${styles.modeBtn} ${mode === "btc" ? styles.modeBtnActive : ""}`} onClick={() => pickMode("btc")} title="Bitcoin Mode">⭐</button>
                </>
              )}
            </div>

            <div className={styles.modeSwitch} style={{ marginLeft: "8px" }}>
              <button type="button" className={`${styles.modeBtn} ${containerMode === "T" ? styles.modeBtnActive : ""}`} onClick={() => setContainerMode("T")} title="Harga Per Ton (1 Ton)">T</button>
              <button type="button" className={`${styles.modeBtn} ${containerMode === "40ft" ? styles.modeBtnActive : ""}`} onClick={() => setContainerMode("40ft")} title="Harga Total Kontainer 40ft (x25 Ton)">40ft</button>
            </div>

            <button className={`${styles.currencyBtn} ${styles.smallBtn} ${type === "candle" ? styles.currencyActive : ""}`} onClick={() => setType("candle")} type="button">CANDLE</button>
            <button className={`${styles.currencyBtn} ${styles.smallBtn} ${type === "area" ? styles.currencyActive : ""}`} onClick={() => setType("area")} type="button">AREA</button>
          </div>

          <div className={styles.toolbarGroup}>
            <div className={styles.currencySelector}>
              <button className={`${styles.currencyBtn} ${styles.smallBtn}`} onClick={() => setTimeDropOpen(!timeDropOpen)} type="button">
                {IV[iv]?.label}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: timeDropOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease" }}><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              {timeDropOpen && (
                <div className={`${styles.currencyDropdown}`} style={{ maxHeight: 340, overflowY: "auto" }}>
                  <div className={styles.dropLabel}>INTERVAL (TICK, SEC & MIN)</div>
                  {Object.keys(IV).map(v => (
                    <button key={v} className={`${styles.currencyOption} ${iv === v ? styles.currencyActive : ""}`} onClick={() => { setIv(v); setTimeDropOpen(false); }}>
                      <span>{IV[v].label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* [PATCH:CENTER-PRICE] TOMBOL +: harga di tengah, chart ikut bergeser mengikuti candle, zoom tidak berubah */}
            <button
              type="button"
              className={`${styles.currencyBtn} ${styles.smallBtn}`}
              onClick={centerOnPrice}
              title="Harga di tengah, chart mengikuti candle"
              style={{ fontWeight: "bold", padding: "0 10px" }}
            >
              +
            </button>
            {/* [/PATCH:CENTER-PRICE] */}

            <button
              type="button"
              className={styles.fullBtn}
              onClick={toggleFull}
              aria-label={isFull ? "Keluar layar penuh" : "Layar penuh"}
            >
              {isFull ? "TUTUP" : "FULL"}
            </button>
          </div>
        </div>

        <div className={`${styles.chartContainer} ${isFull ? styles.chartInFull : ""}`}>
          <div
            className={`${styles.chartFade} ${fade ? styles.chartFadeOut : ""}`}
            onDoubleClick={() => centerOnPrice() /* [PATCH:CENTER-PRICE] */}
            style={{
              position: "relative", width: "100%",
              ...(isFull ? { flex: 1, minHeight: 0 } : { height: "480px" }),
              opacity: fade ? 0 : 1,
              transition: "opacity 0.14s ease"
            }}
          >
            <div ref={chartContainerRef} style={{ position: "absolute", inset: 0, zIndex: 2 }}></div>

            {pendingMode && (
              <div style={{ position: "absolute", inset: 0, zIndex: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.88)" }}>
                <form onSubmit={submitPw} style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "center", maxWidth: 360, padding: 16 }}>
                  <input
                    type="password"
                    autoFocus
                    value={pw}
                    onChange={(e) => { setPw(e.target.value); setPwErr(false); }}
                    placeholder="Password (Coconut Shell Charcoal)"
                    autoComplete="off"
                    style={{ flex: "1 1 220px", minWidth: 0, padding: "10px 12px", border: `1px solid ${pwErr ? "#f23645" : "#e0e3eb"}`, borderRadius: 4, fontSize: 14, outline: "none", background: "#fff", color: "#111" }}
                  />
                  <button className={styles.currencyBtn} type="submit">BUKA</button>
                  <button className={styles.currencyBtn} type="button" onClick={() => setPendingMode(null)}>BATAL</button>
                  {pwErr && <span style={{ width: "100%", textAlign: "center", color: "#f23645", fontSize: 13 }}>Password salah.</span>}
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
