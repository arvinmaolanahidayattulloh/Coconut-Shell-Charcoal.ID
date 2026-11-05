"use client";
// [FILE: src/components/VerifikasiOrder.js]
// Muncul setelah pembeli menekan Selesai. Pembeli memilih SATU metode verifikasi:
// Password · Passkey · Authenticator · Email · WhatsApp.
//   Email / WhatsApp / Authenticator → dibuktikan SERVER (token bukti, dipakai /api/orders).
//   Password / Passkey               → dicek di perangkat, sama seperti halaman Masuk (belum ada akun di server).
// onSukses({ metode, bukti }) dipanggil bila berhasil; bukti = token server atau null.
import { useEffect, useMemo, useState } from "react";
import s from "./AuthShared.module.css";
import v from "./Verifikasi.module.css";
import { loadUsers, sameText } from "./AuthShared";
import AksiBtn from "./AksiBtn";

const METODE = [
  { id: "password", nama: "Password" },
  { id: "passkey", nama: "Passkey" },
  { id: "authenticator", nama: "Authenticator" },
  { id: "email", nama: "Email" },
  { id: "wa", nama: "WhatsApp" },
];

async function panggil(url, body) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  let j = {};
  try { j = await r.json(); } catch { /* respons bukan JSON */ }
  if (!r.ok || j.ok === false) throw new Error(j.pesan || "Permintaan gagal. Coba lagi.");
  return j;
}

