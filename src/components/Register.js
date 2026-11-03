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
  OTP_EMAIL_SIM,
  OTP_WA_SIM
} from './AuthShared';

// Google dipindah ke urutan paling atas
const PROVIDERS = ['Google', 'Microsoft', 'Apple'];

const Register = ({ open, onClose, onRegistered }) => {
  const { runProvider, busyProvider, setBusyProvider } = useProviderAuth();
  const { values, bind, reset } = useAuthForm();

  // State langkah: provider -> username -> password -> wa -> otp_email -> otp_wa
  const [step, setStep] = useState('provider');
  const [data, setData] = useState({}); 
  const [otpInput, setOtpInput] = useState(''); // State khusus untuk input OTP

  useEffect(() => {
    if (open) { 
      reset(); 
      setData({}); 
      setStep('provider'); 
      setOtpInput(''); 
    }
  }, [open, reset]);

  // --- 1. PILIH PROVIDER ---
  const handleSelectProvider = async (providerName) => {
    setBusyProvider(providerName);
    try {
      const account = await runProvider(providerName);
      setData({ provider: providerName, email: account?.email || '' });
      setStep('username'); // Lanjut ke layar Username
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
    setStep('password'); // Lanjut ke layar Password
  };

  // --- 3. SUBMIT PASSWORD ---
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setData((prev) => ({ ...prev, password: values.password }));
    setStep('wa'); // Lanjut ke layar WhatsApp
  };

  // --- 4. SUBMIT WHATSAPP ---
  const handleWaSubmit = (e) => {
    e.preventDefault();
    if (!isValidWa(values.whatsapp)) { alert('Nomor WhatsApp tidak valid.'); return; }
    setData((prev) => ({ ...prev, whatsapp: values.whatsapp }));
    setOtpInput('');
    setStep('otp_email'); // Lanjut ke layar OTP Email
  };

  // --- 5. SUBMIT OTP EMAIL ---
  const handleOtpEmailSubmit = (e) => {
    e.preventDefault();
    if (otpInput !== OTP_EMAIL_SIM) { alert('Kode OTP Email salah!'); return; }
    setOtpInput('');
    setStep('otp_wa'); // Lanjut ke layar OTP WhatsApp
  };

  // --- 6. SUBMIT OTP WHATSAPP & SELESAI ---
  const handleOtpWaSubmit = (e) => {
    e.preventDefault();
    if (otpInput !== OTP_WA_SIM) { alert('Kode OTP WhatsApp salah!'); return; }
    
    // Simpan ke database/lokal
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
    onRegistered(); // Menutup modal daftar dan membuka modal masuk
  };

  if (!open) return null;

  // ================= RENDER LAYAR =================

  // 1. LAYAR PILIH AKUN GOOGLE
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

  // 2. LAYAR BUAT USERNAME
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

  // 3. LAYAR BUAT PASSWORD
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

  // 4. LAYAR NOMOR WHATSAPP
  if (step === 'wa') {
    return (
      <AuthModal
        title="Nomor WhatsApp"
        desc="Masukkan nomor WhatsApp untuk verifikasi keamanan"
        onSubmit={handleWaSubmit}
        submitLabel="KIRIM OTP EMAIL"
        onBack={() => setStep('password')}
        backLabel="KEMBALI"
      >
        <input type="tel" placeholder="No. WhatsApp (0812...)" {...bind('whatsapp')} />
      </AuthModal>
    );
  }

  // 5. LAYAR OTP EMAIL
  if (step === 'otp_email') {
    return (
      <AuthModal
        title="Verifikasi OTP Email"
        desc={<>Kode telah dikirim ke <b>{data.email}</b><br />(Simulasi: {OTP_EMAIL_SIM})</>}
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

  // 6. LAYAR OTP WHATSAPP
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
