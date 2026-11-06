"use client";

import React, { useEffect, useRef, useState } from "react";
import InvestTotal from "./invest/InvestTotal";
import InvestAlur from "./invest/InvestAlur";
import InvestPageContent from "./invest/invest.page";
import InvestProfileContent from "./invest/invest.profile";
import styles from "./invest/invest.module.css";
import { useAccount } from "./Account";

export const TAB_INVEST = { id: "invest", label: "Invest CSCID" };

// Satu panel "Invest CSCID": judul, jumlah ton, tombol Panduan, lalu login / investasi.
// embedded: true di halaman utama (mengalir di dalam bagian), false di /invest (halaman penuh).
export default function Invest({ embedded = false }) {
  const [activeTab, setActiveTab] = useState("invest");
  const [invested, setInvested] = useState(false);
  const { user } = useAccount();
  const panduanRef = useRef(null);

  const handleOpenApp = () => {
    const start = Date.now();
    window.location.href = "cscid://invest";
    if (!embedded) return; // sudah di /invest, tidak ada tujuan web lain
    setTimeout(() => {
      if (Date.now() - start < 2000 && document.hasFocus()) window.location.href = "/invest";
    }, 1500);
  };

  // Panduan dibuka sebagai dialog modal bawaan browser (fokus terkunci, Esc menutup).
  const bukaPanduan = () => {
    const d = panduanRef.current;
    if (!d || d.open) return;
    d.showModal();
    document.body.style.overflow = "hidden";
  };
  const tutupPanduan = () => panduanRef.current?.close();
  const lepasKunci = () => { document.body.style.overflow = ""; };
  useEffect(() => lepasKunci, []);

  // Di halaman utama sudah ada <main id="beranda">; <main> kedua tidak valid, jadi pakai <div>.
  const Outer = embedded ? "div" : "main";

  return (
    <Outer className={embedded ? styles.luar : `${styles.luar} ${styles.luarPenuh}`}>
      <section className={styles.panel} aria-labelledby="invest-judul">
        <header className={styles.kepala}>
          <h2 id="invest-judul" className={styles.judul}>Invest CSCID</h2>
          <button type="button" className={styles.bukaApp} onClick={handleOpenApp} title="Lebih cepat dan stabil di aplikasi resmi">
            Buka di Apps
          </button>
        </header>

        <InvestTotal />

        <div className={styles.panduanBar}>
          <button type="button" className={styles.panduanBtn} onClick={bukaPanduan} aria-haspopup="dialog">
            <span className={styles.panduanIkon} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z" /><path d="M4 19a2 2 0 0 1 2-2h13" />
              </svg>
            </span>
            <span className={styles.panduanTeks}>
              <strong>Panduan</strong>
              <span>Alur, bagi hasil, dan beda Invest dengan Beli</span>
            </span>
            <span className={styles.panduanPanah} aria-hidden="true">›</span>
          </button>
        </div>

        <dialog
          ref={panduanRef}
          className={styles.dialog}
          aria-labelledby="panduan-judul"
          onClose={lepasKunci}
          onClick={(e) => { if (e.target === e.currentTarget) tutupPanduan(); }}
        >
          <div className={styles.dialogKepala}>
            <h3 id="panduan-judul">Panduan Invest</h3>
            <button type="button" className={styles.dialogTutup} onClick={tutupPanduan} aria-label="Tutup panduan">×</button>
          </div>
          <div className={styles.dialogIsi}>
            <p className={styles.lead}>
              <strong>Invest di stok arang batok kelapa.</strong> Prosesnya seperti membeli: pilih jumlah, lalu bayar. Bedanya, barang tetap di gudang kami dan Anda menerima bagi hasil dari penjualannya.
            </p>
            <InvestAlur />
          </div>
        </dialog>

        <div className={`${styles.bagian} ${styles.areaMasuk}`} id="mulai-invest">
          {user && <h3 className={styles.sub}>Investasi Anda</h3>}
          {activeTab === "invest" && (
            <InvestPageContent invested={invested} setInvested={setInvested} setActiveTab={setActiveTab} />
          )}
          {activeTab === "profil" && <InvestProfileContent setActiveTab={setActiveTab} />}
        </div>

        {/* Tab hanya relevan setelah masuk (Profil butuh akun). */}
        {user && (
          <nav className={styles.tab} aria-label="Menu Invest">
            {[["invest", "Beranda"], ["profil", "Profil"]].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-current={activeTab === id ? "page" : undefined}
                className={`${styles.tabBtn} ${activeTab === id ? styles.tabAktif : ""}`}
              >
                {label}
              </button>
            ))}
          </nav>
        )}
      </section>
    </Outer>
  );
}