export default function VerifikasiOrder({ user, onSukses, onBatal }) {
  // akun terdaftar di perangkat ini (dipakai untuk cek Password & mengisi nomor WhatsApp)
  const akun = useMemo(
    () => loadUsers().find((u) => sameText(u.email, user?.email) || sameText(u.username, user?.name)) ?? null,
    [user]
  );

  const [metode, setMetode] = useState("");
  const [sandi, setSandi] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [wa, setWa] = useState(akun?.whatsapp || "");
  const [kode, setKode] = useState("");
  const [token, setToken] = useState(""); // tantangan OTP dari server
  const [terkirim, setTerkirim] = useState(false);
  const [totp, setTotp] = useState(null); // { aktif, secret?, uri? }
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");

  const pilih = (id) => {
    setMetode(id); setKode(""); setSandi(""); setToken(""); setTerkirim(false); setGalat("");
  };

  // Authenticator: cek apakah sudah diaktifkan untuk akun ini
  useEffect(() => {
    if (metode !== "authenticator") return;
    let batal = false;
    setTotp(null);
    if (!user?.email) { setGalat("Akun ini tidak punya email, Authenticator tidak bisa dipakai. Pilih metode lain."); return; }
    panggil("/api/verifikasi/totp", { aksi: "status", email: user.email })
      .then((j) => { if (!batal) setTotp({ aktif: j.aktif }); })
      .catch((e) => { if (!batal) setGalat(e.message); });
    return () => { batal = true; };
  }, [metode, user?.email]);

  const jalankan = async (fn) => {
    setSibuk(true); setGalat("");
    try { await fn(); } catch (e) { setGalat(e?.message || "Terjadi kesalahan."); } finally { setSibuk(false); }
  };

  // --- Password ---
  const cekPassword = () => jalankan(async () => {
    if (!akun) throw new Error("Akun ini masuk lewat Google/Microsoft/Apple dan tidak punya password di perangkat ini. Pilih metode lain.");
    if (akun.password !== sandi) throw new Error("Password salah.");
    onSukses({ metode: "password", bukti: null });
  });

  // --- Passkey ---
  const cekPasskey = () => jalankan(async () => {
    if (!window.PublicKeyCredential) throw new Error("Browser/perangkat ini belum mendukung Passkey.");
    try {
      const cred = await navigator.credentials.get({
        publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), timeout: 60000, userVerification: "preferred" },
      });
      if (!cred) throw new Error();
    } catch {
      throw new Error("Passkey dibatalkan atau tidak ditemukan.");
    }
    onSukses({ metode: "passkey", bukti: null });
  });

  // --- Email / WhatsApp (OTP) ---
  const kirimOtp = (kanal) => jalankan(async () => {
    const j = await panggil("/api/verifikasi/otp", { aksi: "kirim", kanal, tujuan: kanal === "email" ? email : wa });
    setToken(j.token); setTerkirim(true); setKode("");
  });
  const cekOtp = (kanal) => jalankan(async () => {
    const j = await panggil("/api/verifikasi/otp", { aksi: "cek", kanal, tujuan: kanal === "email" ? email : wa, kode, token });
    onSukses({ metode: kanal, bukti: j.bukti });
  });

  // --- Authenticator (TOTP) ---
  const daftarTotp = () => jalankan(async () => {
    const j = await panggil("/api/verifikasi/totp", { aksi: "daftar", email: user.email });
    setTotp({ aktif: false, secret: j.secret, uri: j.uri });
  });
  const cekTotp = () => jalankan(async () => {
    const j = await panggil("/api/verifikasi/totp", { aksi: "cek", email: user.email, kode });
    onSukses({ metode: "authenticator", bukti: j.bukti });
  });

  const kolomKode = (
    <input className={s.inputField} style={{ textAlign: "center", letterSpacing: 6, fontSize: 18, fontWeight: 700 }}
      inputMode="numeric" maxLength={7} placeholder="••••••" value={kode} autoComplete="one-time-code"
      onChange={(e) => setKode(e.target.value.replace(/[^\d\s]/g, ""))} />
  );
  const kodeLengkap = kode.replace(/\s/g, "").length === 6;

  return (
    // mengetuk / mengklik di luar kotak = tutup popup (tidak saat sedang memproses)
    <div className={s.modalOverlay} role="dialog" aria-modal="true" aria-label="Verifikasi order"
      onClick={(e) => { if (e.target === e.currentTarget && !sibuk) onBatal?.(); }}>
      <div className={s.modalForm}>
        <h4 className={s.modalTitle}>Verifikasi Order</h4>
        <p className={s.modalDesc}>Pilih satu cara untuk memastikan ini benar-benar Anda. Setelah itu order disimpan dengan status Pending.</p>

        <div className={v.metode} role="tablist" aria-label="Metode verifikasi">
          {METODE.map((m) => (
            <button key={m.id} type="button" role="tab" aria-selected={metode === m.id}
              className={metode === m.id ? v.metodeAktif : ""} onClick={() => pilih(m.id)} disabled={sibuk}>
              {m.nama}
            </button>
          ))}
        </div>

        {metode === "password" && (
          <form className={v.panel} onSubmit={(e) => { e.preventDefault(); cekPassword(); }}>
            <input className={s.inputField} type="password" placeholder="Password akun Anda" value={sandi}
              onChange={(e) => setSandi(e.target.value)} autoComplete="current-password" />
            <AksiBtn label="Verifikasi" busy={sibuk} disabled={!sandi} />
          </form>
        )}

        {metode === "passkey" && (
          <div className={v.panel}>
            <p className={v.info}>Gunakan sidik jari, wajah, atau PIN perangkat Anda.</p>
            <AksiBtn type="button" label="Gunakan Passkey" busy={sibuk} onClick={cekPasskey} />
          </div>
        )}

        {metode === "authenticator" && (
          <div className={v.panel}>
            {!totp && !galat && <p className={v.info}>Memeriksa status Authenticator…</p>}

            {totp && !totp.aktif && !totp.secret && (
              <>
                <p className={v.info}>Authenticator belum diaktifkan untuk akun ini. Aktifkan sekali, lalu bisa dipakai untuk order berikutnya.</p>
                <AksiBtn type="button" label="Aktifkan Authenticator" busy={sibuk} onClick={daftarTotp} />
              </>
            )}

            {totp && !totp.aktif && totp.secret && (
              <form className={v.panel} onSubmit={(e) => { e.preventDefault(); cekTotp(); }}>
                <p className={v.info}>
                  1. Buka Google Authenticator / Authy → tambah akun → masukkan kunci ini (atau <a href={totp.uri}>buka langsung di aplikasi</a>).
                </p>
                <code className={v.rahasia}>{totp.secret}</code>
                <p className={v.info}>2. Masukkan kode 6 digit yang tampil di aplikasi.</p>
                {kolomKode}
                <AksiBtn label="Aktifkan dan verifikasi" busy={sibuk} disabled={!kodeLengkap} />
              </form>
            )}

            {totp?.aktif && (
              <form className={v.panel} onSubmit={(e) => { e.preventDefault(); cekTotp(); }}>
                <p className={v.info}>Masukkan kode 6 digit dari aplikasi Authenticator Anda.</p>
                {kolomKode}
                <AksiBtn label="Verifikasi" busy={sibuk} disabled={!kodeLengkap} />
              </form>
            )}
          </div>
        )}

        {(metode === "email" || metode === "wa") && (
          <form className={v.panel}
            onSubmit={(e) => { e.preventDefault(); (terkirim ? cekOtp : kirimOtp)(metode); }}>
            {metode === "email" ? (
              <input className={s.inputField} type="email" placeholder="Email Anda" value={email}
                onChange={(e) => { setEmail(e.target.value); setTerkirim(false); }} disabled={sibuk || terkirim} autoComplete="email" />
            ) : (
              <input className={s.inputField} inputMode="tel" placeholder="Nomor WhatsApp, mis. 0812xxxx" value={wa}
                onChange={(e) => { setWa(e.target.value); setTerkirim(false); }} disabled={sibuk || terkirim} autoComplete="tel" />
            )}
            {terkirim && (
              <>
                <p className={v.info}>Kode 6 digit dikirim ke {metode === "email" ? "email" : "WhatsApp"} Anda. Berlaku 5 menit.</p>
                {kolomKode}
              </>
            )}
            <AksiBtn label={terkirim ? "Verifikasi" : "Kirim kode"} busy={sibuk}
              disabled={terkirim ? !kodeLengkap : !(metode === "email" ? email.trim() : wa.trim())} />
            {terkirim && (
              <button type="button" className={v.linkKecil} disabled={sibuk}
                onClick={() => { setTerkirim(false); setKode(""); setToken(""); setGalat(""); }}>
                Ganti {metode === "email" ? "email" : "nomor"} / kirim ulang kode
              </button>
            )}
          </form>
        )}

        {galat && <div className={v.galat} role="alert">{galat}</div>}
      </div>
    </div>
  );
}
