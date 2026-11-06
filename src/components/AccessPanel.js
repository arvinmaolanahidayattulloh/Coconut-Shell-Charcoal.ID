"use client";

import Login from "./Login";
import { useAccount } from "./Account";
import RevealWrapper from "./RevealWrapper";
import styles from "./AccessPanel.module.css";

const WA_LINK =
  "https://wa.me/6285168152525?text=" +
  encodeURIComponent("Halo Pusat Bantuan CSCID, saya butuh bantuan.");

const IconHeadset = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
    <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

// Bagian "Akun & Bantuan": susunan Login/Register sama dengan panel Invest
// (gambar, Username, Password, Masuk, "Atau Login with", Passkey, Microsoft/Google/Apple,
// Daftar, Lupa Akun?/Reset Password), lalu satu baris Customer Service bergaya tombol Panduan di Invest.
export default function AccessPanel() {
  const { user, logout } = useAccount();

  return (
    <section className={`${styles.access} wrap`} id="akun" aria-labelledby="akun-judul">
      <RevealWrapper className={styles.head}>
        <span className="eyebrow">Akun &amp; Bantuan</span>
        <h2 id="akun-judul" className={styles.title}>Mulai Bersama CSCID</h2>
        <p className={styles.desc}>
          Daftar atau masuk untuk mengakses akun Anda. Tim kami siap membantu setiap hari.
        </p>
      </RevealWrapper>

      <div className={styles.panel}>
        <div className={styles.area}>
          {user ? (
            <div className={styles.salam}>
              <div className={styles.salamTeks}>
                <strong>Halo, {user.name}</strong>
                <span>Anda sudah masuk{user.email ? ` sebagai ${user.email}` : ""}.</span>
              </div>
              <button type="button" className={styles.keluar} onClick={logout}>
                Keluar
              </button>
            </div>
          ) : (
            // listenRegister: tombol "Buy" di Produk membuka Register lewat instance ini
            // (hanya satu instance per halaman yang boleh mendengarkan).
            <Login
              listenRegister
              imageAlt="Ilustrasi akun CSCID"
              formLabel="Masuk atau daftar akun CSCID"
            />
          )}
        </div>

        <div className={styles.bantuanBar}>
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className={styles.bantuanBtn}>
            <span className={styles.bantuanIkon} aria-hidden="true"><IconHeadset /></span>
            <span className={styles.bantuanTeks}>
              <strong>Customer Service</strong>
              <span>Tanya harga, pesanan, atau kendala akun via WhatsApp</span>
            </span>
            <span className={styles.bantuanPanah} aria-hidden="true">›</span>
          </a>
        </div>
      </div>
    </section>
  );
}
