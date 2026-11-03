"use client";

import React, { useState } from 'react';
import { useAccount } from './Account';
import styles from './Login.module.css';

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

const Login = () => {
  const { loginGoogle, loginMicrosoft, loginApple } = useAccount();
  const [authMode, setAuthMode] = useState(null); // 'login_username', 'reg_provider', 'reg_form', 'reg_wa', 'otp_wa', 'reset_password', 'forgot_username', 'otp_email', 'new_password'

  // [STATE-START] Form State
  const [authInput, setAuthInput] = useState({ username: '', password: '', whatsapp: '', email: '', otp: '' });
  const [tempData, setTempData] = useState({});
  const [busyProvider, setBusyProvider] = useState(null); // nama provider yang sedang diproses
  // [STATE-END]

  // [LOGIN-START] 1. KLIK MASUK
  const handleOpenLogin = () => {
    setAuthMode('login_username');
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const savedUsers = JSON.parse(localStorage.getItem('csc_registered_users') || '[]');
    const found = savedUsers.find(u => u.username === authInput.username && u.password === authInput.password);

    if (found || (authInput.username === "admin" && authInput.password === "admin")) {
      loginGoogle({ name: authInput.username, email: `${authInput.username}@coconutshellcharcoal.id` });
      setAuthMode(null);
      setAuthInput({ username: '', password: '', whatsapp: '', email: '', otp: '' });
    } else {
      alert("Username atau Password salah!");
    }
  };
  // [LOGIN-END]

  // [PROVIDER-HELPER-START] pemanggil provider terpusat (maintenance: perbaiki integrasi provider di sini saja)
  const providerLoginMap = {
    Microsoft: loginMicrosoft,
    Google: loginGoogle,
    Apple: loginApple,
  };

  const runProvider = async (providerName) => {
    const fn = providerLoginMap[providerName];
    if (typeof fn !== 'function') {
      throw new Error(`Fungsi login${providerName} tidak ditemukan di useAccount()`);
    }
    try {
      const res = await fn();
      if (res && typeof res === 'object') return res;
      return { name: `${providerName} User`, email: `${providerName.toLowerCase()}_user@coconutshellcharcoal.id` };
    } catch (err) {
      // Fungsi di Account kemungkinan butuh argumen profil (seperti pemanggilan di handleLoginSubmit)
      if (err instanceof TypeError) {
        console.warn(`[PROVIDER] ${providerName} dipanggil tanpa argumen gagal, coba dengan profil:`, err);
        const profile = { name: `${providerName} User`, email: `${providerName.toLowerCase()}_user@coconutshellcharcoal.id` };
        await fn(profile);
        return profile;
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
      setAuthMode(null);
    } catch (err) {
      console.error(`[LOGIN-SOCIAL] ${providerName}:`, err);
      alert(`Login ${providerName} gagal: ${err?.message || err}`);
    } finally {
      setBusyProvider(null);
    }
  };

  const handleLoginPasskey = async () => {
    if (!window.PublicKeyCredential) {
      alert("Browser/perangkat ini belum mendukung Passkey.");
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
        setAuthMode(null);
      }
    } catch (err) {
      console.error('[LOGIN-SOCIAL] Passkey:', err);
      alert("Passkey dibatalkan atau tidak ditemukan.");
    } finally {
      setBusyProvider(null);
    }
  };
  // [LOGIN-SOCIAL-END]

  // [REGISTER-START] 2. KLIK DAFTAR: provider → pilih akun → username & password → WA → OTP
  const handleOpenRegister = () => {
    setAuthMode('reg_provider');
  };

  // [REG-PROVIDER-START] pilih provider → pilih akun → lanjut buat kredensial
  const handleSelectProviderForReg = async (providerName) => {
    setBusyProvider(providerName);
    try {
      const account = await runProvider(providerName);
      setTempData({ provider: providerName, account: account || null });
      setAuthMode('reg_form'); // lanjut: Username & Password → WA → OTP
    } catch (err) {
      console.error(`[REG-PROVIDER] ${providerName}:`, err);
      alert(`Pemilihan akun ${providerName} gagal: ${err?.message || err}`);
    } finally {
      setBusyProvider(null);
    }
  };
  // [REG-PROVIDER-END]

  const handleRegFormSubmit = (e) => {
    e.preventDefault();
    if (!authInput.username || !authInput.password) {
      alert("Username dan Password wajib diisi!");
      return;
    }
    setTempData(prev => ({ ...prev, username: authInput.username, password: authInput.password }));
    setAuthMode('reg_wa'); // Lanjut ke input No. WhatsApp
  };

  const handleRegWaSubmit = (e) => {
    e.preventDefault();
    if (!authInput.whatsapp) {
      alert("No. WhatsApp wajib diisi!");
      return;
    }
    setTempData(prev => ({ ...prev, whatsapp: authInput.whatsapp, type: 'register' }));
    alert(`Kode OTP pendaftaran telah dikirim ke WhatsApp ${authInput.whatsapp}. (Simulasi OTP: 123456)`);
    setAuthMode('otp_wa');
  };

  const handleVerifyWaOtp = (e) => {
    e.preventDefault();
    if (authInput.otp === "123456" || authInput.otp.length === 6) {
      if (tempData.type === 'register') {
        const savedUsers = JSON.parse(localStorage.getItem('csc_registered_users') || '[]');
        savedUsers.push(tempData);
        localStorage.setItem('csc_registered_users', JSON.stringify(savedUsers));

        alert("Verifikasi WhatsApp Berhasil! Akun Anda telah terdaftar.");
        loginGoogle({ name: tempData.username, email: `${tempData.username}@coconutshellcharcoal.id` });
        setAuthMode(null);
      } else if (tempData.type === 'reset_pass') {
        alert("OTP benar! Silakan buat password baru Anda.");
        setAuthMode('new_password');
        return;
      }
      setAuthInput({ username: '', password: '', whatsapp: '', email: '', otp: '' });
    } else {
      alert("Kode OTP salah! (Gunakan 123456)");
    }
  };
  // [REGISTER-END]

  // [RESET-START] 3. FITUR LUPA / RESET
  const handleForgotPassSubmit = (e) => {
    e.preventDefault();
    if (!authInput.whatsapp) {
      alert("Masukkan No. WhatsApp Anda.");
      return;
    }
    setTempData({ whatsapp: authInput.whatsapp, type: 'reset_pass' });
    alert(`OTP Reset Password dikirim ke WhatsApp ${authInput.whatsapp}. (Simulasi OTP: 123456)`);
    setAuthMode('otp_wa');
  };

  const handleNewPasswordSubmit = (e) => {
    e.preventDefault();
    if (!authInput.password) {
      alert("Masukkan password baru.");
      return;
    }
    alert("Password berhasil diubah! Silakan login kembali.");
    setAuthMode('login_username');
    setAuthInput({ username: '', password: '', whatsapp: '', email: '', otp: '' });
  };

  const handleForgotUsernameSubmit = (e) => {
    e.preventDefault();
    if (!authInput.email) {
      alert("Masukkan Email terdaftar Anda.");
      return;
    }
    setTempData({ email: authInput.email });
    alert(`Kode OTP verifikasi telah dikirim ke Email ${authInput.email}. (Simulasi OTP: 654321)`);
    setAuthMode('otp_email');
  };

  const handleVerifyEmailOtp = (e) => {
    e.preventDefault();
    if (authInput.otp === "654321" || authInput.otp.length === 6) {
      alert(`Verifikasi Email Berhasil! Username Anda telah dikirimkan melalui email ke ${tempData.email}.`);
      setAuthMode('login_username');
      setAuthInput({ username: '', password: '', whatsapp: '', email: '', otp: '' });
    } else {
      alert("Kode OTP Email salah! (Gunakan 654321)");
    }
  };
  // [RESET-END]

  return (
    <div className={styles.loginContainer}>
      <span className={styles.subtitle}>
        Amankan alokasi kuota komoditas ekspor Anda sekarang.
      </span>

      {/* Tombol Utama (Masuk & Daftar) */}
      <div className={styles.authButtonsRow}>
        <button onClick={handleOpenLogin} className={styles.primaryAuthBtn}>
          Masuk
        </button>
        <button onClick={handleOpenRegister} className={styles.secondaryAuthBtn}>
          Daftar
        </button>
      </div>

      {/* Tautan Bantuan (Reset Pass & Lupa Akun) */}
      <div className={styles.linksRow}>
        <button onClick={() => setAuthMode('reset_password')} className={styles.linkBtn}>
          Reset Password (OTP WA)
        </button>
        <button onClick={() => setAuthMode('forgot_username')} className={styles.linkBtn}>
          Lupa Akun? (Cek Email)
        </button>
      </div>

      {/* ================= MODAL 1: LOGIN USERNAME + PASSKEY/PROVIDER ================= */}
      {authMode === 'login_username' && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleLoginSubmit} className={styles.modalForm}>
            <h4 className={styles.modalTitle}>Masuk Akun</h4>
            <p className={styles.modalDesc}>Masukkan username dan password Anda</p>
            <input type="text" placeholder="Username" value={authInput.username} onChange={e => setAuthInput({...authInput, username: e.target.value})} required className={styles.inputField} />
            <input type="password" placeholder="Password" value={authInput.password} onChange={e => setAuthInput({...authInput, password: e.target.value})} required className={styles.inputField} />
            <div className={styles.modalActionsRow}>
              <button type="submit" className={styles.btnSubmit}>MASUK</button>
              <button type="button" onClick={() => setAuthMode(null)} className={styles.btnCancel}>BATAL</button>
            </div>

            {/* [LOGIN-SOCIAL-UI-START] */}
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
            {/* [LOGIN-SOCIAL-UI-END] */}
          </form>
        </div>
      )}

      {/* ================= MODAL 2: PILIH PROVIDER REGISTRASI ================= */}
      {authMode === 'reg_provider' && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalForm}>
            <h4 className={styles.modalTitle}>Pilih Metode Pendaftaran</h4>
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
              <button type="button" onClick={() => setAuthMode(null)} className={styles.btnCancel} style={{ width: '100%' }}>KEMBALI</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: BUAT USERNAME & PASSWORD (REG) ================= */}
      {authMode === 'reg_form' && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleRegFormSubmit} className={styles.modalForm}>
            <h4 className={styles.modalTitle}>Buat Kredensial Akun</h4>
            <p className={styles.modalDesc}>
              Metode terpilih: <b>{tempData.provider}</b>
              {tempData.account?.email ? <> ({tempData.account.email})</> : null}
            </p>
            <input type="text" placeholder="Buat Username" value={authInput.username} onChange={e => setAuthInput({...authInput, username: e.target.value})} required className={styles.inputField} />
            <input type="password" placeholder="Buat Password" value={authInput.password} onChange={e => setAuthInput({...authInput, password: e.target.value})} required className={styles.inputField} />
            <div className={styles.modalActionsRow}>
              <button type="submit" className={styles.btnSubmit}>NEXT</button>
              <button type="button" onClick={() => setAuthMode('reg_provider')} className={styles.btnCancel}>KEMBALI</button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL 4: MASUKKAN NO. WHATSAPP (REG) ================= */}
      {authMode === 'reg_wa' && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleRegWaSubmit} className={styles.modalForm}>
            <h4 className={styles.modalTitle}>Nomor WhatsApp</h4>
            <p className={styles.modalDesc}>Masukkan nomor WhatsApp untuk verifikasi</p>
            <input type="tel" placeholder="No. WhatsApp (0812...)" value={authInput.whatsapp} onChange={e => setAuthInput({...authInput, whatsapp: e.target.value})} required className={styles.inputField} />
            <div className={styles.modalActionsRow}>
              <button type="submit" className={styles.btnSubmit}>NEXT & KIRIM OTP</button>
              <button type="button" onClick={() => setAuthMode('reg_form')} className={styles.btnCancel}>KEMBALI</button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL 5: VERIFIKASI OTP WHATSAPP ================= */}
      {authMode === 'otp_wa' && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleVerifyWaOtp} className={styles.modalForm}>
            <h4 className={styles.modalTitle}>Verifikasi OTP WhatsApp</h4>
            <p className={styles.modalDesc}>Simulasi kode OTP: <b>123456</b></p>
            <input type="text" maxLength={6} placeholder="123456" value={authInput.otp} onChange={e => setAuthInput({...authInput, otp: e.target.value})} required className={styles.inputField} style={{ textAlign: 'center', letterSpacing: '6px', fontSize: '18px', fontWeight: 'bold' }} />
            <div className={styles.modalActionsRow}>
              <button type="submit" className={styles.btnSubmit}>VERIFIKASI</button>
              <button type="button" onClick={() => setAuthMode(null)} className={styles.btnCancel}>BATAL</button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL 6: RESET PASSWORD (VIA WA) ================= */}
      {authMode === 'reset_password' && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleForgotPassSubmit} className={styles.modalForm}>
            <h4 className={styles.modalTitle}>Reset Password</h4>
            <p className={styles.modalDesc}>Masukkan No. WhatsApp terdaftar</p>
            <input type="tel" placeholder="No. WhatsApp" value={authInput.whatsapp} onChange={e => setAuthInput({...authInput, whatsapp: e.target.value})} required className={styles.inputField} />
            <div className={styles.modalActionsRow}>
              <button type="submit" className={styles.btnSubmit}>KIRIM OTP</button>
              <button type="button" onClick={() => setAuthMode(null)} className={styles.btnCancel}>BATAL</button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL 7: PASSWORD BARU ================= */}
      {authMode === 'new_password' && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleNewPasswordSubmit} className={styles.modalForm}>
            <h4 className={styles.modalTitle}>Password Baru</h4>
            <p className={styles.modalDesc}>Masukkan sandi baru untuk akun Anda</p>
            <input type="password" placeholder="Password Baru" value={authInput.password} onChange={e => setAuthInput({...authInput, password: e.target.value})} required className={styles.inputField} />
            <div className={styles.modalActionsRow}>
              <button type="submit" className={styles.btnSubmit}>SIMPAN</button>
              <button type="button" onClick={() => setAuthMode(null)} className={styles.btnCancel}>BATAL</button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL 8: LUPA AKUN / USERNAME (VIA EMAIL) ================= */}
      {authMode === 'forgot_username' && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleForgotUsernameSubmit} className={styles.modalForm}>
            <h4 className={styles.modalTitle}>Lupa Akun</h4>
            <p className={styles.modalDesc}>Masukkan email terdaftar Anda</p>
            <input type="email" placeholder="email@domain.com" value={authInput.email} onChange={e => setAuthInput({...authInput, email: e.target.value})} required className={styles.inputField} />
            <div className={styles.modalActionsRow}>
              <button type="submit" className={styles.btnSubmit}>KIRIM OTP</button>
              <button type="button" onClick={() => setAuthMode(null)} className={styles.btnCancel}>BATAL</button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL 9: OTP EMAIL ================= */}
      {authMode === 'otp_email' && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleVerifyEmailOtp} className={styles.modalForm}>
            <h4 className={styles.modalTitle}>OTP Email</h4>
            <p className={styles.modalDesc}>Simulasi kode OTP: <b>654321</b></p>
            <input type="text" maxLength={6} placeholder="654321" value={authInput.otp} onChange={e => setAuthInput({...authInput, otp: e.target.value})} required className={styles.inputField} style={{ textAlign: 'center', letterSpacing: '6px', fontSize: '18px', fontWeight: 'bold' }} />
            <div className={styles.modalActionsRow}>
              <button type="submit" className={styles.btnSubmit}>KIRIM USERNAME</button>
              <button type="button" onClick={() => setAuthMode(null)} className={styles.btnCancel}>BATAL</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Login;
