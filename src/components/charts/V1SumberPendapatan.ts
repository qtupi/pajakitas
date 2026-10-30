/**
 * V1: "Dari mana uang daerah Jakarta berasal?"
 * File: src/components/charts/V1SumberPendapatan.ts
 *
 * Bentuk: Setengah donat (half donut) dengan label penunjuk
 * Data: pendapatan_per_akun, pilihan tahun 2026 dan 2025. Porsi dihitung kode.
 * Fitur: Pajak Daerah sedikit terangkat sebagai sorotan, total pendapatan di tengah.
 */

import type { AkunItem } from '../../data/dataClient.ts';
import { AKUN_PENDAPATAN_COLORS, getContrastTextColor } from '../../lib/vizColors.ts';
import { formatRupiahRingkas, formatRupiahPenuh, formatPersen } from '../../lib/format.ts';

export interface V1OptionsProps {
  data: AkunItem[];
  tahun: 2026 | 2025;
  prefersReducedMotion?: boolean;
}

export function createV1Options(props: V1OptionsProps) {
  const { data, tahun, prefersReducedMotion } = props;
  const basisTahun = tahun === 2026 ? 'APBD' : 'APBDP';

  const total = data.reduce((acc, curr) => acc + (curr.nilai[tahun] || 0), 0);

  const seriesData = data.map((item) => {
    const nilai = item.nilai[tahun] || 0;
    const porsi = total > 0 ? (nilai / total) * 100 : 0;
    const color = AKUN_PENDAPATAN_COLORS[item.kode] || '#756C64';
    const isPajak = item.kode === '4.1.01';

    return {
      name: item.nama,
      value: nilai,
      kode: item.kode,
      porsiPersen: formatPersen(porsi),
      basis: basisTahun,
      tahun: tahun,
      selected: isPajak,
      selectedOffset: 12,
      itemStyle: {
        color: color,
        borderColor: '#FFFFFF',
        borderWidth: 2,
      },
      label: {
        show: true,
        color: getContrastTextColor(color),
      },
    };
  });

  return {
    animation: !prefersReducedMotion,
    animationDuration: 800,
    animationEasing: 'cubicOut',
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const item = params.data;
        return `
          <div style="font-weight:700; margin-bottom:4px;">${item.name} (${item.kode})</div>
          <div>Anggaran: <strong>${formatRupiahRingkas(item.value)}</strong></div>
          <div style="font-size:11px; color:#6B6159;">Nilai Penuh: ${formatRupiahPenuh(item.value)}</div>
          <div>Porsi: <strong>${item.porsiPersen}</strong> dari pendapatan</div>
          <div style="font-size:10px; margin-top:4px; color:#8F1414;">[ANGGARAN] Basis ${item.basis} ${item.tahun}</div>
        `;
      },
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      itemWidth: 12,
      itemHeight: 12,
      textStyle: {
        fontSize: 11,
      },
    },
    series: [
      {
        name: 'Sumber Pendapatan APBD',
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['50%', '70%'],
        startAngle: 180,
        endAngle: 0,
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#FFFFFF',
          borderWidth: 2,
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{d}%',
          fontSize: 11,
          lineHeight: 14,
        },
        labelLine: {
          show: true,
          length: 12,
          length2: 14,
          smooth: true,
          lineStyle: {
            color: '#6B6159',
            width: 1,
          },
        },
        data: seriesData,
      },
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '64%',
        style: {
          text: `Total Anggaran\n${formatRupiahRingkas(total)}`,
          textAlign: 'center',
          fill: '#1F1A17',
          font: 'bold 16px "Plus Jakarta Sans", sans-serif',
        },
      },
    ],
  };
}
