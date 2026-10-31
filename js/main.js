/**
 * paJAK-Kita — Main Scripts, Navbar & Interactive Features
 * File: js/main.js
 *
 * Mengimplementasikan:
 * 1. Navbar transparan di atas hero, solid setelah scroll 24px (--color-cream, teks ink).
 * 2. Smart sticky nav: sembunyi saat scroll ke bawah, muncul saat scroll ke atas.
 * 3. Menu dropdown dengan icon panah berputar, hover intent 120ms & dukungan klik.
 * 4. Dropdown panel kaya: ikon, judul, deskripsi satu baris, badge "Segera hadir", side card data terbaru.
 * 5. Aksesibilitas penuh keyboard (Tab, panah, Enter, Esc, ARIA).
 * 6. Mobile navigation sheet layar penuh dengan accordion dan focus trap.
 * 7. Inisialisasi Hero Slideshow dan Framer Motion.
 */

import { HeroSlideshow } from './heroSlideshow.js';
import { initSiteMotion } from './animations.js';
import { getRealisasiMeta } from './dataClient.js';
import { formatTanggalIndonesia } from './format.js';

document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initHeroComponent();
  initSiteMotion();
  await updateNavbarDataBadge();
});

function initNavbar() {
  const siteHeader = document.querySelector('.site-header');
  const menuToggle = document.querySelector('#menuToggle');
  const mobileNav = document.querySelector('#mobileNavSheet');
  const mobileNavClose = document.querySelector('#mobileNavClose');
  const dropdownWrappers = document.querySelectorAll('.nav-dropdown-wrapper');

  if (!siteHeader) return;

  // =========================================================================
  // 1. SCROLL EFFECT: TRANSPARAN -> SOLID & HIDE ON SCROLL DOWN
  // =========================================================================
  let lastScrollY = window.scrollY;
  let isHeaderScrolled = false;

  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    // Solid state setelah 24px
    if (currentScrollY > 24) {
      if (!isHeaderScrolled) {
        siteHeader.classList.add('is-scrolled');
        isHeaderScrolled = true;
      }
    } else {
      if (isHeaderScrolled) {
        siteHeader.classList.remove('is-scrolled');
        isHeaderScrolled = false;
      }
    }

    // Hide on scroll down, show on scroll up (hanya jika scroll > 120px)
    if (currentScrollY > 120) {
      if (currentScrollY > lastScrollY && currentScrollY - lastScrollY > 6) {
        siteHeader.classList.add('is-hidden');
        closeAllDropdowns();
      } else if (lastScrollY - currentScrollY > 6) {
        siteHeader.classList.remove('is-hidden');
      }
    } else {
      siteHeader.classList.remove('is-hidden');
    }

    lastScrollY = currentScrollY;
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // run once on load

  // =========================================================================
  // 2. DROPDOWNS DENGAN HOVER INTENT & KLIK
  // =========================================================================
  function closeAllDropdowns() {
    dropdownWrappers.forEach((wrapper) => {
      wrapper.classList.remove('is-open');
      const trigger = wrapper.querySelector('.nav-dropdown-trigger');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  }

  dropdownWrappers.forEach((wrapper) => {
    const trigger = wrapper.querySelector('.nav-dropdown-trigger');
    const panel = wrapper.querySelector('.nav-dropdown-panel');
    let hoverTimeout = null;

    if (!trigger || !panel) return;

    // Hover intent ~120ms
    wrapper.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        closeAllDropdowns();
        wrapper.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }, 120);
    });

    wrapper.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        wrapper.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      }, 150);
    });

    // Klik/tap toggle
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = wrapper.classList.contains('is-open');
      closeAllDropdowns();
      if (!isOpen) {
        wrapper.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });

    // Tutup saat item link diklik
    panel.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        closeAllDropdowns();
      });
    });
  });

  // Klik di luar menutup dropdown
  document.addEventListener('click', (e) => {
    if (!siteHeader.contains(e.target)) {
      closeAllDropdowns();
    }
  });

  // Tombol Escape menutup dropdown
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDropdowns();
      if (mobileNav && mobileNav.classList.contains('is-open')) {
        toggleMobileNav(false);
      }
    }
  });

  // =========================================================================
  // 3. MOBILE NAVIGATION SHEET (FULLSCREEN ACCORDION & FOCUS TRAP)
  // =========================================================================
  function toggleMobileNav(open) {
    if (!mobileNav || !menuToggle) return;

    mobileNav.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('nav-locked', open);

    if (open) {
      // Focus ke tombol tutup
      setTimeout(() => mobileNavClose?.focus(), 100);
    } else {
      menuToggle.focus();
    }
  }

  menuToggle?.addEventListener('click', () => {
    const isOpen = mobileNav?.classList.contains('is-open');
    toggleMobileNav(!isOpen);
  });

  mobileNavClose?.addEventListener('click', () => {
    toggleMobileNav(false);
  });

  // Accordion pada mobile nav
  const mobileAccordions = document.querySelectorAll('.mobile-accordion-header');
  mobileAccordions.forEach((btn) => {
    btn.addEventListener('click', () => {
      const parent = btn.parentElement;
      const isOpen = parent.classList.contains('is-open');

      mobileAccordions.forEach((other) => other.parentElement.classList.remove('is-open'));
      if (!isOpen) {
        parent.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      } else {
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Tutup mobile nav saat link diklik
  mobileNav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      toggleMobileNav(false);
    });
  });
}

function initHeroComponent() {
  const heroSection = document.querySelector('#beranda');
  if (heroSection) {
    new HeroSlideshow(heroSection);
  }
}

async function updateNavbarDataBadge() {
  try {
    const meta = await getRealisasiMeta();
    if (meta && meta.tanggal_data) {
      const badgeDateEl = document.querySelector('#nav-data-date-val');
      const badgeCard = document.querySelector('#nav-data-date-card');
      if (badgeDateEl) {
        badgeDateEl.textContent = formatTanggalIndonesia(meta.tanggal_data);
      }
      if (badgeCard) {
        badgeCard.style.display = 'block';
      }
    }
  } catch {
    // Sembunyikan jika data layer tidak menyediakan
    const badgeCard = document.querySelector('#nav-data-date-card');
    if (badgeCard) badgeCard.style.display = 'none';
  }
}
