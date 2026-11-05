"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import auth from './AuthShared.module.css';
import reg from './Register.module.css';
import CountryPicker from './CountryPicker';
import { DEFAULT_ISO } from '@/data/Countries';
import {
  ProviderIcon,
  useAuthForm,
  useProviderAuth,
  loadUsers,
  saveUsers
} from './AuthShared';

const PROVIDERS = ['Google', 'Microsoft', 'Apple'];

// Urutan langkah, dipakai untuk progress bar
const STEP_ORDER = ['provider', 'otp_email', 'username', 'password', 'wa', 'otp_wa'];

const EASE = [0.16, 1, 0.3, 1];

// Transisi antar langkah: geser + blur halus, anak-anaknya muncul berurutan
const stepVariants = {
  hidden: { opacity: 0, x: 36, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: EASE, staggerChildren: 0.06, delayChildren: 0.04 }
  },
  exit: {
    opacity: 0,
    x: -36,
    filter: 'blur(6px)',
    transition: { duration: 0.22, ease: 'easeIn' }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } }
};

/* ---------- Ikon ---------- */
const Svg = ({ children, size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const STEP_ICONS = {
  provider: (
    <Svg>
      <path d="M15 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="16" y1="11" x2="22" y2="11" />
    </Svg>
  ),
  otp_email: (
    <Svg>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polyline points="3 7 12 13 21 7" />
    </Svg>
  ),
  username: (
    <Svg>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </Svg>
  ),
  password: (
    <Svg>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Svg>
  ),
  wa: (
    <Svg>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
    </Svg>
  ),
  otp_wa: (
    <Svg>
      <path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l1.9-5.5A8.4 8.4 0 1 1 21 11.5z" />
      <polyline points="8.5 11.5 11 14 15.5 9" />
    </Svg>
  )
};

const ArrowIcon = () => (
  <svg className={reg.arrow} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="13 6 19 12 13 18" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </svg>
);

const BrandMark = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2c1.2 3.2 5 5.4 5 10a5 5 0 0 1-10 0c0-2 1-3.4 2.2-4.6.2 1.2.9 2 1.8 2.4C10.2 6.8 10.6 4.2 12 2z" fill="currentColor" />
  </svg>
);

/* ---------- Kepala langkah (ikon + judul + deskripsi) ---------- */
const StepHead = ({ stepKey, title, desc }) => (
  <motion.div variants={itemVariants} className={reg.head}>
    <motion.div
      className={reg.iconBadge}
      initial={{ scale: 0.55, rotate: -14 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 17, delay: 0.08 }}
    >
      {STEP_ICONS[stepKey]}
    </motion.div>
    <h4 className={reg.title}>{title}</h4>
    <p className={reg.desc}>{desc}</p>
  </motion.div>
);

/* ---------- Form langkah: Batal di KIRI, Approve di KANAN ---------- */
const RegForm = ({
  stepKey,
  title,
  desc,
  onSubmit,
  submitLabel,
  onBack,
  backLabel = 'BATAL',
  busy = false,
  children
}) => (
  <form onSubmit={onSubmit} className={reg.form}>
    <StepHead stepKey={stepKey} title={title} desc={desc} />

    <motion.div variants={itemVariants} className={reg.fieldWrap}>
      {children}
    </motion.div>

    <motion.div variants={itemVariants} className={reg.actions}>
      <button type="button" onClick={onBack} className={reg.btnCancel} disabled={busy}>
        {backLabel}
      </button>
      <motion.button
        type="submit"
        className={reg.btnApprove}
        disabled={busy}
        whileHover={busy ? undefined : { y: -2 }}
        whileTap={busy ? undefined : { scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      >
        <span className={reg.btnLabel}>{submitLabel}</span>
        {busy ? <span className={reg.spinner} aria-hidden="true" /> : <ArrowIcon />}
      </motion.button>
    </motion.div>
  </form>
);

const Register = ({ open, onClose, onRegistered }) => {
  const { runProvider, busyProvider, setBusyProvider } = useProviderAuth();
  const { values, bind, reset } = useAuthForm();

  const [step, setStep] = useState('provider');
  const [data, setData] = useState({});
  const [otpInput, setOtpInput] = useState('');

  const [countryCode, setCountryCode] = useState('+62');
  const [countryIso, setCountryIso] = useState(DEFAULT_ISO);
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
      setCountryIso(DEFAULT_ISO);
      setIsLoading(false);
      setIsAgreed(false);
      setShakeError(false);
    }
  }, [open]);

  // Tutup dengan tombol Escape
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

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

  const otpInputClass = `${auth.inputField} ${reg.otpInput}`;
  const stepIndex = Math.max(0, STEP_ORDER.indexOf(step));
  const progress = ((stepIndex + 1) / STEP_ORDER.length) * 100;

  let content = null;

  if (step === 'provider') {
    content = (
      <div className={reg.form}>
        <StepHead
          stepKey="provider"
          title="Daftar Akun"
          desc="Pilih platform untuk memulai verifikasi email"
        />

        <motion.div variants={itemVariants}>
          <motion.div
            className={`${reg.termsBlock} ${shakeError ? reg.termsError : ''} ${isAgreed ? reg.termsAgreed : ''}`}
            animate={shakeError ? { x: [0, -9, 9, -6, 6, -3, 0] } : { x: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
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
                className={reg.checkInput}
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
              />
              <span className={reg.checkBox} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  <path className={reg.checkPath} d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </span>
              <span className={reg.checkText}>Saya menyetujui Syarat &amp; Ketentuan</span>
            </label>
          </motion.div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className={`${reg.providerList} ${isAgreed ? '' : reg.providerDim}`}
        >
          {PROVIDERS.map((p) => (
            <motion.button
              key={p}
              type="button"
              onClick={() => handleSelectProvider(p)}
              disabled={busyProvider !== null || isLoading}
              className={reg.providerBtn}
              aria-disabled={!isAgreed}
              whileHover={isAgreed ? { y: -2 } : undefined}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 420, damping: 24 }}
            >
              <span className={reg.providerIconWrap}>
                <ProviderIcon name={p} size={20} />
              </span>
              <span className={reg.providerLabel}>
                {busyProvider === p || isLoading ? 'Memeriksa...' : `Daftar dengan ${p}`}
              </span>
              {busyProvider === p || isLoading ? (
                <span className={reg.spinnerDark} aria-hidden="true" />
              ) : (
                <ArrowIcon />
              )}
            </motion.button>
          ))}
        </motion.div>

        <motion.div variants={itemVariants} className={reg.footerRow}>
          <button type="button" onClick={onClose} className={reg.btnCancel}>BATAL</button>
        </motion.div>
      </div>
    );
  } else if (step === 'otp_email') {
    content = (
      <RegForm
        stepKey="otp_email"
        title="Verifikasi OTP Email"
        desc={<>Kode dikirim ke <b>{data.email}</b>.</>}
        onSubmit={handleOtpEmailSubmit}
        submitLabel="VERIFIKASI"
        onBack={onClose}
      >
        <input
          type="text" inputMode="numeric" maxLength={6} placeholder="••••••" autoFocus
          value={otpInput} onChange={(e) => setOtpInput(e.target.value)} required
          className={otpInputClass}
        />
      </RegForm>
    );
  } else if (step === 'username') {
    content = (
      <RegForm
        stepKey="username"
        title="Buat Username"
        desc={<>Email: <b>{data.email}</b></>}
        onSubmit={handleUsernameSubmit}
        submitLabel="LANJUT"
        onBack={onClose}
      >
        <input type="text" placeholder="Masukkan Username" autoFocus {...bind('username')} />
      </RegForm>
    );
  } else if (step === 'password') {
    content = (
      <RegForm
        stepKey="password"
        title="Buat Password"
        desc="Buat password untuk akun (min. 6 karakter)."
        onSubmit={handlePasswordSubmit}
        submitLabel="LANJUT"
        onBack={onClose}
      >
        <input type="password" placeholder="Masukkan Password" autoFocus {...bind('password', { minLength: 6 })} />
      </RegForm>
    );
  } else if (step === 'wa') {
    content = (
      <RegForm
        stepKey="wa"
        title="Nomor WhatsApp"
        desc="Pilih negara dan masukkan nomor WhatsApp."
        onSubmit={handleWaSubmit}
        submitLabel={isLoading ? 'MENGIRIM OTP...' : 'KIRIM OTP'}
        onBack={onClose}
        busy={isLoading}
      >
        <CountryPicker
          value={countryIso}
          onChange={(c) => { setCountryIso(c.iso); setCountryCode(c.dial); }}
        >
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="8123456789"
            autoFocus
            {...bind('whatsapp')}
            onChange={(e) => bind('whatsapp').onChange({ target: { value: e.target.value.replace(/\D/g, '') } })}
          />
        </CountryPicker>
        <p className={reg.waHint}>
          Nomor lengkap:{' '}
          <b>{countryCode} {(values.whatsapp || '').replace(/^0+/, '') || '8123456789'}</b>
        </p>
      </RegForm>
    );
  } else if (step === 'otp_wa') {
    content = (
      <RegForm
        stepKey="otp_wa"
        title="Verifikasi WhatsApp"
        desc={<>Kode dikirim ke WA <b>{data.whatsapp}</b></>}
        onSubmit={handleOtpWaSubmit}
        submitLabel="SELESAI DAFTAR"
        onBack={onClose}
      >
        <input
          type="text" inputMode="numeric" maxLength={6} placeholder="••••••" autoFocus
          value={otpInput} onChange={(e) => setOtpInput(e.target.value)} required
          className={otpInputClass}
        />
      </RegForm>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className={reg.backdrop}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <motion.div
          className={reg.card}
          role="dialog"
          aria-modal="true"
          aria-label="Daftar Akun"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 32, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        >
          <span className={reg.accentLine} aria-hidden="true" />
          <span className={reg.orb} aria-hidden="true" />

          <div className={reg.topBar}>
            <div className={reg.brand}>
              <span className={reg.brandMark}><BrandMark /></span>
              <span className={reg.brandText}>CSCID</span>
            </div>
            <button type="button" className={reg.closeBtn} onClick={onClose} aria-label="Tutup">
              <CloseIcon />
            </button>
          </div>

          <div
            className={reg.progress}
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={STEP_ORDER.length}
            aria-valuenow={stepIndex + 1}
          >
            <div className={reg.progressTrack}>
              <motion.div
                className={reg.progressFill}
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 140, damping: 22 }}
              />
            </div>
            <span className={reg.progressText}>Langkah {stepIndex + 1} / {STEP_ORDER.length}</span>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              className={reg.stepWrap}
              variants={stepVariants}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              {content}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </MotionConfig>
  );
};

export default Register;
