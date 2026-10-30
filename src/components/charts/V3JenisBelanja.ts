/**
 * V3: "Belanja daerah dipakai untuk jenis apa?"
 * File: src/components/charts/V3JenisBelanja.ts
 *
 * Bentuk: Donat dengan drill-down
 * Data: belanja_per_akun (operasi, modal, tidak_terduga, transfer)
 * Interaksi: Klik satu segmen memunculkan rincian akunnya dengan transisi halus dan tombol kembali
 */

import type { BelanjaPerAkunGroup } from '../../data/dataClient.ts';
import { BELANJA_GROUP_COLORS, VIZ_COLORS } from '../../lib/vizColors.ts';
import { formatRupiahRingkas, formatRupiahPenuh, formatPersen } from '../../lib/format.ts';

export interface V3OptionsProps {
  data: BelanjaPerAkunGroup;
  currentGroup?: 'all' | 'operasi' | 'modal' | 'tidak_terduga' | 'transfer';
  tahun?: 2026 | 2025;
  prefersReducedMotion?: boolean;
}

export function createV3Options(props: V3OptionsProps) {
  const { data, currentGroup = 'all', tahun = 2026, prefersReducedMotion } = props;
  const basisTahun = tahun === 2026 ? 'APBD' : 'APBDP';

  // Level 1: 4 Kelompok Belanja
  if (currentGroup === 'all') {
    const sumGroup = (arr: any[]) => arr.reduce((acc, c) => acc + (c.nilai[tahun] || 0), 0);
    const operasiVal = sumGroup(data.operasi);
    const modalVal = sumGroup(data.modal);
    const ttdVal = sumGroup(data.tidak_terduga);
    const transferVal = sumGroup(data.transfer);
    const total = operasiVal + modalVal + ttdVal + transferVal;

    const seriesData = [
      {
        name: 'Belanja Operasi',
        groupId: 'operasi',
        value: operasiVal,
        porsiPersen: formatPersen(total > 0 ? (operasiVal / total) * 100 : 0),
        basis: basisTahun,
        tahun: tahun,
        itemStyle: { color: BELANJA_GROUP_COLORS.operasi, borderColor: '#FFFFFF', borderWidth: 2 },
      },
      {
        name: 'Belanja Modal',
        groupId: 'modal',
        value: modalVal,
        porsiPersen: formatPersen(total > 0 ? (modalVal / total) * 100 : 0),
        basis: basisTahun,
        tahun: tahun,
        itemStyle: { color: BELANJA_GROUP_COLORS.modal, borderColor: '#FFFFFF', borderWidth: 2 },
      },
      {
        name: 'Belanja Tidak Terduga',
        groupId: 'tidak_terduga',
        value: ttdVal,
        porsiPersen: formatPersen(total > 0 ? (ttdVal / total) * 100 : 0),
        basis: basisTahun,
        tahun: tahun,
        itemStyle: { color: BELANJA_GROUP_COLORS.tidak_terduga, borderColor: '#FFFFFF', borderWidth: 2 },
      },
      {
        name: 'Belanja Transfer',
        groupId: 'transfer',
        value: transferVal,
        porsiPersen: formatPersen(total > 0 ? (transferVal / total) * 100 : 0),
        basis: basisTahun,
        tahun: tahun,
        itemStyle: { color: BELANJA_GROUP_COLORS.transfer, borderColor: '#FFFFFF', borderWidth: 2 },
      },
    ];

    return {
      animation: !prefersReducedMotion,
      animationDuration: 750,
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const item = params.data;
          return `
            <div style="font-weight:700; margin-bottom:4px;">${item.name}</div>
            <div>Anggaran: <strong>${formatRupiahRingkas(item.value)}</strong></div>
            <div style="font-size:11px; color:#6B6159;">Nilai Penuh: ${formatRupiahPenuh(item.value)}</div>
            <div>Porsi: <strong>${item.porsiPersen}</strong> dari total belanja</div>
            <div style="font-size:10px; margin-top:4px; color:#8F1414;">[ANGGARAN] Basis ${item.basis} ${item.tahun} • Klik untuk rincian</div>
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
          name: 'Kelompok Belanja APBD',
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['50%', '48%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 4 },
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            fontSize: 11,
          },
          data: seriesData,
        },
      ],
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: '44%',
          style: {
            text: `Total Belanja\n${formatRupiahRingkas(total)}`,
            textAlign: 'center',
            fill: '#1F1A17',
            font: 'bold 15px "Plus Jakarta Sans", sans-serif',
          },
        },
      ],
    };
  }

  // Level 2: Drill-down rincian akun dalam kelompok terpilih
  const groupList = data[currentGroup] || [];
  const groupTotal = groupList.reduce((acc, c) => acc + (c.nilai[tahun] || 0), 0);
  const groupTitle =
    currentGroup === 'operasi'
      ? 'Belanja Operasi'
      : currentGroup === 'modal'
      ? 'Belanja Modal'
      : currentGroup === 'tidak_terduga'
      ? 'Belanja Tidak Terduga'
      : 'Belanja Transfer';

  const subColors = [
    VIZ_COLORS.viz1,
    VIZ_COLORS.viz3,
    VIZ_COLORS.viz5,
    VIZ_COLORS.viz4,
    VIZ_COLORS.viz6,
    VIZ_COLORS.viz2,
  ];

  const seriesData = groupList.map((item, idx) => {
    const val = item.nilai[tahun] || 0;
    const p = groupTotal > 0 ? (val / groupTotal) * 100 : 0;
    return {
      name: item.nama,
      kode: item.kode,
      value: val,
      porsiPersen: formatPersen(p),
      basis: basisTahun,
      tahun: tahun,
      itemStyle: {
        color: subColors[idx % subColors.length],
        borderColor: '#FFFFFF',
        borderWidth: 2,
      },
    };
  });

  return {
    animation: !prefersReducedMotion,
    animationDuration: 750,
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const item = params.data;
        return `
          <div style="font-weight:700; margin-bottom:4px;">${item.name} (${item.kode})</div>
          <div>Anggaran: <strong>${formatRupiahRingkas(item.value)}</strong></div>
          <div style="font-size:11px; color:#6B6159;">Nilai Penuh: ${formatRupiahPenuh(item.value)}</div>
          <div>Porsi: <strong>${item.porsiPersen}</strong> dari ${groupTitle}</div>
          <div style="font-size:10px; margin-top:4px; color:#8F1414;">[ANGGARAN] Basis ${item.basis} ${item.tahun}</div>
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
        name: groupTitle,
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['50%', '48%'],
        avoidLabelOverlap: true,
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          fontSize: 10,
        },
        data: seriesData,
      },
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '44%',
        style: {
          text: `Rincian ${groupTitle}\n${formatRupiahRingkas(groupTotal)}`,
          textAlign: 'center',
          fill: '#1F1A17',
          font: 'bold 13px "Plus Jakarta Sans", sans-serif',
        },
      },
    ],
  };
}
