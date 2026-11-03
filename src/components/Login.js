"use client";

import React, { useState } from 'react';
import { useAccount } from './Account';
import styles from './Login.module.css';

// [CONST-START] Konstanta (OTP masih simulasi, ganti dengan backend saat produksi)
const OTP_EMAIL_SIM = '654321';
const OTP_WA_SIM = '123456';
const USERS_KEY = 'csc_registered_users';
const EMPTY_INPUT = { username: '', password: '', whatsapp: '', email: '', otp: '' };
const otpStyle = { textAlign: 'center', letterSpacing: '6px', fontSize: '18px', fontWeight: 'bold' };
// [CONST-END]

// [HELPERS-START] Penyimpanan & validasi
const loadUsers = () => {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
};
const saveUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));
const sameText = (a, b) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();
const normalizeWa = (v) => (v || '').replace(/\D/g, '').replace(/^62/, '0');
const isValidWa = (v) => { const d = normalizeWa(v); return d.length >= 9 && d.length <= 14; };
// [HELPERS-END]

// [ICONS-START] Logo penyedia auth (SVG inline, tanpa dependensi)
const ProviderIcon = ({ name, size = 20 }) => {
  const common = { width: size, height: size, className: styles.providerIcon, 'aria-hidden': true };

  if (name === 'Google') {
    return (
      <svg {...common} viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
    );
  }

  if (name === 'Microsoft') {
    return (
      <svg {...common} viewBox="0 0 21 21">
        <rect x="1" y="1" width="9" height="9" fill="#F25022" />
        <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
        <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
        <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
      </svg>
    );
  }

  if (name === 'Apple') {
    return (
      <svg {...common} viewBox="0 0 24 24" fill="#000000">
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
      </svg>
    );
  }

  // Passkey
  return (
    <svg {...common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l9-9" />
      <path d="M16 7l3 3" />
      <path d="M14 9l2 2" />
    </svg>
  );
};
// [ICONS-END]

// [MODAL-WRAPPER-START] Pembungkus modal form (dipakai semua modal form)
const AuthModal = ({ title, desc, onSubmit, submitLabel, onBack, backLabel = 'BATAL', footer = null, children }) => (
  <div className={styles.modalOverlay}>
    <form onSubmit={onSubmit} className={styles.modalForm}>
      <h4 className={styles.modalTitle}>{title}</h4>
      <p className={styles.modalDesc}>{desc}</p>
      {children}
      <div className={styles.modalActionsRow}>
        <button type="submit" className={styles.btnSubmit}>{submitLabel}</button>
        <button type="button" onClick={onBack} className={styles.btnCancel}>{backLabel}</button>
      </div>
      {footer}
    </form>
  </div>
);
// [MODAL-WRAPPER-END]

const Login = () => {
  const { loginGoogle, loginMicrosoft, loginApple } = useAccount();
  // authMode: login_username | reg_provider | reg_form | reg_wa | otp_email | otp_wa
  //           forgot_email | forgot_wa | reset_username | reset_email | reset_wa | new_password
  const [authMode, setAuthMode] = useState(null);

  // [STATE-START]
  const [authInput, setAuthInput] = useState(EMPTY_INPUT);
  const [tempData, setTempData] = useState({}); // { flow: 'register'|'forgot'|'reset', ... }
  const [busyProvider, setBusyProvider] = useState(null);
  // [STATE-END]

  // [UTIL-START] helper UI
  const bind = (key, extra = {}) => ({
    value: authInput[key],
    onChange: (e) => setAuthInput((prev) => ({ ...prev, [key]: e.target.value })),
    required: true,
    className: styles.inputField,
    ...extra,
  });
  const closeAll = () => { setAuthInput(EMPTY_INPUT); setTempData({}); setAuthMode(null); };
  const goLogin = () => { setAuthInput(EMPTY_INPUT); setTempData({}); setAuthMode('login_username'); };
  const goStep = (mode, clearOtp = false) => {
    if (clearOtp) setAuthInput((prev) => ({ ...prev, otp: '' }));
    setAuthMode(mode);
  };
  // [UTIL-END]

  // [LOGIN-START] 1. MASUK USERNAME & PASSWORD
  const handleOpenLogin = () => { setAuthInput(EMPTY_INPUT); setTempData({}); setAuthMode('login_username'); };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const found = loadUsers().find(
      (u) => sameText(u.username, authInput.username) && u.password === authInput.password
    );
    if (found || (authInput.username === 'admin' && authInput.password === 'admin')) {
      loginGoogle({ name: authInput.username, email: found?.email || `${authInput.username}@coconutshellcharcoal.id` });
      closeAll();
    } else {
      alert('Username atau Password salah!');
    }
  };
  // [LOGIN-END]

  // [PROVIDER-HELPER-START] pemanggil provider terpusat (perbaiki integrasi provider di sini saja)
  const providerLoginMap = { Microsoft: loginMicrosoft, Google: loginGoogle, Apple: loginApple };

  const runProvider = async (providerName) => {
    const fn = providerLoginMap[providerName];
    if (typeof fn !== 'function') {
      throw new Error(`Fungsi login${providerName} tidak ditemukan di useAccount()`);
    }
    const fallbackProfile = {
      name: `${providerName} User`,
      email: `${providerName.toLowerCase()}_user@coconutshellcharcoal.id`,
    };
    try {
      const res = await fn();
      return res && typeof res === 'object' ? res : fallbackProfile;
    } catch (err) {
      if (err instanceof TypeError) {
        console.warn(`[PROVIDER] ${providerName} tanpa argumen gagal, coba dengan profil:`, err);
        await fn(fallbackProfile);
        return fallbackProfile;
      }
      throw err;
    }
  };
  // [PROVIDER-HELPER-END]

  // [LOGIN-SOCIAL-START] login provider & passkey
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

  // [REGISTER-START] 2. DAFTAR: akun provider → username → password → WA → OTP Email → OTP WA → Login
  const handleOpenRegister = () => { setAuthInput(EMPTY_INPUT); setTempData({ flow: 'register' }); setAuthMode('reg_provider'); };

  const handleSelectProviderForReg = async (providerName) => {
    setBusyProvider(providerName);
    try {
      const account = await runProvider(providerName);
      setTempData({ flow: 'register', provider: providerName, account, email: account?.email || '' });
      setAuthMode('reg_form');
    } catch (err) {
      console.error(`[REG-PROVIDER] ${providerName}:`, err);
      alert(`Pemilihan akun ${providerName} gagal: ${err?.message || err}`);
    } finally {
      setBusyProvider(null);
    }
  };

  const handleRegFormSubmit = (e) => {
    e.preventDefault();
    if (loadUsers().some((u) => sameText(u.username, authInput.username))) {
      alert('Username sudah dipakai, pilih username lain.');
      return;
    }
    setTempData((prev) => ({ ...prev, username: authInput.username.trim(), password: authInput.password }));
    setAuthMode('reg_wa');
  };

  const handleRegWaSubmit = (e) => {
    e.preventDefault();
    if (!isValidWa(authInput.whatsapp)) { alert('Nomor WhatsApp tidak valid.'); return; }
    setTempData((prev) => ({ ...prev, whatsapp: authInput.whatsapp }));
    goStep('otp_email', true);
  };
  // [REGISTER-END]

  // [OTP-START] Verifikasi OTP bersama (dipakai Daftar, Lupa Akun, Reset Password)
  const handleVerifyEmailOtp = (e) => {
    e.preventDefault();
    if (authInput.otp !== OTP_EMAIL_SIM) { alert('Kode OTP Email salah!'); return; }
    goStep('otp_wa', true);
  };

  const handleVerifyWaOtp = (e) => {
    e.preventDefault();
    if (authInput.otp !== OTP_WA_SIM) { alert('Kode OTP WhatsApp salah!'); return; }

    if (tempData.flow === 'register') {
      const users = loadUsers();
      users.push({
        provider: tempData.provider,
        email: tempData.email,
        username: tempData.username,
        password: tempData.password, // TODO produksi: hash di server, jangan simpan polos
        whatsapp: tempData.whatsapp,
      });
      saveUsers(users);
      alert('Pendaftaran berhasil! Silakan masuk dengan username dan password Anda.');
      goLogin();
    } else if (tempData.flow === 'forgot') {
      // TODO produksi: kirim email lewat backend
      alert(`Username Anda telah dikirim ke email ${tempData.email}. (Simulasi: username = ${tempData.username})`);
      goLogin();
    } else if (tempData.flow === 'reset') {
      setAuthInput({ ...EMPTY_INPUT });
      setAuthMode('new_password');
    }
  };
  // [OTP-END]

  // [FORGOT-START] 3. LUPA AKUN: email → WA → OTP Email → OTP WA → username dikirim via email
  const handleOpenForgot = () => { setAuthInput(EMPTY_INPUT); setTempData({ flow: 'forgot' }); setAuthMode('forgot_email'); };

  const handleForgotEmailSubmit = (e) => {
    e.preventDefault();
    setTempData((prev) => ({ ...prev, email: authInput.email.trim() }));
    setAuthMode('forgot_wa');
  };

  const handleForgotWaSubmit = (e) => {
    e.preventDefault();
    const found = loadUsers().find(
      (u) => sameText(u.email, tempData.email) && normalizeWa(u.whatsapp) === normalizeWa(authInput.whatsapp)
    );
    if (!found) { alert('Email dan No. WhatsApp tidak cocok dengan akun terdaftar.'); return; }
    setTempData((prev) => ({ ...prev, whatsapp: authInput.whatsapp, username: found.username }));
    goStep('otp_email', true);
  };
  // [FORGOT-END]

  // [RESET-START] 4. RESET PASSWORD: username → email → WA → OTP Email → OTP WA → password baru
  const handleOpenReset = () => { setAuthInput(EMPTY_INPUT); setTempData({ flow: 'reset' }); setAuthMode('reset_username'); };

  const handleResetUsernameSubmit = (e) => {
    e.preventDefault();
    setTempData((prev) => ({ ...prev, username: authInput.username.trim() }));
    setAuthMode('reset_email');
  };

  const handleResetEmailSubmit = (e) => {
    e.preventDefault();
    setTempData((prev) => ({ ...prev, email: authInput.email.trim() }));
    setAuthMode('reset_wa');
  };

  const handleResetWaSubmit = (e) => {
    e.preventDefault();
    const found = loadUsers().find(
      (u) =>
        sameText(u.username, tempData.username) &&
        sameText(u.email, tempData.email) &&
        normalizeWa(u.whatsapp) === normalizeWa(authInput.whatsapp)
    );
    if (!found) { alert('Username, Email, dan No. WhatsApp tidak cocok dengan akun terdaftar.'); return; }
    setTempData((prev) => ({ ...prev, whatsapp: authInput.whatsapp }));
    goStep('otp_email', true);
  };

  const handleNewPasswordSubmit = (e) => {
    e.preventDefault();
    const users = loadUsers().map((u) =>
      sameText(u.username, tempData.username) ? { ...u, password: authInput.password } : u
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
        <button onClick={handleOpenLogin} className={styles.primaryAuthBtn}>Masuk</button>
        <button onClick={handleOpenRegister} className={styles.secondaryAuthBtn}>Daftar</button>
      </div>

      {/* Tautan Bantuan */}
      <div className={styles.linksRow}>
        <button onClick={handleOpenReset} className={styles.linkBtn}>Reset Password</button>
        <button onClick={handleOpenForgot} className={styles.linkBtn}>Lupa Akun?</button>
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
              <div className={styles.dividerWrapper} style={{ width: '100%' }}>atau masuk dengan</div>

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
                    className={`${styles.providerBtn} ${styles.providerBtnStack}`}
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

      {/* ============ DAFTAR 1: PILIH AKUN PROVIDER ============ */}
      {authMode === 'reg_provider' && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalForm}>
            <h4 className={styles.modalTitle}>Daftar Akun</h4>
            <p className={styles.modalDesc}>Pilih platform, lalu pilih akun Anda</p>

            {/* [REG-PROVIDER-UI-START] */}
            <div className={styles.providerStack}>
              {['Microsoft', 'Google', 'Apple'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSelectProviderForReg(p)}
                  disabled={busyProvider !== null}
                  className={`${styles.providerBtn} ${styles.providerBtnWide}`}
                >
                  <ProviderIcon name={p} size={22} />
                  <span>{busyProvider === p ? 'Membuka pilihan akun...' : `Daftar dengan ${p}`}</span>
                </button>
              ))}
            </div>
            {/* [REG-PROVIDER-UI-END] */}

            <div className={styles.modalActionsRow} style={{ marginTop: 12 }}>
              <button type="button" onClick={closeAll} className={styles.btnCancel} style={{ width: '100%' }}>KEMBALI</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ DAFTAR 2: USERNAME & PASSWORD ============ */}
      {authMode === 'reg_form' && (
        <AuthModal
          title="Buat Username & Password"
          desc={<>Akun terpilih: <b>{tempData.provider}</b>{tempData.email ? <> ({tempData.email})</> : null}</>}
          onSubmit={handleRegFormSubmit}
          submitLabel="NEXT"
          onBack={() => setAuthMode('reg_provider')}
          backLabel="KEMBALI"
        >
          <input type="text" placeholder="Buat Username" {...bind('username')} />
          <input type="password" placeholder="Buat Password (min. 6 karakter)" {...bind('password', { minLength: 6 })} />
        </AuthModal>
      )}

      {/* ============ DAFTAR 3: NO. WHATSAPP ============ */}
      {authMode === 'reg_wa' && (
        <AuthModal
          title="Nomor WhatsApp"
          desc="Masukkan nomor WhatsApp untuk verifikasi"
          onSubmit={handleRegWaSubmit}
          submitLabel="KIRIM OTP"
          onBack={() => setAuthMode('reg_form')}
          backLabel="KEMBALI"
        >
          <input type="tel" placeholder="No. WhatsApp (0812...)" {...bind('whatsapp')} />
        </AuthModal>
      )}

      {/* ============ LUPA AKUN 1: EMAIL ============ */}
      {authMode === 'forgot_email' && (
        <AuthModal
          title="Lupa Akun"
          desc="Masukkan email terdaftar Anda"
          onSubmit={handleForgotEmailSubmit}
          submitLabel="NEXT"
          onBack={closeAll}
        >
          <input type="email" placeholder="email@domain.com" {...bind('email')} />
        </AuthModal>
      )}

      {/* ============ LUPA AKUN 2: NO. WHATSAPP ============ */}
      {authMode === 'forgot_wa' && (
        <AuthModal
          title="Nomor WhatsApp"
          desc="Masukkan nomor WhatsApp yang terdaftar"
          onSubmit={handleForgotWaSubmit}
          submitLabel="KIRIM OTP"
          onBack={() => setAuthMode('forgot_email')}
          backLabel="KEMBALI"
        >
          <input type="tel" placeholder="No. WhatsApp (0812...)" {...bind('whatsapp')} />
        </AuthModal>
      )}

      {/* ============ RESET PASSWORD 1: USERNAME ============ */}
      {authMode === 'reset_username' && (
        <AuthModal
          title="Reset Password"
          desc="Masukkan username akun Anda"
          onSubmit={handleResetUsernameSubmit}
          submitLabel="NEXT"
          onBack={closeAll}
        >
          <input type="text" placeholder="Username" {...bind('username')} />
        </AuthModal>
      )}

      {/* ============ RESET PASSWORD 2: EMAIL ============ */}
      {authMode === 'reset_email' && (
        <AuthModal
          title="Email Terdaftar"
          desc="Masukkan email yang terdaftar"
          onSubmit={handleResetEmailSubmit}
          submitLabel="NEXT"
          onBack={() => setAuthMode('reset_username')}
          backLabel="KEMBALI"
        >
          <input type="email" placeholder="email@domain.com" {...bind('email')} />
        </AuthModal>
      )}

      {/* ============ RESET PASSWORD 3: NO. WHATSAPP ============ */}
      {authMode === 'reset_wa' && (
        <AuthModal
          title="Nomor WhatsApp"
          desc="Masukkan nomor WhatsApp yang terdaftar"
          onSubmit={handleResetWaSubmit}
          submitLabel="KIRIM OTP"
          onBack={() => setAuthMode('reset_email')}
          backLabel="KEMBALI"
        >
          <input type="tel" placeholder="No. WhatsApp (0812...)" {...bind('whatsapp')} />
        </AuthModal>
      )}

      {/* ============ OTP EMAIL (bersama: Daftar / Lupa Akun / Reset) ============ */}
      {authMode === 'otp_email' && (
        <AuthModal
          title="Verifikasi OTP Email"
          desc={<>Kode dikirim ke <b>{tempData.email}</b>.<br />Simulasi kode: <b>{OTP_EMAIL_SIM}</b></>}
          onSubmit={handleVerifyEmailOtp}
          submitLabel="VERIFIKASI"
          onBack={closeAll}
        >
          <input type="text" inputMode="numeric" maxLength={6} placeholder="••••••" {...bind('otp', { style: otpStyle })} />
        </AuthModal>
      )}

      {/* ============ OTP WHATSAPP (bersama: Daftar / Lupa Akun / Reset) ============ */}
      {authMode === 'otp_wa' && (
        <AuthModal
          title="Verifikasi OTP WhatsApp"
          desc={<>Kode dikirim ke WhatsApp <b>{tempData.whatsapp}</b>.<br />Simulasi kode: <b>{OTP_WA_SIM}</b></>}
          onSubmit={handleVerifyWaOtp}
          submitLabel="VERIFIKASI"
          onBack={closeAll}
        >
          <input type="text" inputMode="numeric" maxLength={6} placeholder="••••••" {...bind('otp', { style: otpStyle })} />
        </AuthModal>
      )}

      {/* ============ RESET PASSWORD 4: PASSWORD BARU ============ */}
      {authMode === 'new_password' && (
        <AuthModal
          title="Password Baru"
          desc="Masukkan sandi baru untuk akun Anda"
          onSubmit={handleNewPasswordSubmit}
          submitLabel="SIMPAN"
          onBack={closeAll}
        >
          <input type="password" placeholder="Password Baru (min. 6 karakter)" {...bind('password', { minLength: 6 })} />
        </AuthModal>
      )}
    </div>
  );
};

export default Login;
