"use client";

import { useState, useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AccountProvider } from "@/components/Account";
import { PriceProvider } from "@/context/PriceContext"; // <-- 1. Import PriceProvider
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Partners from "@/components/Partners";
import About from "@/components/About";
import Products from "@/components/Products";
import WhyUs from "@/components/WhyUs";
import CTA from "@/components/CTA";
import PriceChart from "@/components/PriceChart";
import Trade from "@/components/Trade";
import Invest from "@/components/Invest";
import Footer from "@/components/Footer";
import AdBanner from "@/components/AdBanner";
import { LeftPanel, RightPanel } from "@/components/SidePanels";

export default function Home() {
  const [activeSection, setActiveSection] = useState("beranda");

  useEffect(() => {
    const handleScroll = () => {
      const sectionIds = ["beranda", "tentang", "produk", "keunggulan", "kontak"];
      let currentSection = "beranda";
      let minTop = Infinity;

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          const topAbs = Math.abs(rect.top);
          if (rect.top <= 250 && rect.bottom >= 150) {
            currentSection = id;
            break;
          }
          if (topAbs < minTop) {
            minTop = topAbs;
            currentSection = id;
          }
        }
      }
      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <GoogleOAuthProvider clientId="677126002730-5m6a6uge42bvk9aglki09dqkoi467tfs.apps.googleusercontent.com">
      <AccountProvider>
        <PriceProvider> {/* <-- 2. Bungkus PriceProvider di sini agar usePrice() terbaca */}
          <Header />

          <div className="pageFlexLayout">
            <div className="mainLayoutContainer">
              <main>
                <div className="sectionWrapper">
                  <LeftPanel section="beranda" />
                  <Hero />
                  <RightPanel section="beranda" />
                </div>

                <Partners />

                <AdBanner slot="1001" format="horizontal" className="adSection" />

                <div className="sectionWrapper">
                  <LeftPanel section="tentang" />
                  <About />
                  <RightPanel section="tentang" />
                </div>

                <div className="sectionWrapper">
                  <LeftPanel section="produk" />
                  <Products />
                  <RightPanel section="produk" />
                </div>

                <AdBanner slot="1002" format="horizontal" className="adSection" />

                <div className="sectionWrapper">
                  <LeftPanel section="keunggulan" />
                  <WhyUs />
                  <RightPanel section="keunggulan" />
                </div>

                <CTA />

                <PriceChart />
                
                <Trade />
                
                <Invest />

                <AdBanner slot="1003" format="horizontal" className="adSection" />

                <div className="sectionWrapper">
                  <LeftPanel section="kontak" />
                  <Footer />
                  <RightPanel section="kontak" />
                </div>
              </main>
            </div>
          </div>
        </PriceProvider> {/* <-- 3. Penutup PriceProvider */}
      </AccountProvider>
    </GoogleOAuthProvider>
  );
}
