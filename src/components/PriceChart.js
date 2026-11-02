"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createChart } from "lightweight-charts";
import styles from "./PriceChart.module.css"; 

const OZ = 31.1034768;
const GRAMS = 5;
const MARKUP = 1.125;
const BTC_FACTOR = 0.01; 

// Konstanta Basis Masing-Masing Pilar
const YUAN_BASE = 5000;
const USD_BASE = 1000;
const JPY_BASE = 100;
const SAR_BASE = 5;

const WIB = 7 * 3600; 

const IV = {
  "1m":  { step: 60,     bin: "1m",  label: "1M" },
  "5m":  { step: 300,    bin: "5m",  label: "5M" },
  "15m": { step: 900,    bin: "15m", label: "15M" },
  "30m": { step: 1800,   bin: "30m", label: "30M" },
  "1h":  { step: 3600,   bin: "1h",  label: "1H" },
  "4h":  { step: 14400,  bin: "4h",  label: "4H" },
  "12h": { step: 43200,  bin: "12h", label: "12H" },
  "1d":  { step: 86400,  bin: "1d",  label: "1D" },
  "3d":  { step: 259200, bin: "3d",  label: "3D" }
};

const RANGES = {
  "1D":  { iv: "5m",  count: 300,  label: "1D" },
  "5D":  { iv: "15m", count: 500,  label: "5D" },
  "1M":  { iv: "1h",  count: 750,  label: "1M" },
  "3M":  { iv: "4h",  count: 550,  label: "3M" },
  "6M":  { iv: "12h", count: 370,  label: "6M" },
  "YTD": { iv: "1d",  count: 0,    label: "YTD" },
  "1Y":  { iv: "1d",  count: 370,  label: "1Y" },
  "5Y":  { iv: "3d",  count: 610,  label: "5Y" },
  "10Y": { iv: "3d",  count: 1220, label: "10Y" }
};

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

function ytdDays() {
  const n = new Date();
  return Math.max(2, Math.ceil((n.getTime() - Date.UTC(n.getUTCFullYear(), 0, 1)) / 86400000) + 1);
}

function isXauMarketOpen() {
  const now = new Date();
  const day = now.getUTCDay();
  const hour = now.getUTCHours();
  if (day === 6) return false; 
  if (day === 0) return false; 
  if (day === 5 && hour >= 22) return false; 
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

function animateRange(ts, to, animRef, ms = 420) {
  cancelAnimationFrame(animRef.current);
  const from = ts.getVisibleLogicalRange();
  if (!from) { ts.setVisibleLogicalRange(to); return; }
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / ms);
    const e = 1 - Math.pow(1 - k, 3);
    ts.setVisibleLogicalRange({
      from: from.from + (to.from - from.from) * e,
      to: from.to + (to.to - from.to) * e
    });
    if (k < 1) animRef.current = requestAnimationFrame(step);
  };
  animRef.current = requestAnimationFrame(step);
}

