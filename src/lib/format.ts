/**
 * paJAK-Kita — Utilitas Format Angka & Mata Uang
 * Locale: id-ID
 */

export const LOCALE_ID = 'id-ID';

/**
 * Format angka rupiah menjadi format ringkas (Triliun, Miliar, Juta).
 * Contoh:
 * - 71450673065697 => "Rp71,45 T"
 * - 876020190232 => "Rp876 M"
 * - 5230567000000 => "Rp5,23 T"
 * - 745231989077 => "Rp745 M"
 */
export function formatRupiahRingkas(
  nilai: number,
  options?: { maximumFractionDigits?: number; minimumFractionDigits?: number }
): string {
  if (nilai === null || nilai === undefined || isNaN(nilai)) {
    return 'Rp0';
  }

  const tanda = nilai < 0 ? '-' : '';
  const abs = Math.abs(nilai);

  const SATU_TRILIUN = 1_000_000_000_000;
  const SATU_MILAR = 1_000_000_000;
  const SATU_JUTA = 1_000_000;

  if (abs >= SATU_TRILIUN) {
    const unitVal = abs / SATU_TRILIUN;
    const maxDigits =
      options?.maximumFractionDigits !== undefined
        ? options.maximumFractionDigits
        : unitVal >= 100 && unitVal % 1 < 0.05
        ? 0
        : 2;
    const minDigits = options?.minimumFractionDigits ?? 0;
    const str = unitVal.toLocaleString(LOCALE_ID, {
      minimumFractionDigits: minDigits,
      maximumFractionDigits: maxDigits,
    });
    return `${tanda}Rp${str} T`;
  }

  if (abs >= SATU_MILAR) {
    const unitVal = abs / SATU_MILAR;
    const maxDigits =
      options?.maximumFractionDigits !== undefined
        ? options.maximumFractionDigits
        : unitVal >= 100 && unitVal % 1 < 0.05
        ? 0
        : 2;
    const minDigits = options?.minimumFractionDigits ?? 0;
    const str = unitVal.toLocaleString(LOCALE_ID, {
      minimumFractionDigits: minDigits,
      maximumFractionDigits: maxDigits,
    });
    return `${tanda}Rp${str} M`;
  }

  if (abs >= SATU_JUTA) {
    const unitVal = abs / SATU_JUTA;
    const maxDigits =
      options?.maximumFractionDigits !== undefined
        ? options.maximumFractionDigits
        : unitVal >= 100 && unitVal % 1 < 0.05
        ? 0
        : 2;
    const minDigits = options?.minimumFractionDigits ?? 0;
    const str = unitVal.toLocaleString(LOCALE_ID, {
      minimumFractionDigits: minDigits,
      maximumFractionDigits: maxDigits,
    });
    return `${tanda}Rp${str} Jt`;
  }

  return `${tanda}Rp${abs.toLocaleString(LOCALE_ID)}`;
}

/**
 * Format angka rupiah penuh dengan pemisah ribuan titik.
 * Contoh: 71450673065697 => "Rp71.450.673.065.697"
 */
export function formatRupiahPenuh(nilai: number): string {
  if (nilai === null || nilai === undefined || isNaN(nilai)) {
    return 'Rp0';
  }
  const tanda = nilai < 0 ? '-' : '';
  const bulat = Math.round(Math.abs(nilai));
  return `${tanda}Rp${bulat.toLocaleString(LOCALE_ID)}`;
}

/**
 * Format persentase dengan satu desimal.
 * Contoh:
 * - 69.84 => "69,8%"
 * - 0.8071 (dengan isRatio: true) => "80,7%"
 */
export function formatPersen(
  nilai: number,
  options?: { isRatio?: boolean }
): string {
  if (nilai === null || nilai === undefined || isNaN(nilai)) {
    return '0,0%';
  }
  const persen = options?.isRatio ? nilai * 100 : nilai;
  return `${persen.toLocaleString(LOCALE_ID, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

/**
 * Hitung porsi proporsi dari bagian terhadap total (dalam persen, 0-100).
 * Contoh: hitungPorsi(49898218773411, 71450673065697) => 69.84
 */
export function hitungPorsi(bagian: number, total: number): number {
  if (!total || isNaN(total) || total === 0) {
    return 0;
  }
  const hasil = (bagian / total) * 100;
  return Math.round(hasil * 100) / 100;
}

const BULAN_INDONESIA = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/**
 * Format string tanggal YYYY-MM-DD menjadi format bahasa Indonesia resmi.
 * Contoh: "2026-10-25" => "25 Oktober 2026"
 */
export function formatTanggalIndonesia(tanggalStr: string): string {
  if (!tanggalStr) return '-';
  const parts = tanggalStr.split('-');
  if (parts.length === 3) {
    const tahun = parseInt(parts[0], 10);
    const bulanIndex = parseInt(parts[1], 10) - 1;
    const tgl = parseInt(parts[2], 10);
    if (!isNaN(tahun) && bulanIndex >= 0 && bulanIndex < 12 && !isNaN(tgl)) {
      return `${tgl} ${BULAN_INDONESIA[bulanIndex]} ${tahun}`;
    }
  }
  const d = new Date(tanggalStr);
  if (!isNaN(d.getTime())) {
    return `${d.getDate()} ${BULAN_INDONESIA[d.getMonth()]} ${d.getFullYear()}`;
  }
  return tanggalStr;
}

/**
 * Periksa apakah suatu tahun adalah tahun kabisat.
 */
export function isKabisat(tahun: number): boolean {
  return (tahun % 4 === 0 && tahun % 100 !== 0) || tahun % 400 === 0;
}

/**
 * Hitung posisi tanggal dalam tahun anggaran (hari ke-n dari 365/366).
 * Label netral: "Posisi tanggal data dalam tahun anggaran"
 */
export function hitungPosisiHariDalamTahun(tanggalStr: string): {
  hariKe: number;
  totalHari: number;
  persen: number;
  label: string;
} {
  const parts = (tanggalStr || '2026-10-25').split('-');
  const tahun = parseInt(parts[0], 10) || 2026;
  const bulan = parseInt(parts[1], 10) || 10;
  const tgl = parseInt(parts[2], 10) || 25;

  const totalHari = isKabisat(tahun) ? 366 : 365;
  const hariPerBulan = [
    31,
    isKabisat(tahun) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  let hariKe = 0;
  for (let i = 0; i < bulan - 1; i++) {
    hariKe += hariPerBulan[i];
  }
  hariKe += tgl;

  const persen = Math.round((hariKe / totalHari) * 10000) / 100;

  return {
    hariKe,
    totalHari,
    persen,
    label: 'Posisi tanggal data dalam tahun anggaran',
  };
}

/**
 * Format serapan belanja. Jika anggaran 0 atau null, kembalikan '-' (bukan 0%).
 */
export function formatSerapan(serapan: number | null | undefined): string {
  if (serapan === null || serapan === undefined || isNaN(serapan)) {
    return '-';
  }
  return formatPersen(serapan);
}

