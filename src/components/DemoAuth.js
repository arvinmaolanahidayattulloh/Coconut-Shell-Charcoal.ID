"use client";
import { useEffect, useState } from "react";
import styles from "./Index.module.css";

const SERVER_LABEL = process.env.NEXT_PUBLIC_CSCID_EXCHANGE_ENV === "real" ? "Real" : "Demo";

export default function DemoAuth({ onAuth }) {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState("account");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [phoneMasked, setPhoneMasked] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [qr, setQr] = useState("");
  const [qrStatus, setQrStatus] = useState("");

  useEffect(() => {
    let live = true;
    fetch("/api/exchange/auth", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!live) return;
        if (data.user) { setUser(data.user); setStep("ready"); onAuth?.(data.user); }
        else if (data.pendingOtp) { setStep("otp"); setPhoneMasked(data.phoneMasked || "nomor terdaftar"); }
      })
      .catch(() => {});
    return () => { live = false; };
  }, [onAuth]);

  async function requestOtp() {
    const r = await fetch("/api/exchange/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "send" }) });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "OTP gagal dikirim.");
    setPhoneMasked(data.phoneMasked || phoneMasked);
    setNotice("Kode OTP sudah dikirim ke WhatsApp terdaftar.");
  }

  async function submitAccount(e) {
    e.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const body = { action: mode, username, password };
      if (mode === "register") body.phone = phone;
      const r = await fetch("/api/exchange/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Tidak dapat memproses akun.");
      if (data.otpRequired) {
        setStep("otp");
        await requestOtp();
        setPassword("");
      } else {
        throw new Error("Server tidak memulai verifikasi OTP.");
      }
    } catch (e) { setError(e.message || "Terjadi kesalahan."); }
    finally { setBusy(false); }
  }

  async function verifyOtp(e) {
    e.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const r = await fetch("/api/exchange/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify", code: otp }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "OTP tidak valid.");
      const session = await fetch("/api/exchange/auth", { cache: "no-store" }).then((x) => x.json());
      if (!session.user) throw new Error("Verifikasi berhasil, tetapi sesi akun belum aktif. Muat ulang halaman.");
      setUser(session.user); setStep("ready"); setOtp(""); onAuth?.(session.user);
    } catch (e) { setError(e.message || "Verifikasi gagal."); }
    finally { setBusy(false); }
  }

  async function resendOtp() {
    setBusy(true); setError(""); setNotice("");
    try { await requestOtp(); } catch (e) { setError(e.message || "OTP gagal dikirim."); }
    finally { setBusy(false); }
  }

  async function changePassword(e) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const r = await fetch("/api/exchange/auth", { method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"change-password",username:user.username,password:currentPassword,newPassword}) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Password tidak dapat diperbarui.");
      setUser(data.user); onAuth?.(data.user); setCurrentPassword(""); setNewPassword("");
    } catch (e) { setError(e.message || "Terjadi kesalahan."); }
    finally { setBusy(false); }
  }

  async function showQr() {
    setBusy(true); setError(""); setQr(""); setQrStatus("");
    try {
      const r = await fetch("/api/exchange/whatsapp/qr", { cache: "no-store" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "QR Pairing gagal dimuat.");
      if (data.connected) setQrStatus(data.message || "WhatsApp Server sudah terhubung.");
      else setQr(data.qr);
    } catch (e) { setError(e.message || "QR Pairing gagal dimuat."); }
    finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true);
    try { await fetch("/api/exchange/auth", { method: "DELETE" }); setUser(null); setStep("account"); setQr(""); setQrStatus(""); onAuth?.(null); }
    catch { setError("Gagal keluar. Coba lagi."); }
    finally { setBusy(false); }
  }

  return <div className={styles.demoAuth}>
    {step === "otp" ? <form className={styles.demoAuthForm} onSubmit={verifyOtp}>
      <div><span className={styles.sectionLabel}>VERIFIKASI WAJIB</span><h3>Verifikasi WhatsApp</h3><p>Masukkan kode 6 digit yang dikirim ke {phoneMasked || "nomor WhatsApp akun Anda"}. Kode berlaku 5 menit.</p></div>
      <input aria-label="Kode OTP WhatsApp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e)=>setOtp(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="6 digit OTP" required />
      <button type="submit" disabled={busy || otp.length !== 6}>{busy ? "Memverifikasi..." : "Verifikasi & Buka Akses"}</button>
      <button type="button" className={styles.authModeToggle} onClick={resendOtp} disabled={busy}>Kirim ulang OTP</button>
      {error && <p className={styles.authError} role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
    </form> : user ? <div className={styles.demoSignedIn}>
      <div><span className={styles.sectionLabel}>AKUN {SERVER_LABEL.toUpperCase()} AKTIF</span><strong>{user.username}</strong><small>Login dan OTP WhatsApp berhasil diverifikasi.</small></div>
      <button type="button" onClick={logout} disabled={busy}>Keluar</button>
      {user.mustChangePassword && <form className={styles.demoAuthForm} onSubmit={changePassword}>
        <h3>Perbarui keamanan akun</h3><p>Kata sandi awal wajib diperbarui sebelum akun dapat digunakan untuk bertransaksi.</p>
        <input aria-label="Password awal" type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} placeholder="Password awal" required />
        <input aria-label="Password baru" type="password" autoComplete="new-password" minLength={12} value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Password baru (minimal 12 karakter)" required />
        <button type="submit" disabled={busy}>{busy ? "Menyimpan..." : "Ganti password"}</button>
      </form>}
      {user.isFounder && <div style={{marginTop:18,padding:16,border:"1px solid rgba(255,255,255,.16)",borderRadius:14}}>
        <span className={styles.sectionLabel}>KHUSUS FOUNDER / CEO</span>
        <h3 style={{margin:"8px 0"}}>WhatsApp Server Pairing</h3>
        <p style={{fontSize:13,opacity:.75}}>QR ini hanya dapat dibuka oleh Founder/CEO. Pindai melalui WhatsApp pada nomor server, menu Perangkat tertaut.</p>
        <button type="button" onClick={showQr} disabled={busy}>{busy ? "Memuat..." : "Tampilkan QR Pairing"}</button>
        {qr && <div style={{marginTop:14,textAlign:"center"}}><img src={qr} alt="QR Pairing WhatsApp Server" style={{width:"min(100%,280px)",background:"#fff",padding:10,borderRadius:10}}/><p style={{fontSize:12}}>Pindai QR menggunakan WhatsApp pemilik nomor server.</p></div>}
        {qrStatus && <p role="status">{qrStatus}</p>}
      </div>}
      {error && <p className={styles.authError} role="alert">{error}</p>}
    </div> : <form className={styles.demoAuthForm} onSubmit={submitAccount}>
      <div><span className={styles.sectionLabel}>AKSES AKUN CSCID</span><h3>{mode === "login" ? `Masuk ke akun ${SERVER_LABEL}` : `Buat akun ${SERVER_LABEL}`}</h3><p>Login atau daftar, lalu verifikasi OTP WhatsApp untuk membuka akses privat.</p></div>
      <input aria-label={`Username akun ${SERVER_LABEL}`} autoComplete="username" minLength={3} maxLength={24} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
      <input aria-label={`Password akun ${SERVER_LABEL}`} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" && username.toLowerCase() === "cscid" ? 5 : 8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (minimal 8 karakter)" required />
      {mode === "register" && <input aria-label="Nomor WhatsApp" type="tel" autoComplete="tel" value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="Nomor WhatsApp (contoh 08xxxxxxxxxx)" required />}
      <button type="submit" disabled={busy}>{busy ? "Memproses..." : mode === "login" ? `Masuk ${SERVER_LABEL}` : `Daftar ${SERVER_LABEL}`}</button>
      <button type="button" className={styles.authModeToggle} onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}</button>
      {error && <p className={styles.authError} role="alert">{error}</p>}
    </form>}
  </div>;
}
