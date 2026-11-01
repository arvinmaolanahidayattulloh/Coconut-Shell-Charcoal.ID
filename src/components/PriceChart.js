"use client";

import { useState, useEffect, useRef } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";
import styles from "./PriceChart.module.css";

// ==========================================
// KONSTANTA & RUMUS
// ==========================================
const OZ = 31.1034768;
const GRAMS = 5;
const MARKUP = 1.125;
const BTC_FACTOR = 0.909;

const INTERVALS = [
  { id: "1m", bin: "1m", step: 60 },
  { id: "5m", bin: "5m", step: 300 },
  { id: "15m", bin: "15m", step: 900 },
  { id: "30m", bin: "30m", step: 1800 },
  { id: "1h", bin: "1h", step: 3600 },
  { id: "4h", bin: "4h", step: 14400 },
  { id: "1D", bin: "1d", step: 86400 },
  { id: "3D", bin: "3d", step: 259200 },
];

const RANGES = [
  { id: "1D", iv: "5m", count: 288 },
  { id: "5D", iv: "15m", count: 480 },
  { id: "1M", iv: "1h", count: 720 },
  { id: "3M", iv: "4h", count: 540 },
  { id: "6M", iv: "12h", count: 360 }, // 12h interval
  { id: "YTD", iv: "1d", count: "YTD" },
  { id: "1Y", iv: "1d", count: 365 },
  { id: "5Y", iv: "3d", count: 609 },
  { id: "10Y", iv: "1w", count: 520 }, // 1w untuk menghindari limit 1000 Binance
];

const CURRENCIES = [
  { code: "IDR", symbol: "Rp" },
  { code: "USD", symbol: "$" },
];

function fmt(num, dec) {
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(num);
}

// Cek Jam Buka Pasar XAUUSD (Jumat 22:00 UTC - Minggu 22:00 UTC = Tutup)
function isXauMarketOpen() {
  const now = new Date();
  const day = now.getUTCDay();
  const hour = now.getUTCHours();
  if (day === 6) return false;
  if (day === 5 && hour >= 22) return false;
  if (day === 0 && hour < 22) return false;
  return true;
}

