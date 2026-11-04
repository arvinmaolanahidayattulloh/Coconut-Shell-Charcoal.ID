"use client";
// [FILE: src/components/GradePicker.jsx]
import styles from "./Order.module.css";
import { GRADE } from "@/data/Grade";

const LABEL = { kadarAir: "Kadar Air", kadarAbu: "Kadar Abu", zatTerbang: "Zat Terbang", karbonTetap: "Karbon Tetap", nilaiKalori: "Nilai Kalori" };

// [SECTION: GRADE-PICKER] dipakai di kartu produk DAN di form order
export default function GradePicker({ value, onChange, tampilSpek = true }) {
  const g = GRADE.find((x) => x.kode === value) ?? GRADE[0];
  return (
    <div>
      <div className={styles.gradeRow}>
        {GRADE.map((x) => (
          <button key={x.kode} type="button"
            className={`${styles.gradeBtn} ${x.kode === value ? styles.gradeAktif : ""}`}
            onClick={() => onChange(x.kode)}>
            {x.nama}<small>+{String(x.persen).replace(".", ",")}%</small>
          </button>
        ))}
      </div>
      {tampilSpek && (
        <div className={styles.spek}>
          {Object.entries(g.spek).map(([k, v]) => (
            <div key={k}><span>{LABEL[k]}</span><b>{v}</b></div>
          ))}
        </div>
      )}
    </div>
  );
}
// [/SECTION: GRADE-PICKER]
