"use client";
// [FILE: src/components/OrderForm.jsx]
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Order.module.css";
import { MITRA } from "@/data/Mitra";
import { BANK, EWALLET, cariProvider } from "@/data/Provider";
import { GRADE, PRODUK_BERGRADE, GRADE_AWAL } from "@/data/Grade";
import { hitungHarga, formatUang } from "@/lib/csc/harga";
import GradePicker from "./GradePicker";
import LokasiPicker, { jarakM } from "./LokasiPicker";
import ProviderSelect, { LogoProvider } from "./ProviderSelect";
import VerifikasiOrder from "./VerifikasiOrder";
import Invoice from "./Invoice";
import { useAccount } from "./Account";

const fmtAngka = (n) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n);
// "0851-6815-2525" → "6285168152525" (untuk tautan wa.me)
const waLink = (no) => {
  const d = String(no || "").replace(/\D/g, "");
  return d ? `https://wa.me/${d.startsWith("0") ? "62" + d.slice(1) : d}` : null;
};

const MAKS_BUKTI = 3 * 1024 * 1024; // 3 MB (batas body server)

// Foto profil akun terdaftar; bila tidak ada / gagal dimuat → huruf pertama nama
function FotoAkun({ user }) {
  const [gagal, setGagal] = useState(false);
  const huruf = (user?.name || user?.email || "?").trim().charAt(0).toUpperCase();
  if (!user?.picture || gagal || user.picture.includes("via.placeholder.com")) {
    return <span className={styles.fotoAkunHuruf} aria-hidden="true">{huruf}</span>;
  }
  return <img src={user.picture} alt={user.name || "Foto profil"} className={styles.fotoAkun}
    referrerPolicy="no-referrer" onError={() => setGagal(true)} />;
}

