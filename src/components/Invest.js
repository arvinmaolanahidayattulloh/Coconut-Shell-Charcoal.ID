"use client";

import React, { useState } from "react";
import InvestIntro from "./invest/InvestIntro";
import InvestPageContent from "./invest/invest.page";
import InvestProfileContent from "./invest/invest.profile";
import styles from "./invest/invest.module.css";

// embedded: true di halaman utama (mengalir di dalam bagian), false di /invest (layar penuh).
export default function Invest({ embedded = false }) {
  const [activeTab, setActiveTab] = useState("invest");
  const [invested, setInvested] = useState(false);

  const handleOpenApp = () => {
    const start = Date.now();
    window.location.href = "cscid://invest";
    if (!embedded) return; // sudah di /invest, tidak ada tujuan web lain
    setTimeout(() => {
      if (Date.now() - start < 2000 && document.hasFocus()) window.location.href = "/invest";
    }, 1500);
  };

  const full = !embedded;

  return (
    <>
      <InvestIntro />

      <div className={`${styles.shell} ${full ? styles.shellFull : ""}`}>
        <div className={`${styles.appBar} ${full ? styles.appBarFull : ""}`}>
          <div>
            <strong>Gunakan Aplikasi CSCID</strong>
            <span>Lebih cepat dan stabil di aplikasi resmi</span>
          </div>
          <button type="button" className={styles.openApp} onClick={handleOpenApp}>Buka di Apps</button>
        </div>

        <main className={styles.content}>
          {activeTab === "invest" && (
            <InvestPageContent invested={invested} setInvested={setInvested} setActiveTab={setActiveTab} />
          )}
          {activeTab === "profil" && <InvestProfileContent setActiveTab={setActiveTab} />}
        </main>

        <nav className={`${styles.bottomNav} ${full ? styles.bottomNavFull : ""}`} aria-label="Menu Invest">
          {[["invest", "Beranda"], ["profil", "Profil"]].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`${styles.navBtn} ${activeTab === id ? styles.navBtnActive : ""}`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
