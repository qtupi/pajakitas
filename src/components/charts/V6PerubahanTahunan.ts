/**
 * V6: "Apa yang berubah dari 2025 ke 2026?"
 * File: src/components/charts/V6PerubahanTahunan.ts
 *
 * Bentuk: Batang horizontal divergen (menyimpang dari nol)
 * Data: selisih 2026 terhadap 2025 per akun pendapatan, diurutkan
 * Hanya angka selisih nominal dan persen, tanpa kalimat penyebab
 * Penjelasan basis: basis 2025 adalah APBDP, basis 2026 adalah APBD
 */

import type { AkunItem } from '../../data/dataClient.ts';
import { VIZ_COLORS } from '../../lib/vizColors.ts';
import { formatRupiahRingkas, formatRupiahPenuh, formatPersen } from '../../lib/format.ts';

export interface V6OptionsProps {
  data: AkunItem[];
  mode?: 'persen' | 'nominal';
  prefersReducedMotion?: boolean;
}

export function createV6Options(props: V6OptionsProps) {
  const { data, mode = 'nominal', prefersReducedMotion } = props;

  // Hitung selisih nominal dan persen
  const calculated = data.map((item) => {
    const val2026 = item.nilai['2026'] || 0;
    const val2025 = item.nilai['2025'] || 0;
    const selisih = val2026 - val2025;
    const persen = val2025 > 0 ? (selisih / val2025) * 100 : 0;

    return {
      name: item.nama,
      kode: item.kode,
      selisih,
      persen,
      val2026,
      val2025,
    };
  });

  // Urutkan dari perubahan terbesar ke terendah
  calculated.sort((a, b) => (mode === 'nominal' ? a.selisih - b.selisih : a.persen - b.persen));

  const names = calculated.map((i) => i.name);
  const values = calculated.map((i) => {
    const val = mode === 'nominal' ? i.selisih : Math.round(i.persen * 10) / 10;
    const isPositive = val >= 0;
    return {
      value: val,
      selisih: i.selisih,
      persen: i.persen,
      kode: i.kode,
      itemStyle: {
        color: isPositive ? VIZ_COLORS.viz6 : VIZ_COLORS.viz1,
        borderRadius: isPositive ? [0, 4, 4, 0] : [4, 0, 0, 4],
      },
    };
  });

  return {
    animation: !prefersReducedMotion,
    animationDuration: 850,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const item = params[0].data;
        const name = params[0].name;
        const tanda = item.selisih >= 0 ? '+' : '';
        return `
          <div style="font-weight:700; margin-bottom:4px;">${name} (${item.kode})</div>
          <div>Perubahan Nominal: <strong>${tanda}${formatRupiahRingkas(item.selisih)}</strong></div>
          <div style="font-size:11px; color:#6B6159;">Selisih Lengkap: ${tanda}${formatRupiahPenuh(item.selisih)}</div>
          <div>Perubahan Relatif: <strong>${tanda}${formatPersen(item.persen)}</strong></div>
          <div style="font-size:10px; margin-top:4px; color:#8F1414;">[ANGGARAN] Membandingkan APBD 2026 vs APBDP 2025</div>
        `;
      },
    },
    grid: {
      left: '3%',
      right: '6%',
      bottom: '8%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        formatter: (val: number) =>
          mode === 'nominal' ? formatRupiahRingkas(val) : `${val}%`,
        fontSize: 11,
      },
      splitLine: {
        lineStyle: { color: '#E6DACB', type: 'dashed' },
      },
    },
    yAxis: {
      type: 'category',
      data: names,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#E6DACB' } },
      axisLabel: {
        fontSize: 11,
        width: 170,
        overflow: 'truncate',
      },
    },
    series: [
      {
        name: 'Perubahan Anggaran (2025 ke 2026)',
        type: 'bar',
        data: values,
        label: {
          show: true,
          position: 'outside',
          formatter: (p: any) => {
            const tanda = p.data.selisih >= 0 ? '+' : '';
            return mode === 'nominal'
              ? `${tanda}${formatRupiahRingkas(p.data.selisih)}`
              : `${tanda}${formatPersen(p.data.persen)}`;
          },
          fontSize: 10,
          color: '#1F1A17',
        },
      },
    ],
  };
}
