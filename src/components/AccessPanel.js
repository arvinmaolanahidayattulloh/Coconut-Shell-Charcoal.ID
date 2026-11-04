"use client";

import Login from "./Login";
import { useAccount } from "./Account";
import RevealWrapper from "./RevealWrapper";
import styles from "./AccessPanel.module.css";

const WA_LINK =
  "https://wa.me/6285168152525?text=" +
  encodeURIComponent("Halo Pusat Bantuan CSCID, saya butuh bantuan.");

const IconUserPlus = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="16" y1="11" x2="22" y2="11" />
  </svg>
);

const IconLogin = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);

const IconHeadset = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
    <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

export default function AccessPanel() {
  const { user, logout } = useAccount();

  return (
    <section className={`${styles.access} wrap`} id="akun">
      <RevealWrapper className={styles.head}>
        <span className="eyebrow">Akun &amp; Bantuan</span>
        <h2 className={styles.title}>Mulai Bersama CSCID</h2>
        <p className={styles.desc}>
          Daftar atau masuk untuk mengakses akun Anda. Tim kami siap membantu setiap hari.
        </p>
      </RevealWrapper>

      <Login>
        {({ openRegister, openLogin }) => (
          <div className={styles.grid}>
            {user ? (
              <div className={`${styles.card} ${styles.cardWide}`}>
                <div className={styles.icon}><IconLogin /></div>
                <h3 className={styles.cardTitle}>Halo, {user.name}</h3>
                <p className={styles.cardDesc}>Anda sudah masuk{user.email ? ` sebagai ${user.email}` : ""}.</p>
                <button type="button" className={styles.btnGhost} onClick={logout}>
                  Keluar
                </button>
              </div>
            ) : (
              <>
                <div className={styles.card}>
                  <div className={styles.icon}><IconUserPlus /></div>
                  <h3 className={styles.cardTitle}>Register</h3>
                  <p className={styles.cardDesc}>Buat akun baru dalam hitungan menit.</p>
                  <button type="button" className={styles.btnGhost} onClick={openRegister}>
                    Daftar
                  </button>
                </div>

                <div className={styles.card}>
                  <div className={styles.icon}><IconLogin /></div>
                  <h3 className={styles.cardTitle}>Login</h3>
                  <p className={styles.cardDesc}>Sudah punya akun? Masuk untuk melanjutkan.</p>
                  <button type="button" className={styles.btnPrimary} onClick={openLogin}>
                    Masuk
                  </button>
                </div>
              </>
            )}

            <div className={styles.card}>
              <div className={styles.icon}><IconHeadset /></div>
              <h3 className={styles.cardTitle}>Customer Service</h3>
              <p className={styles.cardDesc}>Tanya harga, pesanan, atau kendala akun via WhatsApp.</p>
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className={styles.btnGhost}>
                Hubungi Kami
              </a>
            </div>
          </div>
        )}
      </Login>
    </section>
  );
}
