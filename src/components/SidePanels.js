"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Flame, ShieldCheck, MessageSquare, Send, BookOpen, Calculator, ChevronDown, Compass, MapPin, CheckCircle, Award, Globe, ShoppingCart, HelpCircle, PhoneCall } from "lucide-react";
import styles from "./SidePanels.module.css";

const PRODUCTS_MAP = {
  shisha: { index: 5, name: "Arang Briket", heat: "7.200+ kcal/kg", duration: "3 - 5 Jam", ash: "< 2.5%" },
  bbq: { index: 2, name: "Arang Kayu", heat: "6.500+ kcal/kg", duration: "2 - 3 Jam", ash: "3 - 4%" },
  industri: { index: 11, name: "Arang Cangkang Sawit", heat: "5.800+ kcal/kg", duration: "Maksimal", ash: "< 6%" },
  filtrasi: { index: 8, name: "Arang Aktif", heat: "Pori Tinggi", duration: "N/A", ash: "< 4%" }
};

const PRODUCTS_LIST = [
  { name: "Batu Bara", price: 95, minOrder: 50 }, // USD/Ton
  { name: "Arang Batok Kelapa", price: 1050, minOrder: 15 },
  { name: "Arang Kayu", price: 780, minOrder: 15 },
  { name: "Arang Bambu", price: 920, minOrder: 5 },
  { name: "Arang Kemiri", price: 680, minOrder: 20 },
  { name: "Arang Briket", price: 1100, minOrder: 15 },
  { name: "Arang Serbuk Gergaji", price: 980, minOrder: 15 },
  { name: "Arang Sekam Padi", price: 280, minOrder: 10 },
  { name: "Arang Aktif / Karbon Aktif", price: 1400, minOrder: 5 },
  { name: "Arang Binchotan", price: 1950, minOrder: 2 },
  { name: "Arang Bonggol Jagung", price: 420, minOrder: 10 },
  { name: "Arang Cangkang Sawit", price: 650, minOrder: 25 },
  { name: "Arang Tulang", price: 850, minOrder: 5 }
];

