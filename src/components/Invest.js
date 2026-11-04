"use client";

import React, { useState } from 'react';

// Import sub-komponen dari folder invest
import InvestPageContent from './invest/invest.page';
import InvestProfileContent from './invest/invest.profile';

export default function Invest() {
  // State untuk mengontrol halaman mana yang sedang aktif
  const [activeTab, setActiveTab] = useState('invest');
  
  // State global untuk status investasi
  const [invested, setInvested] = useState(false);

  // Fungsi untuk menangani tombol "Buka di Apps"
  const handleOpenApp = () => {
    // Coba arahkan ke Custom Scheme aplikasi (misal: cscid://invest)
    const appSchema = "cscid://invest";
    const webFallbackUrl = "https://invest.coconutshellcharcoal.id";

    // Catat waktu saat mencoba membuka aplikasi
    const startTimestamp = Date.now();

    // Panggil skema aplikasi
    window.location.href = appSchema;

    // Jika dalam waktu 1.5 detik pengguna masih di halaman ini (artinya aplikasi belum terinstal),
    // alihkan secara otomatis ke subdomain web.
    setTimeout(() => {
      const elapsed = Date.now() - startTimestamp;
      if (elapsed < 2000 && document.hasFocus()) {
        window.location.href = webFallbackUrl;
      }
    }, 1500);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '60px' }}>
      
      {/* 🚀 MENU PALING ATAS: BUKA DI APPS / SUBDOMAIN */}
      <div style={appBannerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>📱</span>
          <div>
            <span style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>
              Gunakan Aplikasi CSCID
            </span>
            <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
              Lebih cepat & stabil di aplikasi resmi
            </span>
          </div>
        </div>
        <button onClick={handleOpenApp} style={openAppBtnStyle}>
          Buka di Apps
        </button>
      </div>

      {/* AREA KONTEN DINAMIS */}
      <main style={{ marginTop: '10px' }}>
        {activeTab === 'invest' && (
          <InvestPageContent 
            invested={invested} 
            setInvested={setInvested} 
            setActiveTab={setActiveTab} 
          />
        )}

        {activeTab === 'profil' && (
          <InvestProfileContent 
            setActiveTab={setActiveTab} 
          />
        )}
      </main>

      {/* NAVIGASI BAWAH (BOTTOM NAVIGATION) */}
      <div style={bottomNavStyle}>
        <button 
          onClick={() => setActiveTab('invest')} 
          style={{ ...navBtnStyle, color: activeTab === 'invest' ? '#c45e20' : '#64748b' }}
        >
          <span style={{ fontSize: '20px', marginBottom: '4px' }}>🏠</span>
          Beranda
        </button>
        <button 
          onClick={() => setActiveTab('profil')} 
          style={{ ...navBtnStyle, color: activeTab === 'profil' ? '#c45e20' : '#64748b' }}
        >
          <span style={{ fontSize: '20px', marginBottom: '4px' }}>👤</span>
          Profil
        </button>
      </div>

    </div>
  );
}

// --- Styling Komponen ---

const appBannerStyle = {
  background: '#ffffff',
  borderBottom: '1px solid #e2e8f0',
  padding: '10px 16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  position: 'sticky',
  top: 0,
  zIndex: 101,
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
};

const openAppBtnStyle = {
  background: '#c45e20',
  color: '#ffffff',
  border: 'none',
  padding: '8px 14px',
  borderRadius: '8px',
  fontSize: '12px',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 2px 6px rgba(196,94,32,0.3)'
};

const bottomNavStyle = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  background: '#ffffff',
  borderTop: '1px solid #e2e8f0',
  display: 'flex',
  justifyContent: 'space-around',
  padding: '10px 0',
  boxShadow: '0 -4px 10px rgba(0,0,0,0.05)',
  zIndex: 100
};

const navBtnStyle = {
  background: 'transparent',
  border: 'none',
  fontSize: '12px',
  fontWeight: 'bold',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flex: 1
};
