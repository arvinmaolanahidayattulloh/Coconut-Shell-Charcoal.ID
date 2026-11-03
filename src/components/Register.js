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

  // State alur pendaftaran multistep
  const [step, setStep] = useState('provider');
  const [data, setData] = useState({}); 
  const [otpInput, setOtpInput] = useState('');
  
  // State pendukung
  const [countryCode, setCountryCode] = useState('+62');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) { 
      reset(); 
      setData({}); 
      setStep('provider'); 
      setOtpInput(''); 
      setCountryCode('+62');
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]); 

  // --- 1. PILIH PROVIDER & LANGSUNG KIRIM OTP EMAIL NYATA VIA RESEND ---
  const handleSelectProvider = async (providerName) => {
    setBusyProvider(providerName);
    try {
      const account = await runProvider(providerName);
      const userEmail = account?.email || '';
      if (!userEmail) {
        throw new Error('Email akun tidak ditemukan.');
      }

      setData({ provider: providerName, email: userEmail });
      
      setIsLoading(true);
      // Kirim OTP Email otomatis setelah memilih akun
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

      alert(`Email verifikasi telah dikirim ke ${userEmail}`);
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

  // --- 2. SUBMIT OTP EMAIL & LANJUT BUAT USERNAME ---
  const handleOtpEmailSubmit = (e) => {
    e.preventDefault();
    
    if (!data.serverEmailOtp || otpInput.trim() !== data.serverEmailOtp.toString().trim()) { 
      alert('Kode OTP Email salah! Periksa kembali email Anda.'); 
      return; 
    }
    
    setOtpInput('');
    setStep('username'); 
  };

  // --- 3. SUBMIT USERNAME ---
  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (loadUsers().some((u) => sameText(u.username, values.username))) {
      alert('Username sudah dipakai, pilih username lain.');
      return;
    }
    setData((prev) => ({ ...prev, username: values.username.trim() }));
    setStep('password'); 
  };

  // --- 4. SUBMIT PASSWORD ---
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setData((prev) => ({ ...prev, password: values.password }));
    setStep('wa'); 
  };

  // --- 5. SUBMIT WHATSAPP & KIRIM OTP WA VIA FONNTE ---
  const handleWaSubmit = async (e) => {
    e.preventDefault();
    const cleanNumber = values.whatsapp.replace(/^0+/, '');
    if (cleanNumber.length < 8) { alert('Nomor WhatsApp tidak valid.'); return; }
    
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

      alert(`Kode OTP WhatsApp telah dikirim ke nomor ${fullWaNumber}`);
      setOtpInput('');
      setStep('otp_wa');
    } catch (err) {
      console.error(err);
      alert(`Gagal mengirim OTP WhatsApp: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 6. SUBMIT OTP WHATSAPP & SELESAI DAFTAR ---
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
    
    alert('Pendaftaran berhasil! Akun PT Tunas Kembar Abadi Anda telah aktif.');
    onRegistered(); 
  };

  if (!open) return null;

  // ================= RENDER TAMPILAN (UI) =================

  if (step === 'provider') {
    return (
      <div className={styles.overlay}>
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

          <button type="button" onClick={onClose} className={styles.backBtn}>KEMBALI</button>
        </div>
      </div>
    );
  }

  if (step === 'otp_email') {
    return (
      <AuthModal
        title="Verifikasi OTP Email"
        desc={
          <>
            Kode telah dikirim ke <b>{data.email}</b> via Resend.<br />
            <span style={{ fontSize: '12px', color: '#c45e20', fontWeight: 'bold' }}>
              Cek Kotak Masuk (Inbox) atau folder Spam Anda.
            </span>
          </>
        }
        onSubmit={handleOtpEmailSubmit}
        submitLabel="VERIFIKASI EMAIL"
        onBack={() => { setStep('provider'); setOtpInput(''); }}
        backLabel="KEMBALI"
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
    );
  }

  if (step === 'username') {
    return (
      <AuthModal
        title="Buat Username"
        desc={<>Email terverifikasi: <b>{data.email}</b></>}
        onSubmit={handleUsernameSubmit}
        submitLabel="LANJUT"
        onBack={() => setStep('otp_email')}
        backLabel="KEMBALI"
      >
        <input type="text" placeholder="Masukkan Username" {...bind('username')} />
      </AuthModal>
    );
  }

  if (step === 'password') {
    return (
      <AuthModal
        title="Buat Password"
        desc="Buat password untuk akun Anda (min. 6 karakter)"
        onSubmit={handlePasswordSubmit}
        submitLabel="LANJUT"
        onBack={() => setStep('username')}
        backLabel="KEMBALI"
      >
        <input type="password" placeholder="Masukkan Password" {...bind('password', { minLength: 6 })} />
      </AuthModal>
    );
  }

  if (step === 'wa') {
    return (
      <AuthModal
        title="Nomor WhatsApp"
        desc="Pilih negara dan masukkan nomor WhatsApp untuk verifikasi akhir"
        onSubmit={handleWaSubmit}
        submitLabel={isLoading ? "MENGIRIM WA OTP..." : "KIRIM OTP WHATSAPP"}
        onBack={() => setStep('password')}
        backLabel="KEMBALI"
      >
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <select 
            value={countryCode} 
            onChange={(e) => setCountryCode(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', outline: 'none' }}
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
            style={{ flex: 1, padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none' }}
          />
        </div>
      </AuthModal>
    );
  }

  if (step === 'otp_wa') {
    return (
      <AuthModal
        title="Verifikasi OTP WhatsApp"
        desc={<>Kode verifikasi telah dikirim ke WA <b>{data.whatsapp}</b> via Fonnte.</>}
        onSubmit={handleOtpWaSubmit}
        submitLabel="SELESAI DAFTAR"
        onBack={() => { setStep('wa'); setOtpInput(''); }}
        backLabel="KEMBALI"
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
    );
  }

  return null;
};

export default Register;
