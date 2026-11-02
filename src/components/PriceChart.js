"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createChart } from "lightweight-charts";
import styles from "./PriceChart.module.css";

const YUAN_BASE = 4750; // Basis 4.750 Yuan absolut untuk harga arang
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
  const [mode, setMode] = useState("yuan"); // Default mode diatur ke yuan (中)
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
  const modeRef = useRef("yuan");
  const rateRef = useRef(1);
  const ivRef = useRef("1m");
  
  const isFetchingHistory = useRef(false);
  const noMoreHistory = useRef(false);

  // Rumus Mode Yuan: (4750 CNY -> USD) dikali nilai tukar mata uang target (IDR, dll)
  const dsRef = useRef({
    yuan: { 
      raw: [], 
      mult: (ratesObj) => {
        const cnyToUsd = ratesObj && ratesObj.CNY ? (1 / ratesObj.CNY) : 0.150125;
        return YUAN_BASE * cnyToUsd; // Menghasilkan nilai USD untuk 4750 Yuan (~$713.10)
      } 
    }
  });

  const tokenRef = useRef(0);
  const livePrices = useRef({ cnyUsd: null });

  const rate = rates ? (cur === "USD" ? 1 : rates[cur] || 1) : 1;
  const curObj = CURRENCIES.find(c => c.code === cur) || CURRENCIES[0];
  const dec = cur === "IDR" || cur === "JPY" ? 0 : 2;

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

  // Infinite Scroll Listener
  useEffect(() => {
    if (!chartRef.current) return;
    const ts = chartRef.current.timeScale();
    
    const onScroll = (logicalRange) => {
      if (logicalRange && logicalRange.from < 50 && !isFetchingHistory.current && !noMoreHistory.current) {
        isFetchingHistory.current = true;
        setLegend(p => ({ ...p, availText: "⏳ Memuat riwayat..." }));

        const binanceIv = IV[ivRef.current]?.bin || "1m";
        const dYuan = dsRef.current.yuan.raw;

        if (!dYuan.length) {
          isFetchingHistory.current = false;
          return;
        }

        const oldestTime = (dYuan[0].time - WIB) * 1000 - 1;

        // Mengambil data historis klines untuk instrumen forex/crypto (misal EURUSDT atau simulasi tren valas CNY)
        getJson(`/api/v3/klines?symbol=EURUSDT&interval=${binanceIv}&limit=1000&endTime=${oldestTime}`).then(rows => {
          if (!rows.length) {
            noMoreHistory.current = true;
            setLegend(p => ({ ...p, availText: "⚠️ Semua riwayat telah dimuat" }));
          } else {
            const oldRows = rows.map(r => {
              const base = rates && rates.CNY ? (1 / rates.CNY) : 0.150125;
              const val = base * (+r[4] / 1.08); // Penyesuaian skala nilai tukar CNY/USD
              return { time: Math.floor(r[0]/1000) + WIB, open: val * 0.999, high: val * 1.001, low: val * 0.999, close: val };
            });

            dsRef.current.yuan.raw = uniqSorted([...oldRows, ...dYuan]);

            const curRange = ts.getVisibleLogicalRange();
            applyRef.current();

            if (curRange && oldRows.length > 0) {
              ts.setVisibleLogicalRange({
                from: curRange.from + oldRows.length,
                to: curRange.to + oldRows.length
              });
            }

            const dateFmt = new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
            setLegend(p => ({ ...p, availText: `📅 Riwayat sejak ${dateFmt.format(new Date(dsRef.current.yuan.raw[0].time * 1000))}` }));
          }
          isFetchingHistory.current = false;
        }).catch(() => {
          isFetchingHistory.current = false;
        });
      }
    };

    ts.subscribeVisibleLogicalRangeChange(onScroll);
    return () => ts.unsubscribeVisibleLogicalRangeChange(onScroll);
  }, [rates]);

  const fitView = useCallback((smooth = false) => {
    const d = dsRef.current.yuan;
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
    if (smooth) animateRange(ts, target, animRef);
    else { cancelAnimationFrame(animRef.current); ts.setVisibleLogicalRange(target); }
  }, [range]);

  const toggleFull = useCallback(async () => {
    const el = cardRef.current;
    if (!isFull) {
      setIsFull(true);
      try { if (el && el.requestFullscreen) await el.requestFullscreen(); } catch (e) {}
    } else {
      setIsFull(false);
      try { if (document.fullscreenElement) await document.exitFullscreen(); } catch (e) {}
    }
  }, [isFull]);

  const applyData = useCallback(() => {
    const d = dsRef.current.yuan;
    if (!d || !d.raw) return;

    // Rumus Total: (Nilai Kurs CNY ke USD) * 4750 * Kurs Mata Tujuan (IDR, dll)
    const cnyToUsd = rates && rates.CNY ? (1 / rates.CNY) : 0.150125;
    const multiplier = YUAN_BASE * cnyToUsd * rate;

    const cs = d.raw.map(x => ({
      time: x.time,
      open: x.open * YUAN_BASE * rate,
      high: x.high * YUAN_BASE * rate,
      low: x.low * YUAN_BASE * rate,
      close: x.close * YUAN_BASE * rate
    }));
    
    seriesRef.current.candle.setData(cs);
    seriesRef.current.area.setData(cs.map(x => ({ time: x.time, value: x.close })));
    lastRef.current = cs.length ? cs[cs.length - 1].close : null;
  }, [rate, rates]);

  const updateLegend = useCallback(() => {
    const d = dsRef.current.yuan;
    if (!d || !d.raw.length) return;

    const cnyToUsd = rates && rates.CNY ? (1 / rates.CNY) : 0.150125;
    const multiplier = YUAN_BASE * cnyToUsd * rate;

    const n = d.raw.length;
    let lookback = 120; 
    if (range) lookback = Math.min(n, RANGES[range]?.count || n);
    
    const f = d.raw[Math.max(0, n - lookback)].open * multiplier;
    const l = d.raw[n - 1].close * multiplier;
    
    const highs = d.raw.map(x => x.high * multiplier);
    const lows = d.raw.map(x => x.low * multiplier);

    const diff = l - f;
    const pct = f ? (diff / f) * 100 : 0;

    setLegend(prev => ({
      ...prev,
      val: l, chg: diff, pct: pct, isUp: diff >= 0,
      high: Math.max(...highs), low: Math.min(...lows)
    }));
  }, [rate, range, rates]);

  fitRef.current = fitView;
  applyRef.current = applyData;
  legendRef.current = updateLegend;
  rateRef.current = rate;
  ivRef.current = iv;

  useEffect(() => {
    const applyVis = () => {
      if (!seriesRef.current.candle) return;
      seriesRef.current.candle.applyOptions({ visible: type === "candle" });
      seriesRef.current.area.applyOptions({ visible: type === "area" });
    };
    const d = dsRef.current.yuan;
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
  }, [rate, type, rates]);

  // Load Initial History Data
  useEffect(() => {
    if (!rates) return;
    tokenRef.current += 1;
    const currentToken = tokenRef.current;
    setFade(true);
    
    isFetchingHistory.current = false;
    noMoreHistory.current = false;
    
    const count = range === "YTD" ? ytdDays() : (range ? RANGES[range]?.count : 750); 
    const binanceIv = IV[iv]?.bin || "1m";
    
    dsRef.current.yuan.raw = [];
    setLegend(p => ({ ...p, availText: "⏳ Memuat data kurs..." }));

    getJson(`/api/v3/klines?symbol=EURUSDT&interval=${binanceIv}&limit=${count}`).then(rows => {
      if (currentToken !== tokenRef.current) return;
      
      const baseCnyUsd = rates && rates.CNY ? (1 / rates.CNY) : 0.150125;
      dsRef.current.yuan.raw = rows.map(r => {
        const val = baseCnyUsd * (+r[4] / 1.08);
        return { time: Math.floor(r[0] / 1000) + WIB, open: val * 0.999, high: val * 1.001, low: val * 0.999, close: val };
      });

      const dateFmt = new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
      const sinceNote = dsRef.current.yuan.raw.length ? `📅 Riwayat sejak ${dateFmt.format(new Date(dsRef.current.yuan.raw[0].time * 1000))}` : "";
      
      setLegend(p => ({ ...p, availText: sinceNote }));
      setStatus({ text: "LIVE", isLive: true, error: null });
      applyRef.current();
      legendRef.current();
      fitRef.current(true);
      setFade(false);
    }).catch(e => {
      if (currentToken !== tokenRef.current) return;
      setFade(false);
      setStatus({ text: "GAGAL MEMUAT.", isLive: false, error: e.message });
    });
  }, [iv, range, rates]);

  return (
    <section className={styles.priceSection} id="harga">
      <div ref={cardRef} className={`${styles.priceCard} ${isFull ? styles.cardFull : ""}`}>
        <div className={styles.priceHeader}>
          <span className={styles.eyebrow}>Coconut Shell Charcoal .ID</span>
          
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

        <div className={`notranslate ${styles.priceMain}`} translate="no">
          <div className={styles.bigPrice}><Smooth value={legend.val} render={v => curObj.symbol + fmt(v, dec)} /><span className={styles.bigPriceUnit}> / TON</span></div>
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
                className={`${styles.modeBtn} ${mode === "yuan" ? styles.modeBtnActive : ""}`}
                onClick={() => setMode("yuan")}
                title="Yuan Mode (CNY to USD x 4750)"
              >
                中
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