export function LeftPanel({ section = "beranda" }) {
  const [leftTab, setLeftTab] = useState("calc");
  const [calcUsage, setCalcUsage] = useState("shisha");
  const [calcVolume, setCalcVolume] = useState(500);
  const [openTip, setOpenTip] = useState(null);

  const handleSelectProduct = (productIndex) => {
    const event = new CustomEvent("select-product", { detail: productIndex });
    window.dispatchEvent(event);
    const el = document.getElementById("produk");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleScrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const recommended = PRODUCTS_MAP[calcUsage];

  const renderContent = () => {
    switch (section) {
      case "beranda":
        return (
          <div className={styles.founderCard}>
            <div className={styles.founderImageContainer}>
              <img
                src="/founder.jpg"
                alt="Arvin Maulana - Founder &amp; CEO NeoKarbon Indonesia"
                className={styles.founderImage}
                draggable={false}
              />

              <div className={styles.founderTextOverlay}>
                <span className={styles.founderOverlayTag}>FOUNDER &amp; CEO</span>
                <h4 className={styles.founderOverlayName}>Arvin Maulana</h4>
                <p className={styles.founderOverlayQuote}>
                  "Menghadirkan briket &amp; arang kelapa premium dari Indonesia untuk pasar energi global secara berkelanjutan."
                </p>
              </div>

              <div className={styles.verticalHoverButtons}>
                <a
                  href="https://instagram.com/arvinmaulana"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.squareBtn}
                  title="Instagram"
                >
                  <svg fill="currentColor" viewBox="0 0 24 24" width="15" height="15" style={{ display: 'block' }}>
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com/in/arvinmaulana"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.squareBtn}
                  title="LinkedIn"
                >
                  <svg fill="currentColor" viewBox="0 0 24 24" width="15" height="15" style={{ display: 'block' }}>
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>

            <div className={styles.academyInfoBox}>
              <div className={styles.academyHeader}>
                <ShieldCheck size={14} className={styles.academyIcon} />
                <span className={styles.academyLabel}>Verified Alumni</span>
              </div>
              <a
                href="https://digitalindoacademy.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.academyLink}
              >
                Digital Indo Academy
              </a>
              <p className={styles.academyDesc}>
                Arvin Maulana merupakan lulusan resmi dari program inkubasi bisnis digital &amp; ekspor global.
              </p>
            </div>
          </div>
        );

      case "tentang":
        return (
          <div className={styles.sectionContainer}>
            <div className={styles.headerRow}>
              <Leaf size={16} className={styles.titleIcon} />
              <h4 className={styles.sectionTitle}>Proses &amp; Produksi</h4>
            </div>
            <p className={styles.sectionSub}>Langkah pengolahan arang kelapa &amp; biomassa ramah lingkungan kami.</p>

            <div className={styles.processTimeline}>
              <div className={styles.processStep}>
                <div className={styles.stepNum}>1</div>
                <div>
                  <h6>Karbonisasi Bersih</h6>
                  <p>Tempurung dibakar dalam ruang vakum minim asap.</p>
                </div>
              </div>
              <div className={styles.processStep}>
                <div className={styles.stepNum}>2</div>
                <div>
                  <h6>Pengayakan Halus</h6>
                  <p>Arang ditumbuk dan disaring menjadi tepung halus 120 mesh.</p>
                </div>
              </div>
              <div className={styles.processStep}>
                <div className={styles.stepNum}>3</div>
                <div>
                  <h6>Pencampuran Alami</h6>
                  <p>Dicampur perekat pati tapioka organik tanpa sulfur.</p>
                </div>
              </div>
              <div className={styles.processStep}>
                <div className={styles.stepNum}>4</div>
                <div>
                  <h6>Cetak &amp; Oven</h6>
                  <p>Dipadatkan dengan cetakan presisi lalu dioven 24 jam.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "produk":
        return (
          <div className={styles.calculatorSection}>
            <div className={styles.tabHeaders}>
              <button
                className={`${styles.tabBtn} ${leftTab === "calc" ? styles.activeTab : ""}`}
                onClick={() => setLeftTab("calc")}
              >
                <Calculator size={13} />
                Kalkulator
              </button>
              <button
                className={`${styles.tabBtn} ${leftTab === "knowledge" ? styles.activeTab : ""}`}
                onClick={() => setLeftTab("knowledge")}
              >
                <BookOpen size={13} />
                Edukasi
              </button>
            </div>

            <div className={styles.tabContentArea}>
              {leftTab === "calc" ? (
                <div className={styles.calcContainer}>
                  <h4 className={styles.sectionTitle}>Kalkulator Briket</h4>
                  <p className={styles.sectionSub}>Temukan arang terbaik sesuai skala usaha Anda.</p>

                  <div className={styles.formGroup}>
                    <label>Sektor Kebutuhan:</label>
                    <select value={calcUsage} onChange={(e) => setCalcUsage(e.target.value)} className={styles.selectInput}>
                      <option value="shisha">Shisha / Hookah Cafe</option>
                      <option value="bbq">Kuliner &amp; Restoran BBQ</option>
                      <option value="industri">Pabrik &amp; Boiler Industri</option>
                      <option value="filtrasi">Penjernihan &amp; Medis</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Kebutuhan Bulanan: <strong>{calcVolume} kg</strong></label>
                    <input
                      type="range"
                      min="50"
                      max="5000"
                      step="50"
                      value={calcVolume}
                      onChange={(e) => setCalcVolume(Number(e.target.value))}
                      className={styles.rangeInput}
                    />
                  </div>

                  <div className={styles.resultBox}>
                    <span className={styles.resultBadge}>Rekomendasi</span>
                    <h5 className={styles.recommendationName}>{recommended.name}</h5>
                    <div className={styles.recommendationSpecs}>
                      <div><span>Kalori:</span> <strong>{recommended.heat}</strong></div>
                      <div><span>Durasi:</span> <strong>{recommended.duration}</strong></div>
                      <div><span>Kadar Abu:</span> <strong>{recommended.ash}</strong></div>
                    </div>
                    <button
                      onClick={() => handleSelectProduct(recommended.index)}
                      className={styles.resultCta}
                    >
                      Buka di Katalog
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.knowledgeContainer}>
                  <h4 className={styles.sectionTitle}>Knowledge Hub</h4>
                  <p className={styles.sectionSub}>Artikel seputar bahan bakar arang.</p>

                  <div className={styles.accordionList}>
                    <div className={styles.accordionItem}>
                      <button className={styles.accordionHeader} onClick={() => setOpenTip(openTip === 0 ? null : 0)}>
                        <span>Uji Kadar Abu Briket</span>
                        <ChevronDown size={14} className={openTip === 0 ? styles.rotateIcon : ""} />
                      </button>
                      <AnimatePresence>
                        {openTip === 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className={styles.accordionContent}
                          >
                            <p>Briket kelapa premium menghasilkan abu berwarna putih abu-abu dengan kadar total di bawah 3%, tidak meninggalkan noda hitam berlebih.</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className={styles.accordionItem}>
                      <button className={styles.accordionHeader} onClick={() => setOpenTip(openTip === 1 ? null : 1)}>
                        <span>Hindari Asap Sulfur</span>
                        <ChevronDown size={14} className={openTip === 1 ? styles.rotateIcon : ""} />
                      </button>
                      <AnimatePresence>
                        {openTip === 1 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className={styles.accordionContent}
                          >
                            <p>Asap sulfur beracun merusak aroma makanan/shisha dan memicu pusing. Arang kami bebas belerang/sulfur.</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "keunggulan":
        return (
          <div className={styles.sectionContainer}>
            <div className={styles.headerRow}>
              <CheckCircle size={16} className={styles.titleIcon} />
              <h4 className={styles.sectionTitle}>Komparasi Mutu</h4>
            </div>
            <p className={styles.sectionSub}>Perbandingan spesifikasi arang premium kami vs arang kayu biasa.</p>

            <div className={styles.comparisonTable}>
              <div className={styles.compRowHeader}>
                <span>Metrik</span>
                <span>NeoKarbon</span>
                <span>Biasa</span>
              </div>
              <div className={styles.compRow}>
                <span>Kalori</span>
                <span className={styles.premiumText}>7200+</span>
                <span>5000</span>
              </div>
              <div className={styles.compRow}>
                <span>Asap</span>
                <span className={styles.premiumText}>Tidak Ada</span>
                <span>Tinggi</span>
              </div>
              <div className={styles.compRow}>
                <span>Durasi</span>
                <span className={styles.premiumText}>3-5 Jam</span>
                <span>1-1.5 J</span>
              </div>
              <div className={styles.compRow}>
                <span>Abu</span>
                <span className={styles.premiumText}>&lt; 2.5%</span>
                <span>&gt; 6%</span>
              </div>
            </div>
          </div>
        );

      case "kontak":
        return (
          <div className={styles.sectionContainer}>
            <div className={styles.headerRow}>
              <MapPin size={16} className={styles.titleIcon} />
              <h4 className={styles.sectionTitle}>Kantor &amp; Pabrik</h4>
            </div>
            <p className={styles.sectionSub}>Informasi alamat operasional dan pusat produksi briket kami.</p>

            <div className={styles.addressList}>
              <div className={styles.addressBox}>
                <h6>Kantor Pusat</h6>
                <p>Menara Karbon Lantai 12, Sudirman, Jakarta Selatan, Indonesia.</p>
              </div>
              <div className={styles.addressBox}>
                <h6>Pusat Produksi (Plant)</h6>
                <p>Jl. Raya Briket No. 88, Kaliwungu, Kendal, Jawa Tengah, Indonesia.</p>
              </div>
              <div className={styles.addressBox}>
                <h6>Surel Penjualan</h6>
                <p>sales@neokarbon.com</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`${styles.sidePanel} ${styles.leftPanel}`}>
      <div className={styles.leftInnerWrapper}>
        <div className={styles.dynamicContentWrap}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export function RightPanel({ section = "beranda" }) {
  const [messages, setMessages] = useState([
    { sender: "agent", text: "Halo! Selamat datang di NeoKarbon Indonesia. Saya Andi, Live Agent Anda." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatHistoryRef = useRef(null);

  // Sync active product from carousel (grabs index from CustomEvent)
  const [activeProductIndex, setActiveProductIndex] = useState(0);
  const [orderQty, setOrderQty] = useState(15); // Tons

  // FAQ state
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const handleProductChanged = (e) => {
      setActiveProductIndex(e.detail);
    };
    window.addEventListener("product-changed", handleProductChanged);
    return () => window.removeEventListener("product-changed", handleProductChanged);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [
          ...prev,
          { sender: "agent", text: "Ada yang bisa saya bantu mengenai info harga ekspor briket, pemesanan sampel, atau spesifikasi?" }
        ]);
      }, 1000);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTo({
        top: chatHistoryRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend = null) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    setMessages(prev => [...prev, { sender: "user", text }]);
    if (!textToSend) setChatInput("");

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let replyText = "";
      let showWaButton = false;

      const lowerText = text.toLowerCase();
      if (lowerText.includes("harga") || lowerText.includes("ekspor")) {
        replyText = "Harga FOB ekspor briket kelapa premium berkisar $950 - $1.150 USD/Ton tergantung spesifikasi abu. Anda bisa mengklik tombol di bawah untuk bernegosiasi langsung dengan Sales Manager kami via WhatsApp.";
        showWaButton = true;
      } else if (lowerText.includes("sampel") || lowerText.includes("sample")) {
        replyText = "Tentu! Kami menyediakan sampel gratis hingga 2kg. Anda hanya perlu menanggung ongkos kirim logistik internasional. Silakan hubungi WhatsApp Sales kami untuk konfirmasi alamat pengiriman.";
        showWaButton = true;
      } else {
        replyText = `Terima kasih atas pesan Anda: "${text}". Pertanyaan Anda telah kami catat. Untuk respon langsung dan penawaran resmi, silakan hubungi WhatsApp Support kami melalui tautan di bawah.`;
        showWaButton = true;
      }

      setMessages(prev => [
        ...prev,
        { sender: "agent", text: replyText, showWa: showWaButton }
      ]);
    }, 1200);
  };

  const getWhatsAppLink = (productName, qty) => {
    const text = `Halo NeoKarbon, saya tertarik memesan ${qty} Ton produk ${productName}. Bagaimana prosedur Letter of Intent (LOI) dan kontrak pembelian selanjutnya?`;
    return `https://wa.me/628123456789?text=${encodeURIComponent(text)}`;
  };

  const activeProduct = PRODUCTS_LIST[activeProductIndex];

  const renderContent = () => {
    switch (section) {
      case "beranda":
        return (
          <div className={styles.chatSection}>
            <div className={styles.chatHeader}>
              <div className={styles.agentAvatar}>
                <MessageSquare size={16} className={styles.avatarIcon} />
                <span className={styles.activeDot} />
              </div>
              <div>
                <h4 className={styles.agentName}>Andi (Live Support)</h4>
                <span className={styles.agentStatus}>NeoKarbon - Online</span>
              </div>
            </div>

            <div ref={chatHistoryRef} className={styles.chatHistory}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`${styles.chatBubble} ${msg.sender === "user" ? styles.userBubble : styles.agentBubble}`}>
                  <p>{msg.text}</p>
                  {msg.showWa && (
                    <a
                      href="https://wa.me/628123456789"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.chatWaBtn}
                    >
                      Hubungi Sales via WhatsApp
                    </a>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className={`${styles.chatBubble} ${styles.agentBubble} ${styles.typingBubble}`}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
            </div>

            <div className={styles.chatPresets}>
              <button onClick={() => handleSendMessage("Berapa harga ekspor briket?")}>Tanya Harga Ekspor</button>
              <button onClick={() => handleSendMessage("Apakah bisa meminta sampel arang?")}>Minta Sampel Gratis</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className={styles.chatForm}
            >
              <input
                type="text"
                placeholder="Ketik pesan..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className={styles.chatInput}
              />
              <button type="submit" className={styles.chatSendBtn} aria-label="Kirim">
                <Send size={14} />
              </button>
            </form>
          </div>
        );

      case "tentang":
        return (
          <div className={styles.sectionContainer}>
            <div className={styles.headerRow}>
              <Award size={16} className={styles.titleIcon} />
              <h4 className={styles.sectionTitle}>Kredibilitas Pabrik</h4>
            </div>
            <p className={styles.sectionSub}>Jaminan kualitas teruji laboratorium internasional dan kapasitas suplai stabil.</p>

            <div className={styles.credList}>
              <div className={styles.credItem}>
                <Award size={18} className={styles.credIcon} />
                <div>
                  <h6>Sucofindo Certified</h6>
                  <p>Lolos uji parameter kadar air, abu, dan kalori panas.</p>
                </div>
              </div>

              <div className={styles.credItem}>
                <Globe size={18} className={styles.credIcon} />
                <div>
                  <h6>Standar Ekspor Global</h6>
                  <p>Memenuhi syarat ekspor Bea Cukai negara Asia, Eropa &amp; Arab.</p>
                </div>
              </div>

              <div className={styles.credItem}>
                <Leaf size={18} className={styles.credIcon} />
                <div>
                  <h6>Halal &amp; Organik</h6>
                  <p>100% tepung tempurung murni berperekat pati singkong alami.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "produk":
        return (
          <div className={styles.sectionContainer}>
            <div className={styles.headerRow}>
              <ShoppingCart size={16} className={styles.titleIcon} />
              <h4 className={styles.sectionTitle}>Pemesanan Produk</h4>
            </div>
            <p className={styles.sectionSub}>Form pembelian cepat tersinkronisasi otomatis dengan katalog aktif.</p>

            <div className={styles.orderForm}>
              <div className={styles.orderField}>
                <label>Produk Terpilih:</label>
                <div className={styles.activeProdBox}>
                  <strong>{activeProduct.name}</strong>
                </div>
              </div>

              <div className={styles.orderField}>
                <label>Jumlah Pesanan (Ton): <strong>{orderQty} Ton</strong></label>
                <input
                  type="range"
                  min={activeProduct.minOrder}
                  max="100"
                  step="5"
                  value={orderQty}
                  onChange={(e) => setOrderQty(Number(e.target.value))}
                  className={styles.rangeInput}
                />
                <span className={styles.minOrderHint}>*Min. order: {activeProduct.minOrder} Ton</span>
              </div>

              <div className={styles.orderSummary}>
                <div className={styles.summaryRow}>
                  <span>FOB Estimasi Tarif:</span>
                  <strong>${activeProduct.price} / Ton</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Total Estimasi:</span>
                  <span className={styles.totalPrice}>${activeProduct.price * orderQty} USD</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Port Of Loading:</span>
                  <span>Tanjung Emas (Semarang)</span>
                </div>
              </div>

              <a
                href={getWhatsAppLink(activeProduct.name, orderQty)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.orderSubmitBtn}
              >
                Kirim PO / LOI via WhatsApp
              </a>
            </div>
          </div>
        );

      case "keunggulan":
        return (
          <div className={styles.sectionContainer}>
            <div className={styles.headerRow}>
              <HelpCircle size={16} className={styles.titleIcon} />
              <h4 className={styles.sectionTitle}>FAQ / Tanya Jawab</h4>
            </div>
            <p className={styles.sectionSub}>Jawaban singkat atas pertanyaan yang sering diajukan pelanggan.</p>

            <div className={styles.accordionList}>
              <div className={styles.accordionItem}>
                <button className={styles.accordionHeader} onClick={() => setOpenFaq(openFaq === 0 ? null : 0)}>
                  <span>Menerima Custom Packaging?</span>
                  <ChevronDown size={14} className={openFaq === 0 ? styles.rotateIcon : ""} />
                </button>
                <AnimatePresence>
                  {openFaq === 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className={styles.accordionContent}
                    >
                      <p>Ya, kami menerima maklon dengan merek/brand kemasan kardus Anda sendiri (OEM) sesuai regulasi pasar tujuan.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className={styles.accordionItem}>
                <button className={styles.accordionHeader} onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}>
                  <span>Berapa Lama Pengiriman?</span>
                  <ChevronDown size={14} className={openFaq === 1 ? styles.rotateIcon : ""} />
                </button>
                <AnimatePresence>
                  {openFaq === 1 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className={styles.accordionContent}
                    >
                      <p>Rata-rata 14-21 hari kerja sejak DP/kontrak ditandatangani, bergantung pada volume antrean oven briket.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        );

      case "kontak":
        return (
          <div className={styles.sectionContainer}>
            <div className={styles.headerRow}>
              <PhoneCall size={16} className={styles.titleIcon} />
              <h4 className={styles.sectionTitle}>Hubungi Sales Manager</h4>
            </div>
            <p className={styles.sectionSub}>Konsultasikan kebutuhan briket ekspor Anda dengan perwakilan resmi kami.</p>

            <div className={styles.salesCard}>
              <div className={styles.salesHeader}>
                <div className={styles.salesAvatar}>NK</div>
                <div>
                  <h6>Hendra Wijaya</h6>
                  <span>Export Sales Manager</span>
                </div>
              </div>
              <div className={styles.salesDetails}>
                <div><span>WhatsApp:</span> <strong>+62 812-3456-789</strong></div>
                <div><span>WeChat ID:</span> <strong>neokarbon_sales</strong></div>
                <div><span>Jam Kerja:</span> <strong>Senin-Sabtu (08:00 - 17:00 WIB)</strong></div>
              </div>
              <a
                href="https://wa.me/628123456789"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.salesWaBtn}
              >
                Hubungi Hendra Sekarang
              </a>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`${styles.sidePanel} ${styles.rightPanel}`}>
      <div className={styles.leftInnerWrapper}>
        <div className={styles.dynamicContentWrap}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
