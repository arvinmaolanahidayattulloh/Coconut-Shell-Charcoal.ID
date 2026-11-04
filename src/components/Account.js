"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

// [PATCH:ACCOUNT-SAFE] nilai bawaan agar useAccount() tidak pernah undefined (aman saat prerender)
const AccountContext = createContext({
  user: null,
  loginGoogle: () => {},
  loginMicrosoft: () => {},
  loginApple: () => {},
  logout: () => {},
});
// [/PATCH:ACCOUNT-SAFE]

// Menggunakan Client ID asli Anda
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "677126002730-5m6a6uge42bvk9aglki09dqkoi467tfs.apps.googleusercontent.com";

export function AccountProvider({ children }) {
  const [user, setUser] = useState(null);

  // Cek sesi login yang tersimpan di localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("csc_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {}
  }, []);

  // Login Google
  const loginGoogle = (userData) => {
    const userInfo = {
      name: userData.name || "Google User",
      email: userData.email || "",
      picture: userData.picture || "https://via.placeholder.com/40",
      provider: "google"
    };
    setUser(userInfo);
    localStorage.setItem("csc_user", JSON.stringify(userInfo));
  };

  // Login Microsoft (Simulasi)
  const loginMicrosoft = () => {
    const mockUser = {
      name: "Microsoft User",
      email: "user@outlook.com",
      picture: "https://via.placeholder.com/40",
      provider: "microsoft"
    };
    setUser(mockUser);
    localStorage.setItem("csc_user", JSON.stringify(mockUser));
  };

  // Login Apple (Simulasi)
  const loginApple = () => {
    const mockUser = {
      name: "Apple User",
      email: "user@privaterelay.appleid.com",
      picture: "https://via.placeholder.com/40",
      provider: "apple"
    };
    setUser(mockUser);
    localStorage.setItem("csc_user", JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("csc_user");
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AccountContext.Provider value={{ user, loginGoogle, loginMicrosoft, loginApple, logout }}>
        {children}
      </AccountContext.Provider>
    </GoogleOAuthProvider>
  );
}

export function useAccount() {
  return useContext(AccountContext);
}
