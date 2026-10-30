/**
 * paJAK-Kita — Logika Visualisasi Data Grafik (Apache ECharts)
 * File: js/charts.js
 *
 * Mengimplementasikan:
 * - V1: Half Donut ("Dari mana uang daerah Jakarta berasal?")
 * - V2: Double Ring ("Seberapa besar peran pajak daerah?")
 * - V3: Donut Drill-down ("Belanja daerah dipakai untuk jenis apa?")
 * - V4: Rose Polar Area ("Bidang apa yang mendapat porsi belanja terbesar?")
 * - V5: Area Chart ("Bagaimana anggaran Jakarta bergerak 2022 sampai 2026?")
 * - V6: Batang Divergen ("Apa yang berubah dari 2025 ke 2026?")
 * - Interaksi InfoModal saat segmen diklik
 * - Tampilan Tabel Aksesibel ("Lihat sebagai tabel")
 * - Ekspor Gambar PNG ("Unduh gambar")
 * - Dukungan prefers-reduced-motion
 */

import {
  getPendapatanPerAkun,
  getBelanjaPerAkun,
  getBelanjaPerUrusanPorsi,
  getRingkasanApbd,
  getMeta,
  getRealisasiPerAkun,
} from './dataClient.js';

import {
  formatRupiahRingkas,
  formatRupiahPenuh,
  formatPersen,
} from './format.js';

import {
  VIZ_COLORS,
  AKUN_PENDAPATAN_COLORS,
  BELANJA_GROUP_COLORS,
  getContrastTextColor,
  getVizPalette,
} from './vizColors.js';

import { getEchartsTheme } from './echartsTheme.js';

// State global visualisasi
const chartInstances = {};
let stateData = {
  meta: null,
  pendapatan: [],
  belanja: null,
  urusanPorsi: [],
  ringkasan: null,
  realisasi: null,
};

let v1Year = '2026';
let v1Mode = 'anggaran'; // 'anggaran' | 'realisasi'
let v2Year = '2026';
let v2Mode = 'anggaran'; // 'anggaran' | 'realisasi'
let v3GroupKey = null; // null = level 1, string = drilled group
let v4Year = '2026';
let v5Basis = 'apbd'; // 'apbd' | 'apbdp'
let v6Mode = 'rupiah'; // 'rupiah' | 'persen'

const prefersReducedMotion = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// =============================================================================
// PEMBUAT OPSI GRAFIK (ECharts Options)
// =============================================================================

function getV1Options(data, year, mode = 'anggaran', realisasiData = null) {
  const isRealisasi = mode === 'realisasi';
  let items;
  let total;

  if (isRealisasi && realisasiData?.pendapatan?.rincian) {
    items = realisasiData.pendapatan.rincian.map((item) => ({
      name: item.nama,
      kode: item.kode,
      value: item.realisasi || 0,
      anggaran: item.anggaran || 0,
      persen: item.persen || 0,
      itemStyle: {
        color: AKUN_PENDAPATAN_COLORS[item.kode] || VIZ_COLORS.viz8,
      },
      selected: item.kode === '4.1.01',
    }));
    total = realisasiData.pendapatan.jumlah?.realisasi || items.reduce((sum, item) => sum + item.value, 0);
  } else {
    const yearKey = String(year);
    items = data.map((item) => ({
      name: item.nama,
      kode: item.kode,
      value: item.nilai[yearKey] || 0,
      itemStyle: {
        color: AKUN_PENDAPATAN_COLORS[item.kode] || VIZ_COLORS.viz8,
      },
      selected: item.kode === '4.1.01',
    }));
    total = items.reduce((sum, item) => sum + item.value, 0);
  }

  const pajakItem = items.find((i) => i.kode === '4.1.01');
  const pajakPersen = total > 0 && pajakItem ? (pajakItem.value / total) * 100 : 0;

  return {
    animation: !prefersReducedMotion(),
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const item = items[params.dataIndex];
        const val = params.value;
        const persen = total > 0 ? (val / total) * 100 : 0;
        if (isRealisasi) {
          return `
            <div style="font-weight:700; margin-bottom:4px;">${item.name} (${item.kode})</div>
            <div>Realisasi: <strong>${formatRupiahRingkas(val)}</strong></div>
            <div style="font-size:11px; color:#6B6159;">(${formatRupiahPenuh(val)})</div>
            <div>Porsi Realisasi: <strong>${formatPersen(persen)}</strong></div>
            <div>Capaian terhadap Anggaran: <strong>${formatPersen(item.persen)}</strong></div>
            <div style="font-size:10px; margin-top:4px; color:#1C6E8C;">[REALISASI] Per 25 Oktober 2026</div>
          `;
        }
        return `
          <div style="font-weight:700; margin-bottom:4px;">${item.name} (${item.kode})</div>
          <div>Nilai: <strong>${formatRupiahRingkas(val)}</strong></div>
          <div style="font-size:11px; color:#6B6159;">(${formatRupiahPenuh(val)})</div>
          <div>Porsi: <strong>${formatPersen(persen)}</strong></div>
          <div style="font-size:11px; margin-top:4px; color:#6B6159;">Klik untuk melihat rincian akun</div>
        `;
      },
    },
    series: [
      {
        name: isRealisasi ? 'Realisasi Pendapatan' : 'Sumber Pendapatan',
        type: 'pie',
        radius: ['52%', '82%'],
        center: ['50%', '70%'],
        startAngle: 180,
        endAngle: 360,
        avoidLabelOverlap: true,
        selectedMode: 'single',
        selectedOffset: 12,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#ffffff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: (params) => {
            const pct = total > 0 ? (params.value / total) * 100 : 0;
            return pct >= 12 ? `${params.name}\n${formatPersen(pct)}` : `${formatPersen(pct)}`;
          },
          fontSize: 11,
          fontWeight: 600,
        },
        labelLine: {
          show: true,
          length: 12,
          length2: 14,
          lineStyle: { color: '#B3A89B' },
        },
        data: items,
      },
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '64%',
        style: {
          text: isRealisasi
            ? `Realisasi Pendapatan\n(per 25 Okt 2026)\n${formatRupiahRingkas(total)}`
            : `Total Pendapatan (${year})\n${formatRupiahRingkas(total)}`,
          textAlign: 'center',
          fill: '#1F1A17',
          fontSize: 13,
          fontWeight: 'bold',
          lineHeight: 18,
        },
      },
    ],
  };
}

