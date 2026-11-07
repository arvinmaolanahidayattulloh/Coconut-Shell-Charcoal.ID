"use client";

import { useCallback, useEffect, useState } from "react";
import Invest from "@/components/Invest";
import Index from "@/components/Index";
import HargaFeed from "@/components/HargaFeed";
import DemoAuth from "@/components/DemoAuth";
import { useAccount } from "@/components/Account";

export default function PrivateAccessClient() {
  const [user, setUser] = useState(null);
  const { loginGoogle, logout } = useAccount();
  const handleAuth = useCallback((nextUser) => setUser(nextUser), []);
  useEffect(() => {
    if (user) loginGoogle({ name: user.username, username: user.username, email: `${user.username}@cscid.local` });
    else logout();
  }, [user, loginGoogle, logout]);

  return (
    <main>
      <section style={{maxWidth:760,margin:"0 auto",padding:"28px 20px 12px"}}>
        <DemoAuth onAuth={handleAuth} />
      </section>
      {user ? <>
        <Invest />
        <Index showAuth={false} initialUser={user} />
        <HargaFeed />
      </> : <section style={{maxWidth:760,margin:"0 auto",padding:"8px 20px 60px",textAlign:"center",opacity:.72}}>
        <p>Invest CSCID dan Index CSCID akan terbuka setelah login dan verifikasi OTP WhatsApp berhasil.</p>
      </section>}
    </main>
  );
}
