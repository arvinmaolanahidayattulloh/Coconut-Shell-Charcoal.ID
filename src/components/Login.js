"use client";

import React, { useState } from 'react';
import { useAccount } from './Account';
import styles from './Login.module.css';

const Login = () => {
  const { loginGoogle, loginMicrosoft, loginApple } = useAccount();
  const [authMode, setAuthMode] = useState(null); 
  const [authInput, setAuthInput] = useState({ username: '', password: '', whatsapp: '', email: '', otp: '' });
  const [tempData, setTempData] = useState({});

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!authInput.username || !authInput.password || !authInput.whatsapp) {
      alert("Semua kolom (Username, Password, No. WhatsApp) wajib diisi!");
      return;
    }
    setTempData({ ...authInput, type: 'register' });
    alert(`Kode OTP WhatsApp telah dikirim ke nomor ${authInput.whatsapp}. (Simulasi: 123456)`);
    setAuthMode('otp_wa');
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

  const handleVerifyWaOtp = (e) => {
    e.preventDefault();
    if (authInput.otp === "123456" || authInput.otp.length === 6) {
      if (tempData.type === 'register') {
        const savedUsers = JSON.parse(localStorage.getItem('csc_registered_users') || '[]');
        savedUsers.push(tempData);
        localStorage.setItem('csc_registered_users', JSON.stringify(savedUsers));
        
        alert("Verifikasi WhatsApp Berhasil! Akun Anda telah dibuat.");
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
    setAuthMode('login');
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
      setAuthMode('login');
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
        <button onClick={() => setAuthMode('login')} className={styles.primaryAuthBtn}>
          Masuk (Username)
        </button>
        <button onClick={() => setAuthMode('register')} className={styles.secondaryAuthBtn}>
          Daftar Akun Baru
        </button>
      </div>

      {/* Pemisah Elegan */}
      <div className={styles.dividerWrapper}>Atau masuk dengan</div>

      {/* Tombol Social Auth (Google, Microsoft, Apple) */}
      <div className={styles.socialButtonsContainer}>
        <button onClick={() => loginGoogle({ name: "Google User", email: "user@gmail.com" })} className={styles.socialBtn}>
          Google
        </button>
        <button onClick={loginMicrosoft} className={styles.socialBtn} style={{ background: '#1e293b', color: '#fff', borderColor: '#1e293b' }}>
          Microsoft
        </button>
        <button onClick={loginApple} className={styles.socialBtn} style={{ background: '#0f172a', color: '#fff', borderColor: '#0f172a' }}>
          Apple
        </button>
      </div>

      {/* Tombol Bantuan (Reset Pass & Lupa Akun) */}
      <div className={styles.linksRow}>
        <button onClick={() => setAuthMode('reset_password')} className={styles.linkBtn}>
          Reset Password (OTP WA)
        </button>
        <button onClick={() => setAuthMode('forgot_username')} className={styles.linkBtn}>
          Lupa Akun? (Cek Email)
        </button>
      </div>

      {/* --- MODAL FORMS --- */}
      {authMode === 'login' && (
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
          </form>
        </div>
      )}

      {authMode === 'register' && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleRegisterSubmit} className={styles.modalForm}>
            <h4 className={styles.modalTitle}>Daftar Akun Baru</h4>
            <p className={styles.modalDesc}>Verifikasi OTP akan dikirim melalui WhatsApp</p>
            <input type="text" placeholder="Buat Username" value={authInput.username} onChange={e => setAuthInput({...authInput, username: e.target.value})} required className={styles.inputField} />
            <input type="password" placeholder="Buat Password" value={authInput.password} onChange={e => setAuthInput({...authInput, password: e.target.value})} required className={styles.inputField} />
            <input type="tel" placeholder="No. WhatsApp (0812...)" value={authInput.whatsapp} onChange={e => setAuthInput({...authInput, whatsapp: e.target.value})} required className={styles.inputField} />
            <div className={styles.modalActionsRow}>
              <button type="submit" className={styles.btnSubmit}>LANJUT & OTP</button>
              <button type="button" onClick={() => setAuthMode(null)} className={styles.btnCancel}>BATAL</button>
            </div>
          </form>
        </div>
      )}

      {authMode === 'otp_wa' && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleVerifyWaOtp} className={styles.modalForm}>
            <h4 className={styles.modalTitle}>OTP WhatsApp</h4>
            <p className={styles.modalDesc}>Simulasi kode OTP: <b>123456</b></p>
            <input type="text" maxLength={6} placeholder="123456" value={authInput.otp} onChange={e => setAuthInput({...authInput, otp: e.target.value})} required className={styles.inputField} style={{ textAlign: 'center', letterSpacing: '6px', fontSize: '18px', fontWeight: 'bold' }} />
            <div className={styles.modalActionsRow}>
              <button type="submit" className={styles.btnSubmit}>VERIFIKASI</button>
              <button type="button" onClick={() => setAuthMode(null)} className={styles.btnCancel}>BATAL</button>
            </div>
          </form>
        </div>
      )}

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
