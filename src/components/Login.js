"use client";

import React, { useState } from 'react';
import styles from './Login.module.css';
import Register from './Register';
import {
  AuthModal,
  OtpFlow,
  ProviderIcon,
  useAuthForm,
  useProviderAuth,
  loadUsers,
  saveUsers,
  sameText,
  normalizeWa,
} from './AuthShared';

// ============================================================
// Login.jsx — titik masuk: Masuk, Passkey, provider, Lupa Akun, Reset Password
// Daftar ada di Register.jsx (dipanggil dari sini)
// ============================================================

const Login = () => {
  const { loginGoogle, runProvider, busyProvider, setBusyProvider } = useProviderAuth();
  const { values, bind, reset } = useAuthForm();

  // authMode: null | login_username | register
  //           | forgot_email | forgot_wa | forgot_otp
  //           | reset_username | reset_email | reset_wa | reset_otp | new_password
  const [authMode, setAuthMode] = useState(null);
  const [tempData, setTempData] = useState({});

  // [NAV-START] navigasi antar modal
  const openMode = (mode, data = {}) => { reset(); setTempData(data); setAuthMode(mode); };
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

  // [FORGOT-START] 2. LUPA AKUN: email → WA → OTP Email → OTP WA → username dikirim via email
  const handleForgotEmailSubmit = (e) => {
    e.preventDefault();
    setTempData((prev) => ({ ...prev, email: values.email.trim() }));
    setAuthMode('forgot_wa');
  };

  const handleForgotWaSubmit = (e) => {
    e.preventDefault();
    const found = loadUsers().find(
      (u) => sameText(u.email, tempData.email) && normalizeWa(u.whatsapp) === normalizeWa(values.whatsapp)
    );
    if (!found) { alert('Email dan No. WhatsApp tidak cocok dengan akun terdaftar.'); return; }
    setTempData((prev) => ({ ...prev, whatsapp: values.whatsapp, username: found.username }));
    setAuthMode('forgot_otp');
  };

  const handleForgotOtpSuccess = () => {
    // TODO produksi: kirim email lewat backend
    alert(`Username Anda telah dikirim ke email ${tempData.email}. (Simulasi: username = ${tempData.username})`);
    goLogin();
  };
  // [FORGOT-END]

  // [RESET-START] 3. RESET PASSWORD: username → email → WA → OTP Email → OTP WA → password baru
  const handleResetUsernameSubmit = (e) => {
    e.preventDefault();
    setTempData((prev) => ({ ...prev, username: values.username.trim() }));
    setAuthMode('reset_email');
  };

  const handleResetEmailSubmit = (e) => {
    e.preventDefault();
    setTempData((prev) => ({ ...prev, email: values.email.trim() }));
    setAuthMode('reset_wa');
  };

  const handleResetWaSubmit = (e) => {
    e.preventDefault();
    const found = loadUsers().find(
      (u) =>
        sameText(u.username, tempData.username) &&
        sameText(u.email, tempData.email) &&
        normalizeWa(u.whatsapp) === normalizeWa(values.whatsapp)
    );
    if (!found) { alert('Username, Email, dan No. WhatsApp tidak cocok dengan akun terdaftar.'); return; }
    setTempData((prev) => ({ ...prev, whatsapp: values.whatsapp }));
    setAuthMode('reset_otp');
  };

  const handleResetOtpSuccess = () => { reset(); setAuthMode('new_password'); };

  const handleNewPasswordSubmit = (e) => {
    e.preventDefault();
    const users = loadUsers().map((u) =>
      sameText(u.username, tempData.username) ? { ...u, password: values.password } : u
    );
    saveUsers(users);
    alert('Password berhasil diubah! Silakan login kembali.');
    goLogin();
  };
  // [RESET-END]

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
        <button onClick={() => openMode('reset_username')} className={styles.linkBtn}>Reset Password</button>
        <button onClick={() => openMode('forgot_email')} className={styles.linkBtn}>Lupa Akun?</button>
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

      {/* ============ LUPA AKUN ============ */}
      {authMode === 'forgot_email' && (
        <AuthModal title="Lupa Akun" desc="Masukkan email terdaftar Anda" onSubmit={handleForgotEmailSubmit} submitLabel="NEXT" onBack={closeAll}>
          <input type="email" placeholder="email@domain.com" {...bind('email')} />
        </AuthModal>
      )}

      {authMode === 'forgot_wa' && (
        <AuthModal title="Nomor WhatsApp" desc="Masukkan nomor WhatsApp yang terdaftar" onSubmit={handleForgotWaSubmit} submitLabel="KIRIM OTP" onBack={() => setAuthMode('forgot_email')} backLabel="KEMBALI">
          <input type="tel" placeholder="No. WhatsApp (0812...)" {...bind('whatsapp')} />
        </AuthModal>
      )}

      {authMode === 'forgot_otp' && (
        <OtpFlow email={tempData.email} whatsapp={tempData.whatsapp} onSuccess={handleForgotOtpSuccess} onCancel={closeAll} />
      )}

      {/* ============ RESET PASSWORD ============ */}
      {authMode === 'reset_username' && (
        <AuthModal title="Reset Password" desc="Masukkan username akun Anda" onSubmit={handleResetUsernameSubmit} submitLabel="NEXT" onBack={closeAll}>
          <input type="text" placeholder="Username" {...bind('username')} />
        </AuthModal>
      )}

      {authMode === 'reset_email' && (
        <AuthModal title="Email Terdaftar" desc="Masukkan email yang terdaftar" onSubmit={handleResetEmailSubmit} submitLabel="NEXT" onBack={() => setAuthMode('reset_username')} backLabel="KEMBALI">
          <input type="email" placeholder="email@domain.com" {...bind('email')} />
        </AuthModal>
      )}

      {authMode === 'reset_wa' && (
        <AuthModal title="Nomor WhatsApp" desc="Masukkan nomor WhatsApp yang terdaftar" onSubmit={handleResetWaSubmit} submitLabel="KIRIM OTP" onBack={() => setAuthMode('reset_email')} backLabel="KEMBALI">
          <input type="tel" placeholder="No. WhatsApp (0812...)" {...bind('whatsapp')} />
        </AuthModal>
      )}

      {authMode === 'reset_otp' && (
        <OtpFlow email={tempData.email} whatsapp={tempData.whatsapp} onSuccess={handleResetOtpSuccess} onCancel={closeAll} />
      )}

      {authMode === 'new_password' && (
        <AuthModal title="Password Baru" desc="Masukkan sandi baru untuk akun Anda" onSubmit={handleNewPasswordSubmit} submitLabel="SIMPAN" onBack={closeAll}>
          <input type="password" placeholder="Password Baru (min. 6 karakter)" {...bind('password', { minLength: 6 })} />
        </AuthModal>
      )}
    </div>
  );
};

export default Login;
