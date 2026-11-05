"use client";
// [FILE: src/components/PetaGeser.js]
// Peta OpenStreetMap (Leaflet) dengan pin yang bisa digeser. Geser pin atau ketuk peta → onGeser(lat, lng).
// Posisi dari luar (GPS live / pencarian / koordinat) memindahkan pin dan peta.
// Leaflet dimuat dari CDN (unpkg, versi dikunci) langsung di browser, jadi tidak menambah dependency npm.
// Bila gagal dimuat (offline / diblokir), peta tampilan biasa (tanpa geser) dipakai sebagai cadangan.
import { useEffect, useRef, useState } from "react";
import rev from "./OrderRevisi.module.css";

const LEAFLET_VER = "1.9.4";
const CSS_URL = `https://unpkg.com/leaflet@${LEAFLET_VER}/dist/leaflet.css`;
const JS_URL = `https://unpkg.com/leaflet@${LEAFLET_VER}/dist/leaflet.js`;

// pin digambar dengan CSS (tanpa file gambar marker bawaan Leaflet)
const PIN = '<span style="display:block;width:26px;height:26px;border-radius:50% 50% 50% 0;background:#c45e20;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);transform:rotate(-45deg)"></span>';

let muatPromise = null;
function muatLeaflet() {
  if (typeof window === "undefined") return Promise.reject(new Error("tanpa window"));
  if (window.L?.map) return Promise.resolve(window.L);
  if (muatPromise) return muatPromise;
  muatPromise = new Promise((resolve, reject) => {
    const gagal = (pesan) => { muatPromise = null; reject(new Error(pesan)); };
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = CSS_URL;
    const js = document.createElement("script");
    js.src = JS_URL;
    js.async = true;
    let cssSiap = false, jsSiap = false;
    const cek = () => { if (cssSiap && jsSiap) { window.L?.map ? resolve(window.L) : gagal("Leaflet tidak termuat"); } };
    css.onload = () => { cssSiap = true; cek(); };
    js.onload = () => { jsSiap = true; cek(); };
    css.onerror = () => gagal("CSS Leaflet gagal dimuat");
    js.onerror = () => gagal("Leaflet gagal dimuat");
    document.head.appendChild(css);
    document.head.appendChild(js);
  });
  return muatPromise;
}

// peta tampilan biasa (tidak bisa digeser), dipakai bila Leaflet tidak bisa dimuat
function petaSrc({ lat, lng }) {
  const d = 0.004;
  const bbox = [lng - d, lat - d, lng + d, lat + d].join("%2C");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export default function PetaGeser({ lat, lng, onGeser }) {
  const elRef = useRef(null);
  const petaRef = useRef(null);
  const pinRef = useRef(null);
  const posRef = useRef({ lat, lng });
  const cbRef = useRef(onGeser);
  const [gagal, setGagal] = useState(false);

  useEffect(() => { cbRef.current = onGeser; });
  useEffect(() => { posRef.current = { lat, lng }; });

  useEffect(() => {
    let batal = false;
    muatLeaflet()
      .then((L) => {
        if (batal || !elRef.current) return;
        const { lat: la, lng: lo } = posRef.current;
        const peta = L.map(elRef.current, { center: [la, lo], zoom: 17, scrollWheelZoom: false });
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
        }).addTo(peta);
        const pin = L.marker([la, lo], {
          draggable: true,
          icon: L.divIcon({ className: "", html: PIN, iconSize: [26, 26], iconAnchor: [13, 31] }),
        }).addTo(peta);
        pin.on("dragend", () => { const p = pin.getLatLng(); cbRef.current?.(p.lat, p.lng); });
        peta.on("click", (e) => { pin.setLatLng(e.latlng); cbRef.current?.(e.latlng.lat, e.latlng.lng); });
        petaRef.current = peta;
        pinRef.current = pin;
      })
      .catch(() => { if (!batal) setGagal(true); });
    return () => {
      batal = true;
      petaRef.current?.remove();
      petaRef.current = null;
      pinRef.current = null;
    };
  }, []);

  // lokasi berubah dari luar → pindahkan pin (abaikan bila pin sudah di titik itu, mis. setelah digeser sendiri)
  useEffect(() => {
    const pin = pinRef.current, peta = petaRef.current;
    if (!pin || !peta) return;
    const now = pin.getLatLng();
    if (Math.abs(now.lat - lat) < 1e-7 && Math.abs(now.lng - lng) < 1e-7) return;
    pin.setLatLng([lat, lng]);
    peta.panTo([lat, lng]);
  }, [lat, lng]);

  if (gagal) {
    return <iframe title="Peta lokasi" src={petaSrc({ lat, lng })} loading="lazy" referrerPolicy="no-referrer"
      style={{ display: "block", width: "100%", height: 230, border: 0 }} />;
  }
  return <div ref={elRef} className={rev.petaGeserEl} role="application" aria-label="Peta lokasi. Geser pin untuk mengubah titik." />;
}
