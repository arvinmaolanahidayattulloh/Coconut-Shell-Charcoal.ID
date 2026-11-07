"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Partners from "@/components/Partners";
import About from "@/components/About";
import Products from "@/components/Products";
import WhyUs from "@/components/WhyUs";
import CTA from "@/components/CTA";
import PriceChart from "@/components/PriceChart";
import Footer from "@/components/Footer";
import AdBanner from "@/components/AdBanner";
import AccessPanel from "@/components/AccessPanel";
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
    <>
      <Header />

      <div className="pageFlexLayout">
        <div className="mainLayoutContainer">
          <main id="beranda">
            <div className="sectionWrapper">
              <LeftPanel section="beranda" />
              <Hero />
              <RightPanel section="beranda" />
            </div>

            <Partners />

            <AdBanner slot="1001" format="horizontal" className="adSection" />

            <div className="sectionWrapper" id="tentang">
              <LeftPanel section="tentang" />
              <About />
              <RightPanel section="tentang" />
            </div>

            <div className="sectionWrapper" id="produk">
              <LeftPanel section="produk" />
              <Products />
              <RightPanel section="produk" />
            </div>

            <AdBanner slot="1002" format="horizontal" className="adSection" />

            <div className="sectionWrapper" id="keunggulan">
              <LeftPanel section="keunggulan" />
              <WhyUs />
              <RightPanel section="keunggulan" />
            </div>

            <CTA />

            <PriceChart />

            <AccessPanel />

            <AdBanner slot="1003" format="horizontal" className="adSection" />

            <div className="sectionWrapper" id="kontak">
              <LeftPanel section="kontak" />
              <Footer />
              <RightPanel section="kontak" />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