export default function PriceChart() {
  // --- STATES ---
  const [mode, setMode] = useState("gold"); // gold | btc
  const [chartType, setChartType] = useState("candle"); // candle | area
  const [activeInterval, setActiveInterval] = useState("1h");
  const [activeRange, setActiveRange] = useState("1M");
  
  const [rates, setRates] = useState(null);
  const [cur, setCur] = useState("IDR");
  const [live, setLive] = useState(false);
  const [priceData, setPriceData] = useState({ current: 0, high: 0, low: 0, change: 0, isUp: true });

  // --- REFS ---
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef({ candle: null, area: null });
  const dataHistoryRef = useRef([]); // Simpan history mentah
  const wsRef = useRef(null);
  const livePrices = useRef({ gold: null, btc: null });

  // 1. Initial Load & Cek Pasar
  useEffect(() => {
    if (!isXauMarketOpen()) setMode("btc");
    
    // Fetch Kurs
    fetch("/api/prices").then(r => r.json()).then(d => {
      if (d.rates) setRates(d.rates);
    }).catch(() => {});
  }, []);

  const rate = rates ? (cur === "USD" ? 1 : rates[cur] || 1) : 1;
  const curObj = CURRENCIES.find((c) => c.code === cur) || CURRENCIES[0];
  const dec = cur === "IDR" ? 0 : 2;
  const multiplier = mode === "gold" ? (GRAMS * MARKUP) / OZ : BTC_FACTOR;
  const marketOpen = mode === "gold" ? isXauMarketOpen() : true;

  // 2. Inisialisasi Lightweight Charts (Hanya dirender sekali)
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      height: 480,
      layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#9ca3af', fontFamily: 'system-ui, sans-serif' },
      grid: { vertLines: { color: '#f3f4f6' }, horzLines: { color: '#f3f4f6' } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#e5e7eb', autoScale: true },
      timeScale: { borderColor: '#e5e7eb', timeVisible: true, secondsVisible: false },
      localization: { locale: 'id-ID' }
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e', downColor: '#ef4444', borderVisible: false, wickUpColor: '#22c55e', wickDownColor: '#ef4444'
    });

    const areaSeries = chart.addAreaSeries({
      lineColor: '#c45e20', topColor: 'rgba(196, 94, 32, 0.2)', bottomColor: 'rgba(196, 94, 32, 0.0)'
    });

    chartRef.current = chart;
    seriesRef.current = { candle: candleSeries, area: areaSeries };

    // Responsive resize
    const handleResize = () => { chart.applyOptions({ width: chartContainerRef.current.clientWidth }); };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // 3. Update Visibilitas Tipe Grafik (Candle vs Area)
  useEffect(() => {
    if (!seriesRef.current.candle) return;
    seriesRef.current.candle.applyOptions({ visible: chartType === "candle" });
    seriesRef.current.area.applyOptions({ visible: chartType === "area" });
  }, [chartType]);

  // 4. Fetch Sejarah Data (Berjalan setiap Mode, Interval, atau Range berubah)
  useEffect(() => {
    if (!chartRef.current || !rates) return;
    
    // Tentukan parameter Binance API
    let binanceInterval = "1h";
    let limit = 500;

    if (activeRange) {
      const rOpt = RANGES.find(r => r.id === activeRange);
      binanceInterval = rOpt.iv;
      if (rOpt.count === "YTD") {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        limit = Math.max(2, Math.ceil((now - startOfYear) / 86400000));
      } else {
        limit = rOpt.count;
      }
      // Sinkronkan UI tombol Interval
      const matchIv = INTERVALS.find(i => i.bin === binanceInterval);
      if (matchIv) setActiveInterval(matchIv.id);
    } else {
      binanceInterval = INTERVALS.find(i => i.id === activeInterval).bin;
    }

    const symbol = mode === "gold" ? "PAXGUSDT" : "BTCUSDT";

    fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${binanceInterval}&limit=${limit}`)
      .then(res => res.json())
      .then(data => {
        // Format untuk Lightweight Charts (waktu dalam Unix Seconds)
        const formatted = data.map(d => {
          const finalMultiplier = multiplier * rate;
          return {
            time: Math.floor(d[0] / 1000), // convert to seconds
            open: parseFloat(d[1]) * finalMultiplier,
            high: parseFloat(d[2]) * finalMultiplier,
            low: parseFloat(d[3]) * finalMultiplier,
            close: parseFloat(d[4]) * finalMultiplier,
            value: parseFloat(d[4]) * finalMultiplier // Untuk Area chart
          };
        });

        // Hapus duplikat waktu jika ada
        const uniqueData = formatted.filter((v, i, a) => a.findIndex(t => (t.time === v.time)) === i);
        dataHistoryRef.current = uniqueData;

        // Set data ke Chart
        seriesRef.current.candle.setData(uniqueData);
        seriesRef.current.area.setData(uniqueData);

        // Fitur Range (Zoom Fit)
        if (activeRange) {
          chartRef.current.timeScale().fitContent();
        } else {
          // Tampilkan 120 candle terakhir seperti TradingView
          const total = uniqueData.length;
          chartRef.current.timeScale().setVisibleLogicalRange({ from: Math.max(0, total - 120), to: total + 4 });
        }

        // Update Statistik UI
        if (uniqueData.length > 0) {
          const first = uniqueData[0].close;
          const last = uniqueData[uniqueData.length - 1].close;
          const high = Math.max(...uniqueData.map(d => d.high));
          const low = Math.min(...uniqueData.map(d => d.low));
          const chg = (((last - first) / first) * 100).toFixed(2);
          setPriceData({ current: last, high, low, change: chg, isUp: parseFloat(chg) >= 0 });
        }
      });
  }, [mode, activeInterval, activeRange, rates, multiplier, rate]);

  // 5. WebSocket (Live Ticker)
  useEffect(() => {
    const ws = new WebSocket("wss://stream.binance.com:9443/stream?streams=btcusdt@trade/paxgusdt@trade");
    ws.onopen = () => setLive(true);
    ws.onmessage = (ev) => {
      const data = JSON.parse(ev.data).data;
      if (!data || !data.p) return;
      if (data.s === "PAXGUSDT") livePrices.current.gold = parseFloat(data.p);
      if (data.s === "BTCUSDT") livePrices.current.btc = parseFloat(data.p);
    };
    ws.onclose = () => setLive(false);
    return () => ws.close();
  }, []);

  // 6. Tick Updater (Perbarui lilin terakhir tiap 1 detik)
  useEffect(() => {
    if (!marketOpen || !rates) return;

    const timer = setInterval(() => {
      const history = dataHistoryRef.current;
      if (!history.length) return;

      const currentRawPrice = livePrices.current[mode];
      if (!currentRawPrice) return;

      const finalPrice = currentRawPrice * multiplier * rate;
      const lastCandle = history[history.length - 1];
      const nowSec = Math.floor(Date.now() / 1000);
      
      const activeStep = INTERVALS.find(i => i.id === activeInterval)?.step || 3600;

      // Logika pembentukan candle baru
      let newTick;
      if (nowSec >= lastCandle.time + activeStep) {
        // Bikin Candle Baru
        const nextTime = lastCandle.time + activeStep * Math.floor((nowSec - lastCandle.time) / activeStep);
        newTick = { time: nextTime, open: finalPrice, high: finalPrice, low: finalPrice, close: finalPrice, value: finalPrice };
        history.push(newTick);
      } else {
        // Update Candle Lama
        newTick = { ...lastCandle };
        newTick.high = Math.max(newTick.high, finalPrice);
        newTick.low = Math.min(newTick.low, finalPrice);
        newTick.close = finalPrice;
        newTick.value = finalPrice;
        history[history.length - 1] = newTick;
      }

      // Render pembaruan ke Chart
      seriesRef.current.candle.update(newTick);
      seriesRef.current.area.update(newTick);

      // Update Angka Raksasa di UI
      setPriceData(prev => ({
        ...prev,
        current: finalPrice,
        high: Math.max(prev.high, finalPrice),
        low: Math.min(prev.low, finalPrice)
      }));

    }, 1000);
    return () => clearInterval(timer);
  }, [mode, activeInterval, multiplier, rate, marketOpen]);

  // Handler Klik Menu
  const handleIntervalClick = (iv) => { setActiveInterval(iv); setActiveRange(null); };
  const handleRangeClick = (rng) => { setActiveRange(rng); };

  if (!rates) return <div className={styles.loading}><div className={styles.spinner}></div><span>Memuat Engine Chart...</span></div>;

  return (
    <section className={styles.priceSection} id="harga">
      <div className={styles.priceCard}>
        <div className={styles.priceHeader}>
          <span className={styles.eyebrow}>Coconut Shell Charcoal</span>
          
          <div className={styles.headerRight}>
            <div className={styles.liveIndicator}>
              <span className={`${styles.liveDot} ${live && marketOpen ? styles.liveDotActive : ""}`}></span>
              <span className={styles.liveText} style={{ color: live && marketOpen ? "#22c55e" : "#9ca3af" }}>
                {live && marketOpen ? "LIVE" : "PASAR TUTUP"}
              </span>
            </div>

            {/* Mata Uang Dropdown */}
            <select 
              value={cur} 
              onChange={(e) => setCur(e.target.value)} 
              className={styles.currencyBtn} 
              style={{ padding: '6px 12px', outline: 'none' }}
            >
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </div>
        </div>
        
        <div className={styles.priceMain}>
          <div className={styles.bigPrice}>{curObj.symbol}{fmt(priceData.current, dec)}<span className={styles.bigPriceUnit}> / ton</span></div>
          <div className={styles.priceStats}>
            <div className={styles.statBox}><span className={styles.statLabel}>Perubahan</span><span className={`${styles.statVal} ${priceData.isUp ? styles.up : styles.down}`}>{priceData.isUp ? "\u25B2" : "\u25BC"} {priceData.change}%</span></div>
            <div className={styles.statBox}><span className={styles.statLabel}>Tertinggi</span><span className={styles.statVal}>{curObj.symbol}{fmt(priceData.high, dec)}</span></div>
            <div className={styles.statBox}><span className={styles.statLabel}>Terendah</span><span className={styles.statVal}>{curObj.symbol}{fmt(priceData.low, dec)}</span></div>
          </div>
        </div>
        
        <div className={styles.chartContainer}>
          
          {/* TOOLBAR CONTROLS (SEPERTI GAMBAR) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f3f4f6' }}>
            
            {/* Baris 1: Assets */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className={`${styles.currencyBtn} ${mode === "gold" ? styles.currencyActive : ""}`} onClick={() => setMode("gold")}>XAUUSD</button>
              <button className={`${styles.currencyBtn} ${mode === "btc" ? styles.currencyActive : ""}`} onClick={() => setMode("btc")}>BTC</button>
            </div>

            {/* Baris 2: Intervals */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
              {INTERVALS.map((iv) => (
                <button key={iv.id} className={`${styles.currencyBtn} ${activeInterval === iv.id && !activeRange ? styles.currencyActive : ""}`} 
                  onClick={() => handleIntervalClick(iv.id)} style={{ padding: '4px 10px', fontSize: '12px', border: 'none', background: activeInterval === iv.id && !activeRange ? '#fef3ec' : 'transparent' }}>
                  {iv.id}
                </button>
              ))}
            </div>

            {/* Baris 3: Ranges */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
              {RANGES.map((rng) => (
                <button key={rng.id} className={`${styles.currencyBtn} ${activeRange === rng.id ? styles.currencyActive : ""}`} 
                  onClick={() => handleRangeClick(rng.id)} style={{ padding: '4px 10px', fontSize: '12px', border: 'none', background: activeRange === rng.id ? '#fef3ec' : 'transparent' }}>
                  {rng.id}
                </button>
              ))}
            </div>

            {/* Baris 4: Tipe Grafik */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className={`${styles.currencyBtn} ${chartType === "candle" ? styles.currencyActive : ""}`} onClick={() => setChartType("candle")} style={{ padding: '4px 12px', fontSize: '12px' }}>Candle</button>
              <button className={`${styles.currencyBtn} ${chartType === "area" ? styles.currencyActive : ""}`} onClick={() => setChartType("area")} style={{ padding: '4px 12px', fontSize: '12px' }}>Area</button>
            </div>

          </div>

          {/* AREA CHART */}
          <div ref={chartContainerRef} style={{ width: '100%', position: 'relative' }}></div>
          
        </div>
      </div>
    </section>
  );
}
