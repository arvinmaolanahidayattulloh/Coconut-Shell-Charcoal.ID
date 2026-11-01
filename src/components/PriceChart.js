"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createChart } from "lightweight-charts";
import styles from "./PriceChart.module.css";

const OZ = 31.1034768;
const GRAMS = 5;
const MARKUP = 1.125;
const BTC_FACTOR = 0.00909; 
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
  "1D":  { iv: "5m",  count: 288, label: "1D" },
  "5D":  { iv: "15m", count: 480, label: "5D" },
  "1M":  { iv: "1h",  count: 720, label: "1M" },
  "3M":  { iv: "4h",  count: 540, label: "3M" },
  "6M":  { iv: "12h", count: 360, label: "6M" },
  "YTD": { iv: "1d",  count: 0,   label: "YTD" },
  "1Y":  { iv: "1d",  count: 365, label: "1Y" },
  "5Y":  { iv: "3d",  count: 609, label: "5Y" },
  "10Y": { iv: "3d",  count: 1217, label: "10Y" }
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
  if (day === 1 && hour < 22) return false;
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

export default function PriceChart() {
  const [marketClosed, setMarketClosed] = useState(false);
  const [mode, setMode] = useState("btc"); 
  const [iv, setIv] = useState("1m");       
  const [range, setRange] = useState(null);
  const [type, setType] = useState("candle");
  const [isFull, setIsFull] = useState(false);
  
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
  
  const dsRef = useRef({
    gold: { raw: [], mult: () => GRAMS * MARKUP / OZ },
    btc:  { raw: [], mult: () => BTC_FACTOR }
  });
  const tokenRef = useRef(0);
  const livePrices = useRef({ gold: null, btcBn: null, btcBs: null, btcSrc: "Bitstamp" });
  const wsRef = useRef({ binance: null, bitstamp: null });

  const rate = rates ? (cur === "USD" ? 1 : rates[cur] || 1) : 1;
  const curObj = CURRENCIES.find(c => c.code === cur) || CURRENCIES[0];
  const dec = cur === "IDR" || cur === "JPY" ? 0 : 2;

  useEffect(() => {
    const open = isXauMarketOpen();
    setMarketClosed(!open);
    setMode(open ? "gold" : "btc");
  }, []);

  useEffect(() => {
    fetch("/api/prices").then(r => r.json()).then(d => {
      if (d.rates) setRates(d.rates);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      autoSize: true,
      layout: { background: { type: "solid", color: "transparent" }, textColor: "#787b86", fontFamily: "system-ui, sans-serif", fontSize: 11 },
      grid: { vertLines: { color: "#f0f3fa" }, horzLines: { color: "#f0f3fa" } },
      rightPriceScale: { borderColor: "#e0e3eb", scaleMargins: { top: 0.22, bottom: 0.08 } },
      leftPriceScale: { visible: false },
      timeScale: { 
        borderColor: "#e0e3eb", 
        timeVisible: IV[iv]?.step < 86400, 
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
      wickUpColor: "#089981", wickDownColor: "#f23645"
    });

    const area = chart.addAreaSeries({
      lineColor: "#2962ff", lineWidth: 2,
      topColor: "rgba(41, 98, 255, 0.28)", bottomColor: "rgba(41, 98, 255, 0.02)",
      visible: false
    });

    chartRef.current = chart;
    seriesRef.current = { candle, area };

    return () => chart.remove();
  }, [iv]); 

  useEffect(() => {
    if (!chartRef.current) return;
    seriesRef.current.candle.applyOptions({ visible: type === "candle" });
    seriesRef.current.area.applyOptions({ visible: type === "area" });
  }, [type]);

  const fitView = useCallback(() => {
    const d = dsRef.current[mode];
    if (!d || !d.raw || !d.raw.length || !chartRef.current) return;
    const n = d.raw.length;
    const ts = chartRef.current.timeScale();
    if (range) {
      ts.fitContent();
    } else {
      ts.setVisibleLogicalRange({ from: Math.max(0, n - 100), to: n + 1 });
    }
  }, [mode, range]);

  // Tombol FULL: pakai Fullscreen API bila ada (desktop/Android), fallback CSS fixed (iPhone)
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

  // Sinkron state saat keluar fullscreen lewat Esc / gesture browser
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

  // Mode layar penuh: kunci scroll, Esc (fallback), dan sesuaikan chart
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setIsFull(false); };
    if (isFull) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKey);
    }
    const t = setTimeout(() => fitView(), 150);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      clearTimeout(t);
    };
  }, [isFull, fitView]);

  // Ukuran ulang saat jendela diubah, F11, atau HP diputar
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

  const applyData = useCallback(() => {
    const d = dsRef.current[mode];
    if (!d || !d.raw) return;
    const m = d.mult() * rate;
    
    const cs = d.raw.map(x => ({
      time: x.time,
      open: x.open * m,
      high: x.high * m,
      low: x.low * m,
      close: x.close * m
    }));
    
    seriesRef.current.candle.setData(cs);
    seriesRef.current.area.setData(cs.map(x => ({ time: x.time, value: x.close })));
  }, [mode, rate]);

  const updateLegend = useCallback(() => {
    const d = dsRef.current[mode];
    if (!d || !d.raw.length) return;

    const m = d.mult() * rate;
    const f = d.raw[0].open * m;
    const last = d.raw[d.raw.length - 1].close;
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
  }, [mode, rate]);

  useEffect(() => {
    if (!rates) return;
    tokenRef.current += 1;
    const currentToken = tokenRef.current;
    
    const count = range === "YTD" ? ytdDays() : (range ? RANGES[range]?.count : 300);
    const binanceIv = IV[iv]?.bin || "1m";
    
    dsRef.current.gold.raw = [];
    dsRef.current.btc.raw = [];
    setLegend(p => ({ ...p, availText: "MEMUAT RIWAYAT TANPA BATAS..." }));

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
    let btcSrc = "Bitstamp";
    const pBtc = fetchBitstampPage(binanceIv, count).then(cs => {
      if (!cs.length) throw new Error("data kosong"); return cs;
    }).catch(() => {
      btcSrc = "Binance"; return fetchBinancePage("BTCUSDT", binanceIv, count);
    });

    Promise.all([pGold, pBtc]).then(res => {
      if (currentToken !== tokenRef.current) return;
      livePrices.current.btcSrc = btcSrc;
      
      dsRef.current.gold.raw = res[0];
      dsRef.current.btc.raw = res[1];

      const dateFmt = new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
      const sinceNote = (d) => (d.raw.length && d.raw.length < count - 2) ? `RIWAYAT SEJAK ${dateFmt.format(new Date(d.raw[0].time * 1000)).toUpperCase()}` : "";
      
      setLegend(p => ({ ...p, availText: sinceNote(dsRef.current[mode]) }));
      applyData();
      fitView();
      setTimeout(() => { if (currentToken === tokenRef.current) fitView(); }, 300);
      updateLegend();
    }).catch(e => {
      if (currentToken !== tokenRef.current) return;
      setStatus({ text: "GAGAL MEMUAT RIWAYAT.", isLive: false, error: e.message });
      setLegend(p => ({ ...p, availText: "" }));
    });
  }, [iv, range, mode, rates, applyData, fitView, updateLegend]); 

  useEffect(() => {
    if (!rates) return;

    const connectBinance = () => {
      try {
        const ws = new WebSocket("wss://stream.binance.com:9443/stream?streams=btcusdt@trade/paxgusdt@trade");
        ws.onopen = () => setStatus({ text: "LIVE", isLive: true, error: null });
        ws.onmessage = (ev) => {
          const d = JSON.parse(ev.data).data;
          if (!d || !d.p) return;
          if (d.s === "BTCUSDT") livePrices.current.btcBn = parseFloat(d.p);
          if (d.s === "PAXGUSDT") livePrices.current.gold = parseFloat(d.p);
        };
        ws.onclose = () => setTimeout(connectBinance, 3000);
        wsRef.current.binance = ws;
      } catch(e) {}
    };

    const connectBitstamp = () => {
      try {
        const w = new WebSocket("wss://ws.bitstamp.net");
        w.onopen = () => w.send(JSON.stringify({ event: "bts:subscribe", data: { channel: "live_trades_btcusd" } }));
        w.onmessage = (ev) => {
          try {
            const m = JSON.parse(ev.data);
            if (m.event === "trade" && m.data) livePrices.current.btcBs = parseFloat(m.data.price_str || m.data.price);
          } catch(e) {}
        };
        w.onclose = () => setTimeout(connectBitstamp, 3000);
        wsRef.current.bitstamp = w;
      } catch(e) {}
    };

    connectBinance();
    connectBitstamp();

    const timer = setInterval(() => {
      ["gold", "btc"].forEach(key => {
        const d = dsRef.current[key];
        const pRaw = key === "gold" ? livePrices.current.gold : (livePrices.current.btcSrc === "Bitstamp" && livePrices.current.btcBs != null ? livePrices.current.btcBs : livePrices.current.btcBn);
        
        if (pRaw == null || !d.raw.length) return;
        
        const last = d.raw[d.raw.length - 1];
        const step = IV[iv].step;
        const nowT = Math.floor(Date.now() / 1000) + WIB;

        let cdl;
        if (nowT >= last.time + step) {
          const t = last.time + step * Math.floor((nowT - last.time) / step);
          cdl = { time: t, open: pRaw, high: pRaw, low: pRaw, close: pRaw };
          d.raw.push(cdl);
        } else {
          last.high = Math.max(last.high, pRaw);
          last.low = Math.min(last.low, pRaw);
          last.close = pRaw;
          cdl = last;
        }

        if (key === mode) {
          const m = d.mult() * rate;
          const s = { time: cdl.time, open: cdl.open * m, high: cdl.high * m, low: cdl.low * m, close: cdl.close * m };
          seriesRef.current.candle.update(s);
          seriesRef.current.area.update({ time: s.time, value: s.close });
        }
      });
      updateLegend();
    }, 1000);

    return () => {
      clearInterval(timer);
      if (wsRef.current.binance) wsRef.current.binance.close();
      if (wsRef.current.bitstamp) wsRef.current.bitstamp.close();
    };
  }, [mode, iv, rate, updateLegend]);

  return (
    <section className={styles.priceSection} id="harga">
      <div ref={cardRef} className={`${styles.priceCard} ${isFull ? styles.cardFull : ""}`}>
        <div className={styles.priceHeader}>
          <span className={styles.eyebrow}>Coconut Shell Charcoal</span>
          
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
        
        {/* translate="no" dan notranslate agar Google Translate tidak merusak/membekukan angka harga */}
        <div className={`notranslate ${styles.priceMain}`} translate="no">
          <div className={styles.bigPrice}>{curObj.symbol}{fmt(legend.val, dec)}<span className={styles.bigPriceUnit}> / TON</span></div>
          <div className={styles.priceStats}>
            <div className={styles.statBox}><span className={styles.statLabel}>PERUBAHAN</span><span className={`${styles.statVal} ${legend.isUp ? styles.up : styles.down}`}>{legend.isUp ? "\u25B2" : "\u25BC"} {legend.isUp ? "+" : ""}{fmt(legend.chg, dec)} ({legend.isUp ? "+" : ""}{fmt(legend.pct, 2)}%)</span></div>
            <div className={styles.statBox}><span className={styles.statLabel}>TERTINGGI</span><span className={styles.statVal}>{curObj.symbol}{fmt(legend.high, dec)}</span></div>
            <div className={styles.statBox}><span className={styles.statLabel}>TERENDAH</span><span className={styles.statVal}>{curObj.symbol}{fmt(legend.low, dec)}</span></div>
          </div>
        </div>
        
        {/* TOOLBAR (di luar chart) */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarGroup}>
            <div className={styles.modeSwitch}>
              <button
                type="button"
                className={`${styles.modeBtn} ${mode === "gold" ? styles.modeBtnActive : ""}`}
                onClick={() => setMode("gold")}
              >
                {marketClosed ? "🔒" : "🔐"}
              </button>
              <button
                type="button"
                className={`${styles.modeBtn} ${mode === "btc" ? styles.modeBtnActive : ""}`}
                onClick={() => setMode("btc")}
              >
                ⭐
              </button>
            </div>

            <button className={`${styles.currencyBtn} ${styles.smallBtn} ${type === "candle" ? styles.currencyActive : ""}`} onClick={() => setType("candle")} type="button">CANDLE</button>
            <button className={`${styles.currencyBtn} ${styles.smallBtn} ${type === "area" ? styles.currencyActive : ""}`} onClick={() => setType("area")} type="button">AREA</button>
          </div>

          <div className={styles.toolbarGroup}>
            {/* DROPDOWN WAKTU (hanya menampilkan nilai, misalnya 1M) */}
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

            {/* TOMBOL FULL TAB */}
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

          {/* CHART */}
          <div style={isFull
            ? { position: 'relative', width: '100%', flex: 1, minHeight: 0 }
            : { position: 'relative', width: '100%', height: '480px' }}>

            {marketClosed && mode === "gold" && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 5, pointerEvents: 'none', opacity: 0.12
              }}>
                <span style={{ fontSize: '140px' }}>🔐</span>
              </div>
            )}

            <div ref={chartContainerRef} style={{ position: 'absolute', inset: 0, zIndex: 2 }}></div>
          </div>

          {marketClosed && mode === "gold" && (
            <div style={{
              marginTop: '12px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              color: '#991b1b', fontSize: '13px', fontWeight: '500', flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚠️</span>
                <span><strong>PASAR TUTUP. PERDAGANGAN LIBUR.</strong> Buka kembali Senin Pukul 22:00 UTC.</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