function useSmooth(target, ms = 400) {
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
  const [iv, setIv] = useState("1m");       
  const [range, setRange] = useState(null);
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
  const animRef = useRef(0);
  const fitRef = useRef(() => {});
  const applyRef = useRef(() => {});
  const legendRef = useRef(() => {});
  
  const modeRef = useRef("csc");
  const containerModeRef = useRef("T");
  const rateRef = useRef(1);
  const ivRef = useRef("1m");
  
  const isFetchingHistory = useRef(false);
  const noMoreHistory = useRef(false);

  const dsRef = useRef({
    usd: { raw: [], mult: (ratesObj, targetRate) => USD_BASE * targetRate },
    yuan: { raw: [], mult: (ratesObj, targetRate) => {
      const cnyToUsd = ratesObj && ratesObj.CNY ? (1 / ratesObj.CNY) : 0.1501;
      return YUAN_BASE * cnyToUsd * targetRate;
    }},
    jpy: { raw: [], mult: (ratesObj, targetRate) => {
      const jpyToUsd = ratesObj && ratesObj.JPY ? (1 / ratesObj.JPY) : 0.0067;
      return JPY_BASE * jpyToUsd * targetRate;
    }},
    sar: { raw: [], mult: (ratesObj, targetRate) => {
      const sarToUsd = ratesObj && ratesObj.SAR ? (1 / ratesObj.SAR) : 0.2666;
      return SAR_BASE * sarToUsd * targetRate;
    }},
    gold: { raw: [], mult: (ratesObj, targetRate) => GRAMS * MARKUP / OZ * targetRate },
    btc:  { raw: [], mult: (ratesObj, targetRate) => BTC_FACTOR * targetRate },
    csc:  { raw: [] } 
  });

  const tokenRef = useRef(0);
  const livePrices = useRef({ gold: null, btcBn: null, btcBs: null, eurusdt: 1.08, btcSrc: "Bitstamp" });
  const wsRef = useRef({ binance: null, bitstamp: null });

  const rate = rates ? (cur === "USD" ? 1 : rates[cur] || 1) : 1;
  const curObj = CURRENCIES.find(c => c.code === cur) || CURRENCIES[0];
  const dec = cur === "IDR" || cur === "JPY" ? 0 : 2;

  useEffect(() => {
    const open = isXauMarketOpen();
    setMarketClosed(!open);
  }, []);

  useEffect(() => {
    fetch("/api/prices").then(r => r.json()).then(d => {
      if (d.rates) setRates(d.rates);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const centerProvider = (orig) => {
      const res = orig();
      const last = lastRef.current;
      if (!res || !res.priceRange || last == null) return res;
      const { minValue, maxValue } = res.priceRange;
      const half = Math.max(maxValue - last, last - minValue) * 1.12 || Math.abs(last) * 0.0005;
      return { ...res, priceRange: { minValue: last - half, maxValue: last + half } };
    };

    const chart = createChart(chartContainerRef.current, {
      autoSize: true,
      layout: { background: { type: "solid", color: "transparent" }, textColor: "#787b86", fontFamily: "system-ui, sans-serif", fontSize: 11 },
      grid: { vertLines: { color: "#f0f3fa" }, horzLines: { color: "#f0f3fa" } },
      rightPriceScale: { borderColor: "#e0e3eb", scaleMargins: { top: 0.12, bottom: 0.12 } },
      leftPriceScale: { visible: false },
      timeScale: { 
        borderColor: "#e0e3eb", 
        timeVisible: IV[ivRef.current]?.step < 86400, 
        secondsVisible: false, 
        rightOffset: 2,
        fixLeftEdge: false,
        fixRightEdge: true 
      },
      crosshair: { mode: 0 },
      localization: { priceFormatter: p => new Intl.NumberFormat("id-ID", { minimumFractionDigits: 4 }).format(p) }
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

    chartRef.current = chart;
    seriesRef.current = { candle, area };

    return () => {
      cancelAnimationFrame(animRef.current);
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({ timeScale: { timeVisible: IV[iv]?.step < 86400 } });
  }, [iv]);

  // INFINITE SCROLL LISTENER 
  useEffect(() => {
    if (!chartRef.current) return;
    const ts = chartRef.current.timeScale();
    
    const onScroll = (logicalRange) => {
      if (logicalRange && logicalRange.from < 50 && !isFetchingHistory.current && !noMoreHistory.current) {
        isFetchingHistory.current = true;
        setLegend(p => ({ ...p, availText: "⏳ Memuat riwayat..." }));

        const binanceIv = IV[ivRef.current]?.bin || "1m";
        const dUsd = dsRef.current.usd.raw;
        const dGold = dsRef.current.gold.raw;
        const dBtc = dsRef.current.btc.raw;

        if (!dUsd.length || !dGold.length || !dBtc.length) {
          isFetchingHistory.current = false;
          return;
        }

        const oldestTime = (dUsd[0].time - WIB) * 1000 - 1;

        const fetchBinancePage = async (symbol, endMs) => {
          const r = await getJson(`/api/v3/klines?symbol=${symbol}&interval=${binanceIv}&limit=1000&endTime=${endMs}`);
          return r.map(x => ({ time: Math.floor(x[0]/1000) + WIB, open: +x[1], high: +x[2], low: +x[3], close: +x[4] }));
        };

        const fetchBitstampPage = async (endSec) => {
          const step = IV[ivRef.current]?.step || 60;
          const r = await fetch(`https://www.bitstamp.net/api/v2/ohlc/btcusd/?step=${step}&limit=1000&end=${endSec}`);
          if (!r.ok) throw new Error();
          const j = await r.json();
          return (j?.data?.ohlc || []).map(o => ({ time: +o.timestamp + WIB, open: +o.open, high: +o.high, low: +o.low, close: +o.close }));
        };

        const pGold = fetchBinancePage("PAXGUSDT", oldestTime);
        const pForex = fetchBinancePage("EURUSDT", oldestTime);
        const oldestBtc = dBtc[0].time - WIB - 1;
        const pBtc = livePrices.current.btcSrc === "Bitstamp" 
          ? fetchBitstampPage(oldestBtc).catch(() => fetchBinancePage("BTCUSDT", oldestTime)) 
          : fetchBinancePage("BTCUSDT", oldestTime);

        Promise.all([pGold, pBtc, pForex]).then(([oldGold, oldBtc, oldForex]) => {
          if (!oldGold.length) {
            noMoreHistory.current = true;
            setLegend(p => ({ ...p, availText: "⚠️ Semua riwayat telah dimuat" }));
          } else {
            const oldUsd = oldForex.map(r => ({
              time: r.time, open: r.open / 1.08, high: r.high / 1.08, low: r.low / 1.08, close: r.close / 1.08
            }));
            const oldYuan = oldUsd;
            const oldJpy = oldUsd;
            const oldSar = oldUsd;

            dsRef.current.gold.raw = uniqSorted([...oldGold, ...dGold]);
            dsRef.current.btc.raw = uniqSorted([...oldBtc, ...dBtc]);
            dsRef.current.usd.raw = uniqSorted([...oldUsd, ...dUsd]);
            dsRef.current.yuan.raw = uniqSorted([...oldYuan, ...dsRef.current.yuan.raw]);
            dsRef.current.jpy.raw = uniqSorted([...oldJpy, ...dsRef.current.jpy.raw]);
            dsRef.current.sar.raw = uniqSorted([...oldSar, ...dsRef.current.sar.raw]);

            const curRange = ts.getVisibleLogicalRange();
            applyRef.current();

            if (curRange && oldGold.length > 0) {
              ts.setVisibleLogicalRange({
                from: curRange.from + oldGold.length,
                to: curRange.to + oldGold.length
              });
            }

            const dateFmt = new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
            const oldestTimeDate = new Date(dsRef.current.usd.raw[0].time * 1000);
            setLegend(p => ({ ...p, availText: `📅 Riwayat sejak ${dateFmt.format(oldestTimeDate)}` }));
          }
          isFetchingHistory.current = false;
        }).catch(() => {
          isFetchingHistory.current = false;
        });
      }
    };

    ts.subscribeVisibleLogicalRangeChange(onScroll);
    return () => ts.unsubscribeVisibleLogicalRangeChange(onScroll);
  }, [rates, cur]);

  const fitView = useCallback((smooth = false) => {
    const targetKey = mode === "csc" ? "usd" : mode;
    const d = dsRef.current[targetKey];
    if (!d || !d.raw || !d.raw.length || !chartRef.current) return;
    
    const n = d.raw.length;
    const ts = chartRef.current.timeScale();
    
    let visibleBars = 120; 
    if (range) {
       if (range === "1D") visibleBars = 288;
       else if (range === "5D") visibleBars = 480;
       else if (range === "1M") visibleBars = 720;
       else visibleBars = n; 
    }
    
    const target = { from: Math.max(0, n - visibleBars), to: n + 1 };
    
    if (smooth) {
      animateRange(ts, target, animRef);
    } else {
      cancelAnimationFrame(animRef.current);
      ts.setVisibleLogicalRange(target);
    }
  }, [mode, range]);

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
    const onKey = (e) => { if (e.key === "Escape") setIsFull(false); };
    if (isFull) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKey);
    }
    const t = setTimeout(() => fitView(true), 150);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      clearTimeout(t);
    };
  }, [isFull, fitView]);

  useEffect(() => {
    let t;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => fitView(), 150);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [fitView]);

  // Fungsi Pembuat Data Index Hibrida (6 Instrumen: USD, Yuan, JPY, SAR, Emas, BTC)
  const buildCscData = useCallback((targetRate) => {
    const dUsdProxy = dsRef.current.usd.raw; 
    const dGold = dsRef.current.gold.raw;
    const dBtc  = dsRef.current.btc.raw;

    if (!dUsdProxy.length || !dGold.length || !dBtc.length) return [];

    const cnyToUsd = rates && rates.CNY ? (1 / rates.CNY) : 0.1501;
    const jpyToUsd = rates && rates.JPY ? (1 / rates.JPY) : 0.0067;
    const sarToUsd = rates && rates.SAR ? (1 / rates.SAR) : 0.2666;

    const mUsd = USD_BASE * targetRate;
    const mYuan = YUAN_BASE * cnyToUsd * targetRate;
    const mJpy = JPY_BASE * jpyToUsd * targetRate;
    const mSar = SAR_BASE * sarToUsd * targetRate;
    const mGold = dsRef.current.gold.mult(rates, targetRate);
    const mBtc = dsRef.current.btc.mult(rates, targetRate);

    const map = {};
    dUsdProxy.forEach(x => map[x.time] = { f: x, g: null, b: null });
    dGold.forEach(x => { if(!map[x.time]) map[x.time] = {f: null, b: null}; map[x.time].g = x; });
    dBtc.forEach(x => { if(!map[x.time]) map[x.time] = {f: null, g: null}; map[x.time].b = x; });

    const times = Object.keys(map).map(Number).sort((a,b) => a-b);
    let lastF = dUsdProxy[0], lastG = dGold[0], lastB = dBtc[0];
    
    return times.map(t => {
      if (map[t].f) lastF = map[t].f;
      if (map[t].g) lastG = map[t].g;
      if (map[t].b) lastB = map[t].b;
      
      if (!lastF || !lastG || !lastB) return null;

      const calcVal = (fVal, gVal, bVal) => {
        const usdPart = fVal * mUsd;
        const yuanPart = fVal * mYuan;
        const jpyPart = fVal * mJpy;
        const sarPart = fVal * mSar;
        const goldPart = gVal * mGold;
        const btcPart = bVal * mBtc;
        return (usdPart + yuanPart + jpyPart + sarPart + goldPart + btcPart) / 6;
      };

      const multiplier = containerModeRef.current === "40ft" ? 25 : 1;

      return {
        time: t,
        open: calcVal(lastF.open, lastG.open, lastB.open) * multiplier,
        high: calcVal(lastF.high, lastG.high, lastB.high) * multiplier,
        low: calcVal(lastF.low, lastG.low, lastB.low) * multiplier,
        close: calcVal(lastF.close, lastG.close, lastB.close) * multiplier,
      };
    }).filter(Boolean);
  }, [rates, containerMode]);

  const applyData = useCallback(() => {
    let cs = [];
    const multiplier = containerMode === "40ft" ? 25 : 1;

    if (mode === "csc") {
      cs = buildCscData(rate);
      dsRef.current.csc.raw = cs; 
    } else {
      const d = dsRef.current[mode];
      if (!d || !d.raw) return;
      const m = d.mult(rates, rate) * multiplier;
      cs = d.raw.map(x => ({
        time: x.time, open: x.open * m, high: x.high * m, low: x.low * m, close: x.close * m
      }));
    }
    
    if (cs.length > 0) {
      seriesRef.current.candle.setData(cs);
      seriesRef.current.area.setData(cs.map(x => ({ time: x.time, value: x.close })));
      lastRef.current = cs[cs.length - 1].close;
    }
  }, [mode, rate, rates, containerMode, buildCscData]);

  const updateLegend = useCallback(() => {
    const isCsc = mode === "csc";
    const d = isCsc ? dsRef.current.csc : dsRef.current[mode];
    if (!d || !d.raw || !d.raw.length) return;

    const n = d.raw.length;
    let lookback = 120; 
    if (range) lookback = Math.min(n, RANGES[range]?.count || n);
    
    const multiplier = containerMode === "40ft" ? 25 : 1;
    const m = isCsc ? 1 : (d.mult(rates, rate) * multiplier);
    
    const f = d.raw[Math.max(0, n - lookback)].open * m;
    const last = d.raw[n - 1].close;
    const l = last * m;
    
    const highs = d.raw.map(x => x.high * m);
    const lows = d.raw.map(x => x.low * m);

    const diff = l - f;
    const pct = f ? (diff / f) * 100 : 0;

    setLegend(prev => ({
      ...prev,
      val: l, chg: diff, pct: pct, isUp: diff >= 0,
      high: Math.max(...highs), low: Math.min(...lows)
    }));
  }, [mode, rate, range, rates, containerMode]);

  fitRef.current = fitView;
  applyRef.current = applyData;
  legendRef.current = updateLegend;
  modeRef.current = mode;
  containerModeRef.current = containerMode;
  rateRef.current = rate;
  ivRef.current = iv;

  useEffect(() => {
    const applyVis = () => {
      if (!seriesRef.current.candle) return;
      seriesRef.current.candle.applyOptions({ visible: type === "candle" });
      seriesRef.current.area.applyOptions({ visible: type === "area" });
    };
    
    const targetKey = mode === "csc" ? "usd" : mode;
    const d = dsRef.current[targetKey];
    
    if (!chartRef.current || !d || !d.raw.length) { applyVis(); return; }
    setFade(true);
    const t = setTimeout(() => {
      applyVis();
      applyData();
      updateLegend();
      fitView(true);
      setFade(false);
    }, 180);
    return () => clearTimeout(t);
  }, [mode, containerMode, rate, type, rates]);

  useEffect(() => {
    if (!rates) return;
    tokenRef.current += 1;
    const currentToken = tokenRef.current;
    setFade(true);
    
    isFetchingHistory.current = false;
    noMoreHistory.current = false;
    
    const count = range === "YTD" ? ytdDays() : (range ? RANGES[range]?.count : 750); 
    const binanceIv = IV[iv]?.bin || "1m";
    
    dsRef.current.gold.raw = [];
    dsRef.current.btc.raw = [];
    dsRef.current.usd.raw = [];
    dsRef.current.yuan.raw = [];
    dsRef.current.jpy.raw = [];
    dsRef.current.sar.raw = [];
    dsRef.current.csc.raw = [];
    
    setLegend(p => ({ ...p, availText: "⏳ Memuat instrumen pasar..." }));

    const fetchBinancePage = async (symbol, interval, left, endMs = null, all = []) => {
      const n = Math.min(left, 1000);
      const path = `/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${n}${endMs ? "&endTime=" + endMs : ""}`;
      const rows = await getJson(path);
      const cs = rows.map(r => ({ time: Math.floor(r[0] / 1000) + WIB, open: +r[1], high: +r[2], low: +r[3], close: +r[4] }));
      all = cs.concat(all);
      left -= rows.length;
      if (left > 0 && rows.length === n) return fetchBinancePage(symbol, interval, left, rows[0][0] - 1, all);
      return uniqSorted(all);
    };

    const fetchBitstampPage = async (interval, left, endSec = Math.floor(Date.now() / 1000), all = []) => {
      const step = IV[iv]?.step || 60;
      const n = Math.min(left, 1000);
      const url = `https://www.bitstamp.net/api/v2/ohlc/btcusd/?step=${step}&limit=${n}&start=${endSec - step * n}&end=${endSec}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      const rows = j?.data?.ohlc || [];
      const cs = rows.map(o => ({ time: +o.timestamp + WIB, open: +o.open, high: +o.high, low: +o.low, close: +o.close }));
      all = cs.concat(all);
      left -= n;
      if (left > 0 && rows.length) return fetchBitstampPage(interval, left, +rows[0].timestamp - 1, all);
      return uniqSorted(all);
    };

    const pGold = fetchBinancePage("PAXGUSDT", binanceIv, count);
    const pForex = fetchBinancePage("EURUSDT", binanceIv, count); 

    let btcSrc = "Bitstamp";
    const pBtc = fetchBitstampPage(binanceIv, count).then(cs => {
      if (!cs.length) throw new Error("data kosong"); return cs;
    }).catch(() => {
      btcSrc = "Binance"; return fetchBinancePage("BTCUSDT", binanceIv, count);
    });

    Promise.all([pGold, pBtc, pForex]).then(res => {
      if (currentToken !== tokenRef.current) return;
      livePrices.current.btcSrc = btcSrc;
      
      dsRef.current.gold.raw = res[0];
      dsRef.current.btc.raw = res[1];

      const proxyData = res[2].map(x => ({
        time: x.time, open: x.open / 1.08, high: x.high / 1.08, low: x.low / 1.08, close: x.close / 1.08 
      }));

      dsRef.current.usd.raw = proxyData;
      dsRef.current.yuan.raw = proxyData;
      dsRef.current.jpy.raw = proxyData;
      dsRef.current.sar.raw = proxyData;

      const dateFmt = new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
      const sinceNote = (d) => (d.raw.length > 0) ? `📅 Hibrida sejak ${dateFmt.format(new Date(d.raw[0].time * 1000))}` : "";
      
      setLegend(p => ({ ...p, availText: sinceNote(dsRef.current.usd) }));
      applyRef.current();
      legendRef.current();
      fitRef.current(true);
      setFade(false);
      setTimeout(() => { if (currentToken === tokenRef.current) fitRef.current(true); }, 350);
    }).catch(e => {
      if (currentToken !== tokenRef.current) return;
      setFade(false);
      setStatus({ text: "GAGAL MEMUAT RIWAYAT.", isLive: false, error: e.message });
      setLegend(p => ({ ...p, availText: "" }));
    });
  }, [iv, range, rates]);

  useEffect(() => {
    if (!rates) return;
    let disposed = false;
    let tb, tt;

    const connectBinance = () => {
      if (disposed) return;
      try {
        const ws = new WebSocket("wss://stream.binance.com:9443/stream?streams=btcusdt@trade/paxgusdt@trade/eurusdt@trade");
        ws.onopen = () => setStatus({ text: "LIVE", isLive: true, error: null });
        ws.onmessage = (ev) => {
          const d = JSON.parse(ev.data).data;
          if (!d || !d.p) return;
          if (d.s === "BTCUSDT") livePrices.current.btcBn = parseFloat(d.p);
          if (d.s === "PAXGUSDT") livePrices.current.gold = parseFloat(d.p);
          if (d.s === "EURUSDT") livePrices.current.eurusdt = parseFloat(d.p);
        };
        ws.onclose = () => { if (!disposed) tb = setTimeout(connectBinance, 3000); };
        wsRef.current.binance = ws;
      } catch(e) {}
    };

    const connectBitstamp = () => {
      if (disposed) return;
      try {
        const w = new WebSocket("wss://ws.bitstamp.net");
        w.onopen = () => w.send(JSON.stringify({ event: "bts:subscribe", data: { channel: "live_trades_btcusd" } }));
        w.onmessage = (ev) => {
          try {
            const m = JSON.parse(ev.data);
            if (m.event === "trade" && m.data) livePrices.current.btcBs = parseFloat(m.data.price_str || m.data.price);
          } catch(e) {}
        };
        w.onclose = () => { if (!disposed) tt = setTimeout(connectBitstamp, 3000); };
        wsRef.current.bitstamp = w;
      } catch(e) {}
    };

    connectBinance();
    connectBitstamp();

    const timer = setInterval(() => {
      const curMode = modeRef.current;
      const curContainer = containerModeRef.current;
      const curRate = rateRef.current;
      const step = IV[ivRef.current].step;
      const multiplier = curContainer === "40ft" ? 25 : 1;
      
      ["gold", "btc", "usd"].forEach(key => {
        const d = dsRef.current[key];
        let pRaw = 1;
        if (key === "gold") pRaw = livePrices.current.gold;
        else if (key === "btc") pRaw = (livePrices.current.btcSrc === "Bitstamp" && livePrices.current.btcBs != null ? livePrices.current.btcBs : livePrices.current.btcBn);
        else if (key === "usd") pRaw = (livePrices.current.eurusdt || 1.08) / 1.08; 
        
        if (pRaw == null || !d.raw.length) return;
        
        const last = d.raw[d.raw.length - 1];
        const nowT = Math.floor(Date.now() / 1000) + WIB;

        if (nowT >= last.time + step) {
          const t = last.time + step * Math.floor((nowT - last.time) / step);
          d.raw.push({ time: t, open: pRaw, high: pRaw, low: pRaw, close: pRaw });
        } else {
          last.high = Math.max(last.high, pRaw);
          last.low = Math.min(last.low, pRaw);
          last.close = pRaw;
        }
      });

      // Sinkronkan juga proxy ke mode fiat lainnya
      ["yuan", "jpy", "sar"].forEach(k => {
        dsRef.current[k].raw = dsRef.current.usd.raw;
      });

      if (dsRef.current.usd.raw.length > 0 && dsRef.current.gold.raw.length > 0 && dsRef.current.btc.raw.length > 0) {
        
        if (curMode === "csc") {
          const lF = dsRef.current.usd.raw[dsRef.current.usd.raw.length - 1];
          const lG = dsRef.current.gold.raw[dsRef.current.gold.raw.length - 1];
          const lB = dsRef.current.btc.raw[dsRef.current.btc.raw.length - 1];
          
          const cnyToUsd = rates && rates.CNY ? (1 / rates.CNY) : 0.1501;
          const jpyToUsd = rates && rates.JPY ? (1 / rates.JPY) : 0.0067;
          const sarToUsd = rates && rates.SAR ? (1 / rates.SAR) : 0.2666;

          const mUsd = USD_BASE * curRate;
          const mYuan = YUAN_BASE * cnyToUsd * curRate;
          const mJpy = JPY_BASE * jpyToUsd * curRate;
          const mSar = SAR_BASE * sarToUsd * curRate;
          const mG = dsRef.current.gold.mult(rates, curRate);
          const mB = dsRef.current.btc.mult(rates, curRate);

          const calcLive = (f, g, b) => {
             return ((f*mUsd + f*mYuan + f*mJpy + f*mSar + g*mG + b*mB) / 6) * multiplier;
          };

          const sv = {
            time: lF.time,
            open: calcLive(lF.open, lG.open, lB.open),
            high: calcLive(lF.high, lG.high, lB.high),
            low: calcLive(lF.low, lG.low, lB.low),
            close: calcLive(lF.close, lG.close, lB.close),
          };
          
          if (dsRef.current.csc.raw.length > 0) {
             const lastCsc = dsRef.current.csc.raw[dsRef.current.csc.raw.length - 1];
             if (lastCsc.time === sv.time) dsRef.current.csc.raw[dsRef.current.csc.raw.length - 1] = sv;
             else dsRef.current.csc.raw.push(sv);
          }

          lastRef.current = sv.close;
          seriesRef.current.candle.update(sv);
          seriesRef.current.area.update({ time: sv.time, value: sv.close });

        } else {
          const d = dsRef.current[curMode];
          const last = d.raw[d.raw.length - 1];
          const m = d.mult(rates, curRate) * multiplier;
          const sv = { time: last.time, open: last.open * m, high: last.high * m, low: last.low * m, close: last.close * m };
          
          lastRef.current = sv.close;
          seriesRef.current.candle.update(sv);
          seriesRef.current.area.update({ time: sv.time, value: sv.close });
        }
      }
      
      legendRef.current();
    }, 1000);

    return () => {
      disposed = true;
      clearInterval(timer);
      clearTimeout(tb);
      clearTimeout(tt);
      if (wsRef.current.binance) wsRef.current.binance.close();
      if (wsRef.current.bitstamp) wsRef.current.bitstamp.close();
    };
  }, [rates]);

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

        {status.error && <div style={{ marginBottom: 10, padding: '10px 12px', border: '1px solid #f23645', borderRadius: 4, color: '#f23645', fontSize: 13 }}>{status.error}</div>}
        
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
              <button
                type="button"
                className={`${styles.modeBtn} ${mode === "csc" ? styles.modeBtnActive : ""}`}
                onClick={() => setMode("csc")}
                style={{ fontWeight: "bold" }}
                title="6 Market Index (USD, Yuan, Yen, Riyal, XAU, BTC)"
              >
                CSC
              </button>
              <button
                type="button"
                className={`${styles.modeBtn} ${mode === "usd" ? styles.modeBtnActive : ""}`}
                onClick={() => setMode("usd")}
                title="USD Mode"
              >
                💵
              </button>
              <button
                type="button"
                className={`${styles.modeBtn} ${mode === "yuan" ? styles.modeBtnActive : ""}`}
                onClick={() => setMode("yuan")}
                title="Yuan Mode"
              >
                中
              </button>
              <button
                type="button"
                className={`${styles.modeBtn} ${mode === "jpy" ? styles.modeBtnActive : ""}`}
                onClick={() => setMode("jpy")}
                title="Yen Mode"
              >
                💴
              </button>
              <button
                type="button"
                className={`${styles.modeBtn} ${mode === "sar" ? styles.modeBtnActive : ""}`}
                onClick={() => setMode("sar")}
                title="Riyal Mode"
              >
                ﷼
              </button>
              <button
                type="button"
                className={`${styles.modeBtn} ${mode === "gold" ? styles.modeBtnActive : ""}`}
                onClick={() => setMode("gold")}
                title="Gold Mode"
              >
                {marketClosed ? "🔒" : "🔐"}
              </button>
              <button
                type="button"
                className={`${styles.modeBtn} ${mode === "btc" ? styles.modeBtnActive : ""}`}
                onClick={() => setMode("btc")}
                title="Bitcoin Mode"
              >
                ⭐
              </button>
            </div>

            {/* Tombol Kontainer T & 40ft */}
            <div className={styles.modeSwitch} style={{ marginLeft: "8px" }}>
              <button
                type="button"
                className={`${styles.modeBtn} ${containerMode === "T" ? styles.modeBtnActive : ""}`}
                onClick={() => setContainerMode("T")}
                title="Harga Per Ton (1 Ton)"
              >
                T
              </button>
              <button
                type="button"
                className={`${styles.modeBtn} ${containerMode === "40ft" ? styles.modeBtnActive : ""}`}
                onClick={() => setContainerMode("40ft")}
                title="Harga Total Kontainer 40ft (x25 Ton)"
              >
                40ft
              </button>
            </div>

            <button className={`${styles.currencyBtn} ${styles.smallBtn} ${type === "candle" ? styles.currencyActive : ""}`} onClick={() => setType("candle")} type="button">CANDLE</button>
            <button className={`${styles.currencyBtn} ${styles.smallBtn} ${type === "area" ? styles.currencyActive : ""}`} onClick={() => setType("area")} type="button">AREA</button>
          </div>

          <div className={styles.toolbarGroup}>
            <div className={styles.currencySelector}>
              <button className={`${styles.currencyBtn} ${styles.smallBtn}`} onClick={() => setTimeDropOpen(!timeDropOpen)} type="button">
                {range ? range : IV[iv]?.label}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: timeDropOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease" }}><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              {timeDropOpen && (
                <div className={`${styles.currencyDropdown}`}>
                  <div className={styles.dropLabel}>INTERVAL</div>
                  {Object.keys(IV).map(v => (
                    <button key={v} className={`${styles.currencyOption} ${iv === v && !range ? styles.currencyActive : ""}`} onClick={() => { setIv(v); setRange(null); setTimeDropOpen(false); }}>
                      <span>{IV[v].label}</span>
                    </button>
                  ))}
                  <div style={{ borderTop: '1px solid #f3f4f6', margin: '4px 0' }}></div>
                  <div className={styles.dropLabel}>RENTANG</div>
                  {Object.keys(RANGES).map(r => (
                    <button key={r} className={`${styles.currencyOption} ${range === r ? styles.currencyActive : ""}`} onClick={() => { setRange(r); setIv(RANGES[r].iv); setTimeDropOpen(false); }}>
                      <span>{RANGES[r].label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className={styles.fullBtn}
              onClick={toggleFull}
              aria-label={isFull ? "Keluar layar penuh" : "Layar penuh"}
            >
              {isFull ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
              )}
              {isFull ? "TUTUP" : "FULL"}
            </button>
          </div>
        </div>

        <div className={`${styles.chartContainer} ${isFull ? styles.chartInFull : ""}`}>
          <div className={`${styles.chartFade} ${fade ? styles.chartFadeOut : ""}`} style={isFull
            ? { position: 'relative', width: '100%', flex: 1, minHeight: 0 }
            : { position: 'relative', width: '100%', height: '480px' }}>

            <div ref={chartContainerRef} style={{ position: 'absolute', inset: 0, zIndex: 2 }}></div>
          </div>
          
          {legend.availText && (
            <div style={{
              marginTop: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              padding: '5px 12px',
              background: '#f8fafc',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '500'
            }}>
              {legend.availText}
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
