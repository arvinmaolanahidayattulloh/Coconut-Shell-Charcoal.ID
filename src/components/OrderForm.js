"use client";
// [FILE: src/components/OrderForm.jsx]
import { useId, useMemo, useState } from "react";
import styles from "./Order.module.css";
import { MITRA } from "@/data/Mitra";
import { GRADE, PRODUK_BERGRADE, GRADE_AWAL } from "@/data/Grade";
import { hitungHarga, formatUang } from "@/lib/csc/harga";
import GradePicker from "./GradePicker";
import LokasiPicker from "./LokasiPicker";
import Invoice from "./Invoice";

// saran isian (bebas diketik; ini hanya daftar bantu)
const BANK = ["BCA", "BRI", "BNI", "Mandiri", "BSI", "CIMB Niaga", "Permata", "Danamon", "OCBC", "Maybank"];
const EWALLET = ["GoPay", "OVO", "DANA", "ShopeePay", "LinkAja"];
const fmtAngka = (n) => new Intl.NumberFormat("id-ID").format(n);

// grade / onGradeChange (opsional): bila diberikan, grade dikontrol dari luar (Products) sehingga
// pilihan di kartu Produk dan di form selalu sama. Tanpa itu, grade dipegang form sendiri.
export default function OrderForm({
  config, produk = "Natural", hargaTonIdr, usdIdr, className = "", onSelesai,
  grade: gradeProp, onGradeChange,
}) {
  // [SECTION: STATE]
  const [f, setF] = useState({ nama: "", wa: "", alamat: "", mitraId: MITRA[0]?.id ?? "", qty: "", metode: "transfer" });
  const [gradeLokal, setGradeLokal] = useState(GRADE_AWAL);
  const [lokasi, setLokasi] = useState(null); // { lat, lng, akurasi, sumber, label } | null (opsional)
  const [dana, setDana] = useState({ jenis: "bank", nama: "", nomor: "", atasNama: "" }); // rekening / e-wallet pembeli
  const [bukti, setBukti] = useState(null);
  const [invId] = useState(
    () => `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  ); // dibuat SEKALI, tidak berubah tiap render
  const idDana = useId();
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const setD = (k) => (e) => setDana((s) => ({ ...s, [k]: e.target.value }));
  const mitra = MITRA.find((m) => m.id === f.mitraId);
  const qty = Number(f.qty) || 0;

  const adaGrade = PRODUK_BERGRADE.includes(produk);
  const kodeGrade = gradeProp ?? gradeLokal;
  const setGrade = (g) => (onGradeChange ? onGradeChange(g) : setGradeLokal(g));
  const persen = adaGrade ? (GRADE.find((g) => g.kode === kodeGrade)?.persen ?? 0) : 0;
  // [/SECTION: STATE]

  // [SECTION: HARGA] null = belum termuat → tidak ditampilkan
  const harga = useMemo(
    () => (hargaTonIdr ? hitungHarga({ mode: config.mode, hargaTonIdr, usdIdr, persen, qty }) : null),
    [config.mode, hargaTonIdr, usdIdr, persen, qty]
  );
  // [/SECTION: HARGA]

  // [SECTION: VALIDASI] lokasi GPS sengaja TIDAK wajib
  const wa = f.wa.replace(/\D/g, "");
  const nomorDana = dana.nomor.replace(/[\s-]/g, "");
  const kurang = [];
  if (!f.nama.trim()) kurang.push("nama penerima");
  if (wa.length < 9) kurang.push("nomor WhatsApp");
  if (!f.alamat.trim()) kurang.push("alamat tujuan");
  if (!mitra) kurang.push("broker");
  if (!(qty >= config.min)) kurang.push(`jumlah minimal ${fmtAngka(config.min)} ${config.satuan}`);
  if (!harga) kurang.push("harga (masih dimuat)");
  if (!dana.nama.trim() || nomorDana.length < 5 || !dana.atasNama.trim()) {
    kurang.push(dana.jenis === "bank" ? "data rekening bank Anda" : "data e-wallet Anda");
  }
  if (!bukti) kurang.push("bukti pembayaran");
  const valid = kurang.length === 0;
  // [/SECTION: VALIDASI]

  // [SECTION: DATA-ORDER]
  const order = harga && mitra ? {
    id: invId,
    tanggal: new Date().toLocaleDateString("id-ID", { dateStyle: "long" }),
    jenis: config.judul, nama: f.nama, wa, alamat: f.alamat, lokasi,
    mitra: mitra.nama, pj: mitra.penanggungJawab.nama, produk, grade: adaGrade ? kodeGrade : null,
    qty, satuan: config.satuan, harga, metode: f.metode,
    dana: { jenis: dana.jenis, nama: dana.nama.trim(), nomor: dana.nomor.trim(), atasNama: dana.atasNama.trim() },
    buktiNama: bukti?.name,
  } : null;
  // [/SECTION: DATA-ORDER]

  // [SECTION: INFO-BAYAR]
  const tf = mitra?.pembayaran.transfer[config.mode];
  // [/SECTION: INFO-BAYAR]

  const bank = dana.jenis === "bank";

  return (
    <div className={`${styles.form} ${className}`}>
      <header className={styles.formHead}>
        <span className="eyebrow">Form Pemesanan</span>
        <h4>Order {config.judul}</h4>
        {config.catatan && <p>{config.catatan}</p>}
      </header>

      {/* [SECTION: PENERIMA] */}
      <section className={styles.seksi}>
        <h5 className={styles.seksiJudul}><i>1</i>Data Penerima</h5>
        <div className={styles.grid2}>
          <label className={styles.label}>Nama Penerima
            <input className={styles.input} value={f.nama} onChange={set("nama")} autoComplete="name" /></label>
          <label className={styles.label}>Nomor WhatsApp Penerima
            <input className={styles.input} inputMode="tel" value={f.wa} onChange={set("wa")} placeholder="62812xxxx" autoComplete="tel" /></label>
        </div>
        <label className={styles.label}>Alamat Tujuan
          <textarea className={styles.input} rows={3} value={f.alamat} onChange={set("alamat")} /></label>

        {/* [SECTION: LOKASI-GPS] tepat setelah Alamat Tujuan */}
        <LokasiPicker value={lokasi} onChange={setLokasi} />
        {/* [/SECTION: LOKASI-GPS] */}
      </section>
      {/* [/SECTION: PENERIMA] */}

      {/* [SECTION: BROKER] */}
      <section className={styles.seksi}>
        <h5 className={styles.seksiJudul}><i>2</i>Broker (mitra terdaftar)</h5>
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
      </section>
      {/* [/SECTION: BROKER] */}

      {/* [SECTION: GRADE-JUMLAH] */}
      <section className={styles.seksi}>
        <h5 className={styles.seksiJudul}><i>3</i>Produk &amp; Jumlah</h5>
        {adaGrade ? (
          <>
            <div className={styles.label}>Pilihan Grade — {produk}</div>
            <GradePicker value={kodeGrade} onChange={setGrade} tampilSpek={false} />
          </>
        ) : (
          <div className={styles.hint}>Produk: <b>{produk}</b> (tanpa pilihan grade)</div>
        )}
        <label className={styles.label}>Jumlah ({config.satuan}) — min. {fmtAngka(config.min)}
          <input className={styles.input} type="number" min={config.min} inputMode="decimal" value={f.qty} onChange={set("qty")} />
          {config.mode === "domestik" && qty > 0 && (
            <span className={styles.hint}>= {fmtAngka(qty / 1000)} Ton</span>
          )}
        </label>
        {harga ? (
          <div className={styles.hargaBox}>
            <div>
              <small>Harga satuan</small>
              <span>{formatUang(harga.satuan, harga.mataUang)} / {config.satuan}</span>
            </div>
            <div>
              <small>Total</small>
              <strong>{formatUang(harga.total, harga.mataUang)}</strong>
            </div>
          </div>
        ) : (
          <div className={`${styles.hargaBox} ${styles.hargaMuat}`}>Memuat harga…</div>
        )}
      </section>
      {/* [/SECTION: GRADE-JUMLAH] */}

      {/* [SECTION: METODE-BAYAR] logo/gambar ada di public/pembayaran/ */}
      <section className={styles.seksi}>
        <h5 className={styles.seksiJudul}><i>4</i>Pembayaran</h5>
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

        {/* [SECTION: INFO-PEMBAYARAN] rekening / QR tujuan transfer */}
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
      </section>

      {/* [SECTION: REKENING-PEMBELI] tepat setelah info rekening / QR penerima */}
      <section className={styles.seksi}>
        <h5 className={styles.seksiJudul}><i>5</i>Rekening / E-Wallet Anda</h5>
        <span className={styles.hint}>Akun yang Anda pakai untuk membayar, agar pembayaran mudah dicocokkan.</span>
        <div className={styles.segmen} role="group" aria-label="Jenis akun">
          <button type="button" className={bank ? styles.segAktif : ""}
            onClick={() => setDana((s) => ({ ...s, jenis: "bank" }))}>Bank</button>
          <button type="button" className={!bank ? styles.segAktif : ""}
            onClick={() => setDana((s) => ({ ...s, jenis: "ewallet" }))}>E-Wallet</button>
        </div>
        <div className={styles.grid2}>
          <label className={styles.label}>{bank ? "Nama Bank" : "Nama E-Wallet"}
            <input className={styles.input} list={idDana} value={dana.nama} onChange={setD("nama")}
              placeholder={bank ? "mis. BCA" : "mis. DANA"} /></label>
          <label className={styles.label}>{bank ? "Nomor Rekening" : "Nomor HP / Akun E-Wallet"}
            <input className={styles.input} inputMode="numeric" value={dana.nomor} onChange={setD("nomor")} /></label>
        </div>
        <label className={styles.label}>Atas Nama
          <input className={styles.input} value={dana.atasNama} onChange={setD("atasNama")} autoComplete="off" /></label>
        <datalist id={idDana}>
          {(bank ? BANK : EWALLET).map((n) => <option key={n} value={n} />)}
        </datalist>
      </section>
      {/* [/SECTION: REKENING-PEMBELI] */}

      {/* [SECTION: UPLOAD-BUKTI] */}
      <section className={styles.seksi}>
        <h5 className={styles.seksiJudul}><i>6</i>Bukti Pembayaran</h5>
        <input className={styles.input} type="file" accept="image/*,application/pdf" aria-label="Upload bukti pembayaran"
          onChange={(e) => setBukti(e.target.files?.[0] ?? null)} />
      </section>
      {/* [/SECTION: UPLOAD-BUKTI] */}

      {/* [SECTION: PREVIEW-INVOICE] */}
      {order && <Invoice o={order} />}
      {/* [/SECTION: PREVIEW-INVOICE] */}

      {/* [SECTION: SELESAI] onSelesai(order, bukti) → batch 2: Verifikasi */}
      <div className={styles.selesaiWrap}>
        <button type="button" className={styles.selesai} disabled={!valid}
          onClick={() => onSelesai?.(order, bukti)}>Selesai</button>
        {!valid && <p className={styles.petunjuk}>Lengkapi dulu: <b>{kurang.join(", ")}</b></p>}
      </div>
      {/* [/SECTION: SELESAI] */}
    </div>
  );
}
