import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatRupiahRingkas,
  formatRupiahPenuh,
  formatPersen,
  hitungPorsi,
  formatTanggalIndonesia,
  hitungPosisiHariDalamTahun,
  formatSerapan,
} from './format.ts';

describe('Format Utility (src/lib/format.ts)', () => {
  describe('formatRupiahRingkas', () => {
    test('mengubah 71450673065697 menjadi "Rp71,45 T"', () => {
      assert.equal(formatRupiahRingkas(71450673065697), 'Rp71,45 T');
    });

    test('mengubah 876020190232 menjadi "Rp876 M"', () => {
      assert.equal(formatRupiahRingkas(876020190232), 'Rp876 M');
    });

    test('memformat angka triliun lainnya dengan tepat', () => {
      assert.equal(formatRupiahRingkas(74285299931740), 'Rp74,29 T');
      assert.equal(formatRupiahRingkas(49898218773411), 'Rp49,9 T');
      assert.equal(formatRupiahRingkas(5230567000000), 'Rp5,23 T');
    });

    test('memformat angka miliar lainnya', () => {
      assert.equal(formatRupiahRingkas(745231989077), 'Rp745,23 M');
      assert.equal(formatRupiahRingkas(745000000000), 'Rp745 M');
    });

    test('menangani angka negatif dan nol', () => {
      assert.equal(formatRupiahRingkas(-18923168874361), '-Rp18,92 T');
      assert.equal(formatRupiahRingkas(0), 'Rp0');
    });
  });

  describe('formatRupiahPenuh', () => {
    test('memformat angka rupiah penuh dengan pemisah titik', () => {
      assert.equal(
        formatRupiahPenuh(71450673065697),
        'Rp71.450.673.065.697'
      );
      assert.equal(
        formatRupiahPenuh(876020190232),
        'Rp876.020.190.232'
      );
    });

    test('menangani nol dan nilai negatif', () => {
      assert.equal(formatRupiahPenuh(0), 'Rp0');
      assert.equal(formatRupiahPenuh(-1000000), '-Rp1.000.000');
    });
  });

  describe('formatPersen', () => {
    test('memformat persentase dengan tepat satu desimal', () => {
      assert.equal(formatPersen(69.84), '69,8%');
      assert.equal(formatPersen(80.71), '80,7%');
      assert.equal(formatPersen(15.62), '15,6%');
    });

    test('memformat rasio 0-1 jika opsi isRatio diset ke true', () => {
      assert.equal(formatPersen(0.8071, { isRatio: true }), '80,7%');
    });

    test('menangani 0%', () => {
      assert.equal(formatPersen(0), '0,0%');
    });
  });

  describe('hitungPorsi', () => {
    test('menghitung proporsi persentase dari nilai bagian terhadap total', () => {
      const porsi = hitungPorsi(49898218773411, 71450673065697);
      assert.equal(porsi, 69.84);
    });

    test('menangani pembagian dengan 0 dengan aman', () => {
      assert.equal(hitungPorsi(100, 0), 0);
    });
  });

  describe('formatTanggalIndonesia', () => {
    test('memformat tanggal YYYY-MM-DD menjadi format teks Indonesia', () => {
      assert.equal(formatTanggalIndonesia('2026-10-25'), '25 Oktober 2026');
      assert.equal(formatTanggalIndonesia('2026-01-01'), '1 Januari 2026');
    });
  });

  describe('hitungPosisiHariDalamTahun', () => {
    test('menghitung hari ke-298 dari 365 untuk 25 Oktober 2026', () => {
      const pos = hitungPosisiHariDalamTahun('2026-10-25');
      assert.equal(pos.hariKe, 298);
      assert.equal(pos.totalHari, 365);
      assert.equal(pos.persen, 81.64);
      assert.equal(pos.label, 'Posisi tanggal data dalam tahun anggaran');
    });
  });

  describe('formatSerapan', () => {
    test('mengembalikan tanda hubung "-" untuk anggaran nol atau null, bukan 0%', () => {
      assert.equal(formatSerapan(null), '-');
      assert.equal(formatSerapan(undefined), '-');
      assert.equal(formatSerapan(NaN), '-');
      assert.equal(formatSerapan(59.86), '59,9%');
    });
  });
});
