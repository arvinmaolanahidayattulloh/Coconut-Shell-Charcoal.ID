"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";
import styles from "./PriceChart.module.css";

// ==========================================
// KONSTANTA & KONFIGURASI
// ==========================================
const OZ = 31.1034768;
const GRAMS = 5;
const MARKUP = 1.125;
const BTC_FACTOR = 0.0909; 
const WIB = 7 * 3600; 

const IV = {
  "1m":  { step: 60,     bin: "1m",  label: "1m" },
  "5m":  { step: 300,    bin: "5m",  label: "5m" },
  "15m": { step: 900,    bin: "15m", label: "15m" },
  "30m": { step: 1800,   bin: "30m", label: "30m" },
  "1h":  { step: 3600,   bin: "1h",  label: "1h" },
  "4h":  { step: 14400,  bin: "4h",  label: "4h" },
  "12h": { step: 43200,  bin: "12h", label: "12h" },
  "1d":  { step: 86400,  bin: "1d",  label: "1D" },
  "3d":  { step: 259200, bin: "3d",  label: "3D" }
};

const RANGES = {
  "1D":  { iv: "5m",  count: 288, label: "Rentang: 1 Hari (1D)" },
  "5D":  { iv: "15m", count: 480, label: "Rentang: 5 Hari (5D)" },
  "1M":  { iv: "1h",  count: 720, label: "Rentang: 1 Bulan (1M)" },
  "3M":  { iv: "4h",  count: 540, label: "Rentang: 3 Bulan (3M)" },
  "6M":  { iv: "12h", count: 360, label: "Rentang: 6 Bulan (6M)" },
  "YTD": { iv: "1d",  count: 0,   label: "Rentang: Tahun Ini (YTD)" },
  "1Y":  { iv: "1d",  count: 365, label: "Rentang: 1 Tahun (1Y)" },
  "5Y":  { iv: "3d",  count: 609, label: "Rentang: 5 Tahun (5Y)" },
  "10Y": { iv: "3d",  count: 1217, label: "Rentang: 10 Tahun (10Y)" }
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
  if (day === 5 && hour >= 22) return false;
  if (day === 0 && hour < 22) return false;
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
  const [mode, setMode] = useState("gold"); // 'gold' atau 'btc'
  const [iv, setIv] = useState("5m");
  const [range, setRange] = useState("1D");
  const [type, setType] = useState("candle");
  const [calib, setCalib] = useState(1);
  const [manualXau, setManualXau] = useState("");
  
  const [cur, setCur] = useState("IDR");
  const [rates, setRates] = useState(null);
  
  // Dropdown States
  const [curDropOpen, setCurDropOpen] = useState(false);
  const [timeDropOpen, setTimeDropOpen] = useState(false);
  
  const [status, setStatus] = useState({ text: "Menghubungkan...", isLive: false, error: null });
  const [legend, setLegend] = useState({ val: 0, chg: 0, pct: 0, rawText: "", availText: "", isUp: true, high: 0, low: 0 });
  const [marketClosed, setMarketClosed] = useState(false);

  const chartRef = useRef(null);
  const seriesRef = useRef({ candle: null, area: null });
  const chartContainerRef = useRef(null);
  
  const dsRef = useRef({
    gold: { raw: [], mult: () => calib * GRAMS * MARKUP / OZ },
    btc:  { raw: [], mult: () => BTC_FACTOR }
  });
  const tokenRef = useRef(0);
  const livePrices = useRef({ gold: null, btcBn: null, btcBs: null, btcSrc: "Bitstamp" });
  const wsRef = useRef({ binance: null, bitstamp: null });

  const rate = rates ? (cur === "USD" ? 1 : rates[cur] || 1) : 1;
  const curObj = CURRENCIES.find(c => c.code === cur) || CURRENCIES[0];
  const dec = cur === "IDR" || cur === "JPY" ? 0 : 2;

  // Cek Status Pasar XAU berkala
  useEffect(() => {
    const checkMarket = () => {
      const open = isXauMarketOpen();
      setMarketClosed(!open);
      if (!open && mode === "gold") {
        setMode("btc"); // Alihkan otomatis ke BTC jika XAU tutup
      }
    };
    checkMarket();
    const interval = setInterval(checkMarket, 30000);
    return () => clearInterval(interval);
  }, [mode]);

  useEffect(() => {
    fetch("/api/prices").then(r => r.json()).then(d => {
      if (d.rates) setRates(d.rates);
    }).catch(() => {});
  }, []);

  // Inisialisasi Lightweight Charts
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      autoSize: true,
      layout: { background: { type: "solid", color: "transparent" }, textColor: "#787b86", fontFamily: "system-ui, sans-serif", fontSize: 11 },
      grid: { vertLines: { color: "#f0f3fa" }, horzLines: { color: "#f0f3fa" } },
      rightPriceScale: { borderColor: "#e0e3eb", scaleMargins: { top: 0.22, bottom: 0.08 } },
      leftPriceScale: { visible: false },
      timeScale: { borderColor: "#e0e3eb", timeVisible: IV[iv]?.step < 86400, secondsVisible: false, rightOffset: 4 },
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
  }, []); 

  useEffect(() => {
    if (!chartRef.current) return;
    seriesRef.current.candle.applyOptions({ visible: type === "candle" });
    seriesRef.current.area.applyOptions({ visible: type === "area" });
    chartRef.current.applyOptions({ timeScale: { timeVisible: IV[iv]?.step < 86400 } });
  }, [type, iv]);

  const fitView = useCallback(() => {
    const n = dsRef.current[mode].raw.length;
    if (!n || !chartRef.current) return;
    const ts = chartRef.current.timeScale();
    if (range) ts.fitContent();
    else ts.setVisibleLogicalRange({ from: Math.max(0, n - 120), to: n + 4 });
  }, [mode, range]);

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

    let rawText = "";
    if (mode === "gold") {
      const xau = last * calib;
      rawText = `XAUUSD ${fmt(xau, 2)} · per gram ${fmt(xau / OZ, 4)}`;
    } else {
      rawText = `BTCUSD ⭐ ${fmt(last, 2)}`;
    }

    const diff = l - f;
    const pct = f ? (diff / f) * 100 : 0;

    setLegend(prev => ({
      ...prev,
      val: l, chg: diff, pct: pct, isUp: diff >= 0, rawText,
      high: Math.max(...highs), low: Math.min(...lows)
    }));
  }, [mode, rate, calib]);

  // Fetch History Tanpa Batas (Paginasi Otomatis)
  useEffect(() => {
    if (!rates) return;
    tokenRef.current += 1;
    const currentToken = tokenRef.current;
    
    const count = range === "YTD" ? ytdDays() : (RANGES[range]?.count || 1000);
    
    dsRef.current.gold.raw = [];
    dsRef.current.btc.raw = [];
    setLegend(p => ({ ...p, availText: "Memuat riwayat tanpa batas…" }));

    const fetchBinancePage = async (symbol, interval, left, endMs = null, all = []) => {
      const n = Math.min(left, 1000);
      const path = `/api/v3/klines?symbol=${symbol}&interval=${IV[interval].bin}&limit=${n}${endMs ? "&endTime=" + endMs : ""}`;
      const rows = await getJson(path);
      const cs = rows.map(r => ({ time: Math.floor(r[0] / 1000) + WIB, open: +r[1], high: +r[2], low: +r[3], close: +r[4] }));
      all = cs.concat(all);
      left -= rows.length;
      if (left > 0 && rows.length === n) return fetchBinancePage(symbol, interval, left, rows[0][0] - 1, all);
      return uniqSorted(all);
    };

    const fetchBitstampPage = async (interval, left, endSec = Math.floor(Date.now() / 1000), all = []) => {
      const step = IV[interval].step;
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

    const pGold = fetchBinancePage("PAXGUSDT", iv, count);
    let btcSrc = "Bitstamp";
    const pBtc = fetchBitstampPage(iv, count).then(cs => {
      if (!cs.length) throw new Error("data kosong"); return cs;
    }).catch(() => {
      btcSrc = "Binance"; return fetchBinancePage("BTCUSDT", iv, count);
    });

    Promise.all([pGold, pBtc]).then(res => {
      if (currentToken !== tokenRef.current) return;
      livePrices.current.btcSrc = btcSrc;
      dsRef.current.gold.raw = res[0];
      dsRef.current.btc.raw = res[1];

      const dateFmt = new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
      const sinceNote = (d) => (d.raw.length && d.raw.length < count - 2) ? `Riwayat sejak ${dateFmt.format(new Date(d.raw[0].time * 1000))}` : "";
      
      setLegend(p => ({ ...p, availText: sinceNote(dsRef.current[mode]) }));
      applyData();
      fitView();
      setTimeout(() => { if (currentToken === tokenRef.current) fitView(); }, 400);
      updateLegend();
    }).catch(e => {
      if (currentToken !== tokenRef.current) return;
      setStatus({ text: "Gagal memuat riwayat.", isLive: false, error: e.message });
      setLegend(p => ({ ...p, availText: "" }));
    });
  }, [iv, range, mode, rates, applyData, fitView, updateLegend]); 

  // WebSocket Live Updates
  useEffect(() => {
    if (!rates) return;

    const connectBinance = () => {
      try {
        const ws = new WebSocket("wss://stream.binance.com:9443/stream?streams=btcusdt@trade/paxgusdt@trade");
        ws.onopen = () => setStatus({ text: "Live", isLive: true, error: null });
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
  }, [mode, iv, rate, calib, updateLegend]);

  return (
    <section className={styles.priceSection} id="harga">
      <div className={styles.priceCard}>
        <div className={styles.priceHeader}>
          <span className={styles.eyebrow}>Coconut Shell Charcoal</span>
          
          <div className={styles.headerRight}>
            <div className={styles.liveIndicator}>
              <span className={`${styles.liveDot} ${status.isLive ? styles.liveDotActive : ""}`}></span>
              <span className={styles.liveText} style={{ color: status.isLive ? "#22c55e" : "#9ca3af" }}>
                {status.text}
              </span>
            </div>

            {/* CURRENCY DROPDOWN */}
            <div className={styles.currencySelector}>
              <button className={styles.currencyBtn} onClick={() => setCurDropOpen(!curDropOpen)} type="button">
                {cur} ({curObj.symbol})
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
        
        <div className={styles.priceMain}>
          <div className={styles.bigPrice}>{curObj.symbol}{fmt(legend.val, dec)}<span className={styles.bigPriceUnit}> / ton</span></div>
          <div className={styles.priceStats}>
            <div className={styles.statBox}><span className={styles.statLabel}>Perubahan</span><span className={`${styles.statVal} ${legend.isUp ? styles.up : styles.down}`}>{legend.isUp ? "\u25B2" : "\u25BC"} {legend.isUp ? "+" : ""}{fmt(legend.chg, dec)} ({legend.isUp ? "+" : ""}{fmt(legend.pct, 2)}%)</span></div>
            <div className={styles.statBox}><span className={styles.statLabel}>Tertinggi</span><span className={styles.statVal}>{curObj.symbol}{fmt(legend.high, dec)}</span></div>
            <div className5={styles.statBox}><span className={styles.statLabel}>Terendah</span><span className={styles.statVal}>{curObj.symbol}{fmt(legend.low, dec)}</span></div>
          </div>
        </div>
        
        <div className={styles.chartContainer}>
          {/* TOOLBAR CONTROLS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f3f4f6' }}>
            
            {/* BARIS 1: TOMBOL ON/OFF XAU & BTC */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              
              {/* Tombol XAU dengan status Market Close & Gembok */}
              <button 
                className={`${styles.currencyBtn} ${mode === "gold" ? styles.currencyActive : ""}`} 
                onClick={() => { if(!marketClosed) setMode("gold"); }} 
                style={{ 
                  opacity: marketClosed ? 0.6 : 1, 
                  background: marketClosed ? "#e5e7eb" : undefined,
                  cursor: marketClosed ? "not-allowed" : "pointer"
                }}
                title={marketClosed ? "Pasar XAUUSD Sedang Tutup" : "Aktifkan XAUUSD"}
              >
                {marketClosed && "🔒 "} XAUUSD {marketClosed && "(TUTUP)"}
              </button>

              {/* Tombol BTC dengan Bintang */}
              <button 
                className={`${styles.currencyBtn} ${mode === "btc" ? styles.currencyActive : ""}`} 
                onClick={() => setMode("btc")}
              >
                BTC ⭐
              </button>

              {/* WAKTU DROPDOWN (PILIHAN INTERVAL & RANGE SEPERTI CURRENCY) */}
              <div className={styles.currencySelector} style={{ marginLeft: 'auto' }}>
                <button className={styles.currencyBtn} onClick={() => setTimeDropOpen(!timeDropOpen)} type="button">
                  🕒 Waktu: {range ? `Range (${range})` : `Interval (${iv})`}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: timeDropOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease" }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                {timeDropOpen && (
                  <div className={styles.currencyDropdown} style={{ right: 0, left: 'auto', width: '220px' }}>
                    <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', color: '#9ca3af' }}>RENTANG WAKTU (RANGE)</div>
                    {Object.keys(RANGES).map(r => (
                      <button key={r} className={`${styles.currencyOption} ${range === r ? styles.currencyActive : ""}`} onClick={() => { setRange(r); setIv(RANGES[r].iv); setTimeDropOpen(false); }}>
                        <span>{RANGES[r].label}</span>
                      </button>
                    ))}
                    <div style={{ borderTop: '1px solid #f3f4f6', margin: '4px 0' }}></div>
                    <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', color: '#9ca3af' }}>INTERVAL CANDLE</div>
                    {["1m","5m","15m","30m","1h","4h","1d","3d"].map(v => (
                      <button key={v} className={`${styles.currencyOption} ${iv === v && !range ? styles.currencyActive : ""}`} onClick={() => { setIv(v); setRange(null); setTimeDropOpen(false); }}>
                        <span>Interval: {v}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* BARIS 2: TIPE GRAFIK & KALIBRASI */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button className={`${styles.currencyBtn} ${type === "candle" ? styles.currencyActive : ""}`} onClick={() => setType("candle")} style={{ padding: '4px 12px', fontSize: '12px' }}>Candle</button>
                <button className={`${styles.currencyBtn} ${type === "area" ? styles.currencyActive : ""}`} onClick={() => setType("area")} style={{ padding: '4px 12px', fontSize: '12px' }}>Area</button>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid #e5e7eb', paddingLeft: '12px' }}>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>Kalibrasi XAU:</span>
                <input type="number" step="0.01" min="0" placeholder="mis. 4000.00" value={manualXau} onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  const rawData = dsRef.current.gold.raw;
                  const rawPrice = rawData.length ? rawData[rawData.length - 1].close : livePrices.current.gold;
                  setManualXau(e.target.value);
                  setCalib((isFinite(v) && v > 0 && rawPrice) ? v / rawPrice : 1);
                  if (mode === "gold") applyData();
                  updateLegend();
                }} disabled={mode !== "gold"} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #e5e7eb', fontSize: '12px', width: '110px' }} />
                <button onClick={() => { setManualXau(""); setCalib(1); if(mode === "gold") applyData(); updateLegend(); }} disabled={mode !== "gold"} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '12px', cursor: mode === "gold" ? 'pointer' : 'not-allowed' }}>Reset</button>
              </div>
            </div>
            
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
              {legend.rawText} {legend.availText && `| ${legend.availText}`}
            </div>

          </div>

          {/* AREA CHART & OVERLAY MARKET CLOSE */}
          <div style={{ position: 'relative', width: '100%', height: '480px' }}>
            <div ref={chartContainerRef} style={{ width: '100%', height: '100%', position: 'relative' }}></div>
            
            {/* TAMPILAN GEMBOK & PESAN JIKA XAU TUTUP DAN DIPILIH */}
            {marketClosed && mode === "gold" && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', zIndex: 20, gap: '12px'
              }}>
                <div style={{ fontSize: '48px' }}>🔒</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>PASAR XAUUSD SEDANG TUTUP</div>
                <div style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', maxWidth: '320px' }}>
                  Perdagangan emas fisik/berjangka libur pada akhir pekan. Silakan beralih ke mode **BTC ⭐** untuk melihat pergerakan live.
                </div>
                <button 
                  onClick={() => setMode("btc")}
                  style={{
                    padding: '8px 16px', background: '#c45e20', color: '#fff', border: 'none',
                    borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(196, 94, 32, 0.2)'
                  }}
                >
                  Beralih ke BTC ⭐
                </button>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </section>
  );
}
