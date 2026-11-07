"use client";
import { useEffect, useState } from "react";
import styles from "./Index.module.css";

const SERVER_LABEL = process.env.NEXT_PUBLIC_CSCID_EXCHANGE_ENV === "real" ? "Real" : "Demo";

export default function DemoAuth({ onAuth }) {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    fetch("/api/exchange/auth", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => { if (live && data.user) { setUser(data.user); onAuth?.(data.user); } })
      .catch(() => {});
    return () => { live = false; };
  }, [onAuth]);

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const r = await fetch("/api/exchange/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: mode, username, password }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Tidak dapat memproses akun.");
      setUser(data.user); setPassword(""); onAuth?.(data.user);
    } catch (e) { setError(e.message || "Terjadi kesalahan."); }
    finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true);
    try { await fetch("/api/exchange/auth", { method: "DELETE" }); setUser(null); onAuth?.(null); }
    catch { setError("Gagal keluar. Coba lagi."); }
    finally { setBusy(false); }
  }

  return <div className={styles.demoAuth}>
    {user ? <div className={styles.demoSignedIn}><div><span className={styles.sectionLabel}>AKUN DEMO AKTIF</span><strong>{user.username}</strong><small>ID: {user.id}</small></div><button type="button" onClick={logout} disabled={busy}>Keluar</button></div> :
      <form className={styles.demoAuthForm} onSubmit={submit}>
        <div><span className={styles.sectionLabel}>AKSES CSCID EXCHANGE</span><h3>{mode === "login" ? "Masuk ke akun {SERVER_LABEL}" : "Buat akun {SERVER_LABEL}"}</h3><p>Login diperlukan untuk menggunakan saldo, portofolio, dan order pribadi.</p></div>
        <input aria-label="Username akun {SERVER_LABEL}" autoComplete="username" minLength={3} maxLength={24} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
        <input aria-label="Password akun {SERVER_LABEL}" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (minimal 8 karakter)" required />
        <button type="submit" disabled={busy}>{busy ? "Memproses..." : mode === "login" ? "Masuk {SERVER_LABEL}" : "Daftar {SERVER_LABEL}"}</button>
        <button type="button" className={styles.authModeToggle} onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}</button>
        {error && <p className={styles.authError} role="alert">{error}</p>}
      </form>
    }
  </div>;
}