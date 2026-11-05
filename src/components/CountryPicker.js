"use client";

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import reg from './Register.module.css';
import { COUNTRIES, PINNED_COUNT, getCountry } from '@/data/Countries';

// Bendera dari flagcdn (gambar), karena emoji bendera tidak tampil di Windows.
// Bila gambar gagal dimuat, tampil kode negara sebagai pengganti.
const Flag = ({ iso }) => {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className={reg.flagFallback}>{iso}</span>;
  const code = iso.toLowerCase();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={reg.flag}
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      width="22"
      height="16"
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};

const Chevron = ({ open }) => (
  <svg
    className={`${reg.chevron} ${open ? reg.chevronOpen : ''}`}
    width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

/**
 * Pemilih negara + kode telepon, daftar lengkap dengan pencarian.
 * `children` = kolom input nomor, ditaruh di sebelah kanan tombol negara.
 */
const CountryPicker = ({ value, onChange, children }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = getCountry(value);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, '');
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.iso.toLowerCase() === q ||
        c.dial.replace('+', '').startsWith(q)
    );
  }, [query]);

  const pick = (country) => {
    onChange(country);
    setOpen(false);
    setQuery('');
  };

  const toggle = () => {
    setOpen((v) => !v);
    setQuery('');
  };

  const onSearchKey = (e) => {
    if (e.key === 'Escape') {
      // Tutup daftar saja, jangan ikut menutup seluruh modal
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[0]) pick(results[0]);
    }
  };

  const showPinnedDivider = !query.trim();

  return (
    <div className={reg.waWrap}>
      <div className={reg.waRow}>
        <button
          type="button"
          className={`${reg.countryBtn} ${open ? reg.countryBtnOpen : ''}`}
          onClick={toggle}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Kode negara: ${selected.name} ${selected.dial}`}
        >
          <Flag iso={selected.iso} />
          <span className={reg.dial}>{selected.dial}</span>
          <Chevron open={open} />
        </button>
        {children}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            className={reg.countryPanel}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={reg.countryPanelInner}>
              <label className={reg.countrySearch}>
                <SearchIcon />
                <input
                  type="text"
                  autoFocus
                  placeholder="Cari negara atau kode..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onSearchKey}
                  aria-label="Cari negara"
                />
                <span className={reg.countryCount}>{results.length}</span>
              </label>

              <ul className={reg.countryList} role="listbox" aria-label="Daftar negara">
                {results.length === 0 && (
                  <li className={reg.countryEmpty}>Negara tidak ditemukan</li>
                )}
                {results.map((c, i) => {
                  const isSel = c.iso === selected.iso;
                  return (
                    <React.Fragment key={c.iso}>
                      {showPinnedDivider && i === PINNED_COUNT && (
                        <li className={reg.countryDivider} aria-hidden="true">Semua negara</li>
                      )}
                      <li role="option" aria-selected={isSel}>
                        <button
                          type="button"
                          className={`${reg.countryItem} ${isSel ? reg.countryItemSel : ''}`}
                          onClick={() => pick(c)}
                        >
                          <Flag iso={c.iso} />
                          <span className={reg.countryName}>{c.name}</span>
                          <span className={reg.countryDial}>{c.dial}</span>
                          {isSel && <span className={reg.countryTick}><CheckIcon /></span>}
                        </button>
                      </li>
                    </React.Fragment>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CountryPicker;
