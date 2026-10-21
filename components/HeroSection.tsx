"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Search, ShieldCheck } from "lucide-react";

interface HeroSectionProps {
  onSearchSelect?: (item: { label: string; value: string; type: string }) => void;
}

const headlineLines = [
  "Lihat dan verifikasi",
  "ke mana pajak daerahmu",
  "mengalir."
];

const quickSearchItems = [
  { label: "Jakarta Selatan (Kontribusi Terbesar Rp 16,77 T)", value: "Jakarta Selatan", type: "wilayah" },
  { label: "Jakarta Pusat (Komersial & Wisata Rp 14,67 T)", value: "Jakarta Pusat", type: "wilayah" },
  { label: "Dinas Perhubungan (Subsidi PSO Tiket MRT & Transjakarta)", value: "DISHUB", type: "opd" },
  { label: "Dinas Pendidikan (Program KJP Plus Rp 16,98 T)", value: "DISDIK", type: "opd" },
  { label: "PBB-P2 (Pajak Bumi dan Bangunan)", value: "PBB-P2", type: "jenis" },
  { label: "PKB (Pajak Kendaraan Bermotor)", value: "PKB", type: "jenis" }
];

export const HeroSection: React.FC<HeroSectionProps> = ({ onSearchSelect }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const filteredItems = quickSearchItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section
      id="hero-section"
      className="relative w-full h-screen h-[100dvh] overflow-hidden flex flex-col justify-between bg-[#0E1626] border-b border-white/10 select-none pt-14 md:pt-16"
    >
      {/* 1. High-Resolution Architectural Infrastructure Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/hero_mrt.jpg"
          alt="Infrastruktur Transportasi Publik Jakarta"
          className="w-full h-full object-cover object-bottom"
        />
        {/* Subtle multi-stop gradient for readable contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A162C]/80 via-[#0E1B36]/50 to-[#0A1324]/85 pointer-events-none" />
      </div>

      {/* 2. Interactive Animated Dot Grid Pattern */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 z-[1] bg-[radial-gradient(#ffffff26_1.2px,transparent_1.2px)] [background-size:24px_24px] pointer-events-none"
      />

      {/* Architectural Text Badge on Building Facade */}
      <div className="hidden lg:block absolute right-12 top-[46%] z-10 max-w-[210px] text-right pointer-events-none">
        <motion.p
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xs font-semibold leading-relaxed text-white/85 drop-shadow-md"
        >
          Transportasi Publik untuk Kota yang Lebih Baik
        </motion.p>
        <div className="w-10 h-[1.5px] bg-white/60 ml-auto mt-2" />
      </div>

      {/* 3. Hero Main Content (Centered vertically & balanced) */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 flex-1 flex flex-col justify-center my-auto">
        {/* Top Tag / Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 self-start text-xs uppercase tracking-wider px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/90 mb-4 md:mb-5 shadow-sm"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
          <span>Platform Civic Tech Independen • WIA MIA 2026</span>
        </motion.div>

        {/* Staggered Split Text Reveal on Headline */}
        <div className="mb-4 md:mb-5">
          {headlineLines.map((line, index) => (
            <div key={index} className="overflow-hidden">
              <motion.h1
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.65,
                  delay: 0.15 + index * 0.12,
                  ease: [0.16, 1, 0.3, 1]
                }}
                className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.08] max-w-3xl"
              >
                {line}
              </motion.h1>
            </div>
          ))}
        </div>

        {/* Sub-headline description */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="text-xs sm:text-sm md:text-base text-white/80 max-w-xl font-normal leading-relaxed mb-6 md:mb-8"
        >
          Pusat transparansi publik mandiri. Pantau alokasi, progres pembangunan kota,
          dan pastikan setiap kontribusi tercatat nyata.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.55 }}
          className="flex flex-wrap items-center gap-3.5"
        >
          <motion.a
            href="#dashboard-penerimaan"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs md:text-sm font-semibold bg-white text-zinc-950 hover:bg-zinc-100 transition-colors shadow-lg"
          >
            <span>Mulai Verifikasi</span>
            <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </motion.a>

          <motion.a
            href="#pembuat-kartu"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs md:text-sm font-medium border border-white/20 bg-white/[0.06] backdrop-blur-sm text-white hover:border-white hover:bg-white/15 transition-all"
          >
            <span>Buat Kartu Insight Warga</span>
          </motion.a>
        </motion.div>
      </div>

      {/* 4. Bottom Hero Bar (Search Capsule & Key Metrics Aligned) */}
      <div className="relative z-20 w-full max-w-7xl mx-auto pb-5 md:pb-6 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Capsule Bar with Frosted Glass & Autocomplete Dropdown */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="relative w-full md:max-w-md"
        >
          <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md border border-white/15 text-white rounded-full px-4 py-2 transition-all focus-within:border-white/40 focus-within:bg-black/60 shadow-lg">
            <Search className="w-4 h-4 text-white/60 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              placeholder="Cari alokasi pajak di kotamu..."
              className="w-full bg-transparent border-none outline-none text-xs md:text-sm text-white placeholder-white/50"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {isFocused && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-full mb-2 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border border-white/15 rounded-xl p-1.5 shadow-2xl z-30 max-h-56 overflow-y-auto"
            >
              {filteredItems.length > 0 ? (
                filteredItems.map((item, idx) => (
                  <div
                    key={idx}
                    onMouseDown={() => {
                      if (onSearchSelect) onSearchSelect(item);
                      setSearchQuery("");
                      setIsFocused(false);
                      const el = document.getElementById(
                        item.type === "opd" ? "dashboard-belanja" : "dashboard-penerimaan"
                      );
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-200 hover:bg-white/10 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] text-zinc-400">Lihat Data →</span>
                  </div>
                ))
              ) : (
                <div className="p-2.5 text-xs text-zinc-400 text-center">
                  Tidak ada hasil ditemukan
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Key Stats Metrics (Flat Architectural Lines) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex items-center gap-6 sm:gap-8 self-center md:self-auto"
        >
          <div className="pl-3.5 border-l border-white/20">
            <div className="text-base md:text-lg font-bold text-white tracking-tight leading-none">
              100%
            </div>
            <div className="text-[11px] text-white/60 mt-1">Data Terbuka</div>
          </div>

          <div className="pl-3.5 border-l border-white/20">
            <div className="text-base md:text-lg font-bold text-white tracking-tight leading-none">
              38 Provinsi
            </div>
            <div className="text-[11px] text-white/60 mt-1">Cakupan Daerah</div>
          </div>

          <div className="pl-3.5 border-l border-white/20">
            <div className="text-base md:text-lg font-bold text-white tracking-tight leading-none">
              Real-time
            </div>
            <div className="text-[11px] text-white/60 mt-1">Pembaruan Dana</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