// grade / onGradeChange (opsional): bila diberikan, grade dikontrol dari luar (Products) sehingga
// pilihan di kartu Produk dan di form selalu sama. Tanpa itu, grade dipegang form sendiri.
export default function OrderForm({
  config, produk = "Natural", hargaTonIdr, usdIdr, className = "", onSelesai,
  grade: gradeProp, onGradeChange,
}) {
  // [SECTION: STATE]
  const [f, setF] = useState({ nama: "", wa: "", alamat: "", catatan: "", mitraId: MITRA[0]?.id ?? "", qty: "", metode: "transfer" });
  const [gradeLokal, setGradeLokal] = useState(GRADE_AWAL);
  const [lokasi, setLokasi] = useState(null); // { lat, lng, akurasi, sumber, label } | null (opsional)
  // rekening / e-wallet pembeli: provider DIPILIH dari daftar (kode), nama pemilik diisi & dicek sistem (tidak bisa diketik)
  const [dana, setDana] = useState({ jenis: "bank", kode: "", nomor: "" });
  const [bukti, setBukti] = useState(null);
  const [setuju, setSetuju] = useState(false); // Syarat & Ketentuan
  const [invId] = useState(
    () => `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  ); // dibuat SEKALI, tidak berubah tiap render
  // Selesai → Verifikasi → simpan sebagai Pending
  const { user } = useAccount();
  const [verif, setVerif] = useState(false);
  const [simpan, setSimpan] = useState({ status: "idle", pesan: "" }); // idle | menyimpan | tersimpan | galat
  const [verifTerakhir, setVerifTerakhir] = useState(null);
  const [tersalin, setTersalin] = useState(false);
  const alamatSentuhRef = useRef(false); // true setelah pengguna mengetik / menghapus Alamat Tujuan
  const geoRef = useRef(null); // titik terakhir yang sudah dicarikan alamatnya
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const mitra = MITRA.find((m) => m.id === f.mitraId);

  // Alamat Tujuan terisi otomatis dari lokasi (GPS live / pencarian). Berhenti menimpa begitu pengguna
  // mengetik atau menghapus alamat; pengguna bebas mengubahnya.
  useEffect(() => {
    if (!lokasi || alamatSentuhRef.current) return;
    if (lokasi.label) { setF((s) => ({ ...s, alamat: lokasi.label })); return; } // hasil pencarian sudah berupa alamat
    if (geoRef.current && jarakM(geoRef.current, lokasi) < 30) return; // belum berpindah jauh
    const ac = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=id&lat=${lokasi.lat}&lon=${lokasi.lng}`,
          { signal: ac.signal }
        );
        if (!r.ok) return;
        const j = await r.json();
        if (j?.display_name && !alamatSentuhRef.current) {
          geoRef.current = { lat: lokasi.lat, lng: lokasi.lng };
          setF((s) => ({ ...s, alamat: j.display_name }));
        }
      } catch { /* dibatalkan / offline: biarkan alamat apa adanya */ }
    }, 800);
    return () => { clearTimeout(t); ac.abort(); };
  }, [lokasi]);

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
  else if (bukti.size > MAKS_BUKTI) kurang.push("bukti pembayaran maksimal 3 MB");
  if (!setuju) kurang.push("persetujuan Syarat dan Ketentuan");
  const valid = kurang.length === 0;
  // [/SECTION: VALIDASI]

  // [SECTION: DATA-ORDER]
  const order = harga && mitra ? {
    id: invId,
    pembeli: { id: user?.name || "", email: user?.email || "" },
    tanggal: new Date().toLocaleDateString("id-ID", { dateStyle: "long" }),
    jenis: config.judul, nama: f.nama, wa, alamat: f.alamat, catatan: f.catatan.trim(), lokasi,
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
  const bankPenerima = cariProvider(tf?.bank);
  const salin = async () => {
    try {
      await navigator.clipboard.writeText(String(tf.noRek));
      setTersalin(true);
      setTimeout(() => setTersalin(false), 2000);
    } catch { /* clipboard tidak tersedia */ }
  };
  // [/SECTION: INFO-BAYAR]

  // [SECTION: SIMPAN-PENDING] dipanggil setelah verifikasi berhasil; order masuk server berstatus "pending"
  const simpanOrder = async (hasil) => {
    setVerif(false);
    setVerifTerakhir(hasil);
    setSimpan({ status: "menyimpan", pesan: "" });
    try {
      const fd = new FormData();
      fd.append("order", JSON.stringify(order));
      fd.append("bukti", bukti);
      fd.append("metode", hasil.metode);
      fd.append("bukti_verifikasi", hasil.bukti || "");
      fd.append("email", user?.email || "");
      const r = await fetch("/api/orders", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.pesan || "Gagal menyimpan order. Coba lagi.");
      setSimpan({ status: "tersimpan", pesan: "" });
      onSelesai?.(order, { status: "pending", metode: hasil.metode });
    } catch (e) {
      setSimpan({ status: "galat", pesan: e?.message || "Gagal menyimpan order. Coba lagi." });
    }
  };
  // [/SECTION: SIMPAN-PENDING]

  return (
    <div className={`${styles.form} ${className}`}>
      <header className={styles.formHead}>
        <span className="eyebrow">Form Pemesanan</span>
        <h4>Order {config.judul}</h4>
        {config.catatan && <p>{config.catatan}</p>}
      </header>

      {/* [SECTION: PEMBELI] data akun terdaftar (tidak bisa diubah di sini) */}
      <section className={styles.seksi}>
        <h5 className={styles.seksiJudul}><i>1</i>Data Pembeli</h5>
        <div className={styles.pembeli}>
          <FotoAkun user={user} />
          <dl className={styles.pjData}>
            <div><dt>ID Akun</dt><dd>{user?.name || "—"}</dd></div>
            <div><dt>Email</dt><dd>{user?.email || "—"}</dd></div>
          </dl>
        </div>
        <span className={styles.hint}>Diambil dari akun terdaftar Anda dan tidak dapat diubah di form ini.</span>
      </section>
      {/* [/SECTION: PEMBELI] */}

      {/* [SECTION: PENERIMA] */}
      <section className={styles.seksi}>
        <h5 className={styles.seksiJudul}><i>2</i>Data Penerima</h5>
        <div className={styles.grid2}>
          <label className={styles.label}>Nama Penerima
            <input className={styles.input} value={f.nama} onChange={set("nama")} autoComplete="name" /></label>
          <label className={styles.label}>Nomor WhatsApp Penerima
            <input className={styles.input} inputMode="tel" value={f.wa} onChange={set("wa")} placeholder="62812xxxx" autoComplete="tel" /></label>
        </div>
        <label className={styles.label}>Alamat Tujuan
          <textarea className={styles.input} rows={3} value={f.alamat}
            onChange={(e) => { alamatSentuhRef.current = true; set("alamat")(e); }} />
          {lokasi && <span className={styles.hint}>Terisi otomatis dari lokasi GPS. Anda bebas mengubah atau menghapusnya.</span>}
        </label>

        {/* [SECTION: CATATAN] tepat di bawah Alamat Tujuan */}
        <label className={styles.label}>Catatan (opsional)
          <textarea className={styles.input} rows={2} maxLength={500} value={f.catatan} onChange={set("catatan")}
            placeholder="mis. jam bongkar, patokan lokasi, kontak di lapangan" /></label>
        {/* [/SECTION: CATATAN] */}

        {/* [SECTION: LOKASI-GPS] setelah Catatan */}
        <LokasiPicker value={lokasi} onChange={setLokasi} />
        {/* [/SECTION: LOKASI-GPS] */}
      </section>
      {/* [/SECTION: PENERIMA] */}

      {/* [SECTION: BROKER] */}
      <section className={styles.seksi}>
        <h5 className={styles.seksiJudul}><i>3</i>Broker (mitra terdaftar)</h5>
        {MITRA.length > 1 && (
          <div className={styles.mitraList}>
            {MITRA.map((m) => (
              <button key={m.id} type="button"
                className={`${styles.mitraItem} ${m.id === f.mitraId ? styles.mitraAktif : ""}`}
                onClick={() => setF((s) => ({ ...s, mitraId: m.id }))}>
                <img src={m.logo} alt={m.nama} className={styles.mitraLogo} /><span>{m.nama}</span>
              </button>
            ))}
          </div>
        )}
        {mitra && (
          <>
            {/* satu kartu: logo + nama + AHU + NIB + alamat + tombol Maps */}
            <div className={styles.brokerCard}>
              <img src={mitra.logo} alt={mitra.nama} className={styles.brokerLogo} />
              <div className={styles.brokerIsi}>
                <b className={styles.brokerNama}>{mitra.nama}</b>
                <dl className={styles.legal}>
                  <div><dt>Nomor AHU</dt><dd>{mitra.ahu || "—"}</dd></div>
                  <div><dt>NIB</dt><dd>{mitra.nib || "—"}</dd></div>
                  <div><dt>Kantor</dt><dd>{mitra.alamat || "—"}</dd></div>
                </dl>
                {mitra.maps && (
                  <a className={styles.btnMaps} href={mitra.maps} target="_blank" rel="noopener noreferrer">Ke Maps</a>
                )}
              </div>
            </div>
            {mitra.embedMap && (
              <div className={styles.brokerPeta}>
                <div className={styles.brokerPetaJudul}>
                  <b>Lokasi Operasional</b>
                  {mitra.alamatOps && <span>{mitra.alamatOps}</span>}
                </div>
                <iframe title={`Peta lokasi operasional ${mitra.nama}`} src={mitra.embedMap}
                  loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            )}
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
        <h5 className={styles.seksiJudul}><i>4</i>Produk &amp; Jumlah</h5>
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
        <h5 className={styles.seksiJudul}><i>5</i>Pembayaran</h5>
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
          <div className={`${styles.brokerCard} ${styles.bayarCard}`}>
            <img src={mitra.logo} alt={mitra.nama} className={styles.brokerLogo} />
            <div className={styles.brokerIsi}>
              <small className={styles.kecil}>Penerima Pembayaran</small>
              <b className={styles.brokerNama}>{mitra.nama}</b>
              {f.metode === "transfer" && tf && (
                <div className={styles.rekPenerima}>
                  <div className={styles.rekBank}>
                    {bankPenerima && <LogoProvider key={bankPenerima.kode} p={bankPenerima} besar />}
                    <span>{tf.bank}</span>
                  </div>
                  <div className={styles.rekNomor}>
                    <b>{tf.noRek}</b>
                    <button type="button" className={styles.btnSalin} onClick={salin}>{tersalin ? "Tersalin ✓" : "Salin"}</button>
                  </div>
                  <span className={styles.hint}>a.n. {tf.atasNama}{tf.swift ? ` · SWIFT ${tf.swift}` : ""}</span>
                </div>
              )}
              {f.metode === "qris" && <img src={mitra.pembayaran.qris} alt="QRIS" className={styles.qris} />}
            </div>
          </div>
        )}
        {/* [/SECTION: INFO-PEMBAYARAN] */}
      </section>

      {/* [SECTION: REKENING-PEMBELI] tepat setelah info rekening / QR penerima */}
      <section className={styles.seksi}>
        <h5 className={styles.seksiJudul}><i>6</i>Rekening / E-Wallet Anda</h5>
        <span className={styles.hint}>Akun yang Anda pakai untuk membayar, agar pembayaran mudah dicocokkan.</span>
        <div className={styles.segmen} role="group" aria-label="Jenis akun">
          <button type="button" className={bank ? styles.segAktif : ""}
            onClick={() => setDana({ jenis: "bank", kode: "", nomor: dana.nomor })}>Bank</button>
          <button type="button" className={!bank ? styles.segAktif : ""}
            onClick={() => setDana({ jenis: "ewallet", kode: "", nomor: dana.nomor })}>E-Wallet</button>
        </div>

        {/* pilih provider (logo + nama lengkap), tidak bisa diketik bebas */}
        <div className={styles.label}>{bank ? "Nama Bank" : "Nama E-Wallet"}
          <ProviderSelect daftar={daftarProvider} value={dana.kode}
            onChange={(kode) => setDana((x) => ({ ...x, kode }))}
            placeholder={bank ? "Pilih bank" : "Pilih e-wallet"} ariaLabel={bank ? "Nama Bank" : "Nama E-Wallet"} />
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
        <h5 className={styles.seksiJudul}><i>7</i>Bukti Pembayaran</h5>
        <input className={styles.input} type="file" accept="image/*,application/pdf" aria-label="Upload bukti pembayaran"
          onChange={(e) => setBukti(e.target.files?.[0] ?? null)} />
      </section>
      {/* [/SECTION: UPLOAD-BUKTI] */}

      {/* [SECTION: PREVIEW-INVOICE] */}
      {order && <Invoice o={order} />}
      {/* [/SECTION: PREVIEW-INVOICE] */}

      {/* [SECTION: SELESAI] Selesai → minta verifikasi → simpan order berstatus Pending */}
      {simpan.status === "tersimpan" ? (
        <div className={styles.tersimpan} role="status">
          <b>Order tersimpan · Status: PENDING</b>
          <span>No. Invoice <strong>{invId}</strong>. Order Anda menunggu validasi. Simpan nomor invoice ini.</span>
        </div>
      ) : (
        <div className={styles.selesaiWrap}>
          <label className={styles.setuju}>
            <input type="checkbox" checked={setuju} onChange={(e) => setSetuju(e.target.checked)} />
            <span>Saya menyetujui Syarat dan Ketentuan</span>
          </label>
          <button type="button" className={styles.selesai}
            disabled={!valid || simpan.status === "menyimpan"} onClick={() => setVerif(true)}>
            {simpan.status === "menyimpan" ? "Menyimpan order…" : "Selesai"}
          </button>
          {!valid && <p className={styles.petunjuk}>Lengkapi dulu: <b>{kurang.join(", ")}</b></p>}
          {simpan.status === "galat" && (
            <p className={styles.galatSimpan} role="alert">
              {simpan.pesan}{" "}
              {verifTerakhir && <button type="button" className={styles.btnLink} onClick={() => simpanOrder(verifTerakhir)}>Coba simpan lagi</button>}
            </p>
          )}
        </div>
      )}
      {verif && <VerifikasiOrder user={user} onSukses={simpanOrder} onBatal={() => setVerif(false)} />}
      {/* [/SECTION: SELESAI] */}
    </div>
  );
}
