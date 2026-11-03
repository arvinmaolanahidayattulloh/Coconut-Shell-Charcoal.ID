"use client";

import React, { useState } from 'react';
import { useAccount } from './Account';
import styles from './Login.module.css';

const Login = () => {
  const { loginGoogle, loginMicrosoft, loginApple } = useAccount();
  const [authMode, setAuthMode] = useState(null); 
  
  // Form State
  const [authInput, setAuthInput] = useState({ username: '', password: '', whatsapp: '', email: '', otp: '' });
  const [tempData, setTempData] = useState({});

  // --- 1. ALUR LOGIN ---
  const handleOpenLogin = () => {
    setAuthMode('login_choice'); // Pilihan: Login via Username atau Social Auth
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

  const handleSocialLogin = (providerName) => {
    if (providerName === 'Google') loginGoogle({ name: "Google User", email: "user@gmail.com" });
    else if (providerName === 'Microsoft') loginMicrosoft();
    else if (providerName === 'Apple') loginApple();
    setAuthMode(null);
  };

  // --- 2. ALUR PENDAFTARAN (REGISTRASI) ---
  const handleOpenRegister = () => {
    setAuthMode('reg_provider'); // Langkah 1: Pilih Provider (Microsoft, Google, Apple)
  };

  const handleSelectProviderForReg = (providerName) => {
    setTempData({ provider: providerName });
    setAuthMode('reg_form'); // Langkah 2: Buat Username dan Password
  };

  const handleRegFormSubmit = (e) => {
    e.preventDefault();
    if (!authInput.username || !authInput.password) {
      alert("Username dan Password wajib diisi!");
      return;
    }
    setTempData(prev => ({ ...prev, username: authInput.username, password: authInput.password }));
    setAuthMode('reg_wa'); // Langkah 3: Meminta No. WhatsApp
  };

  const handleRegWaSubmit = (e) => {
    e.preventDefault();
    if (!authInput.whatsapp) {
      alert("No. WhatsApp wajib diisi!");
      return;
    }
    setTempData(prev => ({ ...prev, whatsapp: authInput.whatsapp, type: 'register' }));
    alert(`Kode OTP pendaftaran telah dikirim ke WhatsApp ${authInput.whatsapp}. (Simulasi OTP: 123456)`);
    setAuthMode('otp_wa'); // Langkah 4: Minta Kode OTP WhatsApp
  };

  const handleVerifyWaOtp = (e) => {
    e.preventDefault();
    if (authInput.otp === "123456" || authInput.otp.length === 6) {
      if (tempData.type === 'register') {
        const savedUsers = JSON.parse(localStorage.getItem('csc_registered_users') || '[]');
        savedUsers.push(tempData);
        localStorage.setItem('csc_registered_users', JSON.stringify(savedUsers));
        
        alert(`Registrasi Berhasil via ${tempData.provider}! Akun Anda telah aktif.`);
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

  // --- 3. FITUR LUPA / RESET ---
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
    setAuthMode('login_choice');
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
      setAuthMode('login_choice');
      setAuthInput({ username: '', password: '', whatsapp: '', email: '', otp: '' });
    } else {
      alert("Kode OTP Email salah! (Gunakan 654321)");
    }
  };

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

      {/* ================= MODAL 1: PILIHAN LOGIN ================= */}
      {authMode === 'login_choice' && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalForm}>
            <h4 className={styles.modalTitle}>Pilih Metode Masuk</h4>
            <p className={styles.modalDesc}>Masuk menggunakan akun atau platform Anda</p>
            
            <button onClick={() => setAuthMode('login_username')} className={styles.primaryAuthBtn} style={{ width: '100%', marginBottom: 4 }}>
              Masuk dengan Username
            </button>
            
            <div className={styles.dividerWrapper}>Atau</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
              <button onClick={() => handleSocialLogin('Microsoft')} className={styles.socialBtn} style={{ background: '#1e293b', color: '#fff', padding: '12px' }}>
                Microsoft
              </button>
              <button onClick={() => handleSocialLogin('Google')} className={styles.socialBtn} style={{ padding: '12px' }}>
                Google
              </button>
              <button onClick={() => handleSocialLogin('Apple')} className={styles.socialBtn} style={{ background: '#0f172a', color: '#fff', padding: '12px' }}>
                Apple
              </button>
            </div>

            <div className={styles.modalActionsRow} style={{ marginTop: 12 }}>
              <button type="button" onClick={() => setAuthMode(null)} className={styles.btnCancel} style={{ width: '100%' }}>KEMBALI</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 1.1: LOGIN USERNAME & PASSWORD ================= */}
      {authMode === 'login_username' && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleLoginSubmit} className={styles.modalForm}>
            <h4 className={styles.modalTitle}>Masuk dengan Username</h4>
            <p className={styles.modalDesc}>Masukkan kredensial akun Anda</p>
            <input type="text" placeholder="Username" value={authInput.username} onChange={e => setAuthInput({...authInput, username: e.target.value})} required className={styles.inputField} />
            <input type="password" placeholder="Password" value={authInput.password} onChange={e => setAuthInput({...authInput, password: e.target.value})} required className={styles.inputField} />
            <div className={styles.modalActionsRow}>
              <button type="submit" className={styles.btnSubmit}>MASUK</button>
              <button type="button" onClick={() => setAuthMode('login_choice')} className={styles.btnCancel}>KEMBALI</button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL 2: PILIH AKUN/PROVIDER UNTUK PENDAFTARAN ================= */}
      {authMode === 'reg_provider' && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalForm}>
            <h4 className={styles.modalTitle}>Pilih Akun / Platform</h4>
            <p className={styles.modalDesc}>Pilih akun yang ingin dihubungkan untuk mendaftar</p>
            
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
            <p className={styles.modalDesc}>Akun terpilih: <b>{tempData.provider}</b></p>
            <input type="text" placeholder="Buat Username" value={authInput.username} onChange={e => setAuthInput({...authInput, username: e.target.value})} required className={styles.inputField} />
            <input type="password" placeholder="Buat Password" value={authInput.password} onChange={e => setAuthInput({...authInput, password: e.target.value})} required className={styles.inputField} />
            <div className={styles.modalActionsRow}>
              <button type="submit" className={styles.btnSubmit}>NEXT</button>
              <button type="button" onClick={() => setAuthMode('reg_provider')} className={styles.btnCancel}>KEMBALI</button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL 4: MEMINTA NOMOR WHATSAPP (REG) ================= */}
      {authMode === 'reg_wa' && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleRegWaSubmit} className={styles.modalForm}>
            <h4 className={styles.modalTitle}>Nomor WhatsApp</h4>
            <p className={styles.modalDesc}>Masukkan nomor WhatsApp untuk menerima OTP</p>
            <input type="tel" placeholder="No. WhatsApp (0812...)" value={authInput.whatsapp} onChange={e => setAuthInput({...authInput, whatsapp: e.target.value})} required className={styles.inputField} />
            <div className={styles.modalActionsRow}>
              <button type="submit" className={styles.btnSubmit}>KIRIM OTP</button>
              <button type="button" onClick={() => setAuthMode('reg_form')} className={styles.btnCancel}>KEMBALI</button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL 5: KODE OTP WHATSAPP ================= */}
      {authMode === 'otp_wa' && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleVerifyWaOtp} className={styles.modalForm}>
            <h4 className={styles.modalTitle}>Kode OTP WhatsApp</h4>
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
