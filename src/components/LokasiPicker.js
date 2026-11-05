"use client";
// [FILE: src/components/LokasiPicker.js]
// Lokasi GPS pembeli. Tiga cara, semuanya opsional (lokasi tidak harus sama dengan posisi pembeli):
//   1. GPS akurat      : navigator.geolocation (high accuracy), ambil pembacaan terbaik ±15 dtk
//   2. Cari di peta    : nama tempat / alamat → OpenStreetMap Nominatim, atau tempel koordinat / tautan
//   3. Koordinat       : "-6.2, 106.8" atau tautan Google Maps (yang memuat koordinat)
// Nilai: { lat, lng, akurasi|null, sumber: "gps"|"cari"|"koordinat", label? } atau null.
import { useEffect, useRef, useState } from "react";
import styles from "./Order.module.css";

// [SECTION: PARSE-KOORDINAT]
const ANGKA = "(-?\\d{1,3}(?:\\.\\d+)?)";
const POLA = [
  new RegExp(`@${ANGKA},\\s*${ANGKA}`), //                 .../@-6.2,106.8,17z
  new RegExp(`!3d${ANGKA}!4d${ANGKA}`), //                 .../data=!3d-6.2!4d106.8
  new RegExp(`[?&](?:q|ll|query|destination)=${ANGKA}[,\\s]+${ANGKA}`), // ?q=-6.2,106.8
  new RegExp(`^\\s*${ANGKA}\\s*[,;\\s]\\s*${ANGKA}\\s*$`), //  -6.2, 106.8
];

export function parseKoordinat(teks) {
  if (!teks) return null;
  let t = String(teks).trim();
  try { t = decodeURIComponent(t); } catch (e) { /* pakai apa adanya */ }
  for (const re of POLA) {
    const m = t.match(re);
    if (!m) continue;
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }
  return null;
}
// [/SECTION: PARSE-KOORDINAT]

const fmt = (n) => Number(n).toFixed(6);

function petaSrc({ lat, lng }) {
  const d = 0.004;
  const bbox = [lng - d, lat - d, lng + d, lat + d].join("%2C");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}

function pesanGalat(err) {
  if (err?.code === 1) return "Izin lokasi ditolak. Aktifkan izin lokasi di browser, atau pakai Cari di Peta / Koordinat.";
  if (err?.code === 2) return "Posisi tidak tersedia. Coba di area terbuka, atau pakai Cari di Peta / Koordinat.";
  return "Waktu habis saat mencari sinyal GPS. Coba lagi, atau pakai Cari di Peta / Koordinat.";
}