function getV2Options(data, year, mode = 'anggaran', realisasiData = null) {
  const isRealisasi = mode === 'realisasi';
  let total;
  let pajakValue;
  let outerData;

  if (isRealisasi && realisasiData?.pendapatan?.rincian) {
    const items = realisasiData.pendapatan.rincian;
    total = realisasiData.pendapatan.jumlah?.realisasi || items.reduce((sum, item) => sum + item.realisasi, 0);
    const pajakItem = items.find((i) => i.kode === '4.1.01');
    pajakValue = pajakItem ? pajakItem.realisasi || 0 : 0;

    outerData = [
      {
        name: 'Pajak Daerah',
        kode: '4.1.01',
        value: pajakValue,
        itemStyle: { color: VIZ_COLORS.viz1 },
      },
      ...items
        .filter((i) => i.kode !== '4.1.01')
        .map((item) => ({
          name: item.nama,
          kode: item.kode,
          value: item.realisasi || 0,
          itemStyle: {
            color: AKUN_PENDAPATAN_COLORS[item.kode] || VIZ_COLORS.viz8,
          },
        })),
    ];
  } else {
    const yearKey = String(year);
    total = data.reduce((sum, item) => sum + (item.nilai[yearKey] || 0), 0);
    const pajakItem = data.find((i) => i.kode === '4.1.01');
    pajakValue = pajakItem ? pajakItem.nilai[yearKey] || 0 : 0;

    outerData = [
      {
        name: 'Pajak Daerah',
        kode: '4.1.01',
        value: pajakValue,
        itemStyle: { color: VIZ_COLORS.viz1 },
      },
      ...data
        .filter((i) => i.kode !== '4.1.01')
        .map((item) => ({
          name: item.nama,
          kode: item.kode,
          value: item.nilai[yearKey] || 0,
          itemStyle: {
            color: AKUN_PENDAPATAN_COLORS[item.kode] || VIZ_COLORS.viz8,
          },
        })),
    ];
  }

  const nonPajakValue = total - pajakValue;
  const pajakPersen = total > 0 ? (pajakValue / total) * 100 : 0;

  const innerData = [
    {
      name: 'Pajak Daerah',
      kode: '4.1.01',
      value: pajakValue,
      itemStyle: { color: VIZ_COLORS.viz1 },
    },
    {
      name: 'Sumber Pendapatan Lain',
      kode: 'NON_PAJAK',
      value: nonPajakValue,
      itemStyle: { color: '#EAE4DC' },
    },
  ];

  return {
    animation: !prefersReducedMotion(),
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const val = params.value;
        const pct = total > 0 ? (val / total) * 100 : 0;
        return `
          <div style="font-weight:700; margin-bottom:4px;">${params.name}</div>
          <div>${isRealisasi ? 'Realisasi' : 'Nilai'}: <strong>${formatRupiahRingkas(val)}</strong></div>
          <div style="font-size:11px; color:#6B6159;">(${formatRupiahPenuh(val)})</div>
          <div>Porsi: <strong>${formatPersen(pct)}</strong></div>
          <div style="font-size:10px; margin-top:4px; color:${isRealisasi ? '#1C6E8C' : '#8F1414'};">[${isRealisasi ? 'REALISASI Per 25 Okt 2026' : `ANGGARAN Basis APBD ${year}`}]</div>
        `;
      },
    },
    series: [
      {
        name: 'Peran Pajak',
        type: 'pie',
        radius: ['34%', '52%'],
        center: ['50%', '50%'],
        itemStyle: {
          borderColor: '#ffffff',
          borderWidth: 2,
        },
        label: { show: false },
        data: innerData,
      },
      {
        name: 'Rincian Sumber Lain',
        type: 'pie',
        radius: ['58%', '78%'],
        center: ['50%', '50%'],
        itemStyle: {
          borderColor: '#ffffff',
          borderWidth: 2,
        },
        label: {
          formatter: (params) => {
            if (params.name === 'Pajak Daerah') return '';
            const pct = total > 0 ? (params.value / total) * 100 : 0;
            return pct >= 3 ? `${params.name}\n${formatPersen(pct)}` : '';
          },
          fontSize: 10,
        },
        labelLine: {
          show: true,
          length: 8,
          length2: 10,
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
          text: isRealisasi
            ? `${formatPersen(pajakPersen)}\nPAJAK DAERAH\n(Realisasi)`
            : `${formatPersen(pajakPersen)}\nPAJAK DAERAH`,
          textAlign: 'center',
          fill: VIZ_COLORS.viz1,
          fontSize: 14,
          fontWeight: 800,
          lineHeight: 18,
        },
      },
    ],
  };
}

function sumBelanjaItems(arr, year = '2026') {
  if (!Array.isArray(arr)) return 0;
  return arr.reduce((acc, item) => {
    let val = 0;
    if (item.nilai && item.nilai[year] !== undefined) {
      val = item.nilai[year];
    } else if (item.nilai_2026 !== undefined) {
      val = item.nilai_2026;
    } else if (typeof item.nilai === 'number') {
      val = item.nilai;
    }
    const cleanNum = typeof val === 'string' ? Number(val.replace(/[^0-9.-]+/g, '')) : Number(val || 0);
    return acc + (isNaN(cleanNum) ? 0 : cleanNum);
  }, 0);
}

