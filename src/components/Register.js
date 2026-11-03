"use client";

import React, { useEffect, useState } from 'react';
import styles from './Register.module.css';
import {
  AuthModal,
  ProviderIcon,
  useAuthForm,
  useProviderAuth,
  loadUsers,
  saveUsers,
  sameText
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

  // State Syarat & Ketentuan + Animasi Getar Merah
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

  const handleSelectProvider = async (providerName) => {
    setBusyProvider(providerName);
    try {
      const account = await runProvider(providerName);
      const userEmail = account?.email || '';
      if (!userEmail) throw new Error('Email akun tidak ditemukan.');

      setData({ provider: providerName, email: userEmail });
      
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

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (loadUsers().some((u) => sameText(u.username, values.username))) {
      alert('Username sudah dipakai, pilih username lain.');
      return;
    }
    setData((prev) => ({ ...prev, username: values.username.trim() }));
    setStep('password'); 
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setData((prev) => ({ ...prev, password: values.password }));
    setStep('wa'); 
  };

  const handleWaSubmit = async (e) => {
    e.preventDefault();
    const cleanNumber = values.whatsapp.replace(/^0+/, '');
    if (cleanNumber.length < 8) { alert('Nomor WhatsApp tidak valid.'); return; }
    
    // Validasi S&K sebelum kirim OTP WhatsApp terakhir
    if (!isAgreed) {
      setShakeError(true);
      setTimeout(() => setShakeError(false), 600); // Bergetar selama 600ms
      return;
    }

    const fullWaNumber = `${countryCode}${cleanNumber}`;
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
    
    const users = loadUsers();
    users.push({
      provider: data.provider,
      email: data.email,
      username: data.username,
      password: data.password, 
      whatsapp: data.whatsapp,
    });
    saveUsers(users);
    
    alert('Pendaftaran berhasil! Akun Anda telah aktif.');
    onRegistered(); 
  };

  if (!open) return null;

  return (
    /* Klik di luar area modal untuk menutup */
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px' }}>
        
        {step === 'provider' && (
          <div className={styles.card}>
            <h4 className={styles.title}>Daftar Akun</h4>
            <p className={styles.desc}>Pilih platform untuk memulai verifikasi email</p>

            <div className={styles.providerStack}>
              {PROVIDERS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSelectProvider(p)}
                  disabled={busyProvider !== null || isLoading}
                  className={styles.providerBtn}
                >
                  <ProviderIcon name={p} size={22} />
                  <span>{busyProvider === p || isLoading ? 'Memproses...' : `Daftar dengan ${p}`}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'otp_email' && (
          <AuthModal
            title="Verifikasi OTP Email"
            desc={<>Kode telah dikirim ke <b>{data.email}</b> via Resend.</>}
            onSubmit={handleOtpEmailSubmit}
            submitLabel="VERIFIKASI EMAIL"
            hideBackBtn={true}
          >
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              required
              className={styles.inputField}
              style={{ textAlign: 'center', letterSpacing: '6px', fontSize: '18px', fontWeight: 'bold' }}
            />
          </AuthModal>
        )}

        {step === 'username' && (
          <AuthModal
            title="Buat Username"
            desc={<>Email terverifikasi: <b>{data.email}</b></>}
            onSubmit={handleUsernameSubmit}
            submitLabel="LANJUT"
            hideBackBtn={true}
          >
            <input type="text" placeholder="Masukkan Username" {...bind('username')} />
          </AuthModal>
        )}

        {step === 'password' && (
          <AuthModal
            title="Buat Password"
            desc="Buat password untuk akun Anda (min. 6 karakter)"
            onSubmit={handlePasswordSubmit}
            submitLabel="LANJUT"
            hideBackBtn={true}
          >
            <input type="password" placeholder="Masukkan Password" {...bind('password', { minLength: 6 })} />
          </AuthModal>
        )}

        {step === 'wa' && (
          <AuthModal
            title="Nomor WhatsApp"
            desc="Pilih negara dan masukkan nomor WhatsApp"
            onSubmit={handleWaSubmit}
            submitLabel={isLoading ? "MENGIRIM WA OTP..." : "KIRIM OTP WHATSAPP"}
            hideBackBtn={true}
          >
            <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '12px' }}>
              <select 
                value={countryCode} 
                onChange={(e) => setCountryCode(e.target.value)}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff' }}
              >
                <option value="+62">🇮🇩 +62</option>
                <option value="+65">🇸🇬 +65</option>
                <option value="+60">🇲🇾 +60</option>
                <option value="+86">🇨🇳 +86</option>
                <option value="+1">🇺🇸 +1</option>
              </select>
              <input 
                type="tel" 
                placeholder="8123456789" 
                {...bind('whatsapp')} 
                style={{ flex: 1, padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
            </div>

            {/* Tombol Persetujuan S&K dengan efek getar merah jika belum dicentang */}
            <div className={`${styles.termsWrapper} ${shakeError ? styles.shakeRed : ''}`}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: shakeError ? '#dc2626' : '#374151', fontWeight: shakeError ? 'bold' : 'normal' }}>
                <input 
                  type="checkbox" 
                  checked={isAgreed} 
                  onChange={(e) => setIsAgreed(e.target.checked)} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                Saya Menyetujui Syarat dan Ketentuan
              </label>
            </div>
          </AuthModal>
        )}

        {step === 'otp_wa' && (
          <AuthModal
            title="Verifikasi OTP WhatsApp"
            desc={<>Kode telah dikirim ke WA <b>{data.whatsapp}</b></>}
            onSubmit={handleOtpWaSubmit}
            submitLabel="SELESAI DAFTAR"
            hideBackBtn={true}
          >
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              required
              className={styles.inputField}
              style={{ textAlign: 'center', letterSpacing: '6px', fontSize: '18px', fontWeight: 'bold' }}
            />
          </AuthModal>
        )}

      </div>
    </div>
  );
};

export default Register;
