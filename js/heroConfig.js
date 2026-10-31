/**
 * paJAK-Kita — Hero Slideshow Configuration
 * File: js/heroConfig.js
 *
 * Mengatur daftar gambar latar belakang hero slideshow, posisi fokus gambar,
 * dan durasi transisi agar mudah diatur tanpa mengubah komponen inti.
 */

export const HERO_SLIDES = [
  {
    src: 'assets/hero-1.jpg',
    objectPosition: '50% 35%',
    label: 'Monumen Nasional Jakarta',
  },
  {
    src: 'assets/hero-2.jpg',
    objectPosition: '50% 50%',
    label: 'Kawasan Sudirman Jakarta',
  },
  {
    src: 'assets/hero-3.jpg',
    objectPosition: '50% 40%',
    label: 'Cakrawala Malam Jakarta',
  },
  {
    src: 'assets/hero-4.jpg',
    objectPosition: '50% 60%',
    label: 'Gedung Modern Jakarta',
  },
];

export const HERO_SETTINGS = {
  slideDuration: 6000, // 6 detik per gambar
  fadeDuration: 1200,  // 1200ms crossfade ease-in-out
  kenBurnsScaleStart: 1.06,
  kenBurnsScaleEnd: 1.0,
};
