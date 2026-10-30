/**
 * V4: "Bidang apa yang mendapat porsi belanja terbesar?"
 * File: src/components/charts/V4PorsiBelanjaUrusan.ts
 *
 * Bentuk: Diagram mawar / polar area (roseType: 'area')
 * Data: belanja_per_urusan.data (HANYA porsi_dari_jumlah_urusan_persen dan nama_pendek)
 * Fitur: 8 urusan terbesar, sisanya digabung "Lainnya" (viz-8)
 * PERINGATAN KETAT: Nominal rupiah dilarang keras ditampilkan (indikasi data per urusan terhitung ganda).
 */

import type { BelanjaUrusanPorsiItem } from '../../data/dataClient.ts';
import { getVizPalette, VIZ_COLORS } from '../../lib/vizColors.ts';
import { formatPersen } from '../../lib/format.ts';

export interface V4OptionsProps {
  data: BelanjaUrusanPorsiItem[];
  tahun?: 2026 | 2025;
  prefersReducedMotion?: boolean;
}

export function createV4Options(props: V4OptionsProps) {
  const { data, tahun = 2026, prefersReducedMotion } = props;
  const basisTahun = tahun === 2026 ? 'APBD' : 'APBDP';

  // Urutkan berdasarkan porsi persentase tertinggi
  const sorted = [...data].sort(
    (a, b) => b.porsi_dari_jumlah_urusan_persen[tahun] - a.porsi_dari_jumlah_urusan_persen[tahun]
  );

  const top8 = sorted.slice(0, 8);
  const remaining = sorted.slice(8);
  const remainingPorsi = remaining.reduce(
    (acc, curr) => acc + (curr.porsi_dari_jumlah_urusan_persen[tahun] || 0),
    0
  );

  const palette = getVizPalette();

  const seriesData = top8.map((item, idx) => {
    const p = item.porsi_dari_jumlah_urusan_persen[tahun];
    return {
      name: item.nama_pendek,
      value: p,
      kode: item.kode,
      kelompok: item.kelompok,
      porsiStr: formatPersen(p),
      basis: basisTahun,
      tahun: tahun,
      itemStyle: {
        color: palette[idx % palette.length],
        borderColor: '#FFFFFF',
        borderWidth: 2,
      },
    };
  });

  // Tambahkan segmen gabungan "Lainnya"
  if (remainingPorsi > 0) {
    seriesData.push({
      name: 'Lainnya (36 Urusan Lain)',
      value: Math.round(remainingPorsi * 100) / 100,
      kode: '—',
      kelompok: 'Gabungan urusan lainnya',
      porsiStr: formatPersen(remainingPorsi),
      basis: basisTahun,
      tahun: tahun,
      itemStyle: {
        color: VIZ_COLORS.viz8,
        borderColor: '#FFFFFF',
        borderWidth: 2,
      },
    });
  }

  return {
    animation: !prefersReducedMotion,
    animationDuration: 850,
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const item = params.data;
        const kodeText = item.kode !== '—' ? ` (${item.kode})` : '';
        return `
          <div style="font-weight:700; margin-bottom:4px;">${item.name}${kodeText}</div>
          <div>Porsi Anggaran: <strong>${item.porsiStr}</strong></div>
          <div style="font-size:11px; color:#6B6159; margin-top:2px;">Kelompok: ${item.kelompok}</div>
          <div style="font-size:10px; margin-top:4px; color:#8F1414;">[ANGGARAN] Basis ${item.basis} ${item.tahun} • Nominal ditahan sesuai aturan konsistensi data</div>
        `;
      },
    },
    legend: {
      bottom: 0,
      left: 'center',
      textStyle: { fontSize: 11 },
    },
    series: [
      {
        name: 'Porsi Urusan Belanja',
        type: 'pie',
        radius: ['20%', '75%'],
        center: ['50%', '46%'],
        roseType: 'area', // Nilai dipetakan ke luas agar persepsi ukuran jujur
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 5,
        },
        label: {
          show: true,
          formatter: '{b}\n{c}%',
          fontSize: 10,
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 12,
        },
        data: seriesData,
      },
    ],
  };
}
