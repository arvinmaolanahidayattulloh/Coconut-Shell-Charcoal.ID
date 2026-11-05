"use client";
// [FILE: src/components/BuyAction.jsx]
import { useState } from "react";
import styles from "./Order.module.css";
import Ekspor from "./Ekspor";
import Domestik from "./Domestik";

// [SECTION: BUY-ACTION] belum login → Buy lama; sudah login → Ekspor / Domestik
export default function BuyAction({ isLoggedIn, onBuyGuest, produk = "Natural", hargaTonIdr, usdIdr, onSelesai }) {
  const [mode, setMode] = useState(null);
  if (!isLoggedIn) return <button type="button" className={styles.tombolAksi} onClick={onBuyGuest}>Buy</button>;
  const p = { produk, hargaTonIdr, usdIdr, onSelesai };
  return (
    <div>
      <div className={styles.aksi}>
        <button type="button" className={`${styles.tombolAksi} ${mode === "ekspor" ? styles.aktif : ""}`} onClick={() => setMode("ekspor")}>Ekspor</button>
        <button type="button" className={`${styles.tombolAksi} ${mode === "domestik" ? styles.aktif : ""}`} onClick={() => setMode("domestik")}>Domestik</button>
      </div>
      {mode === "ekspor" && <Ekspor {...p} />}
      {mode === "domestik" && <Domestik {...p} />}
    </div>
  );
}
// [/SECTION: BUY-ACTION]
