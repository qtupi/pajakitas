import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getMeta,
  getRingkasanApbd,
  getPendapatanPerAkun,
  getBelanjaPerAkun,
  getBelanjaPerUrusanPorsi,
  getPembiayaanPerAkun,
  getTurunan,
  getInsight,
  validateDataAnggaran,
  getRealisasiMeta,
  getRealisasiPerAkun,
  getRealisasiPerSkpd,
  getTurunanRealisasi,
  validateDataRealisasi,
} from './dataClient.ts';

describe('Data Client (src/data/dataClient.ts)', () => {
  test('getMeta mengembalikan metadata resmi APBD DKI Jakarta', async () => {
    const meta = await getMeta();
    assert.ok(meta.judul.includes('APBD Provinsi DKI Jakarta'));
    assert.equal(meta.jenis_data, 'anggaran (bukan realisasi)');
    assert.equal(meta.sumber.nama, 'Dashboard Keuangan Daerah BPKD Provinsi DKI Jakarta');
    assert.equal(meta.basis_tahun_pada_data_per_akun_dan_per_urusan['2026'], 'APBD (sama dengan APBDP)');
    assert.equal(meta.basis_tahun_pada_data_per_akun_dan_per_urusan['2025'], 'APBDP');
  });

  test('getRingkasanApbd mengembalikan deret belanja dan pendapatan 2022-2026', async () => {
    const ringkasan = await getRingkasanApbd();
    assert.ok(Array.isArray(ringkasan.pendapatan));
    assert.ok(Array.isArray(ringkasan.belanja));

    const belanja2026 = ringkasan.belanja.find((b) => b.tahun === 2026);
    assert.ok(belanja2026);
    assert.equal(belanja2026.apbd, 74285299931740);

    const pendapatan2026 = ringkasan.pendapatan.find((p) => p.tahun === 2026);
    assert.ok(pendapatan2026);
    assert.equal(pendapatan2026.apbd, 71450673065697);
  });

  test('getPendapatanPerAkun memuat 6 akun pendapatan daerah', async () => {
    const akun = await getPendapatanPerAkun();
    assert.equal(akun.length, 6);
    const pajak = akun.find((a) => a.kode === '4.1.01');
    assert.ok(pajak);
    assert.equal(pajak.nama, 'Pajak Daerah');
    assert.equal(pajak.nilai['2026'], 49898218773411);
  });

  test('getBelanjaPerAkun memuat operasi, modal, tidak_terduga, dan transfer', async () => {
    const belanja = await getBelanjaPerAkun();
    assert.equal(belanja.operasi.length, 6);
    assert.equal(belanja.modal.length, 6);
    assert.equal(belanja.tidak_terduga.length, 1);
    assert.equal(belanja.transfer.length, 1);
  });

  test('getBelanjaPerUrusanPorsi HANYA mengembalikan porsi proporsi dan TIDAK mengekspos nilai_dashboard', async () => {
    const urusan = await getBelanjaPerUrusanPorsi();
    assert.ok(urusan.length > 0);

    for (const item of urusan) {
      assert.ok(item.kode, 'Item harus memiliki kode');
      assert.ok(item.nama_pendek, 'Item harus memiliki nama_pendek');
      assert.ok(item.kelompok, 'Item harus memiliki kelompok');
      assert.ok(
        typeof item.porsi_dari_jumlah_urusan_persen['2026'] === 'number',
        'Harus memuat porsi 2026'
      );
      assert.equal(
        (item as any).nilai_dashboard,
        undefined,
        'nilai_dashboard dilarang keras diekspos karena risiko data dobel'
      );
    }
  });

  test('getPembiayaanPerAkun memuat penerimaan dan pengeluaran pembiayaan', async () => {
    const pembiayaan = await getPembiayaanPerAkun();
    assert.ok(pembiayaan.penerimaan.length >= 4);
    assert.ok(pembiayaan.pengeluaran.length >= 2);
  });

  test('getTurunan memuat kalkulasi porsi pendapatan dan lima urusan terbesar tanpa nilai_dashboard', async () => {
    const turunan = await getTurunan();
    assert.equal(turunan.porsi_pendapatan_persen.pajak_daerah['2026'], 69.84);
    assert.equal(turunan.porsi_pendapatan_persen.pad_total['2026'], 80.71);
    assert.equal(turunan.lima_urusan_terbesar_2026.length, 5);

    for (const item of turunan.lima_urusan_terbesar_2026) {
      assert.equal(
        (item as any).nilai_dashboard,
        undefined,
        'nilai_dashboard pada lima_urusan_terbesar_2026 dilarang diekspos'
      );
    }
  });

  test('getInsight mengembalikan fakta insight yang cocok dengan wilayah', async () => {
    const insights = await getInsight('Jakarta Selatan');
    assert.ok(Array.isArray(insights));
    assert.ok(insights.length > 0);
    const hasJaksel = insights.some((i) => i.wilayah === 'Jakarta Selatan');
    assert.ok(hasJaksel, 'Harus memuat fakta Jakarta Selatan');
  });

  test('validateDataAnggaran melempar galat jelas bila bentuk JSON tidak sesuai', () => {
    assert.throws(() => {
      validateDataAnggaran(null);
    }, /Galat Validasi/);

    assert.throws(() => {
      validateDataAnggaran({ meta: {} });
    }, /Galat Validasi/);
  });

  test('getRealisasiMeta mengembalikan metadata resmi realisasi APBD DKI Jakarta 2026', async () => {
    const meta = await getRealisasiMeta();
    assert.ok(meta.judul.includes('realisasi APBD'));
    assert.equal(meta.tahun_anggaran, 2026);
    assert.equal(meta.tanggal_data, '2026-10-25');
    assert.ok(Array.isArray(meta.peringatan));
  });

  test('getRealisasiPerAkun memuat pendapatan, belanja, dan total halaman dengan persen hitung', async () => {
    const data = await getRealisasiPerAkun();
    assert.equal(data.pendapatan.length, 6);
    assert.equal(data.belanja.length, 9);

    const pajak = data.pendapatan.find((p) => p.kode === '4.1.01');
    assert.ok(pajak);
    assert.equal(pajak.anggaran, 49898218773411);
    assert.equal(pajak.realisasi, 37138893774592);
    assert.equal(pajak.persen_hitung, 74.43);
    assert.equal(pajak.selisih_menuju_anggaran, 49898218773411 - 37138893774592);

    assert.equal(data.total_halaman.jumlah_belanja.anggaran, 74285299931740);
    assert.equal(data.total_halaman.jumlah_belanja.realisasi, 44467474197668);
  });

  test('getRealisasiPerSkpd memuat 43 unit dengan serapan dan peringkat dihitung kode', async () => {
    const skpd = await getRealisasiPerSkpd();
    assert.equal(skpd.data.length, 43);

    // Unit pertama menurut anggaran adalah Dinas Pendidikan (ranking 1)
    const dik = skpd.data.find((u) => u.nama_pendek === 'Dinas Pendidikan');
    assert.ok(dik);
    assert.equal(dik.peringkat_belanja, 1);
    assert.equal(dik.belanja.serapan_persen, 63.64);
    assert.ok(dik.porsi_dari_total_belanja_persen! > 24);

    // Cek peringkat unik 1 sampai 43
    const ranks = skpd.data.map((u) => u.peringkat_belanja).sort((a, b) => a! - b!);
    assert.equal(ranks[0], 1);
    assert.equal(ranks[ranks.length - 1], 43);
  });

  test('getTurunanRealisasi memuat capaian persen dan daftar belanja terbesar', async () => {
    const turunan = await getTurunanRealisasi();
    assert.equal(turunan.capaian_persen.pajak_daerah, 74.43);
    assert.equal(turunan.capaian_persen.belanja, 59.86);
    assert.ok(Array.isArray(turunan.belanja_terbesar_menurut_anggaran));
  });

  test('validateDataRealisasi melempar galat bila data tidak sesuai', () => {
    assert.throws(() => {
      validateDataRealisasi(null);
    }, /Galat Validasi Realisasi/);

    assert.throws(() => {
      validateDataRealisasi({ meta: {} });
    }, /Galat Validasi Realisasi/);
  });
});
