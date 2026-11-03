"use client";

import React from 'react';
import { useAccount } from './Account'; 
import styles from './Invest.module.css';

const Invest = ({ invested, setInvested, activeTab, setActiveTab }) => {
  const { user, login, logout } = useAccount();

  const handleLogout = () => {
    logout();
    setInvested(false); 
    setActiveTab('invest'); // Kembali ke tab invest jika logout
  };

  const handleInvest = () => {
    setInvested(true);
    alert(`Terima kasih ${user.name || 'Investor'}, investasi sebesar 75 Ton berhasil diproses! Sekarang Anda dapat mengakses Terminal Trade.`);
  };

  return (
    <section className={styles.investSection}>
      <div className={styles.investCard}>
        
        {/* Tombol Switch Tab di Bagian Atas */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
          <button 
            onClick={() => setActiveTab('invest')}
            style={{
              padding: '8px 16px', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer',
              background: activeTab === 'invest' ? '#c45e20' : '#f3f4f6',
              color: activeTab === 'invest' ? '#fff' : '#4b5563', border: 'none'
            }}
          >
            Peluang Investasi
          </button>

          <button 
            onClick={() => {
              if (!invested) {
                alert("Anda harus melakukan investasi / konfirmasi terlebih dahulu di tab Investasi untuk membuka Terminal Trade!");
                return;
              }
              setActiveTab('trade');
            }}
            style={{
              padding: '8px 16px', fontWeight: 'bold', borderRadius: '8px', cursor: invested ? 'pointer' : 'not-allowed',
              background: activeTab === 'trade' ? '#c45e20' : '#f3f4f6',
              color: activeTab === 'trade' ? '#fff' : '#9ca3af', border: 'none',
              opacity: invested ? 1 : 0.6
            }}
          >
            MT5 Terminal Trade {!invested ? '🔒' : ''}
          </button>
        </div>

        {/* Konten Investasi */}
        <span className={styles.eyebrow}>Peluang Investasi</span>
        <span className={styles.subtitle}>
          Amankan alokasi kuota komoditas ekspor Anda sekarang untuk membuka akses Terminal Trading.
        </span>

        <div className={styles.actionWrapper}>
          {!user ? (
            <button 
              onClick={login} 
              className={styles.googleLoginBtn}
            >
              <svg className={styles.googleIcon} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.14C3.15 21.32 7.22 24 12 24z"/>
                <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.62H1.18C.43 8.12 0 9.81 0 12s.43 3.88 1.18 5.38l4.09-3.14z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.15 2.68 1.18 6.62l4.09 3.14c.95-2.85 3.6-4.96 6.73-4.96z"/>
              </svg>
              LOGIN DENGAN GOOGLE
            </button>
          ) : (
            <div className={styles.userDashboard}>
              <div className={styles.userInfo}>
                <img 
                  src={user.picture || 'https://via.placeholder.com/40'} 
                  alt="Profile" 
                  className={styles.avatar} 
                />
                <span>Halo, <strong>{user.name}</strong></span>
                <button onClick={handleLogout} className={styles.logoutBtn}>KELUAR</button>
              </div>

              <button 
                onClick={handleInvest} 
                className={`${styles.investBtn} ${invested ? styles.successBtn : ''}`}
              >
                {invested ? '✓ INVESTASI BERHASIL (AKSES TRADE DIBUKA)' : 'INVESTASI 75 TON'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Invest;
