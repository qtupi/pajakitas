"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";

interface NavbarProps {
  onNavigate?: (id: string) => void;
}

const navItems = [
  { label: "Aliran Pajak", href: "#dashboard-penerimaan" },
  { label: "Transparansi Anggaran", href: "#dashboard-belanja" },
  { label: "Verifikasi Proyek", href: "#verifikasi-proyek" },
  { label: "Peta Daerah", href: "#peta-daerah" },
  { label: "Kamus Pajak", href: "#kamus-pajak" },
  { label: "Buat Kartu", href: "#pembuat-kartu" },
];

export const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const targetId = href.replace("#", "");
    if (onNavigate) {
      onNavigate(targetId);
    } else {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-md bg-black/35 border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-2.5 md:py-3 flex items-center justify-between">
        {/* Brand Logo */}
        <a
          href="#hero-section"
          className="flex items-center gap-1 text-white tracking-tight font-normal text-base md:text-lg select-none group"
        >
          <span>pa</span>
          <span className="font-extrabold tracking-normal">JAK</span>
          <span>-Kita</span>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 ml-0.5 group-hover:scale-125 transition-transform" />
        </a>

        {/* Desktop Nav Links - Centered vertically & text-xs */}
        <nav className="hidden md:flex items-center gap-7">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="text-xs tracking-wide font-medium text-white/80 hover:text-white transition-colors leading-none"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right Action: Pill Outline Button */}
        <div className="hidden md:flex items-center">
          <motion.a
            href="#dashboard-penerimaan"
            onClick={(e) => handleNavClick(e, "#dashboard-penerimaan")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/[0.08] backdrop-blur-sm px-4 py-1.5 text-xs font-medium text-white hover:border-white hover:bg-white/15 transition-all leading-none shadow-sm"
          >
            <span>Periksa Daerahmu</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.a>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white/90 hover:text-white p-1 focus:outline-none"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden border-t border-white/10 bg-black/90 backdrop-blur-xl px-6 py-4 flex flex-col gap-3.5"
          >
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="text-xs tracking-wide font-medium text-white/80 hover:text-white py-1 transition-colors"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#dashboard-penerimaan"
              onClick={(e) => handleNavClick(e, "#dashboard-penerimaan")}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/20 transition-all text-center"
            >
              <span>Periksa Daerahmu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
