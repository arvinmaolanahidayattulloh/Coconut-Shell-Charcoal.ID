"use client";
// [FILE: src/components/OrderForm.jsx]
import { useMemo, useState } from "react";
import styles from "./Order.module.css";
import { MITRA } from "@/data/Mitra";
import { GRADE } from "@/data/Grade";
import { hitungHarga, formatUang } from "@/lib/csc/harga";
import GradePicker from "./GradePicker";
import Invoice from "./Invoice";

export default function OrderForm({ config, produk = "Natural", hargaTonIdr, usdIdr, className = "", onSelesai }) {
  // [SECTION: STATE]
  const [f, setF] = useState({ nama: "", wa: "", alamat: "", mitraId: MITRA[0]?.id ?? "", grade: "A", qty: "", metode: "transfer" });
  const [bukti, setBukti] = useState(null);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const mitra = MITRA.find((m) => m.id === f.mitraId);
  const grade = GRADE.find((g) => g.kode === f.grade);
  const qty = Number(f.qty) || 0;
  // [/SECTION: STATE]

  // [SECTION: HARGA] null = belum termuat → tidak ditampilkan
  const harga = useMemo(
    () => (hargaTonIdr ? hitungHarga({ mode: config.mode, hargaTonIdr, usdIdr, persen: grade.persen, qty }) : null),
    [config.mode, hargaTonIdr, usdIdr, grade.persen, qty]
  );
  // [/SECTION: HARGA]

  // [SECTION: VALIDASI]
  const valid = f.nama.trim() && f.wa.replace(/\D/g, "").length >= 9 && f.alamat.trim()
    && mitra && qty >= config.min && harga && bukti;
  // [/SECTION: VALIDASI]

  // [SECTION: DATA-ORDER]
  const order = harga && mitra ? {
    id: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    tanggal: new Date().toLocaleDateString("id-ID", { dateStyle: "long" }),
    jenis: config.judul, nama: f.nama, wa: f.wa.replace(/\D/g, ""), alamat: f.alamat,
    mitra: mitra.nama, pj: mitra.penanggungJawab.nama, produk, grade: f.grade,
    qty, satuan: config.satuan, harga, metode: f.metode, buktiNama: bukti?.name,
  } : null;
  // [/SECTION: DATA-ORDER]

  // [SECTION: INFO-BAYAR]
  const tf = mitra?.pembayaran.transfer[config.mode];
  // [/SECTION: INFO-BAYAR]

  return (
    <div className={`${styles.form} ${className}`}>
      <h4>{config.judul}</h4>

      {/* [SECTION: PENERIMA] */}
      <label className={styles.label}>Nama Penerima
        <input className={styles.input} value={f.nama} onChange={set("nama")} /></label>
      <label className={styles.label}>Nomor WhatsApp Penerima
        <input className={styles.input} inputMode="tel" value={f.wa} onChange={set("wa")} placeholder="62812xxxx" /></label>
      <label className={styles.label}>Alamat Tujuan
        <textarea className={styles.input} rows={3} value={f.alamat} onChange={set("alamat")} /></label>
      {/* [/SECTION: PENERIMA] */}

      {/* [SECTION: BROKER] */}
      <div className={styles.label}>Broker (mitra terdaftar)</div>
      <div className={styles.mitraList}>
        {MITRA.map((m) => (
          <button key={m.id} type="button"
            className={`${styles.mitraItem} ${m.id === f.mitraId ? styles.mitraAktif : ""}`}
            onClick={() => setF((s) => ({ ...s, mitraId: m.id }))}>
            <img src={m.logo} alt={m.nama} className={styles.mitraLogo} /><span>{m.nama}</span>
          </button>
        ))}
      </div>
      {mitra && (
        <div className={styles.pj}>
          <img src={mitra.penanggungJawab.foto} alt={mitra.penanggungJawab.nama} className={styles.pjFoto} />
          <div><small>Penanggung Jawab</small><b>{mitra.penanggungJawab.nama}</b></div>
        </div>
      )}
      {/* [/SECTION: BROKER] */}

      {/* [SECTION: GRADE-JUMLAH] */}
      <div className={styles.label}>Pilihan Grade</div>
      <GradePicker value={f.grade} onChange={(g) => setF((s) => ({ ...s, grade: g }))} tampilSpek={false} />
      <label className={styles.label}>Jumlah ({config.satuan}) — min. {config.min}
        <input className={styles.input} type="number" min={config.min} value={f.qty} onChange={set("qty")} /></label>
      <div className={styles.hargaBox}>
        {harga
          ? <>{formatUang(harga.satuan, harga.mataUang)} / {config.satuan} · Total <b>{formatUang(harga.total, harga.mataUang)}</b></>
          : "Memuat harga…"}
      </div>
      {/* [/SECTION: GRADE-JUMLAH] */}

      {/* [SECTION: METODE-BAYAR] logo/gambar ada di public/pembayaran/ */}
      <div className={styles.label}>Metode Pembayaran</div>
      <div className={styles.bayarRow}>
        <button type="button" className={`${styles.bayarBtn} ${f.metode === "transfer" ? styles.gradeAktif : ""}`}
          onClick={() => setF((s) => ({ ...s, metode: "transfer" }))}>
          <img src="/pembayaran/transfer.png" alt="Transfer" />Transfer</button>
        <button type="button" className={`${styles.bayarBtn} ${f.metode === "qris" ? styles.gradeAktif : ""}`}
          onClick={() => setF((s) => ({ ...s, metode: "qris" }))}>
          <img src="/pembayaran/qris.png" alt="QRIS" />QRIS</button>
        <button type="button" className={`${styles.bayarBtn} ${styles.terkunci}`} disabled title="Belum tersedia">
          COD 🔒</button>
      </div>
      {/* [/SECTION: METODE-BAYAR] */}

      {/* [SECTION: INFO-PEMBAYARAN] */}
      {mitra && (
        <div className={styles.info}>
          <div className={styles.brokerHead}><img src={mitra.logo} alt="" /><b>{mitra.nama}</b></div>
          {f.metode === "transfer" && tf && (
            <p>{tf.bank} · <b>{tf.noRek}</b><br />a.n. {tf.atasNama}{tf.swift ? <><br />SWIFT: {tf.swift}</> : null}</p>
          )}
          {f.metode === "qris" && <img src={mitra.pembayaran.qris} alt="QRIS" className={styles.qris} />}
        </div>
      )}
      {/* [/SECTION: INFO-PEMBAYARAN] */}

      {/* [SECTION: UPLOAD-BUKTI] */}
      <label className={styles.label}>Upload Bukti Pembayaran
        <input className={styles.input} type="file" accept="image/*,application/pdf"
          onChange={(e) => setBukti(e.target.files?.[0] ?? null)} /></label>
      {/* [/SECTION: UPLOAD-BUKTI] */}

      {/* [SECTION: PREVIEW-INVOICE] */}
      {order && <Invoice o={order} />}
      {/* [/SECTION: PREVIEW-INVOICE] */}

      {/* [SECTION: SELESAI] onSelesai(order, bukti) → batch 2: Verifikasi */}
      <button type="button" className={styles.selesai} disabled={!valid}
        onClick={() => onSelesai?.(order, bukti)}>Selesai</button>
      {/* [/SECTION: SELESAI] */}
    </div>
  );
}
