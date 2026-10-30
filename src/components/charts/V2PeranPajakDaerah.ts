/**
 * V2: "Seberapa besar peran pajak daerah?"
 * File: src/components/charts/V2PeranPajakDaerah.ts
 *
 * Bentuk: Cincin ganda (nested pie / donut)
 * Cincin dalam: Pajak Daerah dibandingkan sumber lain
 * Cincin luar: rincian sumber lain
 * Angka besar di tengah: porsi Pajak Daerah (dihitung kode)
 */

import type { AkunItem } from '../../data/dataClient.ts';
import { VIZ_COLORS, AKUN_PENDAPATAN_COLORS } from '../../lib/vizColors.ts';
import { formatRupiahRingkas, formatRupiahPenuh, formatPersen } from '../../lib/format.ts';

export interface V2OptionsProps {
  data: AkunItem[];
  tahun: 2026 | 2025;
  prefersReducedMotion?: boolean;
}

export function createV2Options(props: V2OptionsProps) {
  const { data, tahun, prefersReducedMotion } = props;
  const basisTahun = tahun === 2026 ? 'APBD' : 'APBDP';

  const total = data.reduce((acc, curr) => acc + (curr.nilai[tahun] || 0), 0);
  const pajakItem = data.find((i) => i.kode === '4.1.01');
  const nilaiPajak = pajakItem ? pajakItem.nilai[tahun] : 0;
  const porsiPajak = total > 0 ? (nilaiPajak / total) * 100 : 0;
  const nilaiNonPajak = total - nilaiPajak;
  const porsiNonPajak = total > 0 ? (nilaiNonPajak / total) * 100 : 0;

  // Cincin dalam
  const innerData = [
    {
      name: 'Pajak Daerah',
      value: nilaiPajak,
      kode: '4.1.01',
      porsiPersen: formatPersen(porsiPajak),
      basis: basisTahun,
      tahun: tahun,
      itemStyle: {
        color: VIZ_COLORS.viz1,
        borderColor: '#FFFFFF',
        borderWidth: 2,
      },
    },
    {
      name: 'Sumber Lainnya',
      value: nilaiNonPajak,
      porsiPersen: formatPersen(porsiNonPajak),
      basis: basisTahun,
      tahun: tahun,
      itemStyle: {
        color: '#E6DACB',
        borderColor: '#FFFFFF',
        borderWidth: 2,
      },
    },
  ];

  // Cincin luar: rincian akun lainnya + segmen transparan/selaras untuk pajak
  const outerData: any[] = [];
  // Pajak Daerah di luar selaras
  outerData.push({
    name: 'Pajak Daerah',
    value: nilaiPajak,
    kode: '4.1.01',
    porsiPersen: formatPersen(porsiPajak),
    basis: basisTahun,
    tahun: tahun,
    itemStyle: {
      color: VIZ_COLORS.viz1,
      borderColor: '#FFFFFF',
      borderWidth: 2,
    },
  });

  // Rincian akun selain pajak daerah
  data
    .filter((i) => i.kode !== '4.1.01')
    .forEach((item) => {
      const val = item.nilai[tahun] || 0;
      const p = total > 0 ? (val / total) * 100 : 0;
      outerData.push({
        name: item.nama,
        value: val,
        kode: item.kode,
        porsiPersen: formatPersen(p),
        basis: basisTahun,
        tahun: tahun,
        itemStyle: {
          color: AKUN_PENDAPATAN_COLORS[item.kode] || VIZ_COLORS.viz8,
          borderColor: '#FFFFFF',
          borderWidth: 2,
        },
      });
    });

  return {
    animation: !prefersReducedMotion,
    animationDuration: 850,
    animationEasing: 'cubicOut',
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const item = params.data;
        const kodeStr = item.kode ? ` (${item.kode})` : '';
        return `
          <div style="font-weight:700; margin-bottom:4px;">${item.name}${kodeStr}</div>
          <div>Nilai: <strong>${formatRupiahRingkas(item.value)}</strong></div>
          <div style="font-size:11px; color:#6B6159;">Nilai Penuh: ${formatRupiahPenuh(item.value)}</div>
          <div>Porsi: <strong>${item.porsiPersen}</strong> dari pendapatan</div>
          <div style="font-size:10px; margin-top:4px; color:#8F1414;">[ANGGARAN] Basis ${item.basis} ${item.tahun}</div>
        `;
      },
    },
    series: [
      // Cincin Dalam: Peran Utama Pajak vs Sumber Lain
      {
        name: 'Peran Utama',
        type: 'pie',
        radius: ['32%', '50%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        label: {
          show: false,
        },
        labelLine: {
          show: false,
        },
        data: innerData,
      },
      // Cincin Luar: Rincian Sumber Lainnya
      {
        name: 'Rincian Sumber Lainnya',
        type: 'pie',
        radius: ['56%', '76%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          fontSize: 11,
          lineHeight: 14,
        },
        labelLine: {
          show: true,
          length: 12,
          length2: 14,
          smooth: true,
        },
        data: outerData,
      },
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '44%',
        style: {
          text: formatPersen(porsiPajak),
          textAlign: 'center',
          fill: '#B91C1C',
          font: 'bold 28px "Plus Jakarta Sans", sans-serif',
        },
      },
      {
        type: 'text',
        left: 'center',
        top: '53%',
        style: {
          text: 'Porsi Pajak Daerah\ndalam APBD ' + tahun,
          textAlign: 'center',
          fill: '#6B6159',
          font: '11px "Plus Jakarta Sans", sans-serif',
          lineHeight: 14,
        },
      },
    ],
  };
}