// [SECTION: KOMPONEN-LOKASI]
export default function LokasiPicker({ value, onChange }) {
  const [tab, setTab] = useState("gps");
  const [status, setStatus] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [q, setQ] = useState("");
  const [hasil, setHasil] = useState([]);
  const [koord, setKoord] = useState("");
  const watchRef = useRef(null);
  const timerRef = useRef(null);

  const stopGps = () => {
    if (watchRef.current != null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchRef.current);
    }
    watchRef.current = null;
    clearTimeout(timerRef.current);
  };
  useEffect(() => () => stopGps(), []);

  const pilih = (lat, lng, sumber, label) => {
    onChange({ lat, lng, akurasi: null, sumber, label });
    setHasil([]);
    setStatus("");
  };

  // --- 1. GPS akurat: pantau beberapa detik, simpan pembacaan dengan akurasi terbaik ---
  const ambilGps = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus("Browser ini tidak mendukung GPS. Pakai Cari di Peta / Koordinat.");
      return;
    }
    stopGps();
    setSibuk(true);
    setHasil([]);
    setStatus("Mencari sinyal GPS… tunggu beberapa detik agar akurat.");
    let terbaik = null;

    const selesai = (pesan) => {
      stopGps();
      setSibuk(false);
      setStatus(pesan);
    };

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (!terbaik || accuracy < terbaik.akurasi) {
          terbaik = { lat: latitude, lng: longitude, akurasi: Math.round(accuracy), sumber: "gps" };
          onChange(terbaik);
          setStatus(`Memperbaiki akurasi… ±${terbaik.akurasi} m`);
        }
        if (accuracy <= 20) selesai(`Lokasi didapat · akurasi ±${terbaik.akurasi} m`);
      },
      (err) => { if (!terbaik) selesai(pesanGalat(err)); else selesai(`Lokasi didapat · akurasi ±${terbaik.akurasi} m`); },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );

    timerRef.current = setTimeout(() => {
      if (!terbaik) return selesai("Sinyal GPS tidak ditemukan. Coba lagi, atau pakai Cari di Peta / Koordinat.");
      selesai(
        terbaik.akurasi > 100
          ? `Akurasi ±${terbaik.akurasi} m kurang tepat. Coba di area terbuka, atau pakai Cari di Peta / Koordinat.`
          : `Lokasi didapat · akurasi ±${terbaik.akurasi} m`
      );
    }, 15000);
  };

  // --- 2. Cari di peta (OpenStreetMap Nominatim) ---
  const cari = async () => {
    const kata = q.trim();
    if (kata.length < 3) { setStatus("Ketik minimal 3 huruf nama tempat atau alamat."); return; }
    const k = parseKoordinat(kata);
    if (k) { pilih(k.lat, k.lng, "koordinat"); return; }
    setSibuk(true);
    setHasil([]);
    setStatus("");
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=id&q=${encodeURIComponent(kata)}`
      );
      if (!r.ok) throw new Error("gagal");
      const j = await r.json();
      const list = j.map((x) => ({ lat: Number(x.lat), lng: Number(x.lon), label: x.display_name }));
      setHasil(list);
      if (!list.length) setStatus("Tempat tidak ditemukan. Coba kata kunci lain, atau tempel koordinat dari Google Maps.");
    } catch (e) {
      setStatus("Pencarian peta gagal. Periksa koneksi, atau tempel koordinat dari Google Maps.");
    } finally {
      setSibuk(false);
    }
  };

  // --- 3. Koordinat / tautan Google Maps ---
  const pakaiKoordinat = () => {
    const k = parseKoordinat(koord);
    if (!k) {
      setStatus("Format tidak dikenali. Contoh: -6.200000, 106.816666 — atau tempel tautan Google Maps (bukan tautan pendek).");
      return;
    }
    pilih(k.lat, k.lng, "koordinat");
  };

  const enter = (fn) => (e) => { if (e.key === "Enter") { e.preventDefault(); fn(); } };

  return (
    <div className={styles.lokasi}>
      <div className={styles.lokasiJudul}>
        Lokasi GPS<small>opsional — tidak harus lokasi Anda saat ini</small>
      </div>

      <div className={styles.segmen} role="tablist" aria-label="Cara menentukan lokasi">
        {[["gps", "GPS Saya"], ["cari", "Cari di Peta"], ["koordinat", "Koordinat"]].map(([k, nama]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k}
            className={tab === k ? styles.segAktif : ""}
            onClick={() => { setTab(k); setStatus(""); setHasil([]); }}>
            {nama}
          </button>
        ))}
      </div>

      {tab === "gps" && (
        <>
          <div className={styles.baris}>
            <button type="button" className={styles.btnSolid} onClick={ambilGps} disabled={sibuk}>
              {sibuk ? "Mencari GPS…" : value?.sumber === "gps" ? "Ambil Ulang GPS" : "Gunakan Lokasi Saya"}
            </button>
          </div>
          <span className={styles.hint}>
            Aktifkan GPS dan izinkan akses lokasi. Hasil paling akurat di area terbuka. Bukan di lokasi tujuan? Pakai tab Cari di Peta atau Koordinat.
          </span>
        </>
      )}

      {tab === "cari" && (
        <>
          <div className={styles.baris}>
            <input className={styles.input} value={q} onChange={(e) => setQ(e.target.value)}
              onKeyDown={enter(cari)} placeholder="Nama tempat / alamat / pelabuhan, mis. Pelabuhan Tanjung Priok" />
            <button type="button" className={styles.btnSolid} onClick={cari} disabled={sibuk}>
              {sibuk ? "Mencari…" : "Cari"}
            </button>
          </div>
          {hasil.length > 0 && (
            <div className={styles.hasilList}>
              {hasil.map((h, i) => (
                <button key={i} type="button" className={styles.hasilItem}
                  onClick={() => pilih(h.lat, h.lng, "cari", h.label)}>
                  {h.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "koordinat" && (
        <>
          <div className={styles.baris}>
            <input className={styles.input} value={koord} onChange={(e) => setKoord(e.target.value)}
              onKeyDown={enter(pakaiKoordinat)} inputMode="decimal"
              placeholder="-6.200000, 106.816666 atau tautan Google Maps" />
            <button type="button" className={styles.btnSolid} onClick={pakaiKoordinat}>Pakai</button>
          </div>
          <span className={styles.hint}>
            Di Google Maps: tekan lama titik tujuan → salin angka koordinat di bagian atas → tempel di sini.
          </span>
        </>
      )}

      {status && <div className={styles.statusTeks} role="status">{status}</div>}

      {value && (
        <>
          <div className={styles.peta}>
            <iframe title="Peta lokasi" src={petaSrc(value)} loading="lazy" referrerPolicy="no-referrer" />
          </div>
          <div className={styles.lokasiMeta}>
            <b>{fmt(value.lat)}, {fmt(value.lng)}</b>
            {value.akurasi != null && <span>akurasi ±{value.akurasi} m</span>}
            <a href={`https://www.google.com/maps?q=${value.lat},${value.lng}`} target="_blank" rel="noopener noreferrer">
              Buka di Google Maps
            </a>
            <button type="button" className={styles.btnLink} onClick={() => { stopGps(); setSibuk(false); setStatus(""); onChange(null); }}>
              Hapus lokasi
            </button>
            {value.label && <span className={styles.lokasiLabel}>{value.label}</span>}
          </div>
        </>
      )}
    </div>
  );
}
// [/SECTION: KOMPONEN-LOKASI]
