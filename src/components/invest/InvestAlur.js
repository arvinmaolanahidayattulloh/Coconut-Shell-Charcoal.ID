import styles from "./invest.module.css";
import { PERBEDAAN, LANGKAH, ALUR_HASIL } from "@/data/investTerms";

// Isi penjelasan di dalam panel Invest CSCID: alur langkah, alur bagi hasil, dan perbandingan dengan membeli.
// Tanpa state. Judul panel dan pembungkusnya ada di Invest.js.
export default function InvestAlur() {
  return (
    <>
      <div className={styles.bagian}>
        <h3 className={styles.sub}>Alur Invest</h3>
        <ol className={styles.langkah}>
          {LANGKAH.map((l) => (
            <li key={l.judul} className={styles.langkahItem}>
              <h4>{l.judul}</h4>
              <p>{l.isi}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.bagian}>
        <h3 className={styles.sub}>Dari hasil penjualan ke bagi hasil</h3>
        <ol className={styles.alur}>
          {ALUR_HASIL.map((a) => (
            <li key={a.judul} className={styles.alurItem}>
              <h4>{a.judul}</h4>
              <p>{a.isi}</p>
              <span className={styles.chip}>{a.nilai}</span>
            </li>
          ))}
        </ol>
        <p className={styles.catatan}>
          Harga jual dan persentase masih ditentukan. Bagi hasil bukan jaminan keuntungan dan bergantung pada hasil penjualan.
        </p>
      </div>

      <details className={`${styles.bagian} ${styles.banding}`} open>
        <summary className={styles.bandingJudul}>Beda dengan membeli</summary>
        <div className={styles.tabelWrap}>
          <table className={styles.tabel}>
            <thead>
              <tr><th scope="col"><span className={styles.srOnly}>Aspek</span></th><th scope="col">Beli</th><th scope="col" className={styles.kolomInvest}>Invest</th></tr>
            </thead>
            <tbody>
              {PERBEDAAN.map((r) => (
                <tr key={r.baris}>
                  <th scope="row">{r.baris}</th>
                  <td>{r.beli}</td>
                  <td className={styles.kolomInvest}>{r.invest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
