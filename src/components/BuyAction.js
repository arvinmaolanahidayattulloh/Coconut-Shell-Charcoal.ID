"use client";
// [FILE: src/components/BuyAction.jsx]
import styles from "./Order.module.css";
import Ekspor from "./Ekspor";
import Domestik from "./Domestik";

// [SECTION: BUY-ACTION] di kartu Produk hanya TOMBOL. State `mode` dipegang Products.
// belum login → Buy lama; sudah login → tombol Ekspor / Domestik
export default function BuyAction({ isLoggedIn, onBuyGuest, mode, onMode }) {
  if (!isLoggedIn) return <button type="button" className={styles.tombolAksi} onClick={onBuyGuest}>Buy</button>;
  return (
    <div className={styles.aksi}>
      <button type="button" className={`${styles.tombolAksi} ${mode === "ekspor" ? styles.aktif : ""}`} onClick={() => onMode("ekspor")}>Ekspor</button>
      <button type="button" className={`${styles.tombolAksi} ${mode === "domestik" ? styles.aktif : ""}`} onClick={() => onMode("domestik")}>Domestik</button>
    </div>
  );
}
// [/SECTION: BUY-ACTION]

// [SECTION: ORDER-PANEL] form order, dirender Products DI BAWAH section Produk
export function OrderPanel({ mode, produk = "Natural", hargaTonIdr, usdIdr, onSelesai }) {
  const p = { produk, hargaTonIdr, usdIdr, onSelesai };
  if (mode === "ekspor") return <Ekspor {...p} />;
  if (mode === "domestik") return <Domestik {...p} />;
  return null;
}
// [/SECTION: ORDER-PANEL]
