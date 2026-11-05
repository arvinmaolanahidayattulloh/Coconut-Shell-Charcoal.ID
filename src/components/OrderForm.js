"use client";
// [FILE: src/components/OrderForm.jsx]
import { useMemo, useState } from "react";
import styles from "./Order.module.css";
import { MITRA } from "@/data/Mitra";
import { BANK, EWALLET } from "@/data/Provider";
import { GRADE, PRODUK_BERGRADE, GRADE_AWAL } from "@/data/Grade";
import { hitungHarga, formatUang } from "@/lib/csc/harga";
import GradePicker from "./GradePicker";
import LokasiPicker from "./LokasiPicker";
import Invoice from "./Invoice";

const fmtAngka = (n) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n);
// "0851-6815-2525" → "6285168152525" (untuk tautan wa.me)
const waLink = (no) => {
  const d = String(no || "").replace(/\D/g, "");
  return d ? `https://wa.me/${d.startsWith("0") ? "62" + d.slice(1) : d}` : null;
};

// Logo provider; bila file belum ada di public/pembayaran/provider/ → tampil inisial
function LogoProvider({ p }) {
  const [gagal, setGagal] = useState(false);
  if (gagal) return <span className={styles.logoCadangan} aria-hidden="true">{p.singkat.slice(0, 3)}</span>;
  return <img src={p.logo} alt="" className={styles.logoProvider} onError={() => setGagal(true)} />;
}

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
  // rekening / e-wallet pembeli: provider DIPILIH dari daftar (kode), nama pemilik diisi & dicek sistem (tidak bisa diketik)
  const [dana, setDana] = useState({ jenis: "bank", kode: "", nomor: "" });
  const [bukti, setBukti] = useState(null);
  const [setuju, setSetuju] = useState(false); // Syarat & Ketentuan
  const [invId] = useState(
    () => `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  ); // dibuat SEKALI, tidak berubah tiap render
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const mitra = MITRA.find((m) => m.id === f.mitraId);

  // Jumlah SELALU diisi dalam Ton (boleh desimal, mis. 1,2). Domestik dihitung per Kg → dikonversi.
  const domestik = config.mode === "domestik";
  const minTon = domestik ? config.min / 1000 : config.min;
  const qtyTon = Number(String(f.qty).replace(",", ".")) || 0;
  const qty = domestik ? Math.round(qtyTon * 1000) : qtyTon; // dalam config.satuan (Kg / Ton)

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
  const bank = dana.jenis === "bank";
  const daftarProvider = bank ? BANK : EWALLET;
  const provider = daftarProvider.find((p) => p.kode === dana.kode) ?? null;
  const kurang = [];
  if (!f.nama.trim()) kurang.push("nama penerima");
  if (wa.length < 9) kurang.push("nomor WhatsApp");
  if (!f.alamat.trim()) kurang.push("alamat tujuan");
  if (!mitra) kurang.push("broker");
  if (!(qtyTon >= minTon)) kurang.push(`jumlah minimal ${fmtAngka(minTon)} Ton`);
  if (!harga) kurang.push("harga (masih dimuat)");
  if (!provider || nomorDana.length < 5) {
    kurang.push(dana.jenis === "bank" ? "bank & nomor rekening Anda" : "e-wallet & nomor akun Anda");
  }
  if (!bukti) kurang.push("bukti pembayaran");
  if (!setuju) kurang.push("persetujuan Syarat dan Ketentuan");
  const valid = kurang.length === 0;
  // [/SECTION: VALIDASI]

  // [SECTION: DATA-ORDER]
  const order = harga && mitra ? {
    id: invId,
    tanggal: new Date().toLocaleDateString("id-ID", { dateStyle: "long" }),
    jenis: config.judul, nama: f.nama, wa, alamat: f.alamat, lokasi,
    mitra: mitra.nama, ahu: mitra.ahu, nib: mitra.nib,
    pj: mitra.penanggungJawab.nama, pjJabatan: mitra.penanggungJawab.jabatan, pjWa: mitra.penanggungJawab.wa,
    produk, grade: adaGrade ? kodeGrade : null,
    qty, satuan: config.satuan, harga, metode: f.metode,
    // atasNama TIDAK diisi pembeli: sistem mengecek pemilik rekening/e-wallet saat verifikasi
    dana: provider ? { jenis: dana.jenis, nama: provider.nama, nomor: dana.nomor.trim(), atasNama: null, cekPemilik: "menunggu" } : null,
    setuju,
    buktiNama: bukti?.name,
  } : null;
  // [/SECTION: DATA-ORDER]

  // [SECTION: INFO-BAYAR]
  const tf = mitra?.pembayaran.transfer[config.mode];
  // [/SECTION: INFO-BAYAR]

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
          <>
            <dl className={styles.legal}>
              <div><dt>Nomor AHU</dt><dd>{mitra.ahu || "—"}</dd></div>
              <div><dt>NIB</dt><dd>{mitra.nib || "—"}</dd></div>
            </dl>
            <div className={styles.pj}>
              <img src={mitra.penanggungJawab.foto} alt={mitra.penanggungJawab.nama} className={styles.pjFoto} />
              <div>
                <small>Penanggung Jawab</small>
                <dl className={styles.pjData}>
                  <div><dt>Nama</dt><dd>{mitra.penanggungJawab.nama}</dd></div>
                  <div><dt>Jabatan</dt><dd>{mitra.penanggungJawab.jabatan || "—"}</dd></div>
                  <div><dt>Nomor WhatsApp</dt>
                    <dd>{waLink(mitra.penanggungJawab.wa)
                      ? <a href={waLink(mitra.penanggungJawab.wa)} target="_blank" rel="noopener noreferrer">{mitra.penanggungJawab.wa}</a>
                      : "—"}</dd></div>
                </dl>
              </div>
            </div>
          </>
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
        <label className={styles.label}>Jumlah (Ton) — min. {fmtAngka(minTon)}
          <input className={styles.input} type="number" min={minTon} step="0.1" inputMode="decimal"
            placeholder={`mis. ${fmtAngka(minTon)} atau ${fmtAngka(minTon + 0.2)}`} value={f.qty} onChange={set("qty")} />
          <span className={styles.hint}>Boleh desimal, mis. 1,2 Ton. Minimal order {fmtAngka(minTon)} Ton.</span>
        </label>
        {harga ? (
          <div className={styles.hargaBox}>
            <div>
              <small>Produk{adaGrade ? ` · Grade ${kodeGrade}` : ""}</small>
              <span>{produk}</span>
            </div>
            <div>
              <small>Harga</small>
              <strong>{qty > 0 ? formatUang(harga.total, harga.mataUang) : "—"}</strong>
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
            onClick={() => setDana({ jenis: "bank", kode: "", nomor: dana.nomor })}>Bank</button>
          <button type="button" className={!bank ? styles.segAktif : ""}
            onClick={() => setDana({ jenis: "ewallet", kode: "", nomor: dana.nomor })}>E-Wallet</button>
        </div>

        {/* pilih provider (logo + nama lengkap), tidak bisa diketik bebas */}
        <div className={styles.label} id="lbl-provider">{bank ? "Nama Bank" : "Nama E-Wallet"}</div>
        <div className={styles.providerGrid} role="radiogroup" aria-labelledby="lbl-provider">
          {daftarProvider.map((p) => (
            <button key={p.kode} type="button" role="radio" aria-checked={p.kode === dana.kode}
              className={`${styles.providerItem} ${p.kode === dana.kode ? styles.providerAktif : ""}`}
              onClick={() => setDana((s) => ({ ...s, kode: p.kode }))}>
              <LogoProvider p={p} />
              <span>{p.nama}</span>
            </button>
          ))}
        </div>

        <label className={styles.label}>{bank ? "Nomor Rekening" : "Nomor HP / Akun E-Wallet"}
          <input className={styles.input} inputMode="numeric" value={dana.nomor}
            onChange={(e) => setDana((s) => ({ ...s, nomor: e.target.value }))} autoComplete="off" /></label>

        {/* Atas Nama: terkunci, diisi/dicek sistem — pembeli tidak dapat mengubah */}
        <label className={styles.label}>Atas Nama Pengirim
          <input className={`${styles.input} ${styles.terkunciInput}`} value="" readOnly disabled
            placeholder="Diisi otomatis setelah sistem memeriksa pemilik rekening" />
          <span className={styles.hint}>Tidak dapat diubah. Sistem akan memeriksa pemilik {bank ? "rekening" : "e-wallet"} saat verifikasi pembayaran.</span>
        </label>
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
        <label className={styles.setuju}>
          <input type="checkbox" checked={setuju} onChange={(e) => setSetuju(e.target.checked)} />
          <span>Saya menyetujui Syarat dan Ketentuan</span>
        </label>
        <button type="button" className={styles.selesai} disabled={!valid}
          onClick={() => onSelesai?.(order, bukti)}>Selesai</button>
        {!valid && <p className={styles.petunjuk}>Lengkapi dulu: <b>{kurang.join(", ")}</b></p>}
      </div>
      {/* [/SECTION: SELESAI] */}
    </div>
  );
}
