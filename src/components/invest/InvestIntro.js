import styles from "./invest.module.css";
import { PERBEDAAN, LANGKAH, ALUR_HASIL } from "@/data/investTerms";

// Penjelasan Invest: beda dengan beli, langkah, dan alur hasil. Tanpa state, dipakai di / dan /invest.
export default function InvestIntro() {
  return (
    <section className={`wrap ${styles.section}`} aria-labelledby="invest-judul">
      <header className={styles.head}>
        <h2 id="invest-judul">Invest di stok arang batok kelapa</h2>
        <p className={styles.lead}>
          Prosesnya seperti membeli: pilih jumlah, lalu bayar. Bedanya, barang tetap di gudang kami dan Anda menerima bagi hasil dari penjualannya.
        </p>
      </header>

      <div className={styles.block}>
        <h3>Beda dengan membeli</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th></th><th>Beli</th><th className={styles.invest}>Invest</th></tr>
            </thead>
            <tbody>
              {PERBEDAAN.map((r) => (
                <tr key={r.baris}>
                  <td>{r.baris}</td>
                  <td>{r.beli}</td>
                  <td className={styles.invest}>{r.invest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.block}>
        <h3>Cara kerjanya</h3>
        <ol className={styles.steps}>
          {LANGKAH.map((l) => (
            <li key={l.judul} className={styles.step}>
              <h4>{l.judul}</h4>
              <p>{l.isi}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.block}>
        <h3>Dari hasil penjualan ke bagi hasil</h3>
        <div className={styles.flow}>
          {ALUR_HASIL.map((a) => (
            <div key={a.judul} className={styles.flowItem}>
              <h4>{a.judul}</h4>
              <p>{a.isi}</p>
              <span className={styles.flowValue}>{a.nilai}</span>
            </div>
          ))}
        </div>
        <p className={styles.note}>
          Harga jual dan persentase masih ditentukan. Bagi hasil bukan jaminan keuntungan dan bergantung pada hasil penjualan.
        </p>
      </div>
    </section>
  );
}
