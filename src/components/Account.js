// Account.js
import React, { createContext, useContext, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

// Membuat Context untuk Akun
const AccountContext = createContext();

export function AccountProvider({ children }) {
  const [user, setUser] = useState(null);

  // Fungsi Login Google
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Mengambil data profil Google menggunakan token yang didapat
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await res.json();
        
        // Menyimpan data user (nama, email, foto) ke state
        setUser(userInfo);
      } catch (error) {
        console.error("Gagal mengambil data user:", error);
      }
    },
    onError: (error) => console.error('Login Gagal:', error)
  });

  // Fungsi Logout
  const logout = () => {
    setUser(null);
  };

  return (
    <AccountContext.Provider value={{ user, login, logout }}>
      {children}
    </AccountContext.Provider>
  );
}

// Custom hook untuk dipanggil di komponen lain (seperti Login.js)
export const useAccount = () => useContext(AccountContext);
