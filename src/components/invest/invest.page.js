"use client";

import React, { useState, useMemo } from 'react';
import { useAccount } from '../Account'; // Sesuaikan lokasi impor Account jika perlu
import { usePrice } from '@/context/PriceContext';
import Login from '../Login'; // Sesuaikan lokasi impor Login jika perlu
import AksiBtn from '../AksiBtn';
import { PAYMENT_CATEGORIES, isEwallet, SYARAT_RISIKO } from '@/data/investOptions';
import { hitungInvest } from '@/lib/investCalc';
import { partnersData } from '../Mitra'; // Sesuaikan lokasi impor Mitra jika perlu

const InvestPageContent = ({ invested, setInvested, setActiveTab }) => {
  const { user, logout } = useAccount();
  const { index } = usePrice(); // [PATCH:PRICE-READY]
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [isInvestingFlow, setIsInvestingFlow] = useState(false);
  const [invData, setInvData] = useState({
    ton: 1,
    currency: 'IDR',
    mitra: '', // Default None
    payment: 'bank',
    senderBank: '', 
    senderAccount: '',
    proofFile: null
  });
  
  const [invAgreed, setInvAgreed] = useState(false);
  const [invShake, setInvShake] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showContractPreview, setShowContractPreview] = useState(false);

  // State Verifikasi (Pilihan & OTP) & Status Investasi
  const [verificationStep, setVerificationStep] = useState(0); // 0: hidden, 1: pilih metode, 2: input kode
  const [verificationMethod, setVerificationMethod] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [investmentStatus, setInvestmentStatus] = useState(null); // null, 'pending', 'approved'

  const [providerSearch, setProviderSearch] = useState('');
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);

  const filteredCategories = useMemo(() => {
    return PAYMENT_CATEGORIES.map(cat => ({
      category: cat.category,
      items: cat.items.filter(item => item.name.toLowerCase().includes(providerSearch.toLowerCase()))
    })).filter(cat => cat.items.length > 0);
  }, [providerSearch]);

  // [PATCH:PRICE-READY] harga dipakai hanya setelah termuat; tanpa harga sementara & tanpa kurs tebakan
  const { priceReady, display: displayTotal } = hitungInvest(index, invData.ton, invData.currency);
  // [/PATCH:PRICE-READY]

  const selectedMitraData = partnersData?.find(p => p.name === invData.mitra) || null;

  const automaticSenderName = user?.name || "Arvin Maolana Hidayattulloh";

  const handleLogout = () => {
    logout();
    setInvested(false); 
    setActiveTab('invest');
    setMenuOpen(false);
    setIsInvestingFlow(false);
    setInvestmentStatus(null);
  };

  const handleTradeAccessCheck = (e) => {
    e.preventDefault();
    if (passwordInput.trim().toLowerCase() === "coconut shell charcoal") {
      setPasswordError(false);
      setPasswordInput("");
      setShowPasswordModal(false);
      setActiveTab('trade');
    } else {
      setPasswordError(true);
    }
  };

  const handleMenuClick = (action) => {
    setMenuOpen(false);
    switch (action) {
      case 'beranda': {
        // di halaman utama: gulir ke atas; di halaman khusus /invest: kembali ke beranda situs
        const beranda = document.getElementById('beranda');
        if (beranda) beranda.scrollIntoView({ behavior: 'smooth' });
        else window.location.href = '/';
        break;
      }
      case 'profil':
        setActiveTab('profil');
        break;
      case 'trade':
        setShowPasswordModal(true); 
        break;
      case 'portofolio':
        alert(invested ? `Portofolio Aktif: ${invData.ton} Ton Komoditas.` : "Portofolio kosong.");
        break;
      case 'keluar':
        handleLogout();
        break;
      default:
        break;
    }
  };

  const handleInitialSubmit = (e) => {
    e.preventDefault();
    // [PATCH:PRICE-READY]
    if (!priceReady) {
      alert("Harga indeks belum termuat. Coba lagi beberapa saat.");
      return;
    }
    // [/PATCH:PRICE-READY]
    if (!invAgreed) {
      setInvShake(true);
      setTimeout(() => setInvShake(false), 600);
      return;
    }
    if (!invData.mitra) {
      alert("Harap pilih perusahaan penyedia (Mitra) terlebih dahulu.");
      return;
    }
    if (!invData.senderBank) {
      alert("Harap pilih sumber bank atau e-wallet terlebih dahulu.");
      return;
    }
    if (!invData.senderAccount) {
      alert("Harap masukkan nomor rekening atau nomor handphone pengirim.");
      return;
    }
    if (!invData.proofFile) {
      alert("Harap unggah bukti transfer pembayaran.");
      return;
    }

    setVerificationStep(1);
  };

  const selectVerificationMethod = (method) => {
    setVerificationMethod(method);
    setVerificationStep(2); 
  };

  const handleFinalVerification = (e) => {
    e.preventDefault();
    if (verificationMethod !== 'Passkey' && otpCode.length < 4) {
      alert("Masukkan kode OTP/Autentikasi yang valid.");
      return;
    }

    setVerificationStep(0);
    setInvestmentStatus('pending');
    setInvested(true);
    setIsInvestingFlow(false);
    setOtpCode('');

    setTimeout(() => {
      setInvestmentStatus('approved');
      alert("Validasi Chief Executive Officer Berhasil Disetujui!\n\nRincian Investasi Berhasil telah dikirimkan oleh Customer Service via WhatsApp.");
    }, 6000);
  };

  return (
    // Tanpa kartu sendiri: pembungkus panel "Invest CSCID" ada di Invest.js (satu panel, tidak ada kartu di dalam kartu).
    <div style={{ position: 'relative' }}>
      <div>

        {/* Judul panel ada di Invest.js; di sini hanya menu akun setelah masuk. */}
        {user && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setMenuOpen(!menuOpen)} style={menuBtnStyle}>Menu ☰</button>
              {menuOpen && (
                <div style={menuDropdownStyle}>
                  <button onClick={() => handleMenuClick('beranda')} style={menuItemStyle}>Beranda</button>
                  <button onClick={() => handleMenuClick('profil')} style={menuItemStyle}>Profil</button>
                  <button onClick={() => handleMenuClick('trade')} style={{ ...menuItemStyle, color: '#c45e20', fontWeight: '700' }}>Terminal Perdagangan 🔐</button>
                  <button onClick={() => handleMenuClick('portofolio')} style={menuItemStyle}>Portofolio</button>
                  <div style={{ height: '1px', background: '#f3f4f6', margin: '4px 0' }}></div>
                  <button onClick={() => handleMenuClick('keluar')} style={{ ...menuItemStyle, color: '#dc2626' }}>Keluar</button>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ filter: showPasswordModal || verificationStep > 0 ? 'blur(5px)' : 'none', transition: 'filter 0.2s ease' }}>
          <div>
            {!user ? (
              <Login />
            ) : (
              <div>
                
                {investmentStatus === 'pending' && (
                  <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', padding: '20px', borderRadius: '14px', marginBottom: '24px', textAlign: 'center' }}>
                    <h4 style={{ color: '#b45309', margin: '0 0 8px 0', fontSize: '18px' }}>Status: Pending (Menunggu Validasi)</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>Menunggu Validasi dari Chief Executive Officer. Mohon tunggu sebentar...</p>
                  </div>
                )}

                {investmentStatus === 'approved' && (
                  <div style={{ background: '#ecfdf5', border: '1px solid #10b981', padding: '20px', borderRadius: '14px', marginBottom: '24px', textAlign: 'center' }}>
                    <h4 style={{ color: '#047857', margin: '0 0 8px 0', fontSize: '18px' }}>Investasi Berhasil Disetujui</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: '#065f46' }}>Rincian lengkap telah dikirimkan oleh Customer Service melalui WhatsApp Anda.</p>
                  </div>
                )}

                {!isInvestingFlow && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                      <img src={user.picture || 'https://via.placeholder.com/40'} alt="Profile" style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ display: 'block', fontSize: '14px', color: '#64748b' }}>Halo,</span>
                        <strong style={{ fontSize: '18px', color: '#0f172a' }}>{user.name}</strong>
                      </div>
                      <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: 'bold', cursor: 'pointer' }}>KELUAR</button>
                    </div>

                    {invested ? (
                      <div style={activeInvestBoxStyle}>
                        <h4 style={{ color: '#047857', margin: '0 0 8px 0', fontSize: '18px' }}>Portofolio Investasi Aktif</h4>
                        <p style={{ margin: 0, fontSize: '14px', color: '#065f46' }}>Alokasi Anda: <b>{invData.ton} Ton</b> (Penyedia: <b>{invData.mitra}</b>).</p>
                        <button onClick={() => setIsInvestingFlow(true)} style={tambahInvestBtnStyle}>TAMBAH ALOKASI INVESTASI</button>
                      </div>
                    ) : (
                      <>
                        <span style={{ display: 'block', marginBottom: '16px', fontSize: '14px', color: '#475569' }}>
                          Amankan alokasi kuota komoditas ekspor Anda sekarang berdasarkan Indeks CSCID dengan penyesuaian khusus.
                        </span>
                        <button onClick={() => setIsInvestingFlow(true)} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#c45e20', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(196,94,32,0.3)' }}>
                          MULAI INVESTASI BARU
                        </button>
                      </>
                    )}
                  </>
                )}

                {isInvestingFlow && (
                  <div style={{ textAlign: 'left', animation: 'fadeIn 0.3s ease' }}>
                    
                    <form onSubmit={handleInitialSubmit}>
                      
                      <div style={{ background: 'linear-gradient(135deg, #fffbeb 100%, #fef3c7 0%)', padding: '24px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #fcd34d', boxShadow: '0 10px 25px -5px rgba(245,158,11,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #fde68a', paddingBottom: '12px' }}>
                          <span style={{ fontSize: '13px', color: '#92400e', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Rincian Tagihan Investasi CSCID</span>
                          <div style={{ display: 'flex', background: '#fef9c3', padding: '3px', borderRadius: '8px', gap: '2px', border: '1px solid #fde047' }}>
                            {['IDR', 'USD'].map(curr => (
                              <button 
                                key={curr} 
                                type="button" 
                                onClick={() => setInvData({...invData, currency: curr})}
                                style={{ padding: '4px 12px', fontSize: '12px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', background: invData.currency === curr ? '#b45309' : 'transparent', color: invData.currency === curr ? '#fff' : '#78350f', transition: 'all 0.2s' }}
                              >
                                {curr}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <span style={{ fontSize: '14px', color: '#78350f', fontWeight: '600' }}>Volume Alokasi Kuota:</span>
                          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #fcd34d', borderRadius: '10px', background: '#fff', overflow: 'hidden' }}>
                            <button type="button" onClick={() => setInvData({...invData, ton: Math.max(1, invData.ton - 1)})} style={qtyBtnStyle}>-</button>
                            <input 
                              type="number" min="1" value={invData.ton} 
                              onChange={(e) => setInvData({...invData, ton: Math.max(1, parseInt(e.target.value) || 1)})}
                              style={{ width: '60px', textAlign: 'center', fontSize: '16px', fontWeight: '800', border: 'none', background: 'transparent', outline: 'none', color: '#111827' }}
                            />
                            <button type="button" onClick={() => setInvData({...invData, ton: invData.ton + 1})} style={qtyBtnStyle}>+</button>
                            <span style={{ paddingRight: '12px', fontSize: '14px', fontWeight: 'bold', color: '#78350f' }}>Ton</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                          <div>
                            <span style={{ display: 'block', fontSize: '12px', color: '#b45309', fontWeight: '700' }}>Total Tagihan Bersih:</span>
                            <span style={{ fontSize: priceReady ? '28px' : '18px', fontWeight: '900', color: '#78350f', letterSpacing: '-0.5px' }}>{displayTotal}</span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#92400e', fontStyle: 'italic' }}>*Terkalkulasi stabil dari Indeks CSCID</span>
                        </div>
                      </div>

                      <div style={{ marginBottom: '24px' }}>
                        <label style={labelStyle}>Pilih Perusahaan Penyedia</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginTop: '6px' }}>
                          {partnersData?.map((mitra) => {
                            const isSelected = invData.mitra === mitra.name;
                            return (
                              <div 
                                key={mitra.id}
                                onClick={() => setInvData({...invData, mitra: mitra.name})}
                                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', border: isSelected ? '2px solid #c45e20' : '1px solid #e2e8f0', background: isSelected ? '#fff7ed' : '#f9fafb', cursor: 'pointer', transition: 'all 0.2s' }}
                              >
                                <img src={mitra.logo} alt={mitra.name} style={{ width: '40px', height: '40px', objectFit: 'contain', aspectRatio: '1/1', borderRadius: '6px', background: '#fff', padding: '2px', border: '1px solid #e2e8f0', flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>{mitra.name}</h4>
                                    <span style={{ fontSize: '10px', background: '#e0f2fe', color: '#0369a1', fontWeight: 'bold', padding: '1px 6px', borderRadius: '4px' }}>Penyedia</span>
                                  </div>
                                  <span style={{ fontSize: '11px', color: '#64748b' }}>NIB: {mitra.nib}</span>
                                </div>
                                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: isSelected ? '5px solid #c45e20' : '2px solid #cbd5e1', background: '#fff' }}></div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {selectedMitraData && (
                        <div style={{ animation: 'fadeIn 0.4s ease' }}>
                          
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '24px', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                            <img 
                              src={selectedMitraData.fotoPJ || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMitraData.direktur || 'Direktur')}&background=c45e20&color=fff&size=120`} 
                              alt="Penanggung Jawab" 
                              style={{ width: '80px', height: '80px', aspectRatio: '1/1', borderRadius: '12px', objectFit: 'cover', border: '2px solid #fed7aa', flexShrink: 0 }} 
                            />
                            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '4px' }}>
                                <h5 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>{selectedMitraData.direktur || 'Arvin Maolana Hidayattulloh'}</h5>
                                <span style={{ fontSize: '10px', color: '#047857', fontWeight: 'bold', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>Terverifikasi Resmi</span>
                              </div>
                              <span style={{ display: 'inline-block', fontSize: '11px', color: '#c45e20', fontWeight: '700', marginBottom: '6px' }}>
                                {selectedMitraData.jabatan || 'Direktur Utama'}
                              </span>
                              <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span><b>NIK:</b> {selectedMitraData.nik || '3304031108040002'}</span>
                                <span><b>Email:</b> {selectedMitraData.email || 'tunaskembarabadi@gmail.com'}</span>
                                <span><b>WhatsApp:</b> {selectedMitraData.phone || '0851-6815-2525'}</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Metode Pembayaran Tujuan</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <label style={{...radioContainerStyle, border: invData.payment === 'bank' ? '2px solid #c45e20' : '1px solid #e5e7eb', background: invData.payment === 'bank' ? '#fff7ed' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                                <input type="radio" value="bank" checked={invData.payment === 'bank'} onChange={() => setInvData({...invData, payment: 'bank'})} style={{display: 'none'}} />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c5/Bank_Icon.svg" alt="Bank" style={{ width: '20px', height: '20px' }} />
                                Transfer Bank
                              </label>
                              <label style={{...radioContainerStyle, border: invData.payment === 'qris' ? '2px solid #c45e20' : '1px solid #e5e7eb', background: invData.payment === 'qris' ? '#fff7ed' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                                <input type="radio" value="qris" checked={invData.payment === 'qris'} onChange={() => setInvData({...invData, payment: 'qris'})} style={{display: 'none'}} />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg" alt="QRIS" style={{ width: '40px', height: '16px', objectFit: 'contain' }} />
                                QRIS
                              </label>
                            </div>
                          </div>

                          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px' }}>
                              <img 
                                src={selectedMitraData.logo || 'https://via.placeholder.com/40'} 
                                alt={selectedMitraData.name} 
                                style={{ width: '28px', height: '28px', aspectRatio: '1/1', objectFit: 'contain', background: '#fff', borderRadius: '4px', border: '1px solid #cbd5e1' }} 
                              />
                              <h5 style={{ margin: 0, color: '#334155', fontSize: '14px' }}>
                                Rekening Resmi Tujuan Pembayaran
                              </h5>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div>
                                <p style={{ margin: '4px 0', fontSize: '14px', color: '#475569' }}>Bank: <b>{selectedMitraData.bank || 'Bank Central Asia'}</b></p>
                                <p style={{ margin: '4px 0', fontSize: '14px', color: '#475569' }}>No. Rekening: <b style={{ fontSize: '18px', color: '#0f172a' }}>{selectedMitraData.noRekening || '8692824902'}</b></p>
                                <p style={{ margin: '4px 0', fontSize: '14px', color: '#475569' }}>Atas Nama: <b>{selectedMitraData.anRekening || invData.mitra}</b></p>
                              </div>
                              
                              <div style={{ textAlign: 'center', background: '#fff', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                                <img 
                                  src={invData.payment === 'qris' 
                                    ? "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_Code_example.svg" 
                                    : "https://upload.wikimedia.org/wikipedia/commons/c/c5/Bank_Icon.svg"} 
                                  alt="Transfer/QRIS" 
                                  style={{ width: '90px', height: '90px', objectFit: 'contain', opacity: invData.payment === 'bank' ? 0.3 : 1 }} 
                                />
                                <span style={{ display: 'block', fontSize: '10px', color: '#64748b', marginTop: '6px', fontWeight: 'bold' }}>
                                  {invData.payment === 'qris' ? 'Scan QRIS Resmi' : 'Transfer Manual'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <h3 style={{ margin: '0 0 12px 0', color: '#111827', fontSize: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
                            Konfirmasi Data Pengirim
                          </h3>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                            
                            <div style={{ position: 'relative' }}>
                              <label style={labelStyle}>Sumber Bank / E-Wallet</label>
                              <div 
                                onClick={() => setProviderDropdownOpen(!providerDropdownOpen)}
                                style={{ ...inputStyle, background: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                              >
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: invData.senderBank ? '#111827' : '#9ca3af' }}>
                                  {invData.senderBank || "Pilih Sumber"}
                                </span>
                                <span style={{ fontSize: '10px', color: '#64748b' }}>▼</span>
                              </div>

                              {providerDropdownOpen && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', marginTop: '4px', padding: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                                  <input 
                                    type="text" 
                                    placeholder="Cari sumber..." 
                                    value={providerSearch} 
                                    onChange={(e) => setProviderSearch(e.target.value)}
                                    autoFocus
                                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', marginBottom: '6px', outline: 'none' }}
                                  />
                                  {filteredCategories.length > 0 ? (
                                    filteredCategories.map((group, idx) => (
                                      <div key={idx} style={{ marginBottom: '6px' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#c45e20', padding: '4px 6px', background: '#fff7ed', borderRadius: '4px', marginBottom: '4px' }}>
                                          {group.category}
                                        </div>
                                        {group.items.map(p => (
                                          <div 
                                            key={p.name} 
                                            onClick={() => { setInvData({...invData, senderBank: p.name}); setProviderDropdownOpen(false); setProviderSearch(''); }}
                                            style={{ padding: '7px 10px', fontSize: '13px', borderRadius: '6px', cursor: 'pointer', color: '#334155', display: 'flex', alignItems: 'center', gap: '10px', background: invData.senderBank === p.name ? '#ffedd5' : 'transparent', fontWeight: invData.senderBank === p.name ? 'bold' : 'normal' }}
                                          >
                                            <img src={p.logo} alt={p.name} style={{ width: '28px', height: '20px', objectFit: 'contain', background: '#fff', padding: '1px', borderRadius: '3px', border: '1px solid #e2e8f0', flexShrink: 0 }} />
                                            <span>{p.name}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ))
                                  ) : (
                                    <div style={{ padding: '8px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>Tidak ditemukan</div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div>
                              <label style={labelStyle}>
                                {isEwallet(invData.senderBank) ? 'Nomor HP Akun' : 'Nomor Rekening Pengirim'}
                              </label>
                              <input 
                                type="text" 
                                placeholder={isEwallet(invData.senderBank) ? 'No. HP e-Wallet' : 'No. Rekening'} 
                                required 
                                value={invData.senderAccount} 
                                onChange={(e) => setInvData({...invData, senderAccount: e.target.value})} 
                                style={inputStyle} 
                              />
                            </div>
                          </div>

                          <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Nama Lengkap Pengirim</label>
                            <input 
                              type="text" 
                              value={automaticSenderName} 
                              disabled 
                              style={{ ...inputStyle, background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed', fontWeight: 'bold' }} 
                            />
                            <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>*Nama pengirim disesuaikan otomatis dengan akun terverifikasi.</span>
                          </div>

                          <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle}>Unggah Bukti Transfer</label>
                            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}>
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                              </svg>
                              <span style={{ fontSize: '14px', color: '#475569', fontWeight: '500' }}>
                                {invData.proofFile ? <b style={{ color: '#c45e20' }}>✓ {invData.proofFile.name}</b> : "Klik atau seret file bukti transfer ke sini"}
                              </span>
                              <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Format: JPG, PNG, PDF</span>
                              <input type="file" accept="image/*,application/pdf" hidden required onChange={(e) => setInvData({...invData, proofFile: e.target.files[0]})} />
                            </label>
                          </div>

                          {/* [PATCH:SHAKE-INLINE] styles.shakeRed diganti border merah inline (tidak ada impor styles di file ini) */}
                          <div style={{ marginBottom: '16px', background: '#fff', border: invShake ? '1px solid #dc2626' : '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', transition: 'border-color 0.2s' }}>
                          {/* [/PATCH:SHAKE-INLINE] */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                              <input type="checkbox" checked={invAgreed} onChange={(e) => setInvAgreed(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#c45e20', marginTop: '2px' }} />
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '14px', cursor: 'pointer', color: invShake ? '#dc2626' : '#111827', fontWeight: 'bold' }} onClick={() => setInvAgreed(!invAgreed)}>
                                  Saya menyetujui seluruh syarat, ketentuan, dan risiko investasi.
                                </label>
                                <button type="button" onClick={() => setShowTerms(!showTerms)} style={{ display: 'block', background: 'none', border: 'none', color: '#c45e20', fontSize: '13px', fontWeight: '700', marginTop: '6px', cursor: 'pointer', padding: 0 }}>
                                  {showTerms ? 'Sembunyikan Detail ▲' : 'Baca Detail ▼'}
                                </button>
                              </div>
                            </div>
                            {showTerms && (
                              <div style={{ marginTop: '14px', padding: '14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', color: '#4b5563', maxHeight: '150px', overflowY: 'auto', lineHeight: '1.6' }}>
                                {SYARAT_RISIKO.map((t, i) => (
                                  <p key={t.judul} style={{ margin: i < SYARAT_RISIKO.length - 1 ? '0 0 8px 0' : '0' }}><b>{i + 1}. {t.judul}:</b> {t.isi}</p>
                                ))}
                              </div>
                            )}
                          </div>

                          <div style={{ background: '#fff7ed', border: '1px solid #ea580c', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                              <div style={{ background: '#ea580c', color: '#fff', padding: '10px', borderRadius: '10px' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                  <polyline points="14 2 14 8 20 8"></polyline>
                                  <line x1="16" y1="13" x2="8" y2="13"></line>
                                  <line x1="16" y1="17" x2="8" y2="17"></line>
                                  <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                              </div>
                              <div style={{ flex: 1 }}>
                                <h5 style={{ margin: '0 0 2px 0', color: '#9a3412', fontSize: '14px', fontWeight: 'bold' }}>Dokumen Kontrak & Invoice (PDF A4)</h5>
                                <p style={{ margin: 0, color: '#c2410c', fontSize: '12px' }}>Format resmi siap cetak untuk pengesahan tanda tangan basah.</p>
                              </div>
                              <button type="button" onClick={() => setShowContractPreview(!showContractPreview)} style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                                {showContractPreview ? 'Tutup Preview' : 'Preview Teks'}
                              </button>
                            </div>

                            {showContractPreview && (
                              <div style={{ marginTop: '14px', background: '#fff', border: '1px solid #fdba74', borderRadius: '8px', padding: '16px', fontSize: '12px', color: '#334155', fontFamily: 'monospace', lineHeight: '1.5', maxHeight: '200px', overflowY: 'auto' }}>
                                <center><b>SURAT PERJANJIAN INVESTASI & ALOKASI KOMODITAS</b></center>
                                <center><b>{invData.mitra} (CSCID)</b></center>
                                <br/>
                                Pada hari ini, sistem mencatat pemesanan alokasi kuota komoditas ekspor sebesar <b>{invData.ton} Ton</b> melalui perusahaan penyedia <b>{invData.mitra}</b> dengan total nilai transaksi sebesar <b>{displayTotal}</b>.<br/><br/>
                                <b>1. Klausul Utama:</b> Investor berhak atas bagi hasil dari penjualan ekspor komoditas sesuai alokasi kuota.<br/>
                                <b>2. Rekening Resmi:</b> Seluruh dana wajib ditransfer ke rekening resmi atas nama {selectedMitraData.anRekening} ({selectedMitraData.bank}).<br/>
                                <b>3. Keabsahan:</b> Dokumen ini sah dan mengikat secara hukum setelah ditandatangani di atas meterai oleh Investor dan Penanggung Jawab ({selectedMitraData.direktur}).
                                <br/><br/>
                                <i>[Area Validasi Tanda Tangan Basah & Meterai Resmi]</i>
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '12px' }}>
                            <button type="button" onClick={() => setIsInvestingFlow(false)} style={{ padding: '14px 20px', background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                              BATAL
                            </button>
                            {/* [PATCH:PRICE-READY] tombol nonaktif selama harga belum termuat */}
                            <button type="submit" disabled={!priceReady} style={{ flex: 1, padding: '14px', background: '#c45e20', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: priceReady ? 'pointer' : 'not-allowed', opacity: priceReady ? 1 : 0.5, boxShadow: '0 4px 12px rgba(196,94,32,0.3)' }}>
                              {priceReady ? 'SELESAI & KONFIRMASI PEMBAYARAN' : 'MEMUAT HARGA...'}
                            </button>
                            {/* [/PATCH:PRICE-READY] */}
                          </div>
                        </div>
                      )}
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {verificationStep > 0 && (
          <div
            onClick={(e) => { if (e.target === e.currentTarget) setVerificationStep(0); }} /* ketuk di luar kotak = tutup popup */
            style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(5px)', borderRadius: '24px' }}>
            <div style={{ width: '100%', maxWidth: 380, padding: 28, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
              
              {verificationStep === 1 && (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, color: '#111827', fontSize: '18px', fontWeight: 'bold' }}>Verifikasi Keamanan</h4>
                    <p style={{ margin: '6px 0 0 0', color: '#6b7280', fontSize: '13px' }}>Pilih metode verifikasi untuk menyelesaikan investasi Anda.</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={() => selectVerificationMethod('Passkey')} style={verifyBtnStyle}>🔑 Passkey (Biometrik / Sidik Jari)</button>
                    <button onClick={() => selectVerificationMethod('Authenticator')} style={verifyBtnStyle}>🛡️ Aplikasi Authenticator</button>
                    <button onClick={() => selectVerificationMethod('Email')} style={verifyBtnStyle}>✉️ OTP Email Resmi</button>
                    <button onClick={() => selectVerificationMethod('WhatsApp')} style={{...verifyBtnStyle, background: '#ecfdf5', color: '#047857', border: '1px solid #10b981'}}>💬 OTP WhatsApp</button>
                  </div>
                </>
              )}

              {verificationStep === 2 && (
                <form onSubmit={handleFinalVerification}>
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, color: '#111827', fontSize: '18px', fontWeight: 'bold' }}>Verifikasi {verificationMethod}</h4>
                    <p style={{ margin: '6px 0 0 0', color: '#6b7280', fontSize: '13px' }}>
                      {verificationMethod === 'Passkey' 
                        ? "Sistem sedang mengotentikasi perangkat Anda..." 
                        : `Masukkan kode autentikasi yang dikirimkan via ${verificationMethod}.`}
                    </p>
                  </div>
                  
                  {verificationMethod !== 'Passkey' && (
                    <input 
                      type="text" 
                      maxLength="6"
                      autoFocus 
                      value={otpCode} 
                      onChange={(e) => setOtpCode(e.target.value)} 
                      placeholder="XXXX" 
                      style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: 18, textAlign: 'center', letterSpacing: '8px', outline: 'none', background: '#f9fafb', fontWeight: 'bold', marginBottom: '16px' }} 
                    />
                  )}

                  <AksiBtn label={verificationMethod === 'Passkey' ? 'Otorisasi' : 'Verifikasi'} />
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const menuBtnStyle = { background: '#ffffff', border: '1px solid #e5e7eb', padding: '8px 14px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', color: '#111827', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const menuDropdownStyle = { position: 'absolute', top: '46px', right: '0', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50, minWidth: '180px', padding: '6px' };
const activeInvestBoxStyle = { padding: '20px', background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '12px', textAlign: 'center' };
const tambahInvestBtnStyle = { marginTop: '16px', padding: '12px 18px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', width: '100%' };
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', background: '#f9fafb', color: '#111827', outline: 'none' };
const qtyBtnStyle = { padding: '12px 18px', background: '#e2e8f0', border: 'none', fontSize: '18px', fontWeight: 'bold', color: '#334155', cursor: 'pointer', transition: 'background 0.2s' };
const radioContainerStyle = { flex: 1, padding: '12px', textAlign: 'center', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', color: '#374151', transition: 'all 0.2s ease' };
const menuItemStyle = { display: 'flex', alignItems: 'center', width: '100%', padding: '10px 12px', border: 'none', borderRadius: '8px', background: 'transparent', fontSize: '13px', fontWeight: '600', color: '#4b5563', cursor: 'pointer', textAlign: 'left' };
const verifyBtnStyle = { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '12px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', color: '#334155', cursor: 'pointer', transition: 'all 0.2s' };

export default InvestPageContent;
