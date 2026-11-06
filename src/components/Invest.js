"use client";

import React, { useState } from "react";
import InvestTotal from "./invest/InvestTotal";
import InvestAlur from "./invest/InvestAlur";
import InvestPageContent from "./invest/invest.page";
import InvestProfileContent from "./invest/invest.profile";
import styles from "./invest/invest.module.css";
import { useAccount } from "./Account";

export const TAB_INVEST = { id: "invest", label: "Investasi CSCID" };

// Satu panel (tab) "Investasi CSCID": judul, total stok, alur, lalu area masuk/investasi.
// embedded: true di halaman utama (mengalir di dalam bagian), false di /invest (halaman penuh).
export default function Invest({ embedded = false }) {
  const [activeTab, setActiveTab] = useState("invest");
  const [invested, setInvested] = useState(false);
  const { user } = useAccount();

  const handleOpenApp = () => {
    const start = Date.now();
    window.location.href = "cscid://invest";
    if (!embedded) return; // sudah di /invest, tidak ada tujuan web lain
    setTimeout(() => {
      if (Date.now() - start < 2000 && document.hasFocus()) window.location.href = "/invest";
    }, 1500);
  };

  // Di halaman utama sudah ada <main id="beranda">; <main> kedua tidak valid, jadi pakai <div>.
  const Outer = embedded ? "div" : "main";

  return (
    <Outer className={embedded ? styles.luar : `${styles.luar} ${styles.luarPenuh}`}>
      <section className={styles.panel} aria-labelledby="invest-judul">
        <header className={styles.kepala}>
          <div className={styles.kepalaTeks}>
            <h2 id="invest-judul" className={styles.judul}>Investasi CSCID</h2>
            <h3 className={styles.subjudul}>Invest di stok arang batok kelapa</h3>
            <p className={styles.lead}>
              Prosesnya seperti membeli: pilih jumlah, lalu bayar. Bedanya, barang tetap di gudang kami dan Anda menerima bagi hasil dari penjualannya.
            </p>
          </div>
          <button type="button" className={styles.bukaApp} onClick={handleOpenApp}>
            <span className={styles.bukaAppLabel}>Lebih cepat di aplikasi</span>
            <strong>Buka di Apps</strong>
          </button>
        </header>

        <InvestTotal />
        <InvestAlur />

        <div className={`${styles.bagian} ${styles.aksi}`} id="mulai-invest">
          <h3 className={styles.sub}>{user ? "Investasi Anda" : "Mulai Invest"}</h3>
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
