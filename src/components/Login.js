"use client";

import React, { useState } from 'react';
import { useAccount } from './Account';
import styles from './Login.module.css';

const Login = () => {
  const { loginGoogle, loginMicrosoft, loginApple } = useAccount();
  const [authMode, setAuthMode] = useState(null); // 'login_username', 'reg_provider', 'reg_form', 'reg_wa', 'otp_wa', 'reset_password', 'forgot_username', 'otp_email', 'new_password'

  // [STATE-START] Form State
  const [authInput, setAuthInput] = useState({ username: '', password: '', whatsapp: '', email: '', otp: '' });
  const [tempData, setTempData] = useState({});
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

  // [LOGIN-SOCIAL-START] login provider & passkey (maintenance: edit di sini saja)
  const providerLoginMap = {
    Microsoft: loginMicrosoft,
    Google: loginGoogle,
    Apple: loginApple,
  };

  const handleLoginProvider = async (providerName) => {
    try {
      await providerLoginMap[providerName]();
      setAuthMode(null);
    } catch (err) {
      alert(`Login ${providerName} gagal atau dibatalkan.`);
    }
  };

  const handleLoginPasskey = async () => {
    if (!window.PublicKeyCredential) {
      alert("Browser/perangkat ini belum mendukung Passkey.");
      return;
    }
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
      alert("Passkey dibatalkan atau tidak ditemukan.");
    }
  };
  // [LOGIN-SOCIAL-END]

  // [REGISTER-START] 2. KLIK DAFTAR: provider → pilih akun → username & password → WA → OTP
  const handleOpenRegister = () => {
    setAuthMode('reg_provider');
  };

  // [REG-PROVIDER-START] pilih provider → pilih akun → lanjut buat kredensial
  const handleSelectProviderForReg = async (providerName) => {
    try {
      const account = await providerLoginMap[providerName]();
      setTempData({ provider: providerName, account: account || null });
      setAuthMode('reg_form'); // lanjut: Username & Password → WA → OTP
    } catch (err) {
      alert(`Pemilihan akun ${providerName} dibatalkan.`);
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
            <p className={styles.modalDesc} style={{ marginTop: 12 }}>atau masuk dengan</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
              <button type="button" onClick={handleLoginPasskey} className={styles.socialBtn} style={{ padding: '10px' }}>
                🔑 Passkey
              </button>
              <button type="button" onClick={() => handleLoginProvider('Microsoft')} className={styles.socialBtn} style={{ background: '#1e293b', color: '#fff', padding: '10px' }}>
                Microsoft
              </button>
              <button type="button" onClick={() => handleLoginProvider('Google')} className={styles.socialBtn} style={{ padding: '10px' }}>
                Google
              </button>
              <button type="button" onClick={() => handleLoginProvider('Apple')} className={styles.socialBtn} style={{ background: '#0f172a', color: '#fff', padding: '10px' }}>
                Apple
              </button>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 4 }}>
              <button onClick={() => handleSelectProviderForReg('Microsoft')} className={styles.socialBtn} style={{ background: '#1e293b', color: '#fff', padding: '12px' }}>
                Microsoft
              </button>
              <button onClick={() => handleSelectProviderForReg('Google')} className={styles.socialBtn} style={{ padding: '12px' }}>
                Google
              </button>
              <button onClick={() => handleSelectProviderForReg('Apple')} className={styles.socialBtn} style={{ background: '#0f172a', color: '#fff', padding: '12px' }}>
                Apple
              </button>
            </div>

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
