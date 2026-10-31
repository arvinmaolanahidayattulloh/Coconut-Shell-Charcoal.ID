"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./PriceChart.module.css";

const K = 0.177946;

const CURRENCIES = [
  { code: "IDR", symbol: "Rp" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "\u20AC" },
  { code: "GBP", symbol: "\u00A3" },
  { code: "JPY", symbol: "\u00A5" },
  { code: "SGD", symbol: "S$" },
  { code: "MYR", symbol: "RM" },
  { code: "AUD", symbol: "A$" },
  { code: "CNY", symbol: "\u00A5" },
  { code: "SAR", symbol: "SAR" },
];

function fmt(num, dec) {
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(num);
}

export default function PriceChart() {
  const [xau, setXau] = useState(null);
  const [rates, setRates] = useState(null);
  const [candles, setCandles] = useState([]);
  const [cur, setCur] = useState("IDR");
  const [dropOpen, setDropOpen] = useState(false);
  const [tip, setTip] = useState(null);
  const [live, setLive] = useState(false);
  const canvasRef = useRef(null);
  const curCandle = useRef(null);
  const seeded = useRef(false);

  const rate = rates ? (cur === "USD" ? 1 : rates[cur] || 1) : 1;
  const curObj = CURRENCIES.find((c) => c.code === cur);
  const dec = cur === "IDR" || cur === "JPY" ? 0 : 2;

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch("/api/prices");
      if (!res.ok) return;
      const d = await res.json();
      if (d.error) return;
      if (d.xauusd) setXau(d.xauusd);
      if (d.rates) setRates(d.rates);
      setLive(true);

      if (d.xauusd) {
        const now = new Date();
        const p = d.xauusd.mid * K;

        if (!seeded.current) {
          seeded.current = true;
          const seed = [];
          for (let i = 29; i >= 1; i--) {
            const t = new Date(now.getTime() - i * 60000);
            const v = (Math.random() - 0.5) * p * 0.002;
            const o = p + v;
            const c = o + (Math.random() - 0.5) * p * 0.001;
            seed.push({ time: t, open: o, high: Math.max(o, c) + Math.random() * p * 0.0005, low: Math.min(o, c) - Math.random() * p * 0.0005, close: c });
          }
          setCandles(seed);
          curCandle.current = { time: now, open: p, high: p, low: p, close: p };
          return;
        }

        if (!curCandle.current || now - new Date(curCandle.current.time) > 60000) {
          if (curCandle.current) {
            setCandles((prev) => {
              const u = [...prev, { ...curCandle.current }];
              if (u.length > 60) u.shift();
              return u;
            });
          }
          curCandle.current = { time: now, open: p, high: p, low: p, close: p };
        } else {
          curCandle.current.close = p;
          curCandle.current.high = Math.max(curCandle.current.high, p);
          curCandle.current.low = Math.min(curCandle.current.low, p);
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 15000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const all = curCandle.current ? [...candles, curCandle.current] : candles;
  const cRated = all.map((c) => ({ time: c.time, open: c.open * rate, high: c.high * rate, low: c.low * rate, close: c.close * rate }));
  const highs = cRated.map((c) => c.high);
  const lows = cRated.map((c) => c.low);
  const hVal = highs.length ? Math.max(...highs) : 0;
  const lVal = lows.length ? Math.min(...lows) : 0;
  const fc = cRated[0]?.close || 0;
  const lc = cRated[cRated.length - 1]?.close || 0;
  const chg = fc ? (((lc - fc) / fc) * 100).toFixed(2) : "0.00";
  const isUp = parseFloat(chg) >= 0;
  const price = xau ? xau.mid * K * rate : 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || cRated.length < 2) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const pad = { top: 20, right: 80, bottom: 40, left: 20 };
    const cW = w - pad.left - pad.right;
    const cH = h - pad.top - pad.bottom;
    const rng = (hVal - lVal) || 1;
    const mg = rng * 0.05;
    const mn = lVal - mg;
    const mx = hVal + mg;
    const fr = mx - mn;
    const gY = (v) => pad.top + cH - ((v - mn) / fr) * cH;

    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (i / 5) * cH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();
    }

    ctx.font = "11px system-ui, sans-serif";
    ctx.fillStyle = "#9ca3af";
    ctx.textAlign = "left";
    for (let i = 0; i <= 5; i++) {
      const v = mx - (i / 5) * fr;
      const y = pad.top + (i / 5) * cH;
      ctx.fillText(rate > 1000 ? (v / 1e6).toFixed(2) + " jt" : fmt(v, 2), w - pad.right + 8, y + 4);
    }

    const n = cRated.length;
    const gap = cW / n;
    const bw = Math.max(4, Math.min(20, gap * 0.6));
    for (let i = 0; i < n; i++) {
      const c = cRated[i];
      const x = pad.left + gap * i + gap / 2;
      const bull = c.close >= c.open;
      const bt = gY(Math.max(c.open, c.close));
      const bb = gY(Math.min(c.open, c.close));
      const bh = Math.max(bb - bt, 1);

      ctx.strokeStyle = bull ? "#16a34a" : "#dc2626";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, gY(c.high));
      ctx.lineTo(x, bt);
      ctx.moveTo(x, bb);
      ctx.lineTo(x, gY(c.low));
      ctx.stroke();

      ctx.fillStyle = bull ? "#22c55e" : "#ef4444";
      ctx.fillRect(x - bw / 2, bt, bw, bh);
      ctx.strokeStyle = bull ? "#16a34a" : "#dc2626";
      ctx.lineWidth = 1;
      ctx.strokeRect(x - bw / 2, bt, bw, bh);
    }

    ctx.fillStyle = "#9ca3af";
    ctx.textAlign = "center";
    const lbl = Math.min(6, n);
    for (let i = 0; i < lbl; i++) {
      const idx = Math.round((i / (lbl - 1)) * (n - 1));
      if (cRated[idx]) {
        const t = new Date(cRated[idx].time);
        ctx.fillText(t.getHours().toString().padStart(2, "0") + ":" + t.getMinutes().toString().padStart(2, "0"), pad.left + gap * idx + gap / 2, h - pad.bottom + 24);
      }
    }
  }, [cRated, hVal, lVal, rate]);

  const onHover = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || cRated.length < 2) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const cW = rect.width - 20 - 80;
    const n = cRated.length;
    const idx = Math.floor((x - 20) / (cW / n));
    if (idx < 0 || idx >= n) { setTip(null); return; }
    const c = cRated[idx];
    const t = new Date(c.time);
    setTip({ x: Math.min(Math.max(x, 100), rect.width - 180), date: t.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) + " " + t.getHours().toString().padStart(2, "0") + ":" + t.getMinutes().toString().padStart(2, "0"), open: c.open, high: c.high, low: c.low, close: c.close });
  };

  if (!xau) return (<section className={styles.priceSection} id="harga"><div className={styles.loading}><div className={styles.spinner}></div><span>Memuat data harga realtime...</span></div></section>);

  return (
    <section className={styles.priceSection} id="harga">
      <div className={styles.priceCard}>
        <div className={styles.priceHeader}>
          <span className={styles.eyebrow}>Coconut Shell Charcoal</span>
          <div className={styles.headerRight}>
            <div className={styles.liveIndicator}>
              <span className={`${styles.liveDot} ${live ? styles.liveDotActive : ""}`}></span>
              <span className={styles.liveText}>{live ? "LIVE" : "OFFLINE"}</span>
            </div>
            <div className={styles.currencySelector}>
              <button className={styles.currencyBtn} onClick={() => setDropOpen(!dropOpen)} type="button">
                {cur}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dropOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease" }}><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              {dropOpen && (
                <div className={styles.currencyDropdown}>
                  {CURRENCIES.map((c) => (
                    <button key={c.code} className={`${styles.currencyOption} ${cur === c.code ? styles.currencyActive : ""}`} onClick={() => { setCur(c.code); setDropOpen(false); }}>
                      <span className={styles.currencyCode}>{c.code}</span>
                      <span className={styles.currencySymbol}>{c.symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={styles.priceMain}>
          <div className={styles.bigPrice}>{curObj.symbol}{fmt(price, dec)}<span className={styles.bigPriceUnit}> / ton</span></div>
          <div className={styles.priceStats}>
            <div className={styles.statBox}><span className={styles.statLabel}>Perubahan</span><span className={`${styles.statVal} ${isUp ? styles.up : styles.down}`}>{isUp ? "\u25B2" : "\u25BC"} {parseFloat(chg) > 0 ? "+" : ""}{chg}%</span></div>
            <div className={styles.statBox}><span className={styles.statLabel}>Tertinggi</span><span className={styles.statVal}>{curObj.symbol}{fmt(hVal, dec)}</span></div>
            <div className={styles.statBox}><span className={styles.statLabel}>Terendah</span><span className={styles.statVal}>{curObj.symbol}{fmt(lVal, dec)}</span></div>
          </div>
        </div>
        <div className={styles.chartContainer}>
          <div className={styles.chartArea} onMouseMove={onHover} onMouseLeave={() => setTip(null)}>
            <canvas ref={canvasRef} className={styles.canvas} />
            {tip && (
              <div className={styles.tooltip} style={{ left: tip.x }}>
                <div className={styles.tooltipDate}>{tip.date}</div>
                <div className={styles.tooltipGrid}>
                  <span className={styles.tooltipLabel}>Open</span><span className={styles.tooltipVal}>{curObj.symbol}{fmt(tip.open, dec)}</span>
                  <span className={styles.tooltipLabel}>High</span><span className={styles.tooltipVal}>{curObj.symbol}{fmt(tip.high, dec)}</span>
                  <span className={styles.tooltipLabel}>Low</span><span className={styles.tooltipVal}>{curObj.symbol}{fmt(tip.low, dec)}</span>
                  <span className={styles.tooltipLabel}>Close</span><span className={styles.tooltipVal}>{curObj.symbol}{fmt(tip.close, dec)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
