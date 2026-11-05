"use client";
// [FILE: src/components/Domestik.js]
import OrderForm from "./OrderForm";
import s from "./Domestik.module.css";

// [SECTION: CONFIG-DOMESTIK] aturan khusus Domestik, ubah di sini
// mode    : "domestik" → harga dalam Rupiah per Kg
// satuan  : Kg
// min     : minimal order (Kg) → 1.000 Kg = 1 Ton
// catatan : teks kecil di bawah judul form
const CONFIG = {
  mode: "domestik",
  judul: "Domestik",
  satuan: "Kg",
  min: 1000,
  catatan: "Harga dalam Rupiah per Kg · minimal order 1 Ton (1.000 Kg)",
};
// [/SECTION: CONFIG-DOMESTIK]

// [SECTION: KOMPONEN-DOMESTIK] sisa props (grade, onGradeChange, dst.) diteruskan ke OrderForm
export default function Domestik({ produk = "Natural", ...sisa }) {
  return <OrderForm config={CONFIG} className={s.root} produk={produk} {...sisa} />;
}
// [/SECTION: KOMPONEN-DOMESTIK]
