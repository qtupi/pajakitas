/**
 * V5: "Bagaimana anggaran Jakarta bergerak 2022 sampai 2026?"
 * File: src/components/charts/V5TrenAnggaran.ts
 *
 * Bentuk: Area chart dengan anotasi bertitik
 * Data: ringkasan_apbd.pendapatan dan belanja, pilihan APBD atau APBDP (default APBDP)
 * Anotasi bertitik DIHASILKAN KODE: titik tertinggi, terendah, dan perubahan 2025 ke 2026
 * Teks anotasi hanya fakta angka murni, tanpa klaim penyebab
 */

import type { RingkasanApbd } from '../../data/dataClient.ts';
import { VIZ_COLORS } from '../../lib/vizColors.ts';
import { formatRupiahRingkas, formatRupiahPenuh, formatPersen } from '../../lib/format.ts';

export interface V5OptionsProps {
  data: RingkasanApbd;
  basis?: 'apbdp' | 'apbd';
  prefersReducedMotion?: boolean;
}

export function createV5Options(props: V5OptionsProps) {
  const { data, basis = 'apbdp', prefersReducedMotion } = props;
  const basisLabel = basis === 'apbdp' ? 'APBDP (Perubahan)' : 'APBD (Awal)';

  // Urutkan tahun 2022 -> 2026
  const years = [2022, 2023, 2024, 2025, 2026];

  const pendapatanList = years.map((th) => {
    const item = data.pendapatan.find((p) => p.tahun === th);
    return item ? item[basis] : 0;
  });

  const belanjaList = years.map((th) => {
    const item = data.belanja.find((b) => b.tahun === th);
    return item ? item[basis] : 0;
  });

  // Hitung titik tertinggi dan terendah secara matematis oleh kode
  let maxBelanja = { val: -Infinity, year: 2022, idx: 0 };
  let minPendapatan = { val: Infinity, year: 2022, idx: 0 };

  belanjaList.forEach((val, idx) => {
    if (val > maxBelanja.val) maxBelanja = { val, year: years[idx], idx };
  });

  pendapatanList.forEach((val, idx) => {
    if (val < minPendapatan.val) minPendapatan = { val, year: years[idx], idx };
  });

  // Hitung selisih 2025 ke 2026
  const idx2025 = years.indexOf(2025);
  const idx2026 = years.indexOf(2026);
  const selisihBelanja = belanjaList[idx2026] - belanjaList[idx2025];
  const persenBelanja = (selisihBelanja / belanjaList[idx2025]) * 100;

  return {
    animation: !prefersReducedMotion,
    animationDuration: 850,
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const year = params[0].name;
        let html = `<div style="font-weight:700; margin-bottom:4px;">Tahun ${year} (${basisLabel})</div>`;
        params.forEach((p: any) => {
          html += `<div>${p.marker} ${p.seriesName}: <strong>${formatRupiahRingkas(p.value)}</strong> <span style="font-size:11px; color:#6B6159;">(${formatRupiahPenuh(p.value)})</span></div>`;
        });
        html += `<div style="font-size:10px; margin-top:4px; color:#8F1414;">[ANGGARAN, BUKAN REALISASI]</div>`;
        return html;
      },
    },
    legend: {
      data: ['Anggaran Belanja', 'Anggaran Pendapatan'],
      bottom: 0,
      textStyle: { fontSize: 11 },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '12%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: years.map(String),
      axisLabel: { fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (val: number) => formatRupiahRingkas(val),
        fontSize: 11,
      },
      splitLine: {
        lineStyle: { type: 'dashed', color: '#F2E8DA' },
      },
    },
    series: [
      {
        name: 'Anggaran Belanja',
        type: 'line',
        smooth: true,
        data: belanjaList,
        lineStyle: { width: 3, color: VIZ_COLORS.viz1 },
        itemStyle: { color: VIZ_COLORS.viz1 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(185, 28, 28, 0.28)' },
              { offset: 1, color: 'rgba(185, 28, 28, 0.02)' },
            ],
          },
        },
        markPoint: {
          symbol: 'pin',
          symbolSize: 45,
          label: {
            fontSize: 9,
            formatter: (p: any) => p.data.labelCustom || '',
          },
          data: [
            {
              name: 'Belanja Tertinggi',
              coord: [String(maxBelanja.year), maxBelanja.val],
              value: formatRupiahRingkas(maxBelanja.val),
              labelCustom: `Maks\n${formatRupiahRingkas(maxBelanja.val)}`,
              itemStyle: { color: VIZ_COLORS.viz1 },
            },
            {
              name: 'Perubahan 2025-2026',
              coord: ['2026', belanjaList[idx2026]],
              value: formatPersen(persenBelanja),
              labelCustom: `${formatPersen(persenBelanja)}`,
              itemStyle: { color: VIZ_COLORS.viz2 },
            },
          ],
        },
      },
      {
        name: 'Anggaran Pendapatan',
        type: 'line',
        smooth: true,
        data: pendapatanList,
        lineStyle: { width: 3, color: VIZ_COLORS.viz3 },
        itemStyle: { color: VIZ_COLORS.viz3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(29, 111, 165, 0.28)' },
              { offset: 1, color: 'rgba(29, 111, 165, 0.02)' },
            ],
          },
        },
        markPoint: {
          symbol: 'pin',
          symbolSize: 42,
          label: {
            fontSize: 9,
            formatter: (p: any) => p.data.labelCustom || '',
          },
          data: [
            {
              name: 'Pendapatan Terendah',
              coord: [String(minPendapatan.year), minPendapatan.val],
              value: formatRupiahRingkas(minPendapatan.val),
              labelCustom: `Min\n${formatRupiahRingkas(minPendapatan.val)}`,
              itemStyle: { color: VIZ_COLORS.viz3 },
            },
          ],
        },
      },
    ],
  };
}
