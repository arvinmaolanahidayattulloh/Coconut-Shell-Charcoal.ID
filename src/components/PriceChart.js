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

// Interval Berbasis Tick & Detik (Sec) sesuai permintaan
const IV = {
  "t1":   { type: "tick", count: 1,    label: "1 Tick" },
  "t10":  { type: "tick", count: 10,   label: "10 Tick" },
  "t100": { type: "tick", count: 100,  label: "100 Tick" },
  "t1000":{ type: "tick", count: 1000, label: "1000 Tick" },
  "1s":   { type: "sec",  step: 1,     label: "1 Sec" },
  "5s":   { type: "sec",  step: 5,     label: "5 Sec" },
  "10s":  { type: "sec",  step: 10,    label: "10 Sec" },
  "15s":  { type: "sec",  step: 15,    label: "15 Sec" },
  "30s":  { type: "sec",  step: 30,    label: "30 Sec" }
};

const RANGES = {
  "1D":  { iv: "10s", count: 150, label: "1D" },
  "5D":  { iv: "15s", count: 250, label: "5D" },
  "1M":  { iv: "30s", count: 350, label: "1M" }
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

function animateRange(ts, to, animRef, ms = 250) {
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

function Smooth({ value, render }) {
  const v = useSmooth(value);
  return <>{render(v)}</>;
}

export default function PriceChart() {
  const [marketClosed, setMarketClosed] = useState(false);
  const [mode, setMode] = useState("csc"); 
  const [containerMode, setContainerMode] = useState("T"); 
  const [iv, setIv] = useState("5s");       
  const [range, setRange] = useState(null);
  const [type, setType] = useState("candle");
  const [isFull, setIsFull] = useState(false);
  const [fade, setFade] = useState(false);
  
  const [unlocked, setUnlocked] = useState(false);
  
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
  const ivRef = useRef("5s");

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
    gold: { raw: [], mult: (ratesObj, targetRate) => GRAMS / OZ * targetRate },
    btc:  { raw: [], mult: (ratesObj, targetRate) => BTC_FACTOR * targetRate },
    csc:  { raw: [] } 
  });

  const tokenRef = useRef(0);
  const livePrices = useRef({ gold: null, btcBn: null, btcBs: null, eurusdt: 1.08, btcSrc: "Bitstamp" });
  const wsRef = useRef({ binance: null });

  const rate = rates ? (cur === "USD" ? 1 : rates[cur] || 1) : 1;
  const curObj = CURRENCIES.find(c => c.code === cur) || CURRENCIES[0];
  const dec = cur === "IDR" || cur === "JPY" ? 0 : 2;

  useEffect(() => {
    setMarketClosed(!isXauMarketOpen());
  }, []);

  useEffect(() => {
    fetch("/api/prices").then(r => r.json()).then(d => {
      if (d.rates) setRates(d.rates);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Autoscale provider untuk memusatkan harga secara vertikal di tengah secara proporsional
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
        rightOffset: 2,
        fixLeftEdge: false,
        fixRightEdge: true // Mengunci agar harga terbaru mentok di kanan dan tidak bisa digeser kebablasan
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

  const fitView = useCallback((smooth = true) => {
    const targetKey = mode === "csc" ? "usd" : mode;
    const d = dsRef.current[targetKey];
    if (!d || !d.raw || !d.raw.length || !chartRef.current) return;
    
    const n = d.raw.length;
    const ts = chartRef.current.timeScale();
    let visibleBars = 60; 
    
    const target = { from: Math.max(0, n - visibleBars), to: n + 1 };
    
    if (smooth) {
      animateRange(ts, target, animRef);
    } else {
      cancelAnimationFrame(animRef.current);
      ts.setVisibleLogicalRange(target);
    }
  }, [mode]);

  const handleCscClick = () => {
    if (!unlocked) {
      const pass = prompt("Masukan Kunci");
      if (pass === "Coconut Shell Charcoal") {
        setUnlocked(true);
        setMode("csc");
      } else if (pass !== null) {
        alert("Kunci salah!");
      }
    } else {
      setMode("csc");
    }
  };

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
        if (chartRef.current) {
          fitView(true);
        }
      }, 100);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [fitView]);

  // Fungsi pengelompokan data berdasarkan Interval Tick & Sec
  const generateIntervalData = useCallback((rawList, intervalConfig) => {
    if (!rawList || !rawList.length) return [];
    if (intervalConfig.type === "sec") {
      const step = intervalConfig.step;
      const grouped = {};
      rawList.forEach(item => {
        const bucket = Math.floor(item.time / step) * step;
        if (!grouped[bucket]) {
          grouped[bucket] = { time: bucket, open: item.open, high: item.high, low: item.low, close: item.close };
        } else {
          grouped[bucket].high = Math.max(grouped[bucket].high, item.high);
          grouped[bucket].low = Math.min(grouped[bucket].low, item.low);
          grouped[bucket].close = item.close;
        }
      });
      return Object.values(grouped).sort((a, b) => a.time - b.time);
    } else {
      const count = intervalConfig.count;
      const out = [];
      for (let i = 0; i < rawList.length; i += count) {
        const chunk = rawList.slice(i, i + count);
        if (!chunk.length) continue;
        out.push({
          time: chunk[0].time,
          open: chunk[0].open,
          high: Math.max(...chunk.map(x => x.high)),
          low: Math.min(...chunk.map(x => x.low)),
          close: chunk[chunk.length - 1].close
        });
      }
      return out;
    }
  }, []);

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
    
    const rawUnified = times.map(t => {
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

    return generateIntervalData(rawUnified, IV[ivRef.current]);
  }, [rates, containerMode, generateIntervalData]);

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
      const rawMode = d.raw.map(x => ({
        time: x.time, open: x.open * m, high: x.high * m, low: x.low * m, close: x.close * m
      }));
      cs = generateIntervalData(rawMode, IV[ivRef.current]);
    }
    
    if (cs.length > 0) {
      seriesRef.current.candle.setData(cs);
      seriesRef.current.area.setData(cs.map(x => ({ time: x.time, value: x.close })));
      lastRef.current = cs[cs.length - 1].close;
    }
  }, [mode, rate, rates, containerMode, buildCscData, generateIntervalData]);

  const updateLegend = useCallback(() => {
    const isCsc = mode === "csc";
    const d = isCsc ? dsRef.current.csc : dsRef.current[mode];
    if (!d || !d.raw || !d.raw.length) return;

    const n = d.raw.length;
    const multiplier = containerMode === "40ft" ? 25 : 1;
    const m = isCsc ? 1 : (d.mult(rates, rate) * multiplier);
    
    const f = d.raw[0].open * m;
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
  }, [mode, rate, rates, containerMode]);

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
    }, 100);
    return () => clearTimeout(t);
  }, [mode, containerMode, rate, type, rates, iv, range, cur, fitView, applyData, updateLegend]);

  useEffect(() => {
    if (!rates) return;
    tokenRef.current += 1;
    const currentToken = tokenRef.current;
    setFade(true);
    
    const count = 300; 
    const binanceIv = "1m";
    
    dsRef.current.gold.raw = [];
    dsRef.current.btc.raw = [];
    dsRef.current.usd.raw = [];
    dsRef.current.yuan.raw = [];
    dsRef.current.jpy.raw = [];
    dsRef.current.sar.raw = [];
    dsRef.current.csc.raw = [];

    const fetchBinancePage = async (symbol, interval, left) => {
      const path = `/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${left}`;
      const rows = await getJson(path);
      return rows.map(r => ({ time: Math.floor(r[0] / 1000) + WIB, open: +r[1], high: +r[2], low: +r[3], close: +r[4] }));
    };

    const fetchBitstampPage = async () => {
      const r = await fetch(`https://www.bitstamp.net/api/v2/ohlc/btcusd/?step=60&limit=300`);
      const j = await r.json();
      return (j?.data?.ohlc || []).map(o => ({ time: +o.timestamp + WIB, open: +o.open, high: +o.high, low: +o.low, close: +o.close }));
    };

    Promise.all([
      fetchBinancePage("PAXGUSDT", binanceIv, count),
      fetchBitstampPage().catch(() => fetchBinancePage("BTCUSDT", binanceIv, count)),
      fetchBinancePage("EURUSDT", binanceIv, count)
    ]).then(res => {
      if (currentToken !== tokenRef.current) return;
      
      dsRef.current.gold.raw = res[0];
      dsRef.current.btc.raw = res[1];

      const proxyData = res[2].map(x => ({
        time: x.time, open: x.open / 1.08, high: x.high / 1.08, low: x.low / 1.08, close: x.close / 1.08 
      }));

      dsRef.current.usd.raw = proxyData;
      dsRef.current.yuan.raw = proxyData;
      dsRef.current.jpy.raw = proxyData;
      dsRef.current.sar.raw = proxyData;

      applyRef.current();
      legendRef.current();
      fitRef.current(true);
      setFade(false);
    }).catch(() => {
      setFade(false);
      setStatus({ text: "GAGAL MEMUAT RIWAYAT.", isLive: false });
    });
  }, [rates]);

  // Real-time live update ticker setiap detik
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
          if (d.s === "BTCUSDT") livePrices.current.btcBn = parseFloat(d.p);
          if (d.s === "PAXGUSDT") livePrices.current.gold = parseFloat(d.p);
          if (d.s === "EURUSDT") livePrices.current.eurusdt = parseFloat(d.p);
        };
        ws.onclose = () => { if (!disposed) setTimeout(connectBinance, 3000); };
        wsRef.current.binance = ws;
      } catch(e) {}
    };

    connectBinance();

    const timer = setInterval(() => {
      const pGold = livePrices.current.gold;
      const pBtc = livePrices.current.btcBn;
      const pUsd = (livePrices.current.eurusdt || 1.08) / 1.08;

      if (pGold && pBtc && dsRef.current.usd.raw.length > 0) {
        const nowT = Math.floor(Date.now() / 1000) + WIB;
        ["gold", "btc", "usd"].forEach(k => {
          const arr = dsRef.current[k].raw;
          const val = k === "gold" ? pGold : (k === "btc" ? pBtc : pUsd);
          if (arr.length > 0) {
            const last = arr[arr.length - 1];
            if (nowT === last.time) {
              last.high = Math.max(last.high, val);
              last.low = Math.min(last.low, val);
              last.close = val;
            } else {
              arr.push({ time: nowT, open: val, high: val, low: val, close: val });
            }
          }
        });
        ["yuan", "jpy", "sar"].forEach(k => { dsRef.current[k].raw = dsRef.current.usd.raw; });
        applyRef.current();
        legendRef.current();
      }
    }, 1000);

    return () => {
      disposed = true;
      clearInterval(timer);
      if (wsRef.current.binance) wsRef.current.binance.close();
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
                onClick={handleCscClick}
                style={{ fontWeight: "bold" }}
                title="CSC Index (Klik masukkan kunci untuk membuka chart lain)"
              >
                CSC
              </button>

              {unlocked && (
                <>
                  <button type="button" className={`${styles.modeBtn} ${mode === "usd" ? styles.modeBtnActive : ""}`} onClick={() => setMode("usd")}>💵</button>
                  <button type="button" className={`${styles.modeBtn} ${mode === "yuan" ? styles.modeBtnActive : ""}`} onClick={() => setMode("yuan")}>中</button>
                  <button type="button" className={`${styles.modeBtn} ${mode === "jpy" ? styles.modeBtnActive : ""}`} onClick={() => setMode("jpy")}>💴</button>
                  <button type="button" className={`${styles.modeBtn} ${mode === "sar" ? styles.modeBtnActive : ""}`} onClick={() => setMode("sar")}>﷼</button>
                  <button type="button" className={`${styles.modeBtn} ${mode === "gold" ? styles.modeBtnActive : ""}`} onClick={() => setMode("gold")}>{marketClosed ? "🔒" : "🔐"}</button>
                  <button type="button" className={`${styles.modeBtn} ${mode === "btc" ? styles.modeBtnActive : ""}`} onClick={() => setMode("btc")}>⭐</button>
                </>
              )}
            </div>

            <div className={styles.modeSwitch} style={{ marginLeft: "8px" }}>
              <button type="button" className={`${styles.modeBtn} ${containerMode === "T" ? styles.modeBtnActive : ""}`} onClick={() => setContainerMode("T")}>T</button>
              <button type="button" className={`${styles.modeBtn} ${containerMode === "40ft" ? styles.modeBtnActive : ""}`} onClick={() => setContainerMode("40ft")}>40ft</button>
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
                <div className={`${styles.currencyDropdown}`}>
                  <div className={styles.dropLabel}>INTERVAL (TICK & SEC)</div>
                  {Object.keys(IV).map(v => (
                    <button key={v} className={`${styles.currencyOption} ${iv === v ? styles.currencyActive : ""}`} onClick={() => { setIv(v); setRange(null); setTimeDropOpen(false); }}>
                      <span>{IV[v].label}</span>
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
        </div>
      </div>
    </section>
  );
}
