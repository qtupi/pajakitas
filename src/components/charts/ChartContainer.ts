/**
 * paJAK-Kita — Chart Container Component
 * File: src/components/charts/ChartContainer.ts
 *
 * Pembungkus terpadu untuk setiap visualisasi data:
 * - Judul dalam bahasa warga (pertanyaan)
 * - Satu kalimat penjelasan di bawahnya
 * - Kontrol interaktif (pilihan tahun / basis)
 * - Tombol aksi: "Lihat sebagai tabel" dan "Unduh gambar"
 * - Mount point canvas ECharts
 * - Container tabel data yang dapat dibuka/tutup (aksesibilitas)
 * - SourceBadge di bagian bawah
 */

import { renderSourceBadge } from '../SourceBadge.ts';

export interface ChartContainerProps {
  id: string;
  title: string;
  subtitle: string;
  basis?: string;
  tahun?: number | string;
  sumber?: string;
  tanggalPengambilan?: string | null;
  controlsHtml?: string;
  tableDataHtml?: string;
  className?: string;
}

export function renderChartContainer(props: ChartContainerProps): string {
  const badgeHtml = renderSourceBadge({
    basis: props.basis || 'APBD',
    tahun: props.tahun || 2026,
    sumber: props.sumber || 'Dashboard Keuangan Daerah BPKD Provinsi DKI Jakarta',
    tanggalPengambilan: props.tanggalPengambilan,
    jenisData: 'Anggaran',
  });

  return `
<div class="chart-card-wrapper ${props.className || ''}" id="card-${props.id}">
  <div class="chart-card-header">
    <div class="chart-card-title-group">
      <h3 class="chart-card-title">${props.title}</h3>
      <p class="chart-card-subtitle">${props.subtitle}</p>
    </div>
    <div class="chart-card-toolbar">
      ${props.controlsHtml ? `<div class="chart-controls">${props.controlsHtml}</div>` : ''}
      <div class="chart-actions">
        <button type="button" class="btn-chart-action btn-toggle-table" data-chart-id="${props.id}" aria-expanded="false" title="Tampilkan data dalam bentuk tabel">
          <span aria-hidden="true">📊</span> Lihat sebagai tabel
        </button>
        <button type="button" class="btn-chart-action btn-download-png" data-chart-id="${props.id}" title="Unduh grafik sebagai gambar PNG">
          <span aria-hidden="true">📥</span> Unduh gambar
        </button>
      </div>
    </div>
  </div>

  <div class="chart-canvas-container" id="container-${props.id}">
    <div class="chart-mount" id="${props.id}" role="img" aria-label="${props.title}"></div>
    <div class="chart-skeleton" id="skeleton-${props.id}">
      <div class="skeleton-shimmer"></div>
      <span class="skeleton-text">Memuat visualisasi data anggaran...</span>
    </div>
  </div>

  <div class="chart-table-container is-hidden" id="table-${props.id}" role="region" aria-label="Tabel data ${props.title}">
    ${props.tableDataHtml || ''}
  </div>

  <div class="chart-card-footer">
    ${badgeHtml}
  </div>
</div>`.trim();
}
