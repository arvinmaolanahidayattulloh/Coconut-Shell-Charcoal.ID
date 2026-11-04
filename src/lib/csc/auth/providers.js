// [AUTH:CLIENT] login Microsoft & Apple yang asli (popup resmi), diverifikasi server di /api/auth/provider.
const MS_ID = process.env.NEXT_PUBLIC_MS_CLIENT_ID;
const APPLE_ID = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
const APPLE_REDIRECT = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI;

const rand = () => {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
};

export async function verifyWithServer(payload) {
  const res = await fetch("/api/auth/provider", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "verifikasi login gagal");
  return data; // { name, email, picture }
}

// ---------- Microsoft: popup OpenID Connect (id_token), redirect ke /auth/callback ----------
export function loginMicrosoft() {
  return new Promise((resolve, reject) => {
    if (!MS_ID) {
      reject(new Error("Login Microsoft belum dikonfigurasi (NEXT_PUBLIC_MS_CLIENT_ID)."));
      return;
    }
    const state = rand();
    const nonce = rand();
    const redirect = window.location.origin + "/auth/callback";
    const url =
      "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?" +
      new URLSearchParams({
        client_id: MS_ID,
        response_type: "id_token",
        redirect_uri: redirect,
        response_mode: "fragment",
        scope: "openid profile email",
        state,
        nonce,
        prompt: "select_account",
      });

    const w = 480, h = 680;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    const popup = window.open(url, "csc-ms-login", `width=${w},height=${h},left=${left},top=${top}`);
    if (!popup) {
      reject(new Error("Popup diblokir browser. Izinkan popup lalu coba lagi."));
      return;
    }

    let done = false;
    const cleanup = () => {
      done = true;
      window.removeEventListener("message", onMessage);
      clearInterval(timer);
    };
    const onMessage = async (ev) => {
      if (ev.origin !== window.location.origin || ev.data?.type !== "csc-oauth") return;
      cleanup();
      const params = new URLSearchParams((ev.data.hash || "").replace(/^#/, ""));
      if (params.get("error")) {
        reject(new Error(params.get("error_description") || params.get("error")));
        return;
      }
      if (params.get("state") !== state) {
        reject(new Error("State login tidak cocok."));
        return;
      }
      try {
        resolve(await verifyWithServer({ provider: "Microsoft", idToken: params.get("id_token"), nonce }));
      } catch (e) {
        reject(e);
      }
    };
    window.addEventListener("message", onMessage);
    const timer = setInterval(() => {
      if (!done && popup.closed) {
        cleanup();
        reject(new Error("Login dibatalkan."));
      }
    }, 500);
  });
}

// ---------- Apple: Sign in with Apple JS (popup) ----------
let appleScript = null;
function loadApple() {
  if (window.AppleID) return Promise.resolve();
  if (appleScript) return appleScript;
  appleScript = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
    s.async = true;
    s.onload = resolve;
    s.onerror = () => { appleScript = null; reject(new Error("Gagal memuat Sign in with Apple.")); };
    document.head.appendChild(s);
  });
  return appleScript;
}

export async function loginApple() {
  if (!APPLE_ID) throw new Error("Login Apple belum dikonfigurasi (NEXT_PUBLIC_APPLE_CLIENT_ID).");
  await loadApple();
  window.AppleID.auth.init({
    clientId: APPLE_ID,
    scope: "name email",
    redirectURI: APPLE_REDIRECT || window.location.origin,
    state: rand(),
    usePopup: true,
  });
  let result;
  try {
    result = await window.AppleID.auth.signIn();
  } catch (e) {
    throw new Error(e?.error === "popup_closed_by_user" ? "Login dibatalkan." : "Login Apple gagal.");
  }
  const u = result?.user?.name; // Apple hanya mengirim nama pada login pertama
  const name = u ? [u.firstName, u.lastName].filter(Boolean).join(" ") : "";
  return verifyWithServer({ provider: "Apple", idToken: result?.authorization?.id_token, name });
}
// [/AUTH:CLIENT]
