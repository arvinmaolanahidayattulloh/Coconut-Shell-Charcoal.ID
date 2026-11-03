"use client";

import React, { useEffect, useState } from 'react';
import styles from './Login.module.css';
import {
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

  // Langkah awal dimulai dari 'terms' (Syarat & Ketentuan)
  const [step, setStep] = useState('terms');
  const [data, setData] = useState({}); 
  const [otpInput, setOtpInput] = useState('');
  
  const [countryCode, setCountryCode] = useState('+62');
  const [isLoading, setIsLoading] = useState(false);

  // State untuk Syarat & Ketentuan + Animasi Getar Merah
  const [isAgreed, setIsAgreed] = useState(false);
  const [shakeError, setShakeError] = useState(false);

  useEffect(() => {
    if (open) { 
      reset(); 
      setData({}); 
      setStep('terms'); 
      setOtpInput(''); 
      setCountryCode('+62');
      setIsLoading(false);
      setIsAgreed(false);
      setShakeError(false);
    }
  }, [open]); 

  // Validasi S&K sebelum lanjut ke halaman pilih provider/login
  const handleProceedTerms = (e) => {
    e.preventDefault();
    if (!isAgreed) {
      setShakeError(true);
      setTimeout(() => setShakeError(false), 600);
      return;
    }
    setStep('provider');
  };

  const handleSelectProvider = async (providerName) => {
    setBusyProvider(providerName);
    try {
      const account = await runProvider(providerName);
      const userEmail = account?.email || '';
      if (!userEmail) throw new Error('Email akun tidak ditemukan.');

      const existingUsers = loadUsers();
      const isAlreadyRegistered = existingUsers.some((u) => sameText(u.email, userEmail));

      if (isAlreadyRegistered) {
        alert(`Akun dengan email ${userEmail} sudah terdaftar! Silakan langsung Masuk.`);
        onRegistered({ email: userEmail, username: userEmail.split('@')[0] });
        return;
      }

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
    
    const newUser = {
      provider: data.provider,
      email: data.email,
      username: data.username,
      password: data.password, 
      whatsapp: data.whatsapp,
    };

    const users = loadUsers();
    users.push(newUser);
    saveUsers(users);
    
    onRegistered(newUser); 
  };

  if (!open) return null;

  return (
    /* Latar belakang pop-up blur (klik area luar untuk menutup) */
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px' }}>
        
        {/* KOTAK POP-UP UTAMA (Desain disamakan persis dengan modal login) */}
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          
          {/* TAHAP 0: SYARAT & KETENTUAN DI AWAL */}
          {step === 'terms' && (
            <form onSubmit={handleProceedTerms}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>Syarat & Ketentuan</h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.4' }}>
                Silakan setujui persyaratan pendaftaran terlebih dahulu untuk melanjutkan.
              </p>

              <div className={`${styles.termsWrapper} ${shakeError ? styles.shakeRed : ''}`} style={{ margin: '16px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', color: shakeError ? '#dc2626' : '#374151', fontWeight: shakeError ? 'bold' : 'normal' }}>
                  <input 
                    type="checkbox" 
                    checked={isAgreed} 
                    onChange={(e) => setIsAgreed(e.target.checked)} 
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#c45e20' }}
                  />
                  Saya Menyetujui Syarat dan Ketentuan
                </label>
              </div>

              <button 
                type="submit"
                style={{
                  width: '100%', padding: '12px', background: '#c45e20', color: '#ffffff',
                  border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
                  marginTop: '12px'
                }}
              >
                LANJUT
              </button>
            </form>
          )}

          {/* TAHAP 1: PILIH PLATFORM (GOOGLE / MICROSOFT / APPLE) */}
          {step === 'provider' && (
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>Daftar Akun</h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.4' }}>
                Pilih platform untuk memulai verifikasi email
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {PROVIDERS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleSelectProvider(p)}
                    disabled={busyProvider !== null || isLoading}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      padding: '12px', background: '#ffffff', border: '1px solid #e5e7eb',
                      borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', color: '#111827',
                      transition: 'background 0.2s'
                    }}
                  >
                    <ProviderIcon name={p} size={22} />
                    <span>{busyProvider === p || isLoading ? 'Memeriksa...' : `Daftar dengan ${p}`}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAHAP 2: OTP EMAIL */}
          {step === 'otp_email' && (
            <form onSubmit={handleOtpEmailSubmit}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>Verifikasi OTP Email</h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.4' }}>
                Kode telah dikirim ke <b>{data.email}</b> via Resend.
              </p>
              
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="••••••"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                required
                style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '20px', fontWeight: 'bold', padding: '12px', width: '100%', border: '1px solid #e5e7eb', borderRadius: '10px', marginBottom: '16px', boxSizing: 'border-box' }}
              />

              <button type="submit" style={{ width: '100%', padding: '12px', background: '#c45e20', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                VERIFIKASI EMAIL
              </button>
            </form>
          )}

          {/* TAHAP 3: USERNAME */}
          {step === 'username' && (
            <form onSubmit={handleUsernameSubmit}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>Buat Username</h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.4' }}>
                Email terverifikasi: <b>{data.email}</b>
              </p>

              <input 
                type="text" 
                placeholder="Masukkan Username" 
                {...bind('username')} 
                required
                style={{ padding: '12px', width: '100%', border: '1px solid #e5e7eb', borderRadius: '10px', marginBottom: '16px', fontSize: '14px', boxSizing: 'border-box' }} 
              />

              <button type="submit" style={{ width: '100%', padding: '12px', background: '#c45e20', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                LANJUT
              </button>
            </form>
          )}

          {/* TAHAP 4: PASSWORD */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>Buat Password</h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.4' }}>
                Buat password untuk akun Anda (min. 6 karakter).
              </p>

              <input 
                type="password" 
                placeholder="Masukkan Password" 
                {...bind('password', { minLength: 6 })} 
                required
                style={{ padding: '12px', width: '100%', border: '1px solid #e5e7eb', borderRadius: '10px', marginBottom: '16px', fontSize: '14px', boxSizing: 'border-box' }} 
              />

              <button type="submit" style={{ width: '100%', padding: '12px', background: '#c45e20', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                LANJUT
              </button>
            </form>
          )}

          {/* TAHAP 5: WHATSAPP */}
          {step === 'wa' && (
            <form onSubmit={handleWaSubmit}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>Nomor WhatsApp</h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.4' }}>
                Pilih negara dan masukkan nomor WhatsApp untuk OTP.
              </p>

              <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '16px' }}>
                <select 
                  value={countryCode} 
                  onChange={(e) => setCountryCode(e.target.value)}
                  style={{ padding: '10px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', fontWeight: 'bold' }}
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
                  required
                  style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <button type="submit" style={{ width: '100%', padding: '12px', background: '#c45e20', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                {isLoading ? 'MENGIRIM WA OTP...' : 'KIRIM OTP WHATSAPP'}
              </button>
            </form>
          )}

          {/* TAHAP 6: OTP WHATSAPP */}
          {step === 'otp_wa' && (
            <form onSubmit={handleOtpWaSubmit}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>Verifikasi WhatsApp</h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.4' }}>
                Kode telah dikirim ke WA <b>{data.whatsapp}</b>
              </p>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="••••••"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                required
                style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '20px', fontWeight: 'bold', padding: '12px', width: '100%', border: '1px solid #e5e7eb', borderRadius: '10px', marginBottom: '16px', boxSizing: 'border-box' }}
              />

              <button type="submit" style={{ width: '100%', padding: '12px', background: '#c45e20', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                SELESAI DAFTAR
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};

export default Register;
