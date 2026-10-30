/**
 * paJAK-Kita — Main Scripts & Modern Interactions
 * Refactored for:
 * 1. Compact Navbar & Chevron Dropdown Menus (Velt style)
 * 2. Accessible Mobile Navigation with Animated Hamburger
 * 3. Header Scroll Shadow Enhancement
 * 4. Staggered Rhythm Initializer & Smooth Anchor Navigation
 */

document.addEventListener("DOMContentLoaded", () => {
  const siteHeader = document.querySelector(".site-header");
  const menuToggle = document.querySelector("#menuToggle");
  const mainNav = document.querySelector("#mainNav");
  const dropdowns = document.querySelectorAll(".nav-dropdown");

  // =========================================================================
  // 1. MOBILE MENU TOGGLE
  // =========================================================================
  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("open");
      menuToggle.classList.toggle("is-active", isOpen);
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Tutup menu navigasi" : "Buka menu navigasi"
      );
    });
  }

  // =========================================================================
  // 2. CHEVRON DROPDOWN MENUS (Penerimaan Pajak & Belanja APBD)
  // =========================================================================
  dropdowns.forEach((dropdown) => {
    const trigger = dropdown.querySelector(".nav-dropdown-btn");
    const menu = dropdown.querySelector(".dropdown-menu");

    if (!trigger || !menu) return;

    // Toggle dropdown on button click (mobile touch & desktop click)
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isCurrentlyOpen = dropdown.classList.contains("is-open");

      // Close other open dropdowns
      dropdowns.forEach((other) => {
        if (other !== dropdown) {
          other.classList.remove("is-open");
          const otherTrigger = other.querySelector(".nav-dropdown-btn");
          if (otherTrigger) {
            otherTrigger.setAttribute("aria-expanded", "false");
          }
        }
      });

      dropdown.classList.toggle("is-open", !isCurrentlyOpen);
      trigger.setAttribute("aria-expanded", String(!isCurrentlyOpen));
    });

    // Close when a link inside dropdown is clicked
    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        dropdown.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");

        // Close mobile nav if open
        if (mainNav && mainNav.classList.contains("open")) {
          mainNav.classList.remove("open");
          if (menuToggle) {
            menuToggle.classList.remove("is-active");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Buka menu navigasi");
          }
        }
      });
    });
  });

  // Close dropdowns and mobile menu when clicking outside
  document.addEventListener("click", (e) => {
    dropdowns.forEach((dropdown) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove("is-open");
        const trigger = dropdown.querySelector(".nav-dropdown-btn");
        if (trigger) trigger.setAttribute("aria-expanded", "false");
      }
    });

    if (
      mainNav &&
      menuToggle &&
      !mainNav.contains(e.target) &&
      !menuToggle.contains(e.target) &&
      mainNav.classList.contains("open")
    ) {
      mainNav.classList.remove("open");
      menuToggle.classList.remove("is-active");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Buka menu navigasi");
    }
  });

  // Keyboard accessibility: Escape key closes all dropdowns and mobile menu
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      dropdowns.forEach((dropdown) => {
        dropdown.classList.remove("is-open");
        const trigger = dropdown.querySelector(".nav-dropdown-btn");
        if (trigger) {
          trigger.setAttribute("aria-expanded", "false");
        }
      });

      if (mainNav && mainNav.classList.contains("open")) {
        mainNav.classList.remove("open");
        if (menuToggle) {
          menuToggle.classList.remove("is-active");
          menuToggle.setAttribute("aria-expanded", "false");
          menuToggle.setAttribute("aria-label", "Buka menu navigasi");
          menuToggle.focus();
        }
      }
    }
  });

  // Close mobile nav when clicking standard links
  if (mainNav) {
    mainNav.querySelectorAll(".nav-link, .nav-cta").forEach((link) => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("open");
        if (menuToggle) {
          menuToggle.classList.remove("is-active");
          menuToggle.setAttribute("aria-expanded", "false");
          menuToggle.setAttribute("aria-label", "Buka menu navigasi");
        }
      });
    });
  }

  // =========================================================================
  // 3. HEADER SCROLL ENHANCEMENT
  // =========================================================================
  const handleScroll = () => {
    if (!siteHeader) return;
    if (window.scrollY > 15) {
      siteHeader.classList.add("is-scrolled");
    } else {
      siteHeader.classList.remove("is-scrolled");
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();
});
