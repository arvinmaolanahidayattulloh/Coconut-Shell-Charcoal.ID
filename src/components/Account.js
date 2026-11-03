"use client";

import React, { createContext, useContext, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

const AccountContext = createContext();

export function AccountProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await res.json();
        setUser(userInfo);
      } catch (error) {
        console.error("Gagal mengambil data user:", error);
      }
    },
    onError: (error) => console.error('Login Gagal:', error)
  });

  const logout = () => {
    setUser(null);
  };

  return (
    <AccountContext.Provider value={{ user, login, logout }}>
      {children}
    </AccountContext.Provider>
  );
}

export const useAccount = () => {
  const context = useContext(AccountContext);
  // Pengaman jika context belum siap saat loading
  if (context === undefined) {
    return { user: null, login: () => {}, logout: () => {} }; 
  }
  return context;
};
