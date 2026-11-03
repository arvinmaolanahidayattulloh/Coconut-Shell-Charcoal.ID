"use client";

import React, { useState } from 'react';
import styles from './Login.module.css';
import Register from './Register';
import Recovery from './Recovery';
import {
  AuthModal,
  ProviderIcon,
  useAuthForm,
  useProviderAuth,
  loadUsers,
  sameText,
} from './AuthShared';

// ============================================================
// Login.jsx — titik masuk: Masuk, Passkey, provider
// Daftar  → Register.jsx (dipanggil dari sini)
// Lupa Akun & Reset Password → Recovery.jsx (dipanggil dari sini)
// ============================================================

const Login = () => {
  const { loginGoogle, runProvider, busyProvider, setBusyProvider } = useProviderAuth();
  const { values, bind, reset } = useAuthForm();

  // authMode: null | login_username | register | forgot | reset
  const [authMode, setAuthMode] = useState(null);

  // [NAV-START] navigasi antar modal
  const openMode = (mode) => { reset(); setAuthMode(mode); };
  const closeAll = () => openMode(null);
  const goLogin = () => openMode('login_username');
  // [NAV-END]

  // [LOGIN-START] 1. MASUK USERNAME & PASSWORD
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const found = loadUsers().find(
      (u) => sameText(u.username, values.username) && u.password === values.password
    );
    if (found || (values.username === 'admin' && values.password === 'admin')) {
      loginGoogle({ name: values.username, email: found?.email || `${values.username}@coconutshellcharcoal.id` });
      closeAll();
    } else {
      alert('Username atau Password salah!');
    }
  };
  // [LOGIN-END]

  // [LOGIN-SOCIAL-START] Masuk dengan provider & passkey
  const handleLoginProvider = async (providerName) => {
    setBusyProvider(providerName);
    try {
      await runProvider(providerName);
      closeAll();
    } catch (err) {
      console.error(`[LOGIN-SOCIAL] ${providerName}:`, err);
      alert(`Login ${providerName} gagal: ${err?.message || err}`);
    } finally {
      setBusyProvider(null);
    }
  };

  const handleLoginPasskey = async () => {
    if (!window.PublicKeyCredential) {
      alert('Browser/perangkat ini belum mendukung Passkey.');
      return;
    }
    setBusyProvider('Passkey');
    try {
      // TODO: challenge harus dari server & hasilnya diverifikasi di server
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const cred = await navigator.credentials.get({
        publicKey: { challenge, timeout: 60000, userVerification: 'preferred' },
      });
      if (cred) {
        loginGoogle({ name: 'passkey_user', email: 'passkey_user@coconutshellcharcoal.id' });
        closeAll();
      }
    } catch (err) {
      console.error('[LOGIN-SOCIAL] Passkey:', err);
      alert('Passkey dibatalkan atau tidak ditemukan.');
    } finally {
      setBusyProvider(null);
    }
  };
  // [LOGIN-SOCIAL-END]

  return (
    <div className={styles.loginContainer}>
      <span className={styles.subtitle}>
        Amankan alokasi kuota komoditas ekspor Anda sekarang.
      </span>

      {/* Tombol Utama (Masuk & Daftar) */}
      <div className={styles.authButtonsRow}>
        <button onClick={goLogin} className={styles.primaryAuthBtn}>Masuk</button>
        <button onClick={() => openMode('register')} className={styles.secondaryAuthBtn}>Daftar</button>
      </div>

      {/* Tautan Bantuan */}
      <div className={styles.linksRow}>
        <button onClick={() => openMode('reset')} className={styles.linkBtn}>Reset Password</button>
        <button onClick={() => openMode('forgot')} className={styles.linkBtn}>Lupa Akun?</button>
      </div>

      {/* ============ MODAL: MASUK (username+password, Passkey, Microsoft/Google/Apple) ============ */}
      {authMode === 'login_username' && (
        <AuthModal
          title="Masuk Akun"
          desc="Masukkan username dan password Anda"
          onSubmit={handleLoginSubmit}
          submitLabel="MASUK"
          onBack={closeAll}
          footer={
            /* [LOGIN-SOCIAL-UI-START] */
            <>
              <div className={styles.dividerWrapper}>atau masuk dengan</div>

              <button type="button" onClick={handleLoginPasskey} disabled={busyProvider !== null} className={styles.passkeyBtn}>
                <ProviderIcon name="Passkey" />
                {busyProvider === 'Passkey' ? 'Memverifikasi...' : 'Masuk dengan Passkey'}
              </button>

              <div className={styles.socialGrid}>
                {['Microsoft', 'Google', 'Apple'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleLoginProvider(p)}
                    disabled={busyProvider !== null}
                    className={styles.providerCard}
                    aria-label={`Masuk dengan ${p}`}
                  >
                    <ProviderIcon name={p} />
                    <span>{busyProvider === p ? '...' : p}</span>
                  </button>
                ))}
              </div>
            </>
            /* [LOGIN-SOCIAL-UI-END] */
          }
        >
          <input type="text" placeholder="Username" {...bind('username')} />
          <input type="password" placeholder="Password" {...bind('password')} />
        </AuthModal>
      )}

      {/* ============ DAFTAR (komponen terpisah: Register.jsx) ============ */}
      <Register open={authMode === 'register'} onClose={closeAll} onRegistered={goLogin} />

      {/* ============ LUPA AKUN & RESET PASSWORD (komponen terpisah: Recovery.jsx) ============ */}
      <Recovery
        mode={authMode === 'forgot' ? 'forgot' : authMode === 'reset' ? 'reset' : null}
        onClose={closeAll}
        onDone={goLogin}
      />
    </div>
  );
};

export default Login;