function getV3Options(belanjaData, groupKey = null) {
  if (!belanjaData) {
    return { isDrilled: false, options: {} };
  }

  const rawGroups = [
    { key: 'operasi', nama: 'Belanja Operasi', items: belanjaData.operasi || [], color: BELANJA_GROUP_COLORS.operasi },
    { key: 'modal', nama: 'Belanja Modal', items: belanjaData.modal || [], color: BELANJA_GROUP_COLORS.modal },
    { key: 'tidak_terduga', nama: 'Belanja Tidak Terduga', items: belanjaData.tidak_terduga || [], color: BELANJA_GROUP_COLORS.tidak_terduga },
    { key: 'transfer', nama: 'Belanja Transfer', items: belanjaData.transfer || [], color: BELANJA_GROUP_COLORS.transfer },
  ];

  const groups = rawGroups.map((g) => ({
    ...g,
    total: sumBelanjaItems(g.items, '2026'),
  }));

  const totalBelanja = groups.reduce((sum, g) => sum + g.total, 0);

  if (groupKey && belanjaData[groupKey]) {
    const selectedGroup = groups.find((g) => g.key === groupKey);
    const subItems = (selectedGroup?.items || []).map((sub, idx) => {
      let val = sub.nilai?.['2026'] ?? sub.nilai_2026 ?? (typeof sub.nilai === 'number' ? sub.nilai : 0);
      const cleanVal = typeof val === 'string' ? Number(val.replace(/[^0-9.-]+/g, '')) : Number(val || 0);
      const finalVal = isNaN(cleanVal) ? 0 : cleanVal;
      return {
        name: sub.nama,
        kode: sub.kode,
        value: finalVal,
        itemStyle: {
          color: idx === 0 ? selectedGroup.color : getVizPalette()[(idx + 1) % 8],
        },
      };
    });

    const groupTotal = selectedGroup ? selectedGroup.total : 0;

    return {
      isDrilled: true,
      groupName: selectedGroup?.nama || 'Rincian',
      options: {
        animation: !prefersReducedMotion(),
        tooltip: {
          trigger: 'item',
          formatter: (params) => {
            const val = params.value;
            const pctDariGroup = groupTotal > 0 ? (val / groupTotal) * 100 : 0;
            const pctDariTotal = totalBelanja > 0 ? (val / totalBelanja) * 100 : 0;
            return `
              <div style="font-weight:700; margin-bottom:4px;">${params.name} (${params.data?.kode || ''})</div>
              <div>Nilai: <strong>${formatRupiahRingkas(val)}</strong></div>
              <div style="font-size:11px; color:#6B6159;">(${formatRupiahPenuh(val)})</div>
              <div>Porsi dari ${selectedGroup?.nama || 'Kelompok'}: <strong>${formatPersen(pctDariGroup)}</strong></div>
              <div>Porsi dari Total Belanja: <strong>${formatPersen(pctDariTotal)}</strong></div>
            `;
          },
        },
        series: [
          {
            name: selectedGroup?.nama || 'Rincian Belanja',
            type: 'pie',
            radius: ['45%', '75%'],
            center: ['50%', '50%'],
            itemStyle: {
              borderColor: '#ffffff',
              borderWidth: 2,
            },
            label: {
              formatter: (params) => {
                const pct = groupTotal > 0 ? (params.value / groupTotal) * 100 : 0;
                return pct >= 5 ? `${params.name}\n${formatPersen(pct)}` : '';
              },
              fontSize: 10,
            },
            data: subItems,
          },
        ],
        graphic: [
          {
            type: 'text',
            left: 'center',
            top: '46%',
            style: {
              text: `${formatRupiahRingkas(groupTotal)}\n${selectedGroup?.nama || ''}`,
              textAlign: 'center',
              fill: '#1F1A17',
              fontSize: 13,
              fontWeight: 800,
              lineHeight: 16,
            },
          },
        ],
      },
    };
  }

  // Level 1: 4 kelompok belanja
  const seriesData = groups.map((g) => ({
    name: g.nama,
    key: g.key,
    value: g.total,
    itemStyle: { color: g.color },
  }));

  return {
    isDrilled: false,
    options: {
      animation: !prefersReducedMotion(),
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const val = params.value;
          const pct = totalBelanja > 0 ? (val / totalBelanja) * 100 : 0;
          return `
            <div style="font-weight:700; margin-bottom:4px;">${params.name}</div>
            <div>Nilai: <strong>${formatRupiahRingkas(val)}</strong></div>
            <div style="font-size:11px; color:#6B6159;">(${formatRupiahPenuh(val)})</div>
            <div>Porsi: <strong>${formatPersen(pct)}</strong></div>
            <div style="font-size:11px; margin-top:4px; color:#B91C1C; font-weight:600;">Klik untuk drill-down ke rincian akun</div>
          `;
        },
      },
      series: [
        {
          name: 'Kelompok Belanja',
          type: 'pie',
          radius: ['45%', '75%'],
          center: ['50%', '50%'],
          itemStyle: {
            borderColor: '#ffffff',
            borderWidth: 2,
          },
          label: {
            formatter: (params) => {
              const pct = totalBelanja > 0 ? (params.value / totalBelanja) * 100 : 0;
              return `${params.name}\n${formatPersen(pct)}`;
            },
            fontSize: 11,
            fontWeight: 600,
          },
          data: seriesData,
        },
      ],
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: '46%',
          style: {
            text: `Total Belanja 2026\n${formatRupiahRingkas(totalBelanja)}`,
            textAlign: 'center',
            fill: '#1F1A17',
            fontSize: 13,
            fontWeight: 800,
            lineHeight: 16,
          },
        },
      ],
    },
  };
}

