"use client";

import React, { useState, useEffect } from 'react';
import styles from './Login.module.css';
import Register from './Register';
import Recovery from './Recovery';
import AksiBtn from './AksiBtn';
import {
  AuthModal,
  ProviderIcon,
  useAuthForm,
  useProviderAuth,
  loadUsers,
  sameText,
} from './AuthShared';

const Login = ({ children } = {}) => {
  const { loginGoogle, runProvider, busyProvider, setBusyProvider } = useProviderAuth();
  const { values, bind, reset } = useAuthForm();
  const [authMode, setAuthMode] = useState(null);

  const openMode = (mode) => { reset(); setAuthMode(mode); };
  const closeAll = () => openMode(null);
  const goLogin = () => openMode('login_username');

  // Tombol lain (mis. "Buy" di Produk) membuka Register lewat event ini.
  // Hanya instance mode panel (children = fungsi) yang mendengarkan.
  const isPanel = typeof children === 'function';
  useEffect(() => {
    if (!isPanel) return;
    const onOpen = () => { reset(); setAuthMode('register'); };
    window.addEventListener('open-register', onOpen);
    return () => window.removeEventListener('open-register', onOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPanel]);

  // Auto-login setelah registrasi selesai (MENERIMA FOTO PROFIL)
  const handleAutoLoginAfterRegister = (registeredData) => {
    closeAll();
    loginGoogle({
      // Anda bisa mengganti registeredData.username dengan registeredData.name jika ingin menggunakan nama asli dari Google.
      name: registeredData.name || registeredData.username, 
      email: registeredData.email,
      picture: registeredData.picture || '' // Menarik foto asli dari register
    });
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const found = loadUsers().find(
      (u) => sameText(u.username, values.username) && u.password === values.password
    );
    if (found || (values.username === 'admin' && values.password === 'admin')) {
      // Saat manual login via username, foto profil akan menggunakan bawaan default jika tidak disetel
      loginGoogle({ 
        name: found?.username || values.username, 
        email: found?.email || `${values.username}@coconutshellcharcoal.id`,
        picture: found?.picture || '' // Mengambil foto dari DB jika tersimpan
      });
      closeAll();
    } else {
      alert('Username atau Password salah!');
    }
  };

  const handleLoginProvider = async (providerName) => {
    setBusyProvider(providerName);
    try {
      const account = await runProvider(providerName);
      loginGoogle({ 
        name: account?.name || `User ${providerName}`, 
        email: account?.email || '',
        picture: account?.picture || '' // Mengambil foto asli langsung
      });
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

  const modals = (
    <>
      {authMode === 'login_username' && (
        <div className={styles.modalBackdrop} onClick={closeAll}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px' }}>
            <AuthModal
              title="Masuk Akun"
              desc="Masukkan username dan password Anda"
              onSubmit={handleLoginSubmit}
              submitLabel="Masuk"
              onClose={closeAll}
              footer={
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
              }
            >
              <input type="text" placeholder="Username" {...bind('username')} />
              <input type="password" placeholder="Password" {...bind('password')} />
            </AuthModal>
          </div>
        </div>
      )}

      {/* Komponen Register */}
      <Register open={authMode === 'register'} onClose={closeAll} onRegistered={handleAutoLoginAfterRegister} />

      {/* Komponen Recovery */}
      <Recovery
        mode={authMode === 'forgot' ? 'forgot' : authMode === 'reset' ? 'reset' : null}
        onClose={closeAll}
        onDone={goLogin}
      />
    </>
  );

  // Mode panel: <Login>{({ openRegister, openLogin }) => ...}</Login>
  // memakai logika & modal yang sama, tampilan tombolnya diatur pemanggil.
  if (typeof children === 'function') {
    return (
      <>
        {children({
          openRegister: () => openMode('register'),
          openLogin: goLogin,
          openForgot: () => openMode('forgot'),
        })}
        {modals}
      </>
    );
  }

  // Form langsung di panel Invest: gambar, username, password, lalu login alternatif.
  // (Judul panel ada di Invest.js, jadi tidak diulang di sini.)
  return (
    <>
      <form className={`${styles.loginContainer} ${styles.inlineForm}`} onSubmit={handleLoginSubmit} aria-label="Masuk akun">
        <div className={styles.imageWrapper}>
          <img src="/NephiPhelia.png" alt="Ilustrasi Invest CSCID" className={styles.centerImage} />
        </div>

        <input type="text" placeholder="Username" autoComplete="username" {...bind('username')} />
        <input type="password" placeholder="Password" autoComplete="current-password" {...bind('password')} />
        <div className={styles.submitRow}>
          <AksiBtn label="Masuk" />
        </div>

        <div className={styles.dividerWrapper}>Atau Login with</div>

        <button type="button" onClick={handleLoginPasskey} disabled={busyProvider !== null} className={styles.passkeyBtn}>
          <ProviderIcon name="Passkey" />
          {busyProvider === 'Passkey' ? 'Memverifikasi...' : 'Passkey'}
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

        <p className={styles.registerRow}>
          Belum punya akun?{' '}
          <button type="button" onClick={() => openMode('register')} className={styles.registerBtn}>Daftar</button>
        </p>
        <div className={styles.linksRow}>
          <button type="button" onClick={() => openMode('forgot')} className={styles.linkBtn}>Lupa Akun?</button>
          <button type="button" onClick={() => openMode('reset')} className={styles.linkBtn}>Reset Password</button>
        </div>
      </form>

      {modals}
    </>
  );
};

export default Login;

