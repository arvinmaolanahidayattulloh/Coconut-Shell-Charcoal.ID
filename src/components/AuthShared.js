"use client";

import React, { useState } from 'react';
import { useAccount } from './Account';
import styles from './AuthShared.module.css';

// ============================================================
// AuthShared.jsx — dipakai bersama oleh Login.jsx & Register.jsx
// Jangan taruh logika khusus Login/Register di sini.
// ============================================================

// [CONST-START] Konstanta (OTP masih simulasi, ganti dengan backend saat produksi)
export const OTP_EMAIL_SIM = '654321';
export const OTP_WA_SIM = '123456';
export const USERS_KEY = 'csc_registered_users';
export const EMPTY_INPUT = { username: '', password: '', whatsapp: '', email: '', otp: '' };
const otpStyle = { textAlign: 'center', letterSpacing: '6px', fontSize: '18px', fontWeight: 'bold' };
// [CONST-END]

// [HELPERS-START] Penyimpanan & validasi
export const loadUsers = () => {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
};
export const saveUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));
export const sameText = (a, b) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();
export const normalizeWa = (v) => (v || '').replace(/\D/g, '').replace(/^62/, '0');
export const isValidWa = (v) => { const d = normalizeWa(v); return d.length >= 9 && d.length <= 14; };
// [HELPERS-END]

// [ICONS-START] Logo penyedia auth (SVG inline, tanpa dependensi)
export const ProviderIcon = ({ name, size = 20 }) => {
  const common = { width: size, height: size, className: styles.providerIcon, 'aria-hidden': true };

  if (name === 'Google') {
    return (
      <svg {...common} viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
    );
  }

  if (name === 'Microsoft') {
    return (
      <svg {...common} viewBox="0 0 21 21">
        <rect x="1" y="1" width="9" height="9" fill="#F25022" />
        <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
        <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
        <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
      </svg>
    );
  }

  if (name === 'Apple') {
    return (
      <svg {...common} viewBox="0 0 24 24" fill="#000000">
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
      </svg>
    );
  }

  // Passkey
  return (
    <svg {...common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l9-9" />
      <path d="M16 7l3 3" />
      <path d="M14 9l2 2" />
    </svg>
  );
};
// [ICONS-END]

// [MODAL-WRAPPER-START] Pembungkus modal form (dipakai semua modal form)
export const AuthModal = ({ title, desc, onSubmit, submitLabel, onBack, backLabel = 'BATAL', footer = null, children }) => (
  <div className={styles.modalOverlay}>
    <form onSubmit={onSubmit} className={styles.modalForm}>
      <h4 className={styles.modalTitle}>{title}</h4>
      <p className={styles.modalDesc}>{desc}</p>
      {children}
      <div className={styles.modalActionsRow}>
        <button type="submit" className={styles.btnSubmit}>{submitLabel}</button>
        <button type="button" onClick={onBack} className={styles.btnCancel}>{backLabel}</button>
      </div>
      {footer}
    </form>
  </div>
);
// [MODAL-WRAPPER-END]

// [FORM-HOOK-START] State form + helper bind() untuk <input>
export const useAuthForm = () => {
  const [values, setValues] = useState(EMPTY_INPUT);
  const bind = (key, extra = {}) => ({
    value: values[key],
    onChange: (e) => setValues((prev) => ({ ...prev, [key]: e.target.value })),
    required: true,
    className: styles.inputField,
    ...extra,
  });
  const reset = () => setValues(EMPTY_INPUT);
  return { values, bind, reset };
};
// [FORM-HOOK-END]

// [PROVIDER-HOOK-START] Pemanggil provider terpusat (perbaiki integrasi provider di sini saja)
export const useProviderAuth = () => {
  const { loginGoogle, loginMicrosoft, loginApple } = useAccount();
  const [busyProvider, setBusyProvider] = useState(null);

  const providerLoginMap = { Microsoft: loginMicrosoft, Google: loginGoogle, Apple: loginApple };

  const runProvider = async (providerName) => {
    const fn = providerLoginMap[providerName];
    if (typeof fn !== 'function') {
      throw new Error(`Fungsi login${providerName} tidak ditemukan di useAccount()`);
    }
    const fallbackProfile = {
      name: `${providerName} User`,
      email: `${providerName.toLowerCase()}_user@coconutshellcharcoal.id`,
    };
    try {
      const res = await fn();
      return res && typeof res === 'object' ? res : fallbackProfile;
    } catch (err) {
      if (err instanceof TypeError) {
        console.warn(`[PROVIDER] ${providerName} tanpa argumen gagal, coba dengan profil:`, err);
        await fn(fallbackProfile);
        return fallbackProfile;
      }
      throw err;
    }
  };

  return { loginGoogle, runProvider, busyProvider, setBusyProvider };
};
// [PROVIDER-HOOK-END]

// [OTP-FLOW-START] OTP Email → OTP WhatsApp (dipakai Daftar, Lupa Akun, Reset Password)
export const OtpFlow = ({ email, whatsapp, onSuccess, onCancel }) => {
  const [step, setStep] = useState('email'); // 'email' | 'wa'
  const [otp, setOtp] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 'email') {
      if (otp !== OTP_EMAIL_SIM) { alert('Kode OTP Email salah!'); return; }
      setOtp('');
      setStep('wa');
    } else {
      if (otp !== OTP_WA_SIM) { alert('Kode OTP WhatsApp salah!'); return; }
      onSuccess();
    }
  };

  const isEmail = step === 'email';
  return (
    <AuthModal
      title={isEmail ? 'Verifikasi OTP Email' : 'Verifikasi OTP WhatsApp'}
      desc={
        isEmail
          ? <>Kode dikirim ke <b>{email}</b>.<br />Simulasi kode: <b>{OTP_EMAIL_SIM}</b></>
          : <>Kode dikirim ke WhatsApp <b>{whatsapp}</b>.<br />Simulasi kode: <b>{OTP_WA_SIM}</b></>
      }
      onSubmit={handleSubmit}
      submitLabel="VERIFIKASI"
      onBack={onCancel}
    >
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        placeholder="••••••"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        required
        className={styles.inputField}
        style={otpStyle}
      />
    </AuthModal>
  );
};
// [OTP-FLOW-END]
