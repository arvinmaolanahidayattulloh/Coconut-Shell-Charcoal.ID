"use client";

import React, { useState, useMemo } from 'react';
import { useAccount } from './Account'; 
import { usePrice } from '@/context/PriceContext'; // Mengambil harga real-time dari context
import Login from './Login';
import styles from './Invest.module.css';
import { partnersData } from './Mitra'; 

// Daftar Bank & E-Wallet Lengkap Tanpa Singkatan
const PAYMENT_PROVIDERS = [
  { name: "Bank Central Asia", type: "Bank", logo: "🏦" },
  { name: "Bank Mandiri", type: "Bank", logo: "🏦" },
  { name: "Bank Negara Indonesia", type: "Bank", logo: "🏦" },
  { name: "Bank Rakyat Indonesia", type: "Bank", logo: "🏦" },
  { name: "Bank Syariah Indonesia", type: "Bank", logo: "🏦" },
  { name: "CIMB Niaga", type: "Bank", logo: "🏦" },
  { name: "Bank Permata", type: "Bank", logo: "🏦" },
  { name: "Bank Danamon", type: "Bank", logo: "🏦" },
  { name: "Bank Tabungan Negara", type: "Bank", logo: "🏦" },
  { name: "Bank Mega", type: "Bank", logo: "🏦" },
  { name: "OCBC NISP", type: "Bank", logo: "🏦" },
  { name: "Panin Bank", type: "Bank", logo: "🏦" },
  { name: "Bank Jago", type: "Bank", logo: "🏦" },
  { name: "SeaBank Indonesia", type: "Bank", logo: "🏦" },
  { name: "Bank Neo Commerce", type: "Bank", logo: "🏦" },
  { name: "Dana", type: "E-Wallet", logo: "📱" },
  { name: "Gopay", type: "E-Wallet", logo: "📱" },
  { name: "OVO", type: "E-Wallet", logo: "📱" },
  { name: "LinkAja", type: "E-Wallet", logo: "📱" }
];

