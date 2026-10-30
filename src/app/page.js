"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Partners from "@/components/Partners";
import About from "@/components/About";
import Products from "@/components/Products";
import WhyUs from "@/components/WhyUs";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { LeftPanel, RightPanel } from "@/components/SidePanels";

export default function Home() {
  const [activeSection, setActiveSection] = useState("beranda");

  // Scroll spy tracking for active section (used for header navigation pills highlight)
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
    handleScroll(); // Initial run
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
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

            <div className="sectionWrapper">
              <LeftPanel section="keunggulan" />
              <WhyUs />
              <RightPanel section="keunggulan" />
            </div>

            <CTA />

            <div className="sectionWrapper">
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
