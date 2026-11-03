"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const AccountContext = createContext();

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

  // Login Microsoft
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

  // Login Apple
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
    <AccountContext.Provider value={{ user, loginGoogle, loginMicrosoft, loginApple, logout }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  return useContext(AccountContext);
}
