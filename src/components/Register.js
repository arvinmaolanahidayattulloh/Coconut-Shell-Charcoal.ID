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
  sameText,
  isValidWa,
  OTP_WA_SIM // WhatsApp masih menggunakan simulasi sesuai kebutuhan tahap ini
} from './AuthShared';

const PROVIDERS = ['Google', 'Microsoft', 'Apple'];

const Register = ({ open, onClose, onRegistered }) => {
  const { runProvider, busyProvider, setBusyProvider } = useProviderAuth();
  const { values, bind, reset } = useAuthForm();

  // State alur pendaftaran
  const [step, setStep] = useState('provider');
  const [data, setData] = useState({}); 
  const [otpInput, setOtpInput] = useState('');
  
  // State kode negara & status loading pengiriman email
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

  // --- 1. PILIH PROVIDER (GOOGLE ASLI) ---
  const handleSelectProvider = async (providerName) => {
    setBusyProvider(providerName);
    try {
      const account = await runProvider(providerName);
      setData({ provider: providerName, email: account?.email || '' });
      setStep('username'); 
    } catch (err) {
      console.error(`[REG-PROVIDER] ${providerName}:`, err);
      alert(`Pemilihan akun ${providerName} gagal: ${err?.message || err}`);
    } finally {
      setBusyProvider(null);
    }
  };

  // --- 2. SUBMIT USERNAME ---
  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (loadUsers().some((u) => sameText(u.username, values.username))) {
      alert('Username sudah dipakai, pilih username lain.');
      return;
    }
    setData((prev) => ({ ...prev, username: values.username.trim() }));
    setStep('password'); 
  };

  // --- 3. SUBMIT PASSWORD ---
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setData((prev) => ({ ...prev, password: values.password }));
    setStep('wa'); 
  };

  // --- 4. SUBMIT WHATSAPP & KIRIM OTP EMAIL NYATA VIA RESEND ---
  const handleWaSubmit = async (e) => {
    e.preventDefault();
    const cleanNumber = values.whatsapp.replace(/^0+/, '');
    if (cleanNumber.length < 8) { alert('Nomor WhatsApp tidak valid.'); return; }
    
    const fullWaNumber = `${countryCode}${cleanNumber}`;
    setData((prev) => ({ ...prev, whatsapp: fullWaNumber }));
    
    setIsLoading(true);
    try {
      // Memanggil API Resend backend secara nyata
      const res = await fetch('/api/send-otp-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Gagal mengirim email OTP');
      }

      // Menyimpan token OTP asli dari server secara rahasia untuk divalidasi
      if (result.test_otp) {
        setData((prev) => ({ ...prev, serverEmailOtp: result.test_otp }));
      }

      alert(`Email verifikasi berhasil dikirim ke ${data.email}`);
      setOtpInput('');
      setStep('otp_email'); 
    } catch (err) {
      console.error(err);
      alert(`Gagal mengirim OTP Email: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 5. SUBMIT OTP EMAIL (VALIDASI NYATA TANPA SIMULASI STATIS) ---
  const handleOtpEmailSubmit = (e) => {
    e.preventDefault();
    
    if (!data.serverEmailOtp) {
      alert('Kode OTP belum di-generate. Silakan ulangi proses.');
      return;
    }

    // Mencocokkan input user persis dengan kode acak dari server Resend
    if (otpInput.trim() !== data.serverEmailOtp.toString().trim()) { 
      alert('Kode OTP Email salah! Periksa kembali email Anda.'); 
      return; 
    }
    
    setOtpInput('');
    setStep('otp_wa'); // Lanjut ke verifikasi WhatsApp
  };

  // --- 6. SUBMIT OTP WHATSAPP & SELESAI ---
  const handleOtpWaSubmit = (e) => {
    e.preventDefault();
    if (otpInput !== OTP_WA_SIM) { alert('Kode OTP WhatsApp salah!'); return; }
    
    const users = loadUsers();
    users.push({
      provider: data.provider,
      email: data.email,
      username: data.username,
      password: data.password, 
      whatsapp: data.whatsapp,
    });
    saveUsers(users);
    
    alert('Pendaftaran berhasil! Silakan masuk dengan username dan password Anda.');
    onRegistered(); 
  };

  if (!open) return null;

  // ================= RENDER LAYAR TAHAPAN =================

  if (step === 'provider') {
    return (
      <div className={styles.overlay}>
        <div className={styles.card}>
          <h4 className={styles.title}>Daftar Akun</h4>
          <p className={styles.desc}>Pilih platform, lalu pilih akun Anda</p>

          <div className={styles.providerStack}>
            {PROVIDERS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleSelectProvider(p)}
                disabled={busyProvider !== null}
                className={styles.providerBtn}
              >
                <ProviderIcon name={p} size={22} />
                <span>{busyProvider === p ? 'Membuka pilihan akun...' : `Daftar dengan ${p}`}</span>
              </button>
            ))}
          </div>

          <button type="button" onClick={onClose} className={styles.backBtn}>KEMBALI</button>
        </div>
      </div>
    );
  }

  if (step === 'username') {
    return (
      <AuthModal
        title="Buat Username"
        desc={<>Akun terpilih: <b>{data.email}</b></>}
        onSubmit={handleUsernameSubmit}
        submitLabel="LANJUT"
        onBack={() => setStep('provider')}
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
        desc="Pilih negara dan masukkan nomor WhatsApp Anda"
        onSubmit={handleWaSubmit}
        submitLabel={isLoading ? "MENGIRIM EMAIL OTP..." : "KIRIM OTP EMAIL"}
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

  if (step === 'otp_email') {
    return (
      <AuthModal
        title="Verifikasi OTP Email"
        desc={
          <>
            Kode verifikasi telah dikirim ke <b>{data.email}</b> via Resend.<br />
            <span style={{ fontSize: '12px', color: '#c45e20', fontWeight: 'bold' }}>
              Cek Kotak Masuk (Inbox) atau folder Spam Anda.
            </span>
          </>
        }
        onSubmit={handleOtpEmailSubmit}
        submitLabel="VERIFIKASI EMAIL"
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

  if (step === 'otp_wa') {
    return (
      <AuthModal
        title="Verifikasi OTP WhatsApp"
        desc={<>Kode telah dikirim ke WA <b>{data.whatsapp}</b><br />(Simulasi: {OTP_WA_SIM})</>}
        onSubmit={handleOtpWaSubmit}
        submitLabel="SELESAI DAFTAR"
        onBack={() => { setStep('otp_email'); setOtpInput(''); }}
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
