"use client";

import React, { useEffect, useState } from 'react';
import styles from './Login.module.css';
import auth from './AuthShared.module.css';
import reg from './Register.module.css';
import {
  AuthModal,
  ProviderIcon,
  useAuthForm,
  useProviderAuth,
  loadUsers,
  saveUsers
} from './AuthShared';

const PROVIDERS = ['Google', 'Microsoft', 'Apple'];

const Register = ({ open, onClose, onRegistered }) => {
  const { runProvider, busyProvider, setBusyProvider } = useProviderAuth();
  const { values, bind, reset } = useAuthForm();

  const [step, setStep] = useState('provider');
  const [data, setData] = useState({}); 
  const [otpInput, setOtpInput] = useState('');
  
  const [countryCode, setCountryCode] = useState('+62');
  const [isLoading, setIsLoading] = useState(false);

  const [isAgreed, setIsAgreed] = useState(false);
  const [shakeError, setShakeError] = useState(false);

  useEffect(() => {
    if (open) { 
      reset(); 
      setData({}); 
      setStep('provider'); 
      setOtpInput(''); 
      setCountryCode('+62');
      setIsLoading(false);
      setIsAgreed(false);
      setShakeError(false);
    }
  }, [open]); 

  // --- 0. VALIDASI S&K: wajib dicentang sebelum memilih platform ---
  const requireTerms = () => {
    if (isAgreed) return true;
    setShakeError(true);
    setTimeout(() => setShakeError(false), 600);
    return false;
  };

  // --- 1. PILIH PLATFORM & TANGKAP FOTO PROFIL ASLI ---
  const handleSelectProvider = async (providerName) => {
    if (!requireTerms()) return;
    setBusyProvider(providerName);
    try {
      const account = await runProvider(providerName);
      const userEmail = account?.email || '';
      
      if (!userEmail) throw new Error('Email akun tidak ditemukan.');

      // Cek apakah email sudah terdaftar
      const existingUsers = loadUsers() || [];
      const isEmailTaken = existingUsers.some(
        (u) => u.email?.toLowerCase() === userEmail.toLowerCase()
      );

      if (isEmailTaken) {
        alert(`Akun dengan email ${userEmail} sudah terdaftar! Silakan langsung Masuk.`);
        // Jika sudah terdaftar, langsung kirim data lengkap ke fungsi auto-login
        onRegistered({ 
          email: userEmail, 
          username: account.name || userEmail.split('@')[0],
          picture: account.picture || ''
        });
        return;
      }

      // SIMPAN FOTO DAN NAMA ASLI KE STATE
      setData({ 
        provider: providerName, 
        email: userEmail,
        googleName: account.name || '',
        googlePicture: account.picture || ''
      });
      
      setIsLoading(true);
      const res = await fetch('/api/send-otp-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal mengirim email OTP');

      if (result.test_otp) {
        setData((prev) => ({ ...prev, serverEmailOtp: result.test_otp }));
      }

      setOtpInput('');
      setStep('otp_email'); 
    } catch (err) {
      console.error(`[REG-PROVIDER] ${providerName}:`, err);
      alert(`Gagal: ${err?.message || err}`);
    } finally {
      setBusyProvider(null);
      setIsLoading(false);
    }
  };

  const handleOtpEmailSubmit = (e) => {
    e.preventDefault();
    if (!data.serverEmailOtp || otpInput.trim() !== data.serverEmailOtp.toString().trim()) { 
      alert('Kode OTP Email salah!'); 
      return; 
    }
    setOtpInput('');
    setStep('username'); 
  };

  // --- 2. CEK KETAT USERNAME ---
  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    const inputUser = values.username?.trim();
    if (!inputUser) return;

    const existingUsers = loadUsers() || [];
    const isUsernameTaken = existingUsers.some(
      (u) => u.username?.toLowerCase() === inputUser.toLowerCase()
    );

    if (isUsernameTaken) {
      alert('Username ini sudah dipakai oleh orang lain. Silakan pilih username yang berbeda!');
      return; 
    }

    setData((prev) => ({ ...prev, username: inputUser }));
    setStep('password'); 
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setData((prev) => ({ ...prev, password: values.password }));
    setStep('wa'); 
  };

  // --- 3. CEK KETAT NOMOR WHATSAPP ---
  const handleWaSubmit = async (e) => {
    e.preventDefault();
    const cleanNumber = values.whatsapp?.replace(/^0+/, '');
    if (!cleanNumber || cleanNumber.length < 8) { 
      alert('Nomor WhatsApp tidak valid.'); 
      return; 
    }
    
    const fullWaNumber = `${countryCode}${cleanNumber}`;

    const existingUsers = loadUsers() || [];
    const isWaTaken = existingUsers.some((u) => u.whatsapp === fullWaNumber);

    if (isWaTaken) {
      alert('Nomor WhatsApp ini sudah terdaftar pada akun lain. Gunakan nomor yang berbeda!');
      return; 
    }

    setData((prev) => ({ ...prev, whatsapp: fullWaNumber }));
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/send-otp-wa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullWaNumber }),
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal mengirim WA OTP');

      if (result.test_otp_wa) {
        setData((prev) => ({ ...prev, serverWaOtp: result.test_otp_wa }));
      }

      setOtpInput('');
      setStep('otp_wa');
    } catch (err) {
      console.error(err);
      alert(`Gagal mengirim OTP WhatsApp: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpWaSubmit = (e) => {
    e.preventDefault();
    if (!data.serverWaOtp || otpInput.trim() !== data.serverWaOtp.toString().trim()) { 
      alert('Kode OTP WhatsApp salah!'); 
      return; 
    }
    
    const newUser = {
      provider: data.provider,
      email: data.email,
      username: data.username,
      password: data.password, 
      whatsapp: data.whatsapp,
      picture: data.googlePicture // Simpan fotonya ke database lokal jika diperlukan
    };

    const users = loadUsers() || [];
    users.push(newUser);
    saveUsers(users);
    
    // Meneruskan data, termasuk foto asli, untuk Auto-Login
    onRegistered({
      email: data.email,
      username: data.username, // Username yang diketik user
      name: data.googleName,   // Nama asli dari akun Google
      picture: data.googlePicture // Foto asli dari akun Google
    }); 
  };

  if (!open) return null;

  const otpStyle = { textAlign: 'center', letterSpacing: '8px', fontSize: '20px', fontWeight: 700 };

  let content = null;

  if (step === 'provider') {
    content = (
      <div className={auth.modalOverlay}>
        <div className={auth.modalForm}>
          <h4 className={auth.modalTitle}>Daftar Akun</h4>
          <p className={auth.modalDesc}>Pilih platform untuk memulai verifikasi email</p>

          <div className={`${reg.termsBlock} ${shakeError ? styles.shakeRed : ''}`}>
            <div className={reg.termsTitle}>Syarat &amp; Ketentuan</div>
            <div className={reg.termsScroll} tabIndex={0}>
              <ol className={reg.termsList}>
                <li>Pendaftaran memerlukan email aktif yang terhubung dengan akun Google, Microsoft, atau Apple, serta nomor WhatsApp yang dapat dihubungi.</li>
                <li>Anda bertanggung jawab atas kerahasiaan username, password, dan seluruh aktivitas yang terjadi pada akun Anda.</li>
                <li>Data yang Anda berikan harus benar dan milik Anda sendiri. Satu email dan satu nomor WhatsApp hanya dapat dipakai untuk satu akun.</li>
                <li>Harga yang ditampilkan adalah harga acuan dan dapat berubah sewaktu-waktu mengikuti pasar. Harga final disepakati saat penawaran atau pesanan dikonfirmasi.</li>
                <li>Data pribadi Anda digunakan untuk verifikasi akun dan komunikasi layanan CSCID, dan tidak dibagikan kepada pihak lain tanpa persetujuan Anda, kecuali diwajibkan hukum.</li>
                <li>CSCID berhak menangguhkan atau menutup akun yang melanggar ketentuan atau terindikasi penyalahgunaan.</li>
              </ol>
            </div>
            <label className={reg.termsCheck}>
              <input
                type="checkbox"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
              />
              <span>Saya menyetujui Syarat &amp; Ketentuan</span>
            </label>
          </div>

          <div className={`${reg.providerList} ${isAgreed ? '' : reg.providerDim}`}>
            {PROVIDERS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleSelectProvider(p)}
                disabled={busyProvider !== null || isLoading}
                className={reg.providerBtn}
                aria-disabled={!isAgreed}
              >
                <ProviderIcon name={p} size={22} />
                <span>{busyProvider === p || isLoading ? 'Memeriksa...' : `Daftar dengan ${p}`}</span>
              </button>
            ))}
          </div>

          <div className={auth.modalActionsRow}>
            <button type="button" onClick={onClose} className={auth.btnCancel}>BATAL</button>
          </div>
        </div>
      </div>
    );
  } else if (step === 'otp_email') {
    content = (
      <AuthModal
        title="Verifikasi OTP Email"
        desc={<>Kode dikirim ke <b>{data.email}</b>.</>}
        onSubmit={handleOtpEmailSubmit}
        submitLabel="VERIFIKASI EMAIL"
        onBack={onClose}
      >
        <input
          type="text" inputMode="numeric" maxLength={6} placeholder="••••••"
          value={otpInput} onChange={(e) => setOtpInput(e.target.value)} required
          className={auth.inputField} style={otpStyle}
        />
      </AuthModal>
    );
  } else if (step === 'username') {
    content = (
      <AuthModal
        title="Buat Username"
        desc={<>Email: <b>{data.email}</b></>}
        onSubmit={handleUsernameSubmit}
        submitLabel="LANJUT"
        onBack={onClose}
      >
        <input type="text" placeholder="Masukkan Username" {...bind('username')} />
      </AuthModal>
    );
  } else if (step === 'password') {
    content = (
      <AuthModal
        title="Buat Password"
        desc="Buat password untuk akun (min. 6 karakter)."
        onSubmit={handlePasswordSubmit}
        submitLabel="LANJUT"
        onBack={onClose}
      >
        <input type="password" placeholder="Masukkan Password" {...bind('password', { minLength: 6 })} />
      </AuthModal>
    );
  } else if (step === 'wa') {
    content = (
      <AuthModal
        title="Nomor WhatsApp"
        desc="Pilih negara dan masukkan nomor WhatsApp."
        onSubmit={handleWaSubmit}
        submitLabel={isLoading ? 'MENGIRIM OTP...' : 'KIRIM OTP'}
        onBack={onClose}
      >
        <div className={reg.waRow}>
          <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className={reg.waSelect}>
            <option value="+62">ID +62</option>
            <option value="+65">SG +65</option>
            <option value="+60">MY +60</option>
            <option value="+86">CN +86</option>
            <option value="+1">US +1</option>
          </select>
          <input type="tel" placeholder="8123456789" {...bind('whatsapp')} />
        </div>
      </AuthModal>
    );
  } else if (step === 'otp_wa') {
    content = (
      <AuthModal
        title="Verifikasi WhatsApp"
        desc={<>Kode dikirim ke WA <b>{data.whatsapp}</b></>}
        onSubmit={handleOtpWaSubmit}
        submitLabel="SELESAI DAFTAR"
        onBack={onClose}
      >
        <input
          type="text" inputMode="numeric" maxLength={6} placeholder="••••••"
          value={otpInput} onChange={(e) => setOtpInput(e.target.value)} required
          className={auth.inputField} style={otpStyle}
        />
      </AuthModal>
    );
  }

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px' }}>
        {content}
      </div>
    </div>
  );
};

export default Register;
