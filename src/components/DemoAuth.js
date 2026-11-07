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
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

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

  async function changePassword(e) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const r = await fetch("/api/exchange/auth", {
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:"change-password",username:user.username,password:currentPassword,newPassword})
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Password tidak dapat diperbarui.");
      setUser(data.user); onAuth?.(data.user);
      setCurrentPassword(""); setNewPassword("");
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
    {user ? <div className={styles.demoSignedIn}>
      <div><span className={styles.sectionLabel}>AKUN {SERVER_LABEL.toUpperCase()} AKTIF</span><strong>{user.username}</strong><small>Akun terhubung ke server perdagangan.</small></div>
      <button type="button" onClick={logout} disabled={busy}>Keluar</button>
      {user.mustChangePassword && <form className={styles.demoAuthForm} onSubmit={changePassword}>
        <h3>Perbarui keamanan akun</h3><p>Kata sandi awal wajib diperbarui sebelum akun dapat digunakan untuk bertransaksi.</p>
        <input aria-label="Password awal" type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} placeholder="Password awal" required />
        <input aria-label="Password baru" type="password" autoComplete="new-password" minLength={12} value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Password baru (minimal 12 karakter)" required />
        <button type="submit" disabled={busy}>{busy ? "Menyimpan..." : "Ganti password"}</button>
      </form>}
      {error && <p role="alert">{error}</p>}
    </div> :
      <form className={styles.demoAuthForm} onSubmit={submit}>
        <div><span className={styles.sectionLabel}>AKSES AKUN CSCID</span><h3>{mode === "login" ? `Masuk ke akun ${SERVER_LABEL}` : `Buat akun ${SERVER_LABEL}`}</h3><p>Masuk untuk mengakses saldo, kepemilikan saham, dan fasilitas perdagangan akun.</p></div>
        <input aria-label={`Username akun ${SERVER_LABEL}`} autoComplete="username" minLength={3} maxLength={24} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
        <input aria-label={`Password akun ${SERVER_LABEL}`} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" && username.toLowerCase() === "cscid" ? 5 : 8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (minimal 8 karakter)" required />
        <button type="submit" disabled={busy}>{busy ? "Memproses..." : mode === "login" ? `Masuk ${SERVER_LABEL}` : `Daftar ${SERVER_LABEL}`}</button>
        <button type="button" className={styles.authModeToggle} onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}</button>
        {error && <p className={styles.authError} role="alert">{error}</p>}
      </form>
    }
  </div>;
}