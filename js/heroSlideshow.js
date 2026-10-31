/**
 * paJAK-Kita — Hero Slideshow Component
 * File: js/heroSlideshow.js
 *
 * Mengimplementasikan:
 * 1. 4 Gambar latar bertumpuk dengan crossfade opacity (1200ms ease-in-out).
 * 2. Ken Burns effect (skala lambat 1.06 -> 1.0) & parallax scroll halus.
 * 3. Preload gambar berikutnya, tidak ada blank frame (gradient fallback).
 * 4. 4 Indikator progress bar tipis yang terisi selama durasi slide (6s).
 * 5. Tombol Pause/Play dengan aria-pressed, jeda saat hover/fokus/tab tersembunyi.
 * 6. Dukungan gestur swipe mobile & penghormatan prefers-reduced-motion.
 */

import { HERO_SLIDES, HERO_SETTINGS } from './heroConfig.js';

export class HeroSlideshow {
  constructor(containerEl) {
    this.container = containerEl;
    if (!this.container) return;

    this.slides = HERO_SLIDES;
    this.totalSlides = this.slides.length;
    this.currentIndex = 0;
    this.isPlaying = true;
    this.isPausedByInteraction = false;
    this.slideStartTime = 0;
    this.elapsedBeforePause = 0;
    this.timerId = null;
    this.rafProgressId = null;

    this.slideDuration = HERO_SETTINGS.slideDuration || 6000;
    this.fadeDuration = HERO_SETTINGS.fadeDuration || 1200;

    this.reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.touchStartX = 0;
    this.touchEndX = 0;

    this.init();
  }

  init() {
    this.slidesWrapper = this.container.querySelector('.hero-slides-wrapper');
    this.indicatorsContainer = this.container.querySelector('.hero-indicators-list');
    this.pausePlayBtn = this.container.querySelector('#hero-slideshow-toggle');

    if (!this.slidesWrapper) return;

    // Render slide image elements
    this.renderSlideElements();

    if (this.reducedMotion) {
      // Jika user memilih reduced motion: hanya tampilkan slide 1, nonaktifkan animasi
      this.showStaticSlide();
      return;
    }

    // Render indicators
    this.renderIndicators();

    // Event listeners
    this.setupControls();
    this.setupInteractivity();
    this.setupParallax();
    this.setupTouchSwipe();

    // Start slideshow
    this.startSlide(0);
  }

  renderSlideElements() {
    this.slideElements = [];
    const existingImgs = Array.from(this.slidesWrapper.querySelectorAll('.hero-slide-img'));

    if (existingImgs.length === this.slides.length) {
      // Gunakan elemen gambar yang sudah ada di markup HTML
      this.slideElements = existingImgs;
      this.slideElements.forEach((img, idx) => {
        const slide = this.slides[idx];
        if (!img.getAttribute('src')) {
          img.src = slide.src;
        }
        img.style.objectPosition = slide.objectPosition || 'center';
        if (idx === 0) {
          img.classList.add('is-active');
          img.style.zIndex = '2';
          img.style.opacity = '1';
          img.style.transform = `scale(${HERO_SETTINGS.kenBurnsScaleStart})`;
        } else {
          img.classList.remove('is-active');
          img.style.zIndex = '1';
          img.style.opacity = '0';
        }
      });
    } else {
      // Buat elemen baru jika belum ada di HTML
      this.slidesWrapper.innerHTML = '';
      this.slides.forEach((slide, idx) => {
        const img = document.createElement('img');
        img.className = `hero-slide-img ${idx === 0 ? 'is-active' : ''}`;
        img.style.objectPosition = slide.objectPosition || 'center';
        img.alt = slide.label || '';
        img.setAttribute('aria-hidden', 'true');
        img.src = slide.src;

        if (idx === 0) {
          img.setAttribute('fetchpriority', 'high');
          img.style.opacity = '1';
          img.style.transform = `scale(${HERO_SETTINGS.kenBurnsScaleStart})`;
        } else if (idx === 1) {
          img.style.opacity = '0';
        } else {
          img.style.opacity = '0';
          img.loading = 'lazy';
        }

        this.slidesWrapper.appendChild(img);
        this.slideElements.push(img);
      });
    }
  }

