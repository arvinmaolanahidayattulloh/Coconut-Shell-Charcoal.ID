"use client";

import React, { useState } from 'react';
import { useAccount } from './Account'; // Sesuaikan dengan path context Anda
import styles from './Profile.module.css'; // Opsional jika menggunakan CSS Module tambahan

const Profile = () => {
  const { user, logout } = useAccount();

  // State Simulasi Data Pengguna (Bisa diganti dengan data dari backend/context)
  const [profileData, setProfileData] = useState({
    nickname: user?.name || "Arvin Maolana",
    username: user?.username || "arvin_cscid",
    email: user?.email || "arvinmaolanahidayattulloh@gmail.com",
    whatsapp: user?.phone || "0851-6815-2525",
    is2FAEnabled: false,
    isPasskeyEnabled: true,
  });

  // Handler untuk aksi edit
  const handleEditField = (field, currentValue) => {
    const newValue = prompt(`Masukkan ${field} baru:`, currentValue);
    if (newValue !== null && newValue.trim() !== "") {
      setProfileData({ ...profileData, [field.toLowerCase()]: newValue });
      alert(`${field} berhasil diperbarui menjadi: ${newValue}`);
    }
  };

  const handleChangePassword = () => {
    // Logika membuka modal ubah password
    alert("Tautan reset atau form ubah kata sandi akan ditampilkan di sini.");
  };

  const handleToggle2FA = () => {
    const confirmMsg = profileData.is2FAEnabled 
      ? "Matikan Autentikasi 2 Langkah (2FA)?" 
      : "Aktifkan Autentikasi 2 Langkah (2FA) via Authenticator/WhatsApp?";
    if (window.confirm(confirmMsg)) {
      setProfileData({ ...profileData, is2FAEnabled: !profileData.is2FAEnabled });
    }
  };

  const handleTogglePasskey = () => {
    const confirmMsg = profileData.isPasskeyEnabled 
      ? "Hapus Passkey dari perangkat ini?" 
      : "Daftarkan Passkey (Sidik Jari/Face ID) untuk perangkat ini?";
    if (window.confirm(confirmMsg)) {
      setProfileData({ ...profileData, isPasskeyEnabled: !profileData.isPasskeyEnabled });
    }
  };

  const handleDeleteAccount = () => {
    const confirmDelete = window.confirm("PERINGATAN: Tindakan ini akan menghapus akun Anda secara permanen beserta seluruh portofolio investasi. Lanjutkan?");
    if (confirmDelete) {
      const finalCheck = prompt("Ketik 'HAPUS' untuk mengonfirmasi penghapusan akun:");
      if (finalCheck === "HAPUS") {
        alert("Akun sedang diproses untuk dihapus. Anda akan dialihkan keluar.");
        logout();
      }
    }
  };

  const handleHelpCenter = () => {
    window.location.href = "https://wa.me/6285168152525?text=Halo%20Pusat%20Bantuan%20CSCID,%20saya%20butuh%20bantuan%20terkait%20akun%20saya.";
  };

  return (
    <section style={{ padding: '20px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Header Profil */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#c45e20', margin: 0 }}>Profil Saya</h2>
        </div>

        {/* Kartu Info Utama */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <img 
              src={user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.nickname)}&background=c45e20&color=fff&size=120`} 
              alt="Avatar" 
              style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #fed7aa' }} 
            />
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a' }}>{profileData.nickname}</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>@{profileData.username}</p>
              <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '10px', background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                Investor Terverifikasi ✓
              </span>
            </div>
          </div>
        </div>

        {/* Seksi Data Pribadi */}
        <div style={sectionTitleStyle}>Data Pribadi</div>
        <div style={cardStyle}>
          <SettingRow 
            label="Nama Panggilan (Nickname)" 
            value={profileData.nickname} 
            onClick={() => handleEditField('Nickname', profileData.nickname)} 
          />
          <Divider />
          <SettingRow 
            label="Username" 
            value={`@${profileData.username}`} 
            onClick={() => handleEditField('Username', profileData.username)} 
          />
          <Divider />
          <SettingRow 
            label="Email" 
            value={profileData.email} 
            onClick={() => handleEditField('Email', profileData.email)} 
          />
          <Divider />
          <SettingRow 
            label="No. WhatsApp" 
            value={profileData.whatsapp} 
            onClick={() => handleEditField('WhatsApp', profileData.whatsapp)} 
          />
        </div>

        {/* Seksi Keamanan */}
        <div style={sectionTitleStyle}>Keamanan Akun</div>
        <div style={cardStyle}>
          <SettingRow 
            label="Kata Sandi (Password)" 
            value="********" 
            onClick={handleChangePassword} 
            isAction 
          />
          <Divider />
          <ToggleRow 
            label="Autentikasi 2 Langkah (2FA)" 
            description="Tingkatkan keamanan saat login atau penarikan dana."
            isActive={profileData.is2FAEnabled} 
            onToggle={handleToggle2FA} 
          />
          <Divider />
          <ToggleRow 
            label="Login Passkey (Biometrik)" 
            description="Login instan dengan Sidik Jari atau Face ID."
            isActive={profileData.isPasskeyEnabled} 
            onToggle={handleTogglePasskey} 
          />
        </div>

        {/* Seksi Bantuan & Zona Bahaya */}
        <div style={sectionTitleStyle}>Lainnya</div>
        <div style={cardStyle}>
          <div 
            onClick={handleHelpCenter} 
            style={{ ...rowInteractiveStyle, color: '#0284c7', fontWeight: 'bold' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>🎧</span> Pusat Bantuan & CS
            </div>
            <span>↗</span>
          </div>
          <Divider />
          <div 
            onClick={handleDeleteAccount} 
            style={{ ...rowInteractiveStyle, color: '#dc2626', fontWeight: 'bold' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>⚠️</span> Hapus Akun Permanen
            </div>
            <span>›</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '30px', marginBottom: '20px' }}>
          <button 
            onClick={logout} 
            style={{ padding: '12px 32px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Keluar dari Akun
          </button>
          <p style={{ marginTop: '12px', fontSize: '11px', color: '#94a3b8' }}>Versi Aplikasi: 1.0.2 (CSCID)</p>
        </div>

      </div>
    </section>
  );
};

// --- Komponen Bantuan (UI Sub-Components) ---

const SettingRow = ({ label, value, onClick, isAction }) => (
  <div onClick={onClick} style={rowInteractiveStyle}>
    <div>
      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: isAction ? '#c45e20' : '#0f172a', fontWeight: isAction ? 'bold' : '500' }}>
        {value}
      </div>
    </div>
    <div style={{ color: '#94a3b8', fontSize: '18px' }}>›</div>
  </div>
);

const ToggleRow = ({ label, description, isActive, onToggle }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0' }}>
    <div style={{ flex: 1, paddingRight: '16px' }}>
      <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 'bold', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>{description}</div>
    </div>
    <div 
      onClick={onToggle} 
      style={{ 
        width: '44px', height: '24px', background: isActive ? '#10b981' : '#cbd5e1', 
        borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' 
      }}
    >
      <div style={{ 
        width: '20px', height: '20px', background: '#fff', borderRadius: '50%', 
        position: 'absolute', top: '2px', left: isActive ? '22px' : '2px', 
        transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' 
      }} />
    </div>
  </div>
);

const Divider = () => <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />;

// --- Objek Styling ---

const cardStyle = {
  background: '#ffffff',
  borderRadius: '16px',
  padding: '16px 20px',
  marginBottom: '20px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
};

const sectionTitleStyle = {
  fontSize: '13px',
  fontWeight: 'bold',
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '8px',
  marginLeft: '8px'
};

const rowInteractiveStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '14px 0',
  cursor: 'pointer',
  transition: 'opacity 0.2s'
};

export default Profile;
