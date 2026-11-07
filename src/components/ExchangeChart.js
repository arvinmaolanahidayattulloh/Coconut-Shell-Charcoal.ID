"use client";

import { useEffect, useMemo, useRef } from "react";
import { ColorType, createChart } from "lightweight-charts";

const IPO_PRICE = 1000;
const IPO_TIME = Math.floor(Date.UTC(2026, 9, 30, 0, 0, 0) / 1000);

export default function ExchangeChart({ trades = [], period = "1D" }) {
  const containerRef = useRef(null);
  const data = useMemo(() => {
    const interval = ({ "1H": 60, "1D": 900, "1W": 3600, "1M": 14400, "1Y": 86400, ALL: 86400 })[period] || 900;
    const candles = new Map();
    candles.set(IPO_TIME, { time: IPO_TIME, open: IPO_PRICE, high: IPO_PRICE, low: IPO_PRICE, close: IPO_PRICE });
    const ordered = [...trades].reverse();
    for (const trade of ordered) {
      const timestamp = Math.floor(new Date(trade.createdAt).getTime() / 1000);
      if (!Number.isFinite(timestamp) || timestamp < IPO_TIME) continue;
      const time = Math.floor(timestamp / interval) * interval;
      const price = Number(trade.priceCents) / 100;
      if (!Number.isFinite(price) || price <= 0) continue;
      const candle = candles.get(time);
      if (!candle) candles.set(time, { time, open: price, high: price, low: price, close: price });
      else {
        candle.high = Math.max(candle.high, price);
        candle.low = Math.min(candle.low, price);
        candle.close = price;
      }
    }
    return [...candles.values()].sort((a, b) => a.time - b.time);
  }, [trades, period]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const chart = createChart(element, {
      width: element.clientWidth || 640,
      height: 260,
      layout: {
        background: { type: ColorType.Solid, color: "#fafaf9" },
        textColor: "#787b86",
        fontFamily: "Arial, sans-serif",
      },
      grid: {
        vertLines: { color: "#f0f3fa" },
        horzLines: { color: "#f0f3fa" },
      },
      rightPriceScale: { borderColor: "#e5e7eb" },
      timeScale: { borderColor: "#e5e7eb", timeVisible: true, secondsVisible: false },
      crosshair: { mode: 1 },
    });
    const series = chart.addCandlestickSeries({
      upColor: "#089981",
      downColor: "#f23645",
      borderUpColor: "#089981",
      borderDownColor: "#f23645",
      wickUpColor: "#089981",
      wickDownColor: "#f23645",
    });
    series.setData(data);
    chart.timeScale().fitContent();
    const observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver((entries) => {
          const width = entries[0]?.contentRect?.width;
          if (width) chart.applyOptions({ width });
        })
      : null;
    observer?.observe(element);
    return () => {
      observer?.disconnect();
      chart.remove();
    };
  }, [data]);

  return <div ref={containerRef} style={{ width: "100%", minHeight: 260 }} aria-label="Grafik candlestick CSCID" />;
}