  showStaticSlide() {
    if (this.slideElements[0]) {
      this.slideElements[0].style.opacity = '1';
      this.slideElements[0].style.transform = 'scale(1)';
    }
    if (this.indicatorsContainer?.parentElement) {
      this.indicatorsContainer.parentElement.style.display = 'none';
    }
  }

  renderIndicators() {
    if (!this.indicatorsContainer) return;
    this.indicatorsContainer.innerHTML = '';
    this.indicatorBars = [];

    this.slides.forEach((slide, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `hero-indicator-btn ${idx === 0 ? 'is-active' : ''}`;
      btn.setAttribute('aria-label', `Tampilkan gambar ${idx + 1} dari ${this.totalSlides}: ${slide.label}`);

      const fill = document.createElement('span');
      fill.className = 'hero-indicator-fill';
      btn.appendChild(fill);

      btn.addEventListener('click', () => {
        this.goToSlide(idx);
      });

      this.indicatorsContainer.appendChild(btn);
      this.indicatorBars.push({ btn, fill });
    });
  }

  setupControls() {
    if (!this.pausePlayBtn) return;

    this.pausePlayBtn.addEventListener('click', () => {
      this.togglePlayPause();
    });

    // Keyboard support: Enter / Spasi
    this.pausePlayBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.togglePlayPause();
      }
    });
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
      this.pausePlayBtn.setAttribute('aria-pressed', 'true');
      this.pausePlayBtn.setAttribute('aria-label', 'Lanjutkan tayangan slide');
      this.pausePlayBtn.classList.add('is-paused');
      this.pausePlayBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      `;
    } else {
      this.resume();
      this.pausePlayBtn.setAttribute('aria-pressed', 'false');
      this.pausePlayBtn.setAttribute('aria-label', 'Jeda tayangan slide');
      this.pausePlayBtn.classList.remove('is-paused');
      this.pausePlayBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
      `;
    }
  }

  setupInteractivity() {
    const controls = this.container.querySelector('.hero-slideshow-controls');
    if (controls) {
      // Jeda hanya saat kontrol slideshow di-hover atau difokuskan secara langsung
      controls.addEventListener('mouseenter', () => {
        if (this.isPlaying) {
          this.pauseInternal();
        }
      });

      controls.addEventListener('mouseleave', () => {
        if (this.isPlaying) {
          this.resumeInternal();
        }
      });

      controls.addEventListener('focusin', () => {
        if (this.isPlaying) {
          this.pauseInternal();
        }
      });

      controls.addEventListener('focusout', (e) => {
        if (!controls.contains(e.relatedTarget) && this.isPlaying) {
          this.resumeInternal();
        }
      });
    }

    // Jeda saat tab browser diminimalkan / tidak aktif
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.isPlaying) this.pauseInternal();
      } else {
        if (this.isPlaying) this.resumeInternal();
      }
    });
  }

  setupParallax() {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (this.reducedMotion) return;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const heroHeight = this.container.offsetHeight;
          if (scrollY <= heroHeight) {
            const translateY = scrollY * 0.28;
            this.slidesWrapper.style.transform = `translate3d(0, ${translateY}px, 0)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  setupTouchSwipe() {
    this.container.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    this.container.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    }, { passive: true });
  }

  handleSwipe() {
    const deltaX = this.touchEndX - this.touchStartX;
    const threshold = 50;

    if (Math.abs(deltaX) > threshold) {
      if (deltaX < 0) {
        // Swipe kiri -> slide berikutnya
        this.goToSlide((this.currentIndex + 1) % this.totalSlides);
      } else {
        // Swipe kanan -> slide sebelumnya
        this.goToSlide((this.currentIndex - 1 + this.totalSlides) % this.totalSlides);
      }
    }
  }

  startSlide(index) {
    this.currentIndex = index;
    const currentImg = this.slideElements[index];
    if (currentImg && !currentImg.getAttribute('src')) {
      currentImg.src = this.slides[index].src;
    }

    // Preload gambar berikutnya
    const nextIdx = (index + 1) % this.totalSlides;
    const nextImg = this.slideElements[nextIdx];
    if (nextImg && !nextImg.getAttribute('src')) {
      nextImg.src = this.slides[nextIdx].src;
    }

    // Aktifkan transisi opacity & Ken Burns zoom
    this.slideElements.forEach((img, idx) => {
      if (idx === index) {
        img.classList.add('active', 'is-active');
        img.style.zIndex = '2';
      } else {
        img.classList.remove('active', 'is-active');
        img.style.zIndex = '1';
      }
    });

    // Update indicators
    this.indicatorBars.forEach((item, idx) => {
      item.btn.classList.toggle('is-active', idx === index);
      if (idx < index) {
        item.fill.style.width = '100%';
        item.fill.style.transition = 'none';
      } else if (idx > index) {
        item.fill.style.width = '0%';
        item.fill.style.transition = 'none';
      } else {
        item.fill.style.width = '0%';
        item.fill.style.transition = 'none';
      }
    });

    this.slideStartTime = performance.now();
    this.elapsedBeforePause = 0;
    this.animateIndicator(index);

    // Jadwalkan slide berikutnya
    clearTimeout(this.timerId);
    this.timerId = setTimeout(() => {
      this.goToSlide((this.currentIndex + 1) % this.totalSlides);
    }, this.slideDuration);
  }

  animateIndicator(index) {
    cancelAnimationFrame(this.rafProgressId);
    const fillEl = this.indicatorBars[index]?.fill;
    if (!fillEl) return;

    const update = (now) => {
      if (!this.isPlaying || this.isPausedByInteraction) return;

      const elapsed = (now - this.slideStartTime) + this.elapsedBeforePause;
      const progress = Math.min(Math.max(elapsed / this.slideDuration, 0), 1);
      fillEl.style.width = `${progress * 100}%`;

      if (progress < 1) {
        this.rafProgressId = requestAnimationFrame(update);
      }
    };

    this.rafProgressId = requestAnimationFrame(update);
  }

  goToSlide(index) {
    clearTimeout(this.timerId);
    cancelAnimationFrame(this.rafProgressId);
    this.isPausedByInteraction = false;
    this.startSlide(index);
  }

  pause() {
    this.isPlaying = false;
    this.pauseInternal();
  }

  resume() {
    this.isPlaying = true;
    this.resumeInternal();
  }

  pauseInternal() {
    this.isPausedByInteraction = true;
    clearTimeout(this.timerId);
    cancelAnimationFrame(this.rafProgressId);
    this.elapsedBeforePause += performance.now() - this.slideStartTime;

    // Hentikan transisi scale di tempat
    const currentImg = this.slideElements[this.currentIndex];
    if (currentImg) {
      const computedTransform = window.getComputedStyle(currentImg).transform;
      currentImg.style.transition = 'none';
      currentImg.style.transform = computedTransform;
    }
  }

  resumeInternal() {
    if (!this.isPlaying) return;
    this.isPausedByInteraction = false;
    this.slideStartTime = performance.now();
    const remainingTime = Math.max(this.slideDuration - this.elapsedBeforePause, 200);

    const currentImg = this.slideElements[this.currentIndex];
    if (currentImg) {
      currentImg.style.transition = `transform ${remainingTime}ms cubic-bezier(0.25, 1, 0.5, 1)`;
      currentImg.style.transform = `scale(${HERO_SETTINGS.kenBurnsScaleEnd})`;
    }

    this.animateIndicator(this.currentIndex);

    clearTimeout(this.timerId);
    this.timerId = setTimeout(() => {
      this.goToSlide((this.currentIndex + 1) % this.totalSlides);
    }, remainingTime);
  }
}
