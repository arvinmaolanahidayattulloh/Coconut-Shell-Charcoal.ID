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
        
        {/* Tombol Menu Dropdown di Kanan Atas */}
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

        {/* Konten Utama dengan Efek Blur saat Modal Password Terbuka */}
        <div style={{ filter: showPasswordModal ? 'blur(5px)' : 'none', transition: 'filter 0.2s ease' }}>
          <span className={styles.eyebrow}>Investasi</span>

          <div className={styles.actionWrapper}>
            {!user ? (
              /* SEBELUM LOGIN: Hanya teks Investasi dan tombol Login (Google, Microsoft, Apple) */
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span className={styles.subtitle} style={{ display: 'block', marginBottom: '12px' }}>
                  Amankan alokasi kuota komoditas ekspor Anda sekarang.
                </span>

                {/* Tombol Google */}
                <button onClick={() => loginGoogle({ name: "Google User", email: "user@gmail.com" })} className={styles.googleLoginBtn}>
                  <svg className={styles.googleIcon} viewBox="0 0 24 24" style={{ width: 18, height: 18, marginRight: 8 }}>
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.14C3.15 21.32 7.22 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.62H1.18C.43 8.12 0 9.81 0 12s.43 3.88 1.18 5.38l4.09-3.14z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.15 2.68 1.18 6.62l4.09 3.14c.95-2.85 3.6-4.96 6.73-4.96z"/>
                  </svg>
                  MASUK DENGAN GOOGLE
                </button>

                {/* Tombol Microsoft */}
                <button onClick={loginMicrosoft} className={styles.googleLoginBtn} style={{ background: '#2f2f2f', color: '#fff' }}>
                  <svg style={{ width: 18, height: 18, marginRight: 8 }} viewBox="0 0 23 23">
                    <path fill="#f3f3f3" d="M0 0h11v11H0z"/>
                    <path fill="#f3f3f3" d="M12 0h11v11H12z"/>
                    <path fill="#f3f3f3" d="M0 12h11v11H0z"/>
                    <path fill="#f3f3f3" d="M12 12h11v11H12z"/>
                  </svg>
                  MASUK DENGAN MICROSOFT
                </button>

                {/* Tombol Apple */}
                <button onClick={loginApple} className={styles.googleLoginBtn} style={{ background: '#000000', color: '#fff' }}>
                  <svg style={{ width: 18, height: 18, marginRight: 8, fill: '#fff' }} viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.31c.67-.82 1.12-1.96.99-3.1-.97.04-2.16.65-2.85 1.47-.62.72-1.16 1.88-1 2.99 1.09.08 2.19-.53 2.86-1.36z"/>
                  </svg>
                  MASUK DENGAN APPLE
                </button>
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
                <div style={{ display: 'flex', gap: '10px', margin: '20px 0', width: '100%' }}>
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

        {/* Modal Password Pop-up dengan Latar Belakang Blur */}
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
