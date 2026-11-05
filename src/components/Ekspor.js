"use client";
// [FILE: src/components/Ekspor.js]
import OrderForm from "./OrderForm";
import s from "./Ekspor.module.css";

// [SECTION: CONFIG-EKSPOR] aturan khusus Ekspor, ubah di sini
// mode   : "ekspor" → harga dalam USD per Ton
// satuan : Ton
// min    : minimal order (Ton) → 25 Ton (± 5.000 USD)
const CONFIG = { mode: "ekspor", judul: "Ekspor", satuan: "Ton", min: 25 };
// [/SECTION: CONFIG-EKSPOR]

// [SECTION: KOMPONEN-EKSPOR]
export default function Ekspor({ produk = "Natural", hargaTonIdr, usdIdr, onSelesai }) {
  return (
    <OrderForm
      config={CONFIG}
      className={s.root}
      produk={produk}
      hargaTonIdr={hargaTonIdr}
      usdIdr={usdIdr}
      onSelesai={onSelesai}
    />
  );
}
// [/SECTION: KOMPONEN-EKSPOR]
