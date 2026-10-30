import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getPendapatanPerAkun,
  getBelanjaPerAkun,
  getBelanjaPerUrusanPorsi,
  getRingkasanApbd,
} from '../../data/dataClient.ts';
import { createV1Options } from './V1SumberPendapatan.ts';
import { createV2Options } from './V2PeranPajakDaerah.ts';
import { createV3Options } from './V3JenisBelanja.ts';
import { createV4Options } from './V4PorsiBelanjaUrusan.ts';
import { createV5Options } from './V5TrenAnggaran.ts';
import { createV6Options } from './V6PerubahanTahunan.ts';
import { getContrastTextColor } from '../../lib/vizColors.ts';

describe('Chart Option Generators (src/components/charts/)', () => {
  test('V1 (Half Donut): menyorot Pajak Daerah dan menghitung total pendapatan', async () => {
    const data = await getPendapatanPerAkun();
    const opts2026 = createV1Options({ data, tahun: 2026 });

    assert.equal(opts2026.series[0].type, 'pie');
    assert.equal(opts2026.series[0].startAngle, 180);
    assert.equal(opts2026.series[0].endAngle, 0);

    const pajakSegmen = opts2026.series[0].data.find((d: any) => d.kode === '4.1.01');
    assert.ok(pajakSegmen);
    assert.equal(pajakSegmen.selected, true, 'Pajak Daerah harus disorot (selected: true)');
    assert.equal(pajakSegmen.value, 49898218773411);
  });

  test('V2 (Cincin Ganda): memuat cincin dalam peran utama dan cincin luar rincian sumber lain', async () => {
    const data = await getPendapatanPerAkun();
    const opts2026 = createV2Options({ data, tahun: 2026 });

    assert.equal(opts2026.series.length, 2, 'Harus memiliki 2 cincin (dalam dan luar)');
    const inner = opts2026.series[0].data;
    const outer = opts2026.series[1].data;

    assert.equal(inner[0].name, 'Pajak Daerah');
    assert.equal(inner[1].name, 'Sumber Lainnya');
    assert.ok(outer.length >= 6);
  });

  test('V3 (Donut Drill-down): Level 1 memuat 4 kelompok belanja, Level 2 memuat rincian akun', async () => {
    const data = await getBelanjaPerAkun();
    const optsLevel1 = createV3Options({ data, currentGroup: 'all', tahun: 2026 });
    assert.equal(optsLevel1.series[0].data.length, 4, 'Level 1 memuat 4 kelompok belanja');

    const optsLevel2 = createV3Options({ data, currentGroup: 'operasi', tahun: 2026 });
    assert.equal(optsLevel2.series[0].data.length, data.operasi.length);
  });

  test('V4 (Diagram Mawar): hanya menampilkan porsi persentase dan TIDAK memuat nominal rupiah per urusan', async () => {
    const data = await getBelanjaPerUrusanPorsi();
    const opts = createV4Options({ data, tahun: 2026 });

    assert.equal(opts.series[0].roseType, 'area');
    // Maksimal 8 urusan terbesar + 1 "Lainnya" = 9 segmen
    assert.ok(opts.series[0].data.length <= 9);

    for (const segmen of opts.series[0].data) {
      assert.ok(segmen.porsiStr.includes('%'), 'Segmen harus memuat porsi persen');
      assert.equal(
        (segmen as any).nilai_dashboard,
        undefined,
        'Nominal rupiah dilarang keras diekspos di grafik urusan'
      );
    }
  });

  test('V5 (Area Chart): menghasilkan titik anotasi tertinggi dan terendah secara matematis', async () => {
    const data = await getRingkasanApbd();
    const opts = createV5Options({ data, basis: 'apbdp' });

    assert.equal(opts.series[0].type, 'line');
    assert.equal(opts.series[1].type, 'line');
    assert.ok(opts.series[0].markPoint.data.length >= 2, 'Harus memuat anotasi titik belanja');
    assert.ok(opts.series[1].markPoint.data.length >= 1, 'Harus memuat anotasi titik pendapatan');
  });

  test('V6 (Batang Divergen): menghitung selisih 2026 vs 2025 per akun pendapatan', async () => {
    const data = await getPendapatanPerAkun();
    const opts = createV6Options({ data, mode: 'nominal' });

    assert.equal(opts.series[0].type, 'bar');
    assert.equal(opts.series[0].data.length, 6);
  });

  test('Luminance check: viz-2 menghasilkan teks gelap, viz-1 menghasilkan teks putih', () => {
    assert.equal(getContrastTextColor('#B07A0A'), '#1F1A17');
    assert.equal(getContrastTextColor('#B91C1C'), '#FFFFFF');
    assert.equal(getContrastTextColor('#1D6FA5'), '#FFFFFF');
  });
});