function getV4Options(urusanList, year) {
  const sorted = [...urusanList].sort(
    (a, b) => b.porsi_dari_jumlah_urusan_persen - a.porsi_dari_jumlah_urusan_persen
  );

  const top8 = sorted.slice(0, 8);
  const remaining = sorted.slice(8);
  const remainingPersen = remaining.reduce(
    (sum, item) => sum + item.porsi_dari_jumlah_urusan_persen,
    0
  );

  const palette = getVizPalette();

  const seriesData = top8.map((item, index) => ({
    name: item.nama_pendek,
    kode: item.kode,
    value: Number(item.porsi_dari_jumlah_urusan_persen.toFixed(2)),
    itemStyle: { color: palette[index % 7] },
  }));

  if (remainingPersen > 0) {
    seriesData.push({
      name: 'Urusan Lainnya',
      kode: 'LAINNYA',
      value: Number(remainingPersen.toFixed(2)),
      itemStyle: { color: VIZ_COLORS.viz8 },
    });
  }

  return {
    animation: !prefersReducedMotion(),
    tooltip: {
      trigger: 'item',
      formatter: (params) => `
        <div style="font-weight:700; margin-bottom:4px;">${params.name} (${params.data.kode})</div>
        <div>Porsi dari Jumlah Urusan: <strong>${formatPersen(params.value)}</strong></div>
        <div style="font-size:11px; color:#B07A0A; margin-top:4px;">
          * Nominal rupiah ditahan sesuai rujukan dokumen resmi BPKD (indikasi terhitung ganda).
        </div>
      `,
    },
    series: [
      {
        name: 'Porsi Urusan',
        type: 'pie',
        roseType: 'area',
        radius: ['20%', '80%'],
        center: ['50%', '50%'],
        itemStyle: {
          borderRadius: 6,
          borderColor: '#ffffff',
          borderWidth: 2,
        },
        label: {
          formatter: (params) => `${params.name}\n${formatPersen(params.value)}`,
          fontSize: 10,
          fontWeight: 600,
        },
        labelLine: {
          length: 6,
          length2: 8,
        },
        data: seriesData,
      },
    ],
  };
}

function getV5Options(ringkasan, basis = 'apbd') {
  const belanjaArr = ringkasan.belanja || [];
  const pendapatanArr = ringkasan.pendapatan || [];

  const years = belanjaArr.map((item) => String(item.tahun));
  const basisKey = basis === 'apbdp' ? 'apbdp' : 'apbd';

  const belanjaValues = belanjaArr.map((item) => item[basisKey]);
  const pendapatanValues = pendapatanArr.map((item) => item[basisKey]);

  // Cari max, min, dan delta 2025-2026
  let maxBelanja = -Infinity;
  let maxBelanjaIdx = 0;
  let minBelanja = Infinity;
  let minBelanjaIdx = 0;

  belanjaValues.forEach((val, idx) => {
    if (val > maxBelanja) {
      maxBelanja = val;
      maxBelanjaIdx = idx;
    }
    if (val < minBelanja) {
      minBelanja = val;
      minBelanjaIdx = idx;
    }
  });

  const delta2526 = belanjaValues[4] - belanjaValues[3];
  const deltaPct = belanjaValues[3] > 0 ? (delta2526 / belanjaValues[3]) * 100 : 0;

  return {
    animation: !prefersReducedMotion(),
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let html = `<div style="font-weight:700; margin-bottom:6px;">Tahun ${params[0].axisValue} (${basis.toUpperCase()})</div>`;
        params.forEach((p) => {
          html += `
            <div style="display:flex; justify-content:space-between; gap:16px; font-size:12px;">
              <span>${p.marker} ${p.seriesName}:</span>
              <strong>${formatRupiahRingkas(p.value)}</strong>
            </div>
            <div style="font-size:10px; color:#6B6159; text-align:right;">(${formatRupiahPenuh(p.value)})</div>
          `;
        });
        return html;
      },
    },
    legend: {
      data: ['Belanja Daerah', 'Pendapatan Daerah'],
      bottom: 0,
      textStyle: { fontSize: 11 },
    },
    grid: {
      top: 36,
      left: 12,
      right: 24,
      bottom: 36,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: years,
      axisLine: { lineStyle: { color: '#D4C9BC' } },
      axisLabel: { fontWeight: 600, color: '#1F1A17' },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (val) => formatRupiahRingkas(val),
        color: '#6B6159',
      },
      splitLine: {
        lineStyle: { color: '#EAE4DC', type: 'dashed' },
      },
    },
    series: [
      {
        name: 'Belanja Daerah',
        type: 'line',
        data: belanjaValues,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: VIZ_COLORS.viz1 },
        lineStyle: { width: 3 },
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
          symbolSize: 42,
          data: [
            {
              name: 'Tertinggi',
              coord: [years[maxBelanjaIdx], maxBelanja],
              value: 'Max',
              itemStyle: { color: VIZ_COLORS.viz1 },
            },
            {
              name: 'Terendah',
              coord: [years[minBelanjaIdx], minBelanja],
              value: 'Min',
              itemStyle: { color: VIZ_COLORS.viz3 },
            },
          ],
        },
      },
      {
        name: 'Pendapatan Daerah',
        type: 'line',
        data: pendapatanValues,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: VIZ_COLORS.viz2 },
        lineStyle: { width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(176, 122, 10, 0.25)' },
              { offset: 1, color: 'rgba(176, 122, 10, 0.02)' },
            ],
          },
        },
      },
    ],
  };
}

