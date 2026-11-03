"use client";

import React, { useEffect, useState } from 'react';
import {
  AuthModal,
  OtpFlow,
  useAuthForm,
  loadUsers,
  saveUsers,
  sameText,
  normalizeWa,
} from './AuthShared';

// ============================================================
// Recovery.jsx — Lupa Akun & Reset Password
//
// mode 'forgot' : email → No. WhatsApp → OTP Email → OTP WhatsApp
//                 → username dikirim lewat email → Login
// mode 'reset'  : username → email → No. WhatsApp → OTP Email → OTP WhatsApp
//                 → password baru → Login
//
// Props:
//   mode    : 'forgot' | 'reset' | null (null = tidak tampil)
//   onClose : dipanggil saat user membatalkan
//   onDone  : dipanggil saat alur selesai (Login membuka modal Masuk)
//
// Tidak butuh file CSS sendiri: seluruh tampilan memakai AuthShared.module.css
// ============================================================

const Recovery = ({ mode, onClose, onDone }) => {
  const { values, bind, reset } = useAuthForm();

  // step: username | email | wa | otp | password
  const [step, setStep] = useState('email');
  const [data, setData] = useState({}); // { username, email, whatsapp }

  // [RESET-ON-OPEN-START] mulai dari langkah pertama setiap kali mode berubah
  useEffect(() => {
    if (mode) {
      reset();
      setData({});
      setStep(mode === 'reset' ? 'username' : 'email');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);
  // [RESET-ON-OPEN-END]

  // [STEP-HANDLERS-START] langkah umum (Lupa Akun & Reset)
  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    setData((prev) => ({ ...prev, username: values.username.trim() }));
    setStep('email');
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setData((prev) => ({ ...prev, email: values.email.trim() }));
    setStep('wa');
  };

  const handleWaSubmit = (e) => {
    e.preventDefault();
    const users = loadUsers();
    const waMatch = (u) => normalizeWa(u.whatsapp) === normalizeWa(values.whatsapp);

    if (mode === 'forgot') {
      const found = users.find((u) => sameText(u.email, data.email) && waMatch(u));
      if (!found) { alert('Email dan No. WhatsApp tidak cocok dengan akun terdaftar.'); return; }
      setData((prev) => ({ ...prev, whatsapp: values.whatsapp, username: found.username }));
    } else {
      const found = users.find(
        (u) => sameText(u.username, data.username) && sameText(u.email, data.email) && waMatch(u)
      );
      if (!found) { alert('Username, Email, dan No. WhatsApp tidak cocok dengan akun terdaftar.'); return; }
      setData((prev) => ({ ...prev, whatsapp: values.whatsapp }));
    }
    setStep('otp');
  };
  // [STEP-HANDLERS-END]

  // [OTP-DONE-START] OTP Email & WA sukses
  const handleOtpSuccess = () => {
    if (mode === 'forgot') {
      // TODO produksi: kirim email lewat backend
      alert(`Username Anda telah dikirim ke email ${data.email}. (Simulasi: username = ${data.username})`);
      onDone();
    } else {
      reset();
      setStep('password');
    }
  };
  // [OTP-DONE-END]

  // [NEW-PASSWORD-START] khusus Reset Password
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const users = loadUsers().map((u) =>
      sameText(u.username, data.username) ? { ...u, password: values.password } : u
    );
    saveUsers(users);
    alert('Password berhasil diubah! Silakan login kembali.');
    onDone();
  };
  // [NEW-PASSWORD-END]

  if (!mode) return null;

  // ============ USERNAME (khusus Reset) ============
  if (step === 'username') {
    return (
      <AuthModal title="Reset Password" desc="Masukkan username akun Anda" onSubmit={handleUsernameSubmit} submitLabel="NEXT" onBack={onClose}>
        <input type="text" placeholder="Username" {...bind('username')} />
      </AuthModal>
    );
  }

  // ============ EMAIL ============
  if (step === 'email') {
    const isReset = mode === 'reset';
    return (
      <AuthModal
        title={isReset ? 'Email Terdaftar' : 'Lupa Akun'}
        desc={isReset ? 'Masukkan email yang terdaftar' : 'Masukkan email terdaftar Anda'}
        onSubmit={handleEmailSubmit}
        submitLabel="NEXT"
        onBack={isReset ? () => setStep('username') : onClose}
        backLabel={isReset ? 'KEMBALI' : 'BATAL'}
      >
        <input type="email" placeholder="email@domain.com" {...bind('email')} />
      </AuthModal>
    );
  }

  // ============ NO. WHATSAPP ============
  if (step === 'wa') {
    return (
      <AuthModal
        title="Nomor WhatsApp"
        desc="Masukkan nomor WhatsApp yang terdaftar"
        onSubmit={handleWaSubmit}
        submitLabel="KIRIM OTP"
        onBack={() => setStep('email')}
        backLabel="KEMBALI"
      >
        <input type="tel" placeholder="No. WhatsApp (0812...)" {...bind('whatsapp')} />
      </AuthModal>
    );
  }

  // ============ OTP EMAIL → OTP WHATSAPP ============
  if (step === 'otp') {
    return <OtpFlow email={data.email} whatsapp={data.whatsapp} onSuccess={handleOtpSuccess} onCancel={onClose} />;
  }

  // ============ PASSWORD BARU (khusus Reset) ============
  return (
    <AuthModal title="Password Baru" desc="Masukkan sandi baru untuk akun Anda" onSubmit={handlePasswordSubmit} submitLabel="SIMPAN" onBack={onClose}>
      <input type="password" placeholder="Password Baru (min. 6 karakter)" {...bind('password', { minLength: 6 })} />
    </AuthModal>
  );
};

export default Recovery;
