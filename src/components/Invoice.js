"use client";
// [FILE: src/components/Invoice.jsx]
import styles from "./Order.module.css";
import { formatUang } from "@/lib/csc/harga";

const fmtKoord = (l) => `${Number(l.lat).toFixed(6)}, ${Number(l.lng).toFixed(6)}`;

// [SECTION: INVOICE-A4] rasio 210:297, font memakai cqw agar skala ikut lebar
export default function Invoice({ o }) {
  const baris = [
    ["No. Invoice", o.id], ["Tanggal", o.tanggal], ["Jenis", o.jenis],
    ["Penerima", o.nama], ["WhatsApp", o.wa], ["Alamat Tujuan", o.alamat],
    ...(o.lokasi ? [["Lokasi GPS", fmtKoord(o.lokasi)]] : []),
    ["Broker / Mitra", o.mitra],
    ...(o.ahu ? [["Nomor AHU", o.ahu]] : []), ...(o.nib ? [["NIB", o.nib]] : []),
    ["Penanggung Jawab", [o.pj, o.pjJabatan].filter(Boolean).join(" — ")],
    ...(o.pjWa ? [["WhatsApp PJ", o.pjWa]] : []),
    ["Produk", o.grade ? `${o.produk} — Grade ${o.grade}` : o.produk],
    ["Jumlah", `${o.qty} ${o.satuan}`],
    ["Metode Bayar", o.metode.toUpperCase()],
    ...(o.dana ? [[o.dana.jenis === "bank" ? "Rekening Pembeli" : "E-Wallet Pembeli", `${o.dana.nama} · ${o.dana.nomor} · a.n. ${o.dana.atasNama || "dicek sistem"}`]] : []),
    ["Bukti Bayar", o.buktiNama || "—"],
  ];
  return (
    <div className={styles.invoiceWrap}>
      <div className={styles.invoice}>
        <h3>INVOICE</h3>
        <p className={styles.invSub}>Coconut Shell Charcoal Indonesia</p>
        {baris.map(([k, v]) => (
          <div key={k} className={styles.invRow}><span>{k}</span><b>{v}</b></div>
        ))}
        <div className={`${styles.invRow} ${styles.invTotal}`}>
          <span>TOTAL</span><b>{formatUang(o.harga.total, o.harga.mataUang)}</b>
        </div>
        <p className={styles.invNote}>Harga dibulatkan. Menunggu validasi Chief Executive Officer.</p>
      </div>
    </div>
  );
}
// [/SECTION: INVOICE-A4]