function getV6Options(data, mode = 'rupiah') {
  const deltas = data.map((item) => {
    const val26 = item.nilai['2026'] || 0;
    const val25 = item.nilai['2025'] || 0;
    const deltaNominal = val26 - val25;
    const deltaPersen = val25 > 0 ? (deltaNominal / val25) * 100 : 0;
    return {
      nama: item.nama,
      kode: item.kode,
      deltaNominal,
      deltaPersen,
    };
  });

  // Urutkan dari delta tertinggi ke terendah
  const sorted = [...deltas].sort((a, b) =>
    mode === 'rupiah' ? a.deltaNominal - b.deltaNominal : a.deltaPersen - b.deltaPersen
  );

  const categories = sorted.map((d) => d.nama);
  const values = sorted.map((d) => (mode === 'rupiah' ? d.deltaNominal : Number(d.deltaPersen.toFixed(2))));

  return {
    animation: !prefersReducedMotion(),
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const item = sorted[params[0].dataIndex];
        return `
          <div style="font-weight:700; margin-bottom:4px;">${item.nama} (${item.kode})</div>
          <div>Perubahan Nominal: <strong>${item.deltaNominal >= 0 ? '+' : ''}${formatRupiahRingkas(item.deltaNominal)}</strong></div>
          <div style="font-size:11px; color:#6B6159;">(${formatRupiahPenuh(item.deltaNominal)})</div>
          <div>Perubahan Persen: <strong>${item.deltaPersen >= 0 ? '+' : ''}${formatPersen(item.deltaPersen)}</strong></div>
          <div style="font-size:10px; color:#B07A0A; margin-top:4px;">
            * Basis 2025: APBDP, Basis 2026: APBD
          </div>
        `;
      },
    },
    grid: {
      top: 16,
      left: 12,
      right: 48,
      bottom: 24,
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        formatter: (val) => (mode === 'rupiah' ? formatRupiahRingkas(val) : `${val}%`),
        color: '#6B6159',
      },
      splitLine: {
        lineStyle: { color: '#EAE4DC', type: 'dashed' },
      },
    },
    yAxis: {
      type: 'category',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        fontSize: 11,
        color: '#1F1A17',
        width: 140,
        overflow: 'truncate',
      },
      data: categories,
    },
    series: [
      {
        name: 'Perubahan',
        type: 'bar',
        data: values.map((val) => ({
          value: val,
          itemStyle: {
            color: val >= 0 ? VIZ_COLORS.viz5 : VIZ_COLORS.viz1,
            borderRadius: val >= 0 ? [0, 4, 4, 0] : [4, 0, 0, 4],
          },
        })),
        label: {
          show: true,
          position: 'right',
          formatter: (params) => {
            const v = params.value;
            if (mode === 'rupiah') {
              return (v >= 0 ? '+' : '') + formatRupiahRingkas(v);
            }
            return (v >= 0 ? '+' : '') + `${formatPersen(v)}`;
          },
          fontSize: 10,
          fontWeight: 600,
        },
      },
    ],
  };
}

// =============================================================================
// MODAL & DRAWER PENJELASAN AKUN (InfoModal)
// =============================================================================

function showInfoModal({ kode, nama, nilai, porsi, tahun, sumber, basis }) {
  const modalContainer = document.getElementById('info-modal-container');
  if (!modalContainer) return;

  const nilaiText = nilai !== undefined ? formatRupiahRingkas(nilai) : 'Sesuai rujukan resmi';
  const nilaiPenuhText = nilai !== undefined ? formatRupiahPenuh(nilai) : 'Nominal ditahan dari tampilan publik';
  const porsiText = porsi !== undefined ? formatPersen(porsi) : '-';

  modalContainer.innerHTML = `
    <div class="info-modal-backdrop is-open" id="info-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="info-modal-title">
      <div class="info-modal-card">
        <button class="info-modal-close" id="info-modal-close-btn" aria-label="Tutup jendela penjelasan">×</button>
        
        <span class="info-modal-code">${kode || 'AKUN'}</span>
        <h3 class="info-modal-title" id="info-modal-title">${nama}</h3>
        
        <div class="info-modal-stats">
          <div class="info-modal-stat-box">
            <div class="info-modal-stat-label">Anggaran (${tahun || '2026'})</div>
            <div class="info-modal-stat-val">${nilaiText}</div>
            <div style="font-size:11px; color:var(--color-muted); margin-top:2px;">${nilaiPenuhText}</div>
          </div>
          <div class="info-modal-stat-box">
            <div class="info-modal-stat-label">Proporsi / Porsi</div>
            <div class="info-modal-stat-val">${porsiText}</div>
            <div style="font-size:11px; color:var(--color-muted); margin-top:2px;">Terhadap total kategori</div>
          </div>
        </div>

        <div class="info-modal-explanation">
          <div class="info-modal-explanation-title">
            <span aria-hidden="true">ⓘ</span> Status Penjelasan Resmi
          </div>
          <p class="info-modal-explanation-text">
            Penjelasan menyusul (menunggu rujukan dokumen resmi bersumber). Platform paJAK-Kita tidak mengarang definisi demi transparansi publik.
          </p>
        </div>

        <div class="trust-source-badge" role="note" style="margin-top:0;">
          <span class="badge-tag-anggaran">[ANGGARAN]</span>
          <span class="badge-info">Basis <strong>${basis || 'APBD 2026'}</strong></span>
          <span class="badge-separator" aria-hidden="true">•</span>
          <span class="badge-source">Sumber: <em>${sumber || 'Dashboard Keuangan Daerah BPKD Provinsi DKI Jakarta'}</em></span>
        </div>
      </div>
    </div>
  `;

  // Listener untuk close
  const closeBtn = document.getElementById('info-modal-close-btn');
  const backdrop = document.getElementById('info-modal-backdrop');

  const closeModal = () => {
    backdrop.classList.remove('is-open');
    setTimeout(() => {
      modalContainer.innerHTML = '';
    }, 250);
  };

  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  const onKeydown = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', onKeydown);
    }
  };
  document.addEventListener('keydown', onKeydown);
}

// =============================================================================
// TABEL DATA AKSESIBEL ("Lihat Sebagai Tabel")
// =============================================================================

