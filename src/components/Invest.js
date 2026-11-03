"use client";

import React, { useState } from 'react';
import { useAccount } from './Account'; 
import styles from './Invest.module.css';

const Invest = ({ invested, setInvested, activeTab, setActiveTab }) => {
  const { user, loginGoogle, loginMicrosoft, loginApple, logout } = useAccount();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const handleLogout = () => {
    logout();
    setInvested(false); 
    setActiveTab('invest');
    setMenuOpen(false);
  };

  const handleInvest = () => {
    setInvested(true);
    alert(`Terima kasih ${user.name || 'Investor'}, investasi sebesar 75 Ton berhasil diproses!`);
  };

  // Validasi Password Terminal Trade ("coconut shell charcoal")
  const handleTradeAccessCheck = (e) => {
    e.preventDefault();
    if (passwordInput.trim().toLowerCase() === "coconut shell charcoal") {
      setPasswordError(false);
      setPasswordInput("");
      setShowPasswordModal(false);
      setActiveTab('trade'); // Buka akses Terminal Trade
    } else {
      setPasswordError(true);
    }
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (!resetEmail) {
      alert("Masukkan email akun Anda terlebih dahulu.");
      return;
    }
    alert(`Instruksi reset password telah dikirim ke ${resetEmail}. Silakan periksa kotak masuk Anda.`);
    setShowResetModal(false);
    setResetEmail("");
  };

  const handleMenuClick = (action) => {
    setMenuOpen(false);
    switch (action) {
      case 'beranda':
        const berandaEl = document.getElementById('beranda');
        if (berandaEl) {
          berandaEl.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        break;
      case 'profil':
        alert(user ? `Profil: ${user.name} (${user.email})` : "Silakan login terlebih dahulu.");
        break;
      case 'portofolio':
        alert("Portofolio: 75 Ton Komoditas Arang Tempurung Kelapa.");
        break;
      case 'riwayat':
        alert("Riwayat transaksi kosong.");
        break;
      case 'pengaturan':
        alert("Menu pengaturan akun.");
        break;
      case 'keluar':
        handleLogout();
        break;
      default:
        break;
    }
  };

  return (
    <section className={styles.investSection} style={{ position: 'relative' }}>
      <div className={styles.investCard}>
        
        {/* Tombol Menu Dropdown di Kanan Atas (Hanya Muncul Jika Sudah Login) */}
        {user && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  background: '#ffffff', border: '1px solid #e5e7eb', padding: '8px 14px',
                  borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', color: '#111827',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                Menu ☰
              </button>

              {menuOpen && (
                <div style={{
                  position: 'absolute', top: '42px', right: '0', background: '#ffffff',
                  border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  zIndex: 50, minWidth: '160px', padding: '6px'
                }}>
                  <button onClick={() => handleMenuClick('beranda')} style={menuItemStyle}>Beranda</button>
                  <button onClick={() => handleMenuClick('profil')} style={menuItemStyle}>Profil</button>
                  <button onClick={() => handleMenuClick('portofolio')} style={menuItemStyle}>Portofolio</button>
                  <button onClick={() => handleMenuClick('riwayat')} style={menuItemStyle}>Riwayat</button>
                  <button onClick={() => handleMenuClick('pengaturan')} style={menuItemStyle}>Pengaturan</button>
                  <div style={{ height: '1px', background: '#f3f4f6', margin: '4px 0' }}></div>
                  <button onClick={() => handleMenuClick('keluar')} style={{ ...menuItemStyle, color: '#dc2626' }}>Keluar</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Konten Utama dengan Efek Blur saat Modal Terbuka */}
        <div style={{ filter: (showPasswordModal || showResetModal) ? 'blur(5px)' : 'none', transition: 'filter 0.2s ease' }}>
          <span className={styles.eyebrow}>Investasi</span>

          <div className={styles.actionWrapper}>
            {!user ? (
              /* SEBELUM LOGIN: Teks Investasi & Tombol Login Responsif (Samping / Vertikal) */
              <div style={{ marginTop: '16px' }}>
                <span className={styles.subtitle} style={{ display: 'block', marginBottom: '16px' }}>
                  Amankan alokasi kuota komoditas ekspor Anda sekarang.
                </span>

                <div className={styles.loginButtonsContainer}>
                  <button onClick={() => loginGoogle({ name: "Google User", email: "user@gmail.com" })} className={styles.loginBtnItem}>
                    Google
                  </button>
                  <button onClick={loginMicrosoft} className={styles.loginBtnItem} style={{ background: '#2f2f2f', color: '#fff' }}>
                    Microsoft
                  </button>
                  <button onClick={loginApple} className={styles.loginBtnItem} style={{ background: '#000000', color: '#fff' }}>
                    Apple
                  </button>
                </div>

                {/* Tombol Lupa Akun / Reset Password */}
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button 
                    onClick={() => setShowResetModal(true)}
                    style={{ background: 'transparent', border: 'none', color: '#c45e20', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Lupa Akun / Reset Password?
                  </button>
                </div>
              </div>
            ) : (
              /* SETELAH LOGIN: Profil, Tombol Switch di bawah profil, & Aksi Investasi */
              <div className={styles.userDashboard}>
                <div className={styles.userInfo}>
                  <img src={user.picture || 'https://via.placeholder.com/40'} alt="Profile" className={styles.avatar} />
                  <span>Halo, <strong>{user.name}</strong></span>
                  <button onClick={handleLogout} className={styles.logoutBtn}>KELUAR</button>
                </div>

                {/* TOMBOL SWITCH TRADE / INVEST DI BAWAH PROFIL */}
                <div style={{ display: 'flex', gap: '10px', margin: '20px 0', width: '100%', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => setActiveTab('invest')}
                    style={{
                      flex: 1, padding: '10px', fontWeight: 'bold', borderRadius: '10px', cursor: 'pointer',
                      background: activeTab === 'invest' ? '#c45e20' : '#f3f4f6',
                      color: activeTab === 'invest' ? '#fff' : '#4b5563', border: 'none', transition: '0.2s'
                    }}
                  >
                    Menu Investasi
                  </button>

                  <button 
                    onClick={() => setShowPasswordModal(true)}
                    style={{
                      flex: 1, padding: '10px', fontWeight: 'bold', borderRadius: '10px', cursor: 'pointer',
                      background: activeTab === 'trade' ? '#c45e20' : '#f3f4f6',
                      color: activeTab === 'trade' ? '#fff' : '#4b5563', border: 'none', transition: '0.2s'
                    }}
                  >
                    MT5 Terminal Trade 🔐
                  </button>
                </div>

                <span className={styles.subtitle} style={{ display: 'block', marginBottom: '16px' }}>
                  Amankan alokasi kuota komoditas ekspor Anda sekarang.
                </span>

                <button onClick={handleInvest} className={`${styles.investBtn} ${invested ? styles.successBtn : ''}`}>
                  {invested ? '✓ INVESTASI BERHASIL' : 'INVESTASI 75 TON'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Password Terminal Trade */}
        {showPasswordModal && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 6, display: 'flex', 
            alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.75)',
            borderRadius: '24px'
          }}>
            <form onSubmit={handleTradeAccessCheck} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'center', maxWidth: 360, padding: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', boxShadow: '0 12px 36px rgba(0,0,0,0.1)' }}>
              <div style={{ width: '100%', textAlign: 'center', marginBottom: '4px' }}>
                <h4 style={{ margin: 0, color: '#111827', fontSize: '16px' }}>Sandi Terminal Trade</h4>
                <p style={{ margin: '4px 0 12px 0', color: '#6b7280', fontSize: '12px' }}>Masukkan sandi: coconut shell charcoal</p>
              </div>
              <input
                type="password"
                autoFocus
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                placeholder="Sandi"
                autoComplete="off"
                style={{ flex: '1 1 220px', minWidth: 0, padding: '10px 12px', border: `1px solid ${passwordError ? '#f23645' : '#e0e3eb'}`, borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', color: '#111' }}
              />
              <button type="submit" style={{ padding: '10px 16px', background: '#c45e20', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>BUKA</button>
              <button type="button" onClick={() => setShowPasswordModal(false)} style={{ padding: '10px 16px', background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>BATAL</button>
              {passwordError && <span style={{ width: '100%', textAlign: 'center', color: '#f23645', fontSize: 12 }}>Password salah.</span>}
            </form>
          </div>
        )}

        {/* Modal Lupa Akun / Reset Password */}
        {showResetModal && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 6, display: 'flex', 
            alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.75)',
            borderRadius: '24px'
          }}>
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'center', maxWidth: 360, padding: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', boxShadow: '0 12px 36px rgba(0,0,0,0.1)' }}>
              <div style={{ width: '100%', textAlign: 'center', marginBottom: '4px' }}>
                <h4 style={{ margin: 0, color: '#111827', fontSize: '16px' }}>Reset Password</h4>
                <p style={{ margin: '4px 0 12px 0', color: '#6b7280', fontSize: '12px' }}>Masukkan email akun Anda</p>
              </div>
              <input
                type="email"
                autoFocus
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="email@domain.com"
                required
                style={{ flex: '1 1 220px', minWidth: 0, padding: '10px 12px', border: '1px solid #e0e3eb', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', color: '#111' }}
              />
              <button type="submit" style={{ padding: '10px 16px', background: '#c45e20', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>KIRIM</button>
              <button type="button" onClick={() => setShowResetModal(false)} style={{ padding: '10px 16px', background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>BATAL</button>
            </form>
          </div>
        )}

      </div>
    </section>
  );
};

const menuItemStyle = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '8px 12px',
  border: 'none',
  borderRadius: '8px',
  background: 'transparent',
  fontSize: '13px',
  fontWeight: '600',
  color: '#4b5563',
  cursor: 'pointer',
  textAlign: 'left'
};

export default Invest;
