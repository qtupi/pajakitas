/**
 * paJAK-Kita — Palet Warna Visualisasi Grafik
 * File: src/lib/vizColors.ts
 *
 * Palet visualisasi data (terpisah dari palet merek)
 * Menggunakan CSS variables --viz-1 sampai --viz-8.
 */

export const VIZ_COLORS = {
  viz1: '#B91C1C', // Merah Betawi (Pajak Daerah)
  viz2: '#B07A0A', // Emas Tua (Retribusi Daerah)
  viz3: '#1D6FA5', // Biru (Hasil Pengelolaan Kekayaan Daerah)
  viz4: '#6B4BA1', // Ungu (Lain-lain PAD yang Sah)
  viz5: '#0F766E', // Hijau Teal (Transfer Pemerintah Pusat)
  viz6: '#3A7A2E', // Hijau Daun (Pendapatan Hibah)
  viz7: '#A8326B', // Magenta
  viz8: '#756C64', // Abu Hangat, khusus "Lainnya"
} as const;

export type VizColorKey = keyof typeof VIZ_COLORS;

/**
 * Pemetaan warna tetap untuk akun pendapatan agar konsisten di semua grafik.
 */
export const AKUN_PENDAPATAN_COLORS: Record<string, string> = {
  '4.1.01': VIZ_COLORS.viz1, // Pajak Daerah
  '4.1.02': VIZ_COLORS.viz2, // Retribusi Daerah
  '4.1.03': VIZ_COLORS.viz3, // Hasil Pengelolaan Kekayaan Daerah yang Dipisahkan
  '4.1.04': VIZ_COLORS.viz4, // Lain-lain PAD yang Sah
  '4.2.01': VIZ_COLORS.viz5, // Pendapatan Transfer Pemerintah Pusat
  '4.3.01': VIZ_COLORS.viz6, // Pendapatan Hibah
};

/**
 * Pemetaan warna tetap untuk belanja per kelompok.
 */
export const BELANJA_GROUP_COLORS: Record<string, string> = {
  operasi: VIZ_COLORS.viz1,
  modal: VIZ_COLORS.viz3,
  tidak_terduga: VIZ_COLORS.viz2,
  transfer: VIZ_COLORS.viz5,
};

/**
 * Menghitung kecerahan relatif (relative luminance) dari warna heksadesimal
 * untuk menentukan secara otomatis apakah teks di atasnya harus putih (#FFFFFF)
 * atau gelap (#1F1A17).
 */
export function getContrastTextColor(hexColor: string): string {
  const cleanHex = hexColor.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  // Jika warna adalah viz-2 (#B07A0A) atau luminans > 0.22, gunakan teks gelap
  if (cleanHex.toUpperCase() === 'B07A0A' || L > 0.22) {
    return '#1F1A17'; // --color-ink
  }
  return '#FFFFFF';
}

/**
 * Mendapatkan palet array warna visualisasi berurutan
 */
export function getVizPalette(): string[] {
  return [
    VIZ_COLORS.viz1,
    VIZ_COLORS.viz2,
    VIZ_COLORS.viz3,
    VIZ_COLORS.viz4,
    VIZ_COLORS.viz5,
    VIZ_COLORS.viz6,
    VIZ_COLORS.viz7,
    VIZ_COLORS.viz8,
  ];
}