function toggleTable(cardId, tableData) {
  const container = document.getElementById(`${cardId}-table`);
  const btn = document.querySelector(`[data-table-toggle="${cardId}"]`);
  if (!container) return;

  const isHidden = container.style.display === 'none' || container.hidden;

  if (isHidden) {
    let rowsHtml = '';
    tableData.rows.forEach((row) => {
      rowsHtml += `
        <tr>
          ${row.map((cell) => `<td>${cell}</td>`).join('')}
        </tr>
      `;
    });

    container.innerHTML = `
      <table aria-label="${tableData.caption}">
        <caption class="sr-only" style="position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); border:0;">
          ${tableData.caption}
        </caption>
        <thead>
          <tr>
            ${tableData.headers.map((h) => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;
    container.style.display = 'block';
    container.hidden = false;
    if (btn) {
      btn.setAttribute('aria-expanded', 'true');
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>
        Sembunyikan tabel
      `;
    }
  } else {
    container.style.display = 'none';
    container.hidden = true;
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3V3zm0 6h18M3 15h18M9 3v18M15 3v18"/></svg>
        Lihat sebagai tabel
      `;
    }
  }
}

// =============================================================================
// UNDUH GAMBAR PNG
// =============================================================================

function exportChartPNG(chartInstance, filename = 'pajak-kita-grafik.png') {
  if (!chartInstance) return;
  const url = chartInstance.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: '#ffffff',
  });

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// =============================================================================
// INISIALISASI SETIAP GRAFIK
// =============================================================================

function initV1() {
  const mount = document.getElementById('chart-v1');
  const skeleton = document.getElementById('chart-v1-skeleton');
  if (!mount) return;

  const chart = window.echarts.init(mount, getEchartsTheme());
  chartInstances.v1 = chart;

  const update = () => {
    try {
      const opts = getV1Options(stateData.pendapatan, v1Year, v1Mode, stateData.realisasi);
      chart.setOption(opts, true);
    } catch (err) {
      console.error('[paJAK-Kita] Error rendering V1:', err);
    } finally {
      if (skeleton) skeleton.classList.add('is-hidden');
    }
  };

  update();

  chart.on('click', (params) => {
    const item = stateData.pendapatan.find((p) => p.kode === params.data.kode) || params.data;
    const total = stateData.pendapatan.reduce((sum, p) => sum + (p.nilai[v1Year] || 0), 0);
    const porsi = total > 0 ? ((item.nilai ? item.nilai[v1Year] : params.value) / total) * 100 : 0;
    showInfoModal({
      kode: item.kode,
      nama: item.nama || params.name,
      nilai: item.nilai ? item.nilai[v1Year] : params.value,
      porsi,
      tahun: v1Year,
      basis: v1Mode === 'realisasi' ? 'Realisasi 25 Okt 2026' : `APBD ${v1Year}`,
      sumber: stateData.meta?.sumber?.nama,
    });
  });

  // Listener pill toggle year
  document.querySelectorAll('[data-chart="v1"][data-year]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('[data-chart="v1"][data-year]').forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');
      v1Year = e.target.dataset.year;
      update();
    });
  });

  // Listener pill toggle mode (Anggaran vs Realisasi)
  document.querySelectorAll('[data-chart="v1"][data-mode]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('[data-chart="v1"][data-mode]').forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');
      v1Mode = e.target.dataset.mode;
      update();
    });
  });

  // Table toggle
  document.querySelector('[data-table-toggle="chart-v1"]')?.addEventListener('click', () => {
    const total = stateData.pendapatan.reduce((sum, p) => sum + (p.nilai[v1Year] || 0), 0);
    const tableData = {
      caption: `Tabel Pendapatan Daerah Jakarta ${v1Year}`,
      headers: ['Kode', 'Nama Akun', `Nilai (${v1Year})`, 'Porsi'],
      rows: stateData.pendapatan.map((p) => {
        const val = p.nilai[v1Year] || 0;
        const pct = total > 0 ? (val / total) * 100 : 0;
        return [p.kode, p.nama, formatRupiahRingkas(val), formatPersen(pct)];
      }),
    };
    toggleTable('chart-v1', tableData);
  });

  // Download PNG
  document.querySelector('[data-export="chart-v1"]')?.addEventListener('click', () => {
    exportChartPNG(chart, `pajak-kita-v1-sumber-pendapatan-${v1Year}.png`);
  });
}

function initV2() {
  const mount = document.getElementById('chart-v2');
  const skeleton = document.getElementById('chart-v2-skeleton');
  if (!mount) return;

  const chart = window.echarts.init(mount, getEchartsTheme());
  chartInstances.v2 = chart;

  const update = () => {
    try {
      const opts = getV2Options(stateData.pendapatan, v2Year, v2Mode, stateData.realisasi);
      chart.setOption(opts, true);
    } catch (err) {
      console.error('[paJAK-Kita] Error rendering V2:', err);
    } finally {
      if (skeleton) skeleton.classList.add('is-hidden');
    }
  };

  update();

  chart.on('click', (params) => {
    if (params.data.kode === 'NON_PAJAK') return;
    const item = stateData.pendapatan.find((p) => p.kode === params.data.kode) || params.data;
    const total = stateData.pendapatan.reduce((sum, p) => sum + (p.nilai[v2Year] || 0), 0);
    const porsi = total > 0 ? ((item.nilai ? item.nilai[v2Year] : params.value) / total) * 100 : 0;
    showInfoModal({
      kode: item.kode,
      nama: item.nama || params.name,
      nilai: item.nilai ? item.nilai[v2Year] : params.value,
      porsi,
      tahun: v2Year,
      basis: v2Mode === 'realisasi' ? 'Realisasi 25 Okt 2026' : `APBD ${v2Year}`,
      sumber: stateData.meta?.sumber?.nama,
    });
  });

  // Listener pill toggle year
  document.querySelectorAll('[data-chart="v2"][data-year]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('[data-chart="v2"][data-year]').forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');
      v2Year = e.target.dataset.year;
      update();
    });
  });

  // Listener pill toggle mode (Anggaran vs Realisasi)
  document.querySelectorAll('[data-chart="v2"][data-mode]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('[data-chart="v2"][data-mode]').forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');
      v2Mode = e.target.dataset.mode;
      update();
    });
  });

  // Table toggle
  document.querySelector('[data-table-toggle="chart-v2"]')?.addEventListener('click', () => {
    const total = stateData.pendapatan.reduce((sum, p) => sum + (p.nilai[v2Year] || 0), 0);
    const tableData = {
      caption: `Tabel Peran Pajak Daerah Jakarta ${v2Year}`,
      headers: ['Kelompok / Akun', `Nilai (${v2Year})`, 'Porsi'],
      rows: stateData.pendapatan.map((p) => {
        const val = p.nilai[v2Year] || 0;
        const pct = total > 0 ? (val / total) * 100 : 0;
        return [p.nama, formatRupiahRingkas(val), formatPersen(pct)];
      }),
    };
    toggleTable('chart-v2', tableData);
  });

  // Download PNG
  document.querySelector('[data-export="chart-v2"]')?.addEventListener('click', () => {
    exportChartPNG(chart, `pajak-kita-v2-peran-pajak-daerah-${v2Year}.png`);
  });
}

function initV3() {
  const mount = document.getElementById('chart-v3');
  const skeleton = document.getElementById('chart-v3-skeleton');
  const drillBar = document.getElementById('chart-v3-drill-bar');
  const drillTitle = document.getElementById('chart-v3-drill-title');
  const backBtn = document.getElementById('chart-v3-back-btn');
  if (!mount) return;

  const chart = window.echarts.init(mount, getEchartsTheme());
  chartInstances.v3 = chart;

  const update = () => {
    try {
      const result = getV3Options(stateData.belanja, v3GroupKey);
      chart.setOption(result.options, true);

      if (result.isDrilled) {
        if (drillBar) drillBar.style.display = 'flex';
        if (drillTitle) drillTitle.textContent = `Rincian: ${result.groupName}`;
      } else {
        if (drillBar) drillBar.style.display = 'none';
      }
    } catch (err) {
      console.error('[paJAK-Kita] Error rendering V3:', err);
    } finally {
      if (skeleton) skeleton.classList.add('is-hidden');
    }
  };

  update();

  chart.on('click', (params) => {
    if (!v3GroupKey && params.data?.key) {
      v3GroupKey = params.data.key;
      update();
    } else if (v3GroupKey && params.data) {
      showInfoModal({
        kode: params.data.kode,
        nama: params.data.name,
        nilai: params.data.value,
        tahun: '2026',
        basis: 'APBD 2026',
        sumber: stateData.meta?.sumber?.nama,
      });
    }
  });

  backBtn?.addEventListener('click', () => {
    v3GroupKey = null;
    update();
  });

  // Table toggle
  document.querySelector('[data-table-toggle="chart-v3"]')?.addEventListener('click', () => {
    if (!stateData.belanja) return;
    const totalBelanja =
      sumBelanjaItems(stateData.belanja.operasi, '2026') +
      sumBelanjaItems(stateData.belanja.modal, '2026') +
      sumBelanjaItems(stateData.belanja.tidak_terduga, '2026') +
      sumBelanjaItems(stateData.belanja.transfer, '2026');

    const opTotal = sumBelanjaItems(stateData.belanja.operasi, '2026');
    const modTotal = sumBelanjaItems(stateData.belanja.modal, '2026');
    const ttTotal = sumBelanjaItems(stateData.belanja.tidak_terduga, '2026');
    const tfTotal = sumBelanjaItems(stateData.belanja.transfer, '2026');

    const rows = [
      ['Belanja Operasi', formatRupiahRingkas(opTotal), formatPersen(totalBelanja > 0 ? (opTotal / totalBelanja) * 100 : 0)],
      ['Belanja Modal', formatRupiahRingkas(modTotal), formatPersen(totalBelanja > 0 ? (modTotal / totalBelanja) * 100 : 0)],
      ['Belanja Tidak Terduga', formatRupiahRingkas(ttTotal), formatPersen(totalBelanja > 0 ? (ttTotal / totalBelanja) * 100 : 0)],
      ['Belanja Transfer', formatRupiahRingkas(tfTotal), formatPersen(totalBelanja > 0 ? (tfTotal / totalBelanja) * 100 : 0)],
    ];

    toggleTable('chart-v3', {
      caption: 'Tabel Jenis Belanja APBD 2026',
      headers: ['Kelompok Belanja', 'Nilai (2026)', 'Porsi Total'],
      rows,
    });
  });

  // Download PNG
  document.querySelector('[data-export="chart-v3"]')?.addEventListener('click', () => {
    exportChartPNG(chart, `pajak-kita-v3-jenis-belanja-2026.png`);
  });
}

function initV4() {
  const mount = document.getElementById('chart-v4');
  const skeleton = document.getElementById('chart-v4-skeleton');
  if (!mount) return;

  const chart = window.echarts.init(mount, getEchartsTheme());
  chartInstances.v4 = chart;

  const update = () => {
    try {
      const opts = getV4Options(stateData.urusanPorsi, v4Year);
      chart.setOption(opts, true);
    } catch (err) {
      console.error('[paJAK-Kita] Error rendering V4:', err);
    } finally {
      if (skeleton) skeleton.classList.add('is-hidden');
    }
  };

  update();

  chart.on('click', (params) => {
    showInfoModal({
      kode: params.data.kode,
      nama: params.data.name,
      porsi: params.data.value,
      tahun: v4Year,
      basis: `APBD ${v4Year}`,
      sumber: stateData.meta?.sumber?.nama,
    });
  });

  // Table toggle
  document.querySelector('[data-table-toggle="chart-v4"]')?.addEventListener('click', () => {
    const tableData = {
      caption: 'Tabel Porsi Belanja per Urusan Pemerintahan',
      headers: ['Kode', 'Urusan Pemerintahan', 'Porsi Persentase'],
      rows: stateData.urusanPorsi.map((u) => [
        u.kode,
        u.nama_pendek,
        formatPersen(u.porsi_dari_jumlah_urusan_persen),
      ]),
    };
    toggleTable('chart-v4', tableData);
  });

  // Download PNG
  document.querySelector('[data-export="chart-v4"]')?.addEventListener('click', () => {
    exportChartPNG(chart, `pajak-kita-v4-porsi-belanja-urusan.png`);
  });
}

function initV5() {
  const mount = document.getElementById('chart-v5');
  const skeleton = document.getElementById('chart-v5-skeleton');
  if (!mount) return;

  const chart = window.echarts.init(mount, getEchartsTheme());
  chartInstances.v5 = chart;

  const update = () => {
    try {
      const opts = getV5Options(stateData.ringkasan, v5Basis);
      chart.setOption(opts, true);
    } catch (err) {
      console.error('[paJAK-Kita] Error rendering V5:', err);
    } finally {
      if (skeleton) skeleton.classList.add('is-hidden');
    }
  };

  update();

  // Listener basis toggle
  document.querySelectorAll('[data-chart="v5"][data-basis]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('[data-chart="v5"][data-basis]').forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');
      v5Basis = e.target.dataset.basis;
      update();
    });
  });

  // Table toggle
  document.querySelector('[data-table-toggle="chart-v5"]')?.addEventListener('click', () => {
    const rows = (stateData.ringkasan?.belanja || []).map((b, idx) => {
      const p = (stateData.ringkasan?.pendapatan || [])[idx] || {};
      const key = v5Basis;
      return [
        String(b.tahun),
        formatRupiahRingkas(b[key]),
        formatRupiahRingkas(p[key]),
      ];
    });

    toggleTable('chart-v5', {
      caption: `Tabel Tren Anggaran Jakarta 2022-2026 (${v5Basis.toUpperCase()})`,
      headers: ['Tahun', 'Belanja', 'Pendapatan'],
      rows,
    });
  });

  // Download PNG
  document.querySelector('[data-export="chart-v5"]')?.addEventListener('click', () => {
    exportChartPNG(chart, `pajak-kita-v5-tren-anggaran-${v5Basis}.png`);
  });
}

function initV6() {
  const mount = document.getElementById('chart-v6');
  const skeleton = document.getElementById('chart-v6-skeleton');
  if (!mount) return;

  const chart = window.echarts.init(mount, getEchartsTheme());
  chartInstances.v6 = chart;

  const update = () => {
    try {
      const opts = getV6Options(stateData.pendapatan, v6Mode);
      chart.setOption(opts, true);
    } catch (err) {
      console.error('[paJAK-Kita] Error rendering V6:', err);
    } finally {
      if (skeleton) skeleton.classList.add('is-hidden');
    }
  };

  update();

  chart.on('click', (params) => {
    const item = stateData.pendapatan.find((p) => p.nama === params.name);
    if (!item) return;
    const val26 = item.nilai['2026'] || 0;
    const val25 = item.nilai['2025'] || 0;
    showInfoModal({
      kode: item.kode,
      nama: item.nama,
      nilai: val26,
      tahun: '2026 vs 2025',
      basis: 'APBD 2026 vs APBDP 2025',
      sumber: stateData.meta?.sumber?.nama,
    });
  });

  // Listener mode toggle
  document.querySelectorAll('[data-chart="v6"][data-mode]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('[data-chart="v6"][data-mode]').forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');
      v6Mode = e.target.dataset.mode;
      update();
    });
  });

  // Table toggle
  document.querySelector('[data-table-toggle="chart-v6"]')?.addEventListener('click', () => {
    const rows = stateData.pendapatan.map((p) => {
      const v26 = p.nilai['2026'] || 0;
      const v25 = p.nilai['2025'] || 0;
      const delta = v26 - v25;
      const pct = v25 > 0 ? (delta / v25) * 100 : 0;
      return [
        p.nama,
        formatRupiahRingkas(v25),
        formatRupiahRingkas(v26),
        (delta >= 0 ? '+' : '') + formatRupiahRingkas(delta),
        (pct >= 0 ? '+' : '') + formatPersen(pct),
      ];
    });

    toggleTable('chart-v6', {
      caption: 'Tabel Perubahan Anggaran Pendapatan 2025-2026',
      headers: ['Akun', 'APBDP 2025', 'APBD 2026', 'Selisih Rp', 'Selisih %'],
      rows,
    });
  });

  // Download PNG
  document.querySelector('[data-export="chart-v6"]')?.addEventListener('click', () => {
    exportChartPNG(chart, `pajak-kita-v6-perubahan-tahunan.png`);
  });
}

// =============================================================================
// MAIN INITIALIZER
// =============================================================================

async function initCharts() {
  if (!window.echarts) {
    console.warn('[paJAK-Kita] ECharts belum dimuat di window.echarts');
    return;
  }

  try {
    const [meta, pendapatan, belanja, urusanPorsi, ringkasan, realisasi] = await Promise.all([
      getMeta(),
      getPendapatanPerAkun(),
      getBelanjaPerAkun(),
      getBelanjaPerUrusanPorsi(),
      getRingkasanApbd(),
      getRealisasiPerAkun().catch((e) => {
        console.warn('Gagal memuat data realisasi akun:', e);
        return null;
      }),
    ]);

    stateData = { meta, pendapatan, belanja, urusanPorsi, ringkasan, realisasi };

    // Inisialisasi masing-masing grafik secara terisolasi
    try { initV1(); } catch (e) { console.error('Error initV1', e); }
    try { initV2(); } catch (e) { console.error('Error initV2', e); }
    try { initV3(); } catch (e) { console.error('Error initV3', e); }
    try { initV4(); } catch (e) { console.error('Error initV4', e); }
    try { initV5(); } catch (e) { console.error('Error initV5', e); }
    try { initV6(); } catch (e) { console.error('Error initV6', e); }

    // Event resize responsif
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        Object.values(chartInstances).forEach((c) => c && c.resize());
      }, 150);
    });

    // Listener prefers-reduced-motion
    if (window.matchMedia) {
      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
        try { initV1(); } catch (_) {}
        try { initV2(); } catch (_) {}
        try { initV3(); } catch (_) {}
        try { initV4(); } catch (_) {}
        try { initV5(); } catch (_) {}
        try { initV6(); } catch (_) {}
      });
    }
  } catch (err) {
    console.error('[paJAK-Kita] Gagal memuat data atau menginisialisasi grafik:', err);
    ['chart-v1', 'chart-v2', 'chart-v3', 'chart-v4', 'chart-v5', 'chart-v6'].forEach((id) => {
      const skel = document.getElementById(`${id}-skeleton`);
      if (skel) {
        skel.textContent = 'Gagal memuat visualisasi data. Silakan muat ulang halaman.';
        skel.classList.remove('is-hidden');
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCharts);
} else {
  initCharts();
}