const Invest = ({ invested, setInvested, activeTab, setActiveTab }) => {
  const { user, logout } = useAccount();
  const { livePrice } = usePrice(); // Mengambil harga live chart dari context
  
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
    payment: 'bank',
    senderName: '',
    senderBank: 'Bank Central Asia',
    senderAccount: '',
    proofFile: null
  });
  
  const [invAgreed, setInvAgreed] = useState(false);
  const [invShake, setInvShake] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showContractPreview, setShowContractPreview] = useState(false);

  // State untuk Search Provider (Bank / E-Wallet)
  const [providerSearch, setProviderSearch] = useState('');
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);

  const filteredProviders = useMemo(() => {
    return PAYMENT_PROVIDERS.filter(p => p.name.toLowerCase().includes(providerSearch.toLowerCase()));
  }, [providerSearch]);

  // HARGA PER TON: Harga Realtime Chart dikurangi 10% (-10%)
  const baseLivePrice = livePrice || 1250.50; // Fallback jika livePrice belum termuat
  const USD_EXCHANGE_RATE = 15500;
  
  // Konversi harga chart ke IDR per ton, lalu kurangi 10%
  const pricePerTonIdr = (baseLivePrice * USD_EXCHANGE_RATE) * 0.90; 

  const selectedMitraData = partnersData?.find(p => p.name === invData.mitra) || partnersData?.[0];

  const handleLogout = () => {
    logout();
    setInvested(false); 
    setActiveTab('invest');
    setMenuOpen(false);
    setIsInvestingFlow(false);
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
        alert(user ? `Profil: ${user.name} (${user.email})` : "Silakan login terlebih dahulu.");
        break;
      case 'trade':
        setShowPasswordModal(true); 
        break;
      case 'portofolio':
        alert(invested ? `Portofolio: ${invData.ton} Ton Komoditas Arang.` : "Portofolio kosong.");
        break;
      case 'keluar':
        handleLogout();
        break;
      default:
        break;
    }
  };

  const handleProcessPayment = (e) => {
    e.preventDefault();
    if (!invAgreed) {
      setInvShake(true);
      setTimeout(() => setInvShake(false), 600);
      return;
    }
    if (!invData.proofFile) {
      alert("Harap upload bukti transfer pembayaran Anda.");
      return;
    }

    setInvested(true);
    setIsInvestingFlow(false);
    alert(`Konfirmasi Pembayaran Berhasil!\n\nInvestor: ${invData.senderName}\nSumber: ${invData.senderBank} (${invData.senderAccount})\nAlokasi: ${invData.ton} Ton pada ${invData.mitra}`);
  };

  const currentTotalIdr = invData.ton * pricePerTonIdr;
  const displayTotal = invData.currency === 'IDR' 
    ? `Rp ${currentTotalIdr.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`
    : `$ ${(currentTotalIdr / USD_EXCHANGE_RATE).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <section className={styles.investSection} style={{ position: 'relative' }}>
      <div className={styles.investCard}>
        
        {/* HEADER UTAMA: Judul & Menu Sejajar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#c45e20', margin: 0 }}>Investasi CSCID</h2>
          
          {user && (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setMenuOpen(!menuOpen)} style={menuBtnStyle}>Menu ☰</button>
              {menuOpen && (
                <div style={menuDropdownStyle}>
                  <button onClick={() => handleMenuClick('beranda')} style={menuItemStyle}>Beranda</button>
                  <button onClick={() => handleMenuClick('profil')} style={menuItemStyle}>Profil</button>
                  <button onClick={() => handleMenuClick('trade')} style={{ ...menuItemStyle, color: '#c45e20', fontWeight: '700' }}>MT5 Terminal Trade 🔐</button>
                  <button onClick={() => handleMenuClick('portofolio')} style={menuItemStyle}>Portofolio</button>
                  <div style={{ height: '1px', background: '#f3f4f6', margin: '4px 0' }}></div>
                  <button onClick={() => handleMenuClick('keluar')} style={{ ...menuItemStyle, color: '#dc2626' }}>Keluar</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ filter: showPasswordModal ? 'blur(5px)' : 'none', transition: 'filter 0.2s ease' }}>
          <div className={styles.actionWrapper}>
            {!user ? (
              <Login />
            ) : (
              <div className={styles.userDashboard}>
                
                {!isInvestingFlow && (
                  <>
                    <div className={styles.userInfo} style={{ marginBottom: '24px' }}>
                      <img src={user.picture || 'https://via.placeholder.com/40'} alt="Profile" className={styles.avatar} />
                      <span>Halo, <strong>{user.name}</strong></span>
                      <button onClick={handleLogout} className={styles.logoutBtn}>KELUAR</button>
                    </div>

                    {invested ? (
                      <div style={activeInvestBoxStyle}>
                        <h4 style={{ color: '#047857', margin: '0 0 8px 0', fontSize: '18px' }}>Investasi Aktif!</h4>
                        <p style={{ margin: 0, fontSize: '14px', color: '#065f46' }}>Portofolio Anda: <b>{invData.ton} Ton</b> (Mitra: <b>{invData.mitra}</b>).</p>
                        <button onClick={() => setIsInvestingFlow(true)} style={tambahInvestBtnStyle}>TAMBAH ALOKASI INVESTASI</button>
                      </div>
                    ) : (
                      <>
                        <span className={styles.subtitle} style={{ display: 'block', marginBottom: '16px', fontSize: '14px' }}>
                          Amankan alokasi kuota komoditas ekspor Anda sekarang (Harga Realtime -10%).
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
                    
                    <form onSubmit={handleProcessPayment}>
                      
                      {/* QTY & MATA UANG */}
                      <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <label style={{ ...labelStyle, marginBottom: 0 }}>Tentukan Volume Investasi (Ton)</label>
                          <div style={{ display: 'flex', background: '#e2e8f0', padding: '3px', borderRadius: '8px', gap: '2px' }}>
                            {['IDR', 'USD'].map(curr => (
                              <button 
                                key={curr} 
                                type="button" 
                                onClick={() => setInvData({...invData, currency: curr})}
                                style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', background: invData.currency === curr ? '#c45e20' : 'transparent', color: invData.currency === curr ? '#fff' : '#475569' }}
                              >
                                {curr}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '10px', background: '#fff', overflow: 'hidden', flex: 1 }}>
                            <button type="button" onClick={() => setInvData({...invData, ton: Math.max(1, invData.ton - 1)})} style={qtyBtnStyle}>-</button>
                            <input 
                              type="number" min="1" value={invData.ton} 
                              onChange={(e) => setInvData({...invData, ton: Math.max(1, parseInt(e.target.value) || 1)})}
                              style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: '800', border: 'none', background: 'transparent', outline: 'none', color: '#0f172a' }}
                            />
                            <button type="button" onClick={() => setInvData({...invData, ton: invData.ton + 1})} style={qtyBtnStyle}>+</button>
                          </div>
                          <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#475569', minWidth: '40px' }}>Ton</span>
                        </div>
                        <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '6px' }}>*Harga per Ton didasarkan pada Chart Realtime dikurangi 10% (-10%)</span>
                      </div>

                      <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #fcd34d', boxShadow: '0 4px 12px rgba(245,158,11,0.1)' }}>
                        <span style={{ display: 'block', fontSize: '12px', color: '#92400e', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Total Tagihan Bersih (-10%):</span>
                        <span style={{ fontSize: '26px', fontWeight: '900', color: '#b45309' }}>{displayTotal}</span>
                      </div>

                      {/* PILIHAN MITRA */}
                      <div style={{ marginBottom: '24px' }}>
                        <label style={labelStyle}>Pilih Mitra / Perusahaan Pelaksana (PT)</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginTop: '6px' }}>
                          {partnersData?.map((mitra) => {
                            const isSelected = invData.mitra === mitra.name;
                            return (
                              <div 
                                key={mitra.id}
                                onClick={() => setInvData({...invData, mitra: mitra.name})}
                                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', border: isSelected ? '2px solid #c45e20' : '1px solid #e2e8f0', background: isSelected ? '#fff7ed' : '#f9fafb', cursor: 'pointer', transition: 'all 0.2s' }}
                              >
                                <img src={mitra.logo} alt={mitra.name} style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '6px', background: '#fff', padding: '2px', border: '1px solid #e2e8f0' }} />
                                <div style={{ flex: 1 }}>
                                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>{mitra.name}</h4>
                                  <span style={{ fontSize: '11px', color: '#64748b' }}>NIB: {mitra.nib} • {mitra.bank}</span>
                                </div>
                                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: isSelected ? '5px solid #c45e20' : '2px solid #cbd5e1', background: '#fff' }}></div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Profil Penanggung Jawab 1:1 */}
                        <div style={{ display: 'flex', gap: '16px', background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', marginTop: '12px', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                          <img 
                            src={selectedMitraData?.fotoPJ || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMitraData?.direktur || 'Direktur')}&background=c45e20&color=fff&size=120`} 
                            alt="Penanggung Jawab" 
                            style={{ width: '80px', height: '80px', aspectRatio: '1/1', borderRadius: '12px', objectFit: 'cover', border: '2px solid #fed7aa' }} 
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <h5 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>{selectedMitraData?.direktur || 'Arvin Maolana Hidayattulloh'}</h5>
                              <span style={{ fontSize: '10px', color: '#047857', fontWeight: 'bold', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>Verified Official</span>
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

                      <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Metode Pembayaran Tujuan</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <label style={{...radioContainerStyle, border: invData.payment === 'bank' ? '2px solid #c45e20' : '1px solid #e5e7eb', background: invData.payment === 'bank' ? '#fff7ed' : '#fff'}}>
                            <input type="radio" name="pay" value="bank" checked={invData.payment === 'bank'} onChange={() => setInvData({...invData, payment: 'bank'})} style={{display: 'none'}} />
                            💳 Transfer Bank PT
                          </label>
                          <label style={{...radioContainerStyle, border: invData.payment === 'qris' ? '2px solid #c45e20' : '1px solid #e5e7eb', background: invData.payment === 'qris' ? '#fff7ed' : '#fff'}}>
                            <input type="radio" name="pay" value="qris" checked={invData.payment === 'qris'} onChange={() => setInvData({...invData, payment: 'qris'})} style={{display: 'none'}} />
                            📱 QRIS Perusahaan
                          </label>
                        </div>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                        {invData.payment === 'bank' ? (
                          <>
                            <h5 style={{ margin: '0 0 8px 0', color: '#334155', fontSize: '14px' }}>Rekening Resmi Tujuan</h5>
                            <p style={{ margin: '4px 0', fontSize: '14px', color: '#475569' }}>Bank: <b>{selectedMitraData?.bank || 'Bank Central Asia'}</b></p>
                            <p style={{ margin: '4px 0', fontSize: '14px', color: '#475569' }}>No. Rekening: <b style={{ fontSize: '18px', color: '#0f172a' }}>{selectedMitraData?.noRekening || '8692824902'}</b></p>
                            <p style={{ margin: '4px 0', fontSize: '14px', color: '#475569' }}>Atas Nama: <b>{selectedMitraData?.anRekening || invData.mitra}</b></p>
                          </>
                        ) : (
                          <div style={{ textAlign: 'center' }}>
                            <h5 style={{ margin: '0 0 12px 0', color: '#334155', fontSize: '14px' }}>Scan QRIS Resmi</h5>
                            <div style={{ width: '130px', height: '130px', background: '#cbd5e1', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '2px dashed #94a3b8' }}>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>[Mockup QRIS]</span>
                            </div>
                            <p style={{ margin: '12px 0 0 0', fontSize: '14px', color: '#475569' }}>A.n <b>{selectedMitraData?.anRekening || invData.mitra}</b></p>
                          </div>
                        )}
                      </div>

                      <h3 style={{ margin: '0 0 12px 0', color: '#111827', fontSize: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
                        Konfirmasi Data Pengirim
                      </h3>
                      
                      <div style={{ marginBottom: '14px' }}>
                        <label style={labelStyle}>Nama Lengkap (Sesuai Rekening / E-Wallet Pengirim)</label>
                        <input type="text" placeholder="Masukkan nama pemilik rekening" required value={invData.senderName} onChange={(e) => setInvData({...invData, senderName: e.target.value})} style={inputStyle} />
                      </div>
                      
                      {/* PEMILIHAN BANK / E-WALLET PENGIRIM DENGAN PENCARIAN */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ position: 'relative' }}>
                          <label style={labelStyle}>Bank / E-Wallet Pengirim</label>
                          <div 
                            onClick={() => setProviderDropdownOpen(!providerDropdownOpen)}
                            style={{ ...inputStyle, background: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{invData.senderBank}</span>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>▼</span>
                          </div>

                          {providerDropdownOpen && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', marginTop: '4px', padding: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                              <input 
                                type="text" 
                                placeholder="Cari Bank / E-Wallet..." 
                                value={providerSearch} 
                                onChange={(e) => setProviderSearch(e.target.value)}
                                autoFocus
                                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', marginBottom: '6px', outline: 'none' }}
                              />
                              {filteredProviders.length > 0 ? (
                                filteredProviders.map(p => (
                                  <div 
                                    key={p.name} 
                                    onClick={() => { setInvData({...invData, senderBank: p.name}); setProviderDropdownOpen(false); setProviderSearch(''); }}
                                    style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '6px', cursor: 'pointer', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', background: invData.senderBank === p.name ? '#ffedd5' : 'transparent', fontWeight: invData.senderBank === p.name ? 'bold' : 'normal' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = invData.senderBank === p.name ? '#ffedd5' : 'transparent'}
                                  >
                                    <span>{p.logo}</span>
                                    <span>{p.name} <small style={{ color: '#94a3b8' }}>({p.type})</small></span>
                                  </div>
                                ))
                              ) : (
                                <div style={{ padding: '8px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>Tidak ditemukan</div>
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          <label style={labelStyle}>Nomor Rekening / No. HP E-Wallet</label>
                          <input type="text" placeholder="No. Rekening / No. HP" required value={invData.senderAccount} onChange={(e) => setInvData({...invData, senderAccount: e.target.value})} style={inputStyle} />
                        </div>
                      </div>

                      <div style={{ marginBottom: '24px' }}>
                        <label style={labelStyle}>Upload Bukti Transfer</label>
                        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          <span style={{ fontSize: '14px', color: '#475569', fontWeight: '500' }}>
                            {invData.proofFile ? <b style={{ color: '#c45e20' }}>✓ {invData.proofFile.name}</b> : "Klik atau seret file bukti transfer ke sini"}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Format didukung: JPG, PNG, PDF</span>
                          <input type="file" accept="image/*,application/pdf" hidden required onChange={(e) => setInvData({...invData, proofFile: e.target.files[0]})} />
                        </label>
                      </div>

                      <div className={invShake ? styles.shakeRed : ''} style={{ marginBottom: '16px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <input type="checkbox" checked={invAgreed} onChange={(e) => setInvAgreed(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#c45e20', marginTop: '2px' }} />
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '14px', cursor: 'pointer', color: invShake ? '#dc2626' : '#111827', fontWeight: 'bold' }} onClick={() => setInvAgreed(!invAgreed)}>
                              Saya menyetujui seluruh <u>Syarat, Ketentuan, dan Risiko Investasi</u>.
                            </label>
                            <button type="button" onClick={() => setShowTerms(!showTerms)} style={{ display: 'block', background: 'none', border: 'none', color: '#c45e20', fontSize: '13px', fontWeight: '700', marginTop: '6px', cursor: 'pointer', padding: 0 }}>
                              {showTerms ? 'Sembunyikan Detail ▲' : 'Baca Detail ▼'}
                            </button>
                          </div>
                        </div>

                        {showTerms && (
                          <div style={{ marginTop: '14px', padding: '14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', color: '#4b5563', maxHeight: '150px', overflowY: 'auto', lineHeight: '1.6' }}>
                            <p style={{ margin: '0 0 8px 0' }}><b>1. Risiko Fluktuasi Pasar:</b> Nilai investasi komoditas dapat berubah sewaktu-waktu tergantung pada kondisi pasar global.</p>
                            <p style={{ margin: '0 0 8px 0' }}><b>2. Regulasi Ekspor:</b> Proses distribusi dapat dipengaruhi oleh perubahan regulasi internasional maupun kendala logistik.</p>
                            <p style={{ margin: '0' }}><b>3. Kebijakan Dana:</b> Dana yang telah dikonfirmasi dan dialokasikan ke dalam kuota komoditas tidak dapat ditarik kembali secara sepihak.</p>
                          </div>
                        )}
                      </div>

                      {/* DOKUMEN KONTRAK & INVOICE (PDF A4) */}
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
                            <p style={{ margin: 0, color: '#c2410c', fontSize: '12px' }}>Format resmi siap cetak untuk tanda tangan basah.</p>
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
                            Pada hari ini, sistem mencatat pemesanan alokasi ekspor arang batok kelapa sebesar <b>{invData.ton} Ton</b> melalui mitra pelaksana <b>{invData.mitra}</b> dengan total nilai transaksi (disesuaikan diskon promosi -10%) sebesar <b>{displayTotal}</b>.<br/><br/>
                            <b>1. Klausul Utama:</b> Pihak Investor berhak atas bagi hasil ekspor sesuai kuota yang diamankan.<br/>
                            <b>2. Rekening Resmi:</b> Seluruh dana ditransfer ke rekening resmi terdaftar atas nama {selectedMitraData?.anRekening} ({selectedMitraData?.bank}).<br/>
                            <b>3. Validasi:</b> Dokumen ini sah dan mengikat secara hukum setelah ditandatangani di atas meterai oleh Investor dan Penanggung Jawab ({selectedMitraData?.direktur}).
                            <br/><br/>
                            <i>[Area Tanda Tangan Basah & Meterai 10.000]</i>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="button" onClick={() => setIsInvestingFlow(false)} style={{ padding: '14px 20px', background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                          BATAL
                        </button>
                        <button type="submit" style={{ flex: 1, padding: '14px', background: '#c45e20', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(196,94,32,0.3)' }}>
                          SELESAI & KONFIRMASI PEMBAYARAN
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Password Terminal Trade */}
        {showPasswordModal && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(4px)', borderRadius: '24px' }}>
            <form onSubmit={handleTradeAccessCheck} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'center', maxWidth: 360, padding: 24, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
              <div style={{ width: '100%', textAlign: 'center', marginBottom: '8px' }}>
                <h4 style={{ margin: 0, color: '#111827', fontSize: '18px', fontWeight: 'bold' }}>Sandi Terminal Trade</h4>
                <p style={{ margin: '6px 0 12px 0', color: '#6b7280', fontSize: '13px' }}>Masukkan sandi untuk mengakses terminal.</p>
              </div>
              <input type="password" autoFocus value={passwordInput} onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }} placeholder="Kata Sandi" autoComplete="off" style={{ flex: '1 1 220px', minWidth: 0, padding: '12px', border: `1px solid ${passwordError ? '#f23645' : '#e0e3eb'}`, borderRadius: '10px', fontSize: 14, outline: 'none', background: '#f9fafb', color: '#111', width: '100%' }} />
              {passwordError && <span style={{ width: '100%', textAlign: 'center', color: '#f23645', fontSize: 12, marginTop: '-4px' }}>Password salah. (Hint: coconut shell charcoal)</span>}
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

// Styling Objek Inline
const menuBtnStyle = { background: '#ffffff', border: '1px solid #e5e7eb', padding: '8px 14px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', color: '#111827', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const menuDropdownStyle = { position: 'absolute', top: '46px', right: '0', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50, minWidth: '180px', padding: '6px' };
const activeInvestBoxStyle = { padding: '20px', background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '12px', textAlign: 'center' };
const tambahInvestBtnStyle = { marginTop: '16px', padding: '12px 18px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', width: '100%' };
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', background: '#f9fafb', color: '#111827', outline: 'none' };
const qtyBtnStyle = { padding: '12px 18px', background: '#e2e8f0', border: 'none', fontSize: '18px', fontWeight: 'bold', color: '#334155', cursor: 'pointer', transition: 'background 0.2s' };
const radioContainerStyle = { flex: 1, padding: '12px', textAlign: 'center', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', color: '#374151', transition: 'all 0.2s ease' };
const menuItemStyle = { display: 'flex', alignItems: 'center', width: '100%', padding: '10px 12px', border: 'none', borderRadius: '8px', background: 'transparent', fontSize: '13px', fontWeight: '600', color: '#4b5563', cursor: 'pointer', textAlign: 'left' };

export default Invest;
