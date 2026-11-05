"use client";
// [FILE: src/components/HargaFeed.js]
// Harga realtime (PriceContext) diisi oleh PriceChart. Halaman yang tidak menampilkan chart (/product, /invest)
// memasang PriceChart di luar layar lewat komponen ini, hanya agar harga di Products / Invest ikut terisi.
import PriceChart from "./PriceChart";

export default function HargaFeed() {
  return (
    <div aria-hidden="true"
      style={{ position: "fixed", left: -10000, top: 0, width: 1100, height: 700, overflow: "hidden", visibility: "hidden", pointerEvents: "none" }}>
      <PriceChart />
    </div>
  );
}
