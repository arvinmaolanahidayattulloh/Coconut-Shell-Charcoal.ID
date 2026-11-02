"use client";

import React, { useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from '../firebase'; // Pastikan path ini benar mengarah ke file firebase.js Anda
import styles from './Invest.module.css';

const Invest = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [invested, setInvested] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Gagal login dengan Google:", error);
      alert("Terjadi kesalahan saat login. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setInvested(false);
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  const handleInvest = () => {
    setInvested(true);
    alert(`Terima kasih ${user.displayName || 'Investor'}, investasi sebesar 75 Ton berhasil diproses!`);
  };

  return (
    <section className={styles.investSection}>
      <div className={styles.investContainer}>
        <h2 className={styles.title}>Peluang Investasi Arang Tempurung Kelapa</h2>
        <p className={styles.subtitle}>
          Amankan alokasi kuota komoditas ekspor Anda sekarang.
        </p>

        <div className={styles.actionWrapper}>
          {!user ? (
            <button 
              onClick={handleGoogleLogin} 
              className={styles.googleLoginBtn}
              disabled={loading}
            >
              <svg className={styles.googleIcon} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.14C3.15 21.32 7.22 24 12 24z"/>
                <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.62H1.18C.43 8.12 0 9.81 0 12s.43 3.88 1.18 5.38l4.09-3.14z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.15 2.68 1.18 6.62l4.09 3.14c.95-2.85 3.6-4.96 6.73-4.96z"/>
              </svg>
              {loading ? 'Memproses...' : 'Login dengan Google'}
            </button>
          ) : (
            <div className={styles.userDashboard}>
              <div className={styles.userInfo}>
                <img 
                  src={user.photoURL || 'https://via.placeholder.com/40'} 
                  alt="Profile" 
                  className={styles.avatar} 
                />
                <span>Halo, <strong>{user.displayName}</strong></span>
                <button onClick={handleLogout} className={styles.logoutBtn}>Keluar</button>
              </div>

              <button 
                onClick={handleInvest} 
                className={`${styles.investBtn} ${invested ? styles.successBtn : ''}`}
              >
                {invested ? '✓ Berhasil Investasi 75 Ton' : '🚀 Invest 75 Ton'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Invest;
