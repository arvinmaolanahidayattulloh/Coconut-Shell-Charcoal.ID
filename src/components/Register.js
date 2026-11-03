"use client";

import React, { useEffect, useState } from 'react';
import styles from './Register.module.css';
import {
  AuthModal,
  OtpFlow,
  ProviderIcon,
  useAuthForm,
  useProviderAuth,
  loadUsers,
  saveUsers,
  sameText,
  isValidWa,
} from './AuthShared';

const PROVIDERS = ['Microsoft', 'Google', 'Apple'];

const Register = ({ open, onClose, onRegistered }) => {
  const { runProvider, busyProvider, setBusyProvider } = useProviderAuth();
  const { values, bind, reset } = useAuthForm();

  const [step, setStep] = useState('provider');
  const [data, setData] = useState({}); 

  useEffect(() => {
    if (open) { reset(); setData({}); setStep('provider'); }
  }, [open, reset]);

  const handleSelectProvider = async (providerName) => {
    setBusyProvider(providerName);
    try {
      const account = await runProvider(providerName);
      setData({ provider: providerName, email: account?.email || '' });
      setStep('form');
    } catch (err) {
      console.error(`[REG-PROVIDER] ${providerName}:`, err);
      alert(`Pemilihan akun ${providerName} gagal: ${err?.message || err}`);
    } finally {
      setBusyProvider(null);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (loadUsers().some((u) => sameText(u.username, values.username))) {
      alert('Username sudah dipakai, pilih username lain.');
      return;
    }
    setData((prev) => ({ ...prev, username: values.username.trim(), password: values.password }));
    setStep('wa');
  };

  const handleWaSubmit = (e) => {
    e.preventDefault();
    if (!isValidWa(values.whatsapp)) { alert('Nomor WhatsApp tidak valid.'); return; }
    setData((prev) => ({ ...prev, whatsapp: values.whatsapp }));
    setStep('otp');
  };

  const handleOtpSuccess = () => {
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

  if (step === 'form') {
    return (
      <AuthModal
        title="Buat Username & Password"
        desc={<>Akun terpilih: <b>{data.provider}</b>{data.email ? <> ({data.email})</> : null}</>}
        onSubmit={handleFormSubmit}
        submitLabel="NEXT"
        onBack={() => setStep('provider')}
        backLabel="KEMBALI"
      >
        <input type="text" placeholder="Buat Username" {...bind('username')} />
        <input type="password" placeholder="Buat Password (min. 6 karakter)" {...bind('password', { minLength: 6 })} />
      </AuthModal>
    );
  }

  if (step === 'wa') {
    return (
      <AuthModal
        title="Nomor WhatsApp"
        desc="Masukkan nomor WhatsApp untuk verifikasi"
        onSubmit={handleWaSubmit}
        submitLabel="KIRIM OTP"
        onBack={() => setStep('form')}
        backLabel="KEMBALI"
      >
        <input type="tel" placeholder="No. WhatsApp (0812...)" {...bind('whatsapp')} />
      </AuthModal>
    );
  }

  return (
    <OtpFlow
      email={data.email}
      whatsapp={data.whatsapp}
      onSuccess={handleOtpSuccess}
      onCancel={onClose}
    />
  );
};

export default Register;
