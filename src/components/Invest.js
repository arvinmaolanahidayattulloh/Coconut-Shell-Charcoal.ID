"use client";

import React, { useState, useMemo } from 'react';
import { useAccount } from './Account'; 
import { usePrice } from '@/context/PriceContext'; 
import Login from './Login';
import styles from './Invest.module.css';
import { partnersData } from './Mitra'; 

const PAYMENT_CATEGORIES = [
  {
    category: "Transfer Bank Resmi",
    items: [
      { name: "Bank Central Asia", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia_logo.svg" },
      { name: "Bank Mandiri", logo: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg" },
      { name: "Bank Negara Indonesia", logo: "https://upload.wikimedia.org/wikipedia/commons/9/97/Logo_BNI.svg" },
      { name: "Bank Rakyat Indonesia", logo: "https://upload.wikimedia.org/wikipedia/commons/2/28/Logo_Bank_Rakyat_Indonesia.svg" },
      { name: "Bank Syariah Indonesia", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Bank_Syariah_Indonesia_logo.svg" },
      { name: "CIMB Niaga", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b3/CIMB_Niaga_logo.svg" },
      { name: "Bank Permata", logo: "https://upload.wikimedia.org/wikipedia/commons/6/6f/PermataBank_logo.svg" },
      { name: "Bank Danamon", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Bank_Danamon_logo.svg" },
      { name: "Bank Tabungan Negara", logo: "https://upload.wikimedia.org/wikipedia/commons/d/d1/Bank_BTN_logo.svg" },
      { name: "Bank Mega", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Bank_Mega_logo.svg" },
      { name: "OCBC NISP", logo: "https://upload.wikimedia.org/wikipedia/commons/7/77/OCBC_logo_2023.svg" },
      { name: "Panin Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/8/8c/PaninBank_logo.svg" },
      { name: "Bank Jago", logo: "https://upload.wikimedia.org/wikipedia/commons/3/36/Bank_Jago_logo.svg" },
      { name: "SeaBank Indonesia", logo: "https://upload.wikimedia.org/wikipedia/commons/d/de/SeaBank_Logo.svg" },
      { name: "Bank Neo Commerce", logo: "https://upload.wikimedia.org/wikipedia/commons/2/23/Bank_Neo_Commerce_logo.svg" },
      { name: "BCA Syariah", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia_logo.svg" },
      { name: "Bank Muamalat", logo: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Bank_Muamalat_Indonesia_logo.svg" },
      { name: "BTPN / Jenius", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fc/BTPN_logo_2019.svg" },
      { name: "Maybank Indonesia", logo: "https://upload.wikimedia.org/wikipedia/commons/8/8c/Maybank_logo.svg" },
      { name: "Bank Jabar Banten", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Bank_BJB_logo.svg" },
      { name: "Bank DKI", logo: "https://upload.wikimedia.org/wikipedia/commons/3/3a/Logo_Bank_DKI.svg" }
    ]
  },
  {
    category: "Dompet Digital (E-Wallet)",
    items: [
      { name: "Dana", logo: "https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg" },
      { name: "Gopay", logo: "https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg" },
      { name: "OVO", logo: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg" },
      { name: "LinkAja", logo: "https://upload.wikimedia.org/wikipedia/commons/8/89/LinkAja_logo.svg" }
    ]
  }
];

const Invest = ({ invested, setInvested, activeTab, setActiveTab }) => {
  const { user, logout } = useAccount();
  const { livePrice, currency: chartCurrency } = usePrice();
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const defaultMitra = partnersData && partnersData.length > 0 ? partnersData[0].name : 'PT. Tunas Kembar Abadi';

  const [isInvestingFlow, setIsInvestingFlow] = useState(false);
  const [invData, setInvData] = useState({
    ton: 1,
    currency: 'IDR',
    mitra: defaultMitra,
    senderBank: '', 
    senderAccount: '',
    proofFile: null
  });
  
  const [invAgreed, setInvAgreed] = useState(false);
  const [invShake, setInvShake] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // State OTP & Status Validasi CEO
  const [showOtpModal, setShowOtpModal] = useState(false);
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

  // Sinkronisasi stabil harga dari Indeks CSCID & Konversi Kurs Stabil (Fix Bug Mata Uang Lain)
  const rawChartPrice = livePrice || 1250.50; 
  const USD_EXCHANGE_RATE = 15500; 

  // Normalisasi stabil agar tidak mengalami lonjakan saat mata uang chart berubah
  const normalizedChartUSD = chartCurrency === 'IDR' ? rawChartPrice / USD_EXCHANGE_RATE : rawChartPrice;
  const normalizedChartIDR = chartCurrency === 'IDR' ? rawChartPrice : rawChartPrice * USD_EXCHANGE_RATE;

  const unitPriceUSD = normalizedChartUSD * 0.90;
  const unitPriceIDR = normalizedChartIDR * 0.90;

  const currentTotalCalculated = invData.currency === 'IDR' 
    ? invData.ton * unitPriceIDR 
    : invData.ton * unitPriceUSD;

  const displayTotal = invData.currency === 'IDR' 
    ? `Rp ${Math.round(currentTotalCalculated).toLocaleString('id-ID')}`
    : `$ ${currentTotalCalculated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const selectedMitraData = partnersData?.find(p => p.name === invData.mitra) || partnersData?.[0];

  // Nama Pengirim Otomatis Terisi dari Akun Terverifikasi
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
      case 'beranda':
        const berandaEl = document.getElementById('beranda');
        if (berandaEl) berandaEl.scrollIntoView({ behavior: 'smooth' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'profil':
        alert(user ? `Profil Pengguna: ${user.name} (${user.email})` : "Silakan masuk terlebih dahulu.");
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
    if (!invAgreed) {
      setInvShake(true);
      setTimeout(() => setInvShake(false), 600);
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

    // Memunculkan permintaan OTP WhatsApp
    setShowOtpModal(true);
  };

  const handleVerifyOtpAndProcess = (e) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      alert("Masukkan kode OTP WhatsApp yang valid.");
      return;
    }

    setShowOtpModal(false);
    setInvestmentStatus('pending');
    setInvested(true);
    setIsInvestingFlow(false);
    setOtpCode('');

    // Simulasi validasi CEO dan pengiriman rincian sukses via WhatsApp CS
    setTimeout(() => {
      setInvestmentStatus('approved');
      alert("Validasi Chief Executive Officer Berhasil Disetujui! Rincian Investasi Berhasil telah dikirimkan oleh Customer Service via WhatsApp.");
    }, 6000);
  };

  return (
    <section className={styles.investSection} style={{ position: 'relative' }}>
      <div className={styles.investCard} style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#c45e20', margin: 0 }}>Investasi Indeks CSCID</h2>
          
          {user && (
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
          )}
        </div>

        <div style={{ filter: showPasswordModal || showOtpModal ? 'blur(5px)' : 'none', transition: 'filter 0.2s ease' }}>
          <div className={styles.actionWrapper}>
            {!user ? (
              <Login />
            ) : (
              <div className={styles.userDashboard}>
                
                {investmentStatus === 'pending' && (
                  <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', padding: '20px', borderRadius: '14px', marginBottom: '24px', textAlign: 'center' }}>
                    <h4 style={{ color: '#b45309', margin: '0 0 8px 0', fontSize: '18px' }}>Status: Pending</h4>
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
                    <div className={styles.userInfo} style={{ marginBottom: '24px' }}>
                      <img src={user.picture || 'https://via.placeholder.com/40'} alt="Profile" className={styles.avatar} />
                      <span>Halo, <strong>{user.name}</strong></span>
                      <button onClick={handleLogout} className={styles.logoutBtn}>KELUAR</button>
                    </div>

                    {invested ? (
                      <div style={activeInvestBoxStyle}>
                        <h4 style={{ color: '#047857', margin: '0 0 8px 0', fontSize: '18px' }}>Portofolio Investasi Aktif</h4>
                        <p style={{ margin: 0, fontSize: '14px', color: '#065f46' }}>Alokasi Anda: <b>{invData.ton} Ton</b> (Penyedia: <b>{invData.mitra}</b>).</p>
                        <button onClick={() => setIsInvestingFlow(true)} style={tambahInvestBtnStyle}>TAMBAH ALOKASI INVESTASI</button>
                      </div>
                    ) : (
                      <>
                        <span className={styles.subtitle} style={{ display: 'block', marginBottom: '16px', fontSize: '14px', color: '#475569' }}>
                          Amankan alokasi kuota komoditas ekspor Anda sekarang berdasarkan Indeks CSCID dengan penyesuaian khusus.
                        </span>
                        <button onClick={() => setIsInvestingFlow(true)} className={styles.investBtn} style={{ width: '100%', padding: '14px', borderRadius: '12px' }}>
                          MULAI INVESTASI BARU
                        </button>
                      </>
                    )}
                  </>
                )}

                {isInvestingFlow && (
                  <div style={{ textAlign: 'left', animation: 'fadeIn 0.3s ease' }}>
                    
                    <form onSubmit={handleInitialSubmit}>
                      
                      {/* DESAIN BAGIAN TAGIHAN KOKOH & STABIL */}
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
                            <span style={{ fontSize: '28px', fontWeight: '900', color: '#78350f', letterSpacing: '-0.5px' }}>{displayTotal}</span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#92400e', fontStyle: 'italic' }}>*Terkalkulasi stabil dari Indeks CSCID</span>
                        </div>
                      </div>

                      {/* PEMILIHAN PERUSAHAAN PENYEDIA / MITRA */}
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
                                <img src={mitra.logo} alt={mitra.name} style={{ width: '38px', height: '38px', objectFit: 'contain', borderRadius: '6px', background: '#fff', padding: '2px', border: '1px solid #e2e8f0', flexShrink: '0' }} />
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>{mitra.name}</h4>
                                    <span style={{ fontSize: '10px', background: '#e0f2fe', color: '#0369a1', fontWeight: 'bold', padding: '1px 6px', borderRadius: '4px' }}>Penyedia</span>
                                  </div>
                                  <span style={{ fontSize: '11px', color: '#64748b' }}>NIB: {mitra.nib} • {mitra.bank}</span>
                                </div>
                                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: isSelected ? '5px solid #c45e20' : '2px solid #cbd5e1', background: '#fff' }}></div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* KARTU PROFIL PENANGGUNG JAWAB */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', marginTop: '12px', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                          <img 
                            src={selectedMitraData?.fotoPJ || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMitraData?.direktur || 'Direktur')}&background=c45e20&color=fff&size=120`} 
                            alt="Penanggung Jawab" 
                            style={{ width: '80px', height: '80px', aspectRatio: '1/1', borderRadius: '12px', objectFit: 'cover', border: '2px solid #fed7aa', flexShrink: 0 }} 
                          />
                          <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '4px' }}>
                              <h5 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>{selectedMitraData?.direktur || 'Arvin Maolana Hidayattulloh'}</h5>
                              <span style={{ fontSize: '10px', color: '#047857', fontWeight: 'bold', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>Terverifikasi Resmi</span>
                            </div>
                            <span style={{ display: 'inline-block', fontSize: '11px', color: '#c45e20', fontWeight: '700', marginBottom: '6px' }}>
                              {selectedMitraData?.jabatan || 'Direktur Utama'}
                            </span>
                            <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span><b>NIK:</b> {selectedMitraData?.nik || '3304031108040002'}</span>
                              <span><b>Email:</b> {selectedMitraData?.email || 'tunaskembarabadi@gmail.com'}</span>
                              <span><b>WhatsApp:</b> {selectedMitraData?.phone || '0851-6815-2525'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* INFORMASI REKENING TUJUAN, LOGO PENYEDIA & GAMBAR QRIS / TRANSFER */}
                      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px' }}>
                          <img 
                            src={selectedMitraData?.logo || 'https://via.placeholder.com/40'} 
                            alt={selectedMitraData?.name} 
                            style={{ width: '28px', height: '28px', objectFit: 'contain', background: '#fff', borderRadius: '4px', border: '1px solid #cbd5e1' }} 
                          />
                          <h5 style={{ margin: 0, color: '#334155', fontSize: '14px' }}>
                            Pembayaran / QRIS Perusahaan Penyedia Resmi
                          </h5>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <p style={{ margin: '4px 0', fontSize: '14px', color: '#475569' }}>Bank: <b>{selectedMitraData?.bank || 'Bank Central Asia'}</b></p>
                            <p style={{ margin: '4px 0', fontSize: '14px', color: '#475569' }}>No. Rekening: <b style={{ fontSize: '18px', color: '#0f172a' }}>{selectedMitraData?.noRekening || '8692824902'}</b></p>
                            <p style={{ margin: '4px 0', fontSize: '14px', color: '#475569' }}>Atas Nama: <b>{selectedMitraData?.anRekening || invData.mitra}</b></p>
                          </div>
                          
                          {/* GAMBAR QRIS / TRANSFER RESMI */}
                          <div style={{ textAlign: 'center', background: '#fff', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                            <img 
                              src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_Code_example.svg" 
                              alt="QRIS Transfer Resmi" 
                              style={{ width: '110px', height: '110px', objectFit: 'contain' }} 
                            />
                            <span style={{ display: 'block', fontSize: '10px', color: '#64748b', marginTop: '4px', fontWeight: 'bold' }}>Scan QRIS / Transfer</span>
                          </div>
                        </div>
                      </div>

                      <h3 style={{ margin: '0 0 12px 0', color: '#111827', fontSize: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
                        Konfirmasi Data Pengirim
                      </h3>
                      
                      {/* URUTAN BARU: SUMBER DAN NOMOR DULU, KEMUDIAN NAMA OTOMATIS */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        
                        {/* SUMBER (BANK / E-WALLET) */}
                        <div style={{ position: 'relative' }}>
                          <label style={labelStyle}>Sumber</label>
                          <div 
                            onClick={() => setProviderDropdownOpen(!providerDropdownOpen)}
                            style={{ ...inputStyle, background: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: invData.senderBank ? '#111827' : '#9ca3af' }}>
                              {invData.senderBank || "Pilih Bank atau E-Wallet"}
                            </span>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>▼</span>
                          </div>

                          {providerDropdownOpen && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', marginTop: '4px', padding: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                              <input 
                                type="text" 
                                placeholder="Cari bank atau e-wallet..." 
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
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = invData.senderBank === p.name ? '#ffedd5' : 'transparent'}
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

                        {/* NOMOR REKENING / NO HP BERDASARKAN SUMBER */}
                        <div>
                          <label style={labelStyle}>
                            {invData.senderBank.toLowerCase().includes('dana') || invData.senderBank.toLowerCase().includes('gopay') || invData.senderBank.toLowerCase().includes('ovo') || invData.senderBank.toLowerCase().includes('linkaja') ? 'Nomor Handphone Akun' : 'Nomor Rekening Pengirim'}
                          </label>
                          <input 
                            type="text" 
                            placeholder={invData.senderBank.toLowerCase().includes('dana') || invData.senderBank.toLowerCase().includes('gopay') || invData.senderBank.toLowerCase().includes('ovo') || invData.senderBank.toLowerCase().includes('linkaja') ? 'Masukkan nomor handphone e-wallet' : 'Masukkan nomor rekening pengirim'} 
                            required 
                            value={invData.senderAccount} 
                            onChange={(e) => setInvData({...invData, senderAccount: e.target.value})} 
                            style={inputStyle} 
                          />
                        </div>

                      </div>

                      {/* NAMA PENGIRIM OTOMATIS (TIDAK BISA DIGANTI KARENA SUDAH JELAS DARI AKUN) */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Nama Lengkap Pengirim</label>
                        <input 
                          type="text" 
                          value={automaticSenderName} 
                          disabled 
                          style={{ ...inputStyle, background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed', fontWeight: 'bold' }} 
                        />
                        <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>*Nama pengirim terisi otomatis dari akun terverifikasi dan tidak dapat diubah.</span>
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
                          <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Format yang didukung: JPG, PNG, atau PDF</span>
                          <input type="file" accept="image/*,application/pdf" hidden required onChange={(e) => setInvData({...invData, proofFile: e.target.files[0]})} />
                        </label>
                      </div>

                      <div className={invShake ? styles.shakeRed : ''} style={{ marginBottom: '16px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
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
                            <p style={{ margin: '0 0 8px 0' }}><b>1. Risiko Fluktuasi Pasar:</b> Nilai investasi komoditas dapat berubah sewaktu-waktu tergantung pada dinamika pasar global.</p>
                            <p style={{ margin: '0 0 8px 0' }}><b>2. Regulasi Ekspor:</b> Proses distribusi komoditas dipengaruhi oleh regulasi internasional serta jalur logistik.</p>
                            <p style={{ margin: '0' }}><b>3. Kebijakan Dana:</b> Dana yang telah dialokasikan ke dalam kuota komoditas tidak dapat ditarik kembali secara sepihak.</p>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="button" onClick={() => setIsInvestingFlow(false)} style={{ padding: '14px 20px', background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                          BATAL
                        </button>
                        <button type="submit" style={{ flex: 1, padding: '14px', background: '#c45e20', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(196,94,32,0.3)' }}>
                          SELESAI & LANJUTKAN KE OTP WHATSAPP
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MODAL OTP WHATSAPP */}
        {showOtpModal && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(5px)', borderRadius: '24px' }}>
            <form onSubmit={handleVerifyOtpAndProcess} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'center', maxWidth: 380, padding: 28, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
              <div style={{ width: '100%', textAlign: 'center', marginBottom: '4px' }}>
                <h4 style={{ margin: 0, color: '#111827', fontSize: '18px', fontWeight: 'bold' }}>Verifikasi OTP WhatsApp</h4>
                <p style={{ margin: '6px 0 16px 0', color: '#6b7280', fontSize: '13px' }}>Masukkan 4 digit kode OTP yang dikirimkan ke nomor WhatsApp terdaftar Anda.</p>
              </div>
              <input 
                type="text" 
                maxLength="6"
                autoFocus 
                value={otpCode} 
                onChange={(e) => setOtpCode(e.target.value)} 
                placeholder="Contoh: 1234" 
                style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: 18, textAlign: 'center', letterSpacing: '4px', outline: 'none', background: '#f9fafb', fontWeight: 'bold' }} 
              />
              <div style={{ display: 'flex', width: '100%', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowOtpModal(false)} style={{ flex: 1, padding: '12px', background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>BATAL</button>
                <button type="submit" style={{ flex: 1, padding: '12px', background: '#c45e20', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>VERIFIKASI</button>
              </div>
            </form>
          </div>
        )}

        {/* Modal Sandi Terminal Trade */}
        {showPasswordModal && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(4px)', borderRadius: '24px' }}>
            <form onSubmit={handleTradeAccessCheck} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'center', maxWidth: 360, padding: 24, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
              <div style={{ width: '100%', textAlign: 'center', marginBottom: '8px' }}>
                <h4 style={{ margin: 0, color: '#111827', fontSize: '18px', fontWeight: 'bold' }}>Sandi Terminal Trade</h4>
                <p style={{ margin: '6px 0 12px 0', color: '#6b7280', fontSize: '13px' }}>Masukkan kata sandi untuk mengakses terminal.</p>
              </div>
              <input type="password" autoFocus value={passwordInput} onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }} placeholder="Kata Sandi" autoComplete="off" style={{ flex: '1 1 220px', minWidth: 0, padding: '12px', border: `1px solid ${passwordError ? '#f23645' : '#e0e3eb'}`, borderRadius: '10px', fontSize: 14, outline: 'none', background: '#f9fafb', color: '#111', width: '100%' }} />
              {passwordError && <span style={{ width: '100%', textAlign: 'center', color: '#f23645', fontSize: 12, marginTop: '-4px' }}>Kata sandi salah.</span>}
              <div style={{ display: 'flex', width: '100%', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowPasswordModal(false)} style={{ flex: 1, padding: '12px', background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>BATAL</button>
                <button type="submit" style={{ flex: 1, padding: '12px', background: '#c45e20', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>BUKA</button>
              </div>
            </form>
          </div>
        )}

      </div>
    </section>
  );
};

const menuBtnStyle = { background: '#ffffff', border: '1px solid #e5e7eb', padding: '8px 14px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', color: '#111827', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const menuDropdownStyle = { position: 'absolute', top: '46px', right: '0', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50, minWidth: '180px', padding: '6px' };
const activeInvestBoxStyle = { padding: '20px', background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '12px', textAlign: 'center' };
const tambahInvestBtnStyle = { marginTop: '16px', padding: '12px 18px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', width: '100%' };
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', background: '#f9fafb', color: '#111827', outline: 'none' };
const qtyBtnStyle = { padding: '12px 18px', background: '#e2e8f0', border: 'none', fontSize: '18px', fontWeight: 'bold', color: '#334155', cursor: 'pointer', transition: 'background 0.2s' };
const menuItemStyle = { display: 'flex', alignItems: 'center', width: '100%', padding: '10px 12px', border: 'none', borderRadius: '8px', background: 'transparent', fontSize: '13px', fontWeight: '600', color: '#4b5563', cursor: 'pointer', textAlign: 'left' };

export default Invest;
