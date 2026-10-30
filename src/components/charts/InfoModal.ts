/**
 * paJAK-Kita — InfoModal Component
 * File: src/components/charts/InfoModal.ts
 *
 * Panel informasi interaktif yang muncul saat pengguna mengklik segmen grafik:
 * - Kode dan nama resmi akun
 * - Nilai penuh (Rupiah presisi)
 * - Porsi persentase dari total
 * - SourceBadge resmi
 * - Penjelasan bahasa awam: "Penjelasan menyusul" (tidak mengarang definisi)
 */

import { renderSourceBadge } from '../SourceBadge.ts';

export interface InfoModalData {
  kode?: string;
  namaResmi: string;
  nilaiPenuh?: string;
  porsiPersen?: string;
  basis?: string;
  tahun?: number | string;
  sumber?: string;
  penjelasan?: string;
}

export function renderInfoModal(data: InfoModalData): string {
  const badgeHtml = renderSourceBadge({
    basis: data.basis || 'APBD',
    tahun: data.tahun || 2026,
    sumber: data.sumber || 'Dashboard Keuangan Daerah BPKD Provinsi DKI Jakarta',
    jenisData: 'Anggaran',
  });

  return `
<div class="info-modal-backdrop" id="info-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-account-title">
  <div class="info-modal-card">
    <div class="info-modal-header">
      <div class="info-modal-kicker">INFORMASI RINCIAN AKUN ANGGARAN</div>
      <button type="button" class="btn-close-modal" id="btn-close-info-modal" aria-label="Tutup panel informasi">✕</button>
    </div>

    <div class="info-modal-body">
      ${data.kode ? `<div class="info-modal-code">Kode Akun: <strong>${data.kode}</strong></div>` : ''}
      <h3 class="info-modal-title" id="modal-account-title">${data.namaResmi}</h3>

      <div class="info-modal-stats-grid">
        ${
          data.nilaiPenuh
            ? `
        <div class="info-stat-box">
          <span class="info-stat-label">NILAI ANGGARAN LENGKAP</span>
          <span class="info-stat-value tabular-nums">${data.nilaiPenuh}</span>
        </div>`
            : ''
        }
        ${
          data.porsiPersen
            ? `
        <div class="info-stat-box">
          <span class="info-stat-label">PORSI DARI TOTAL</span>
          <span class="info-stat-value tabular-nums">${data.porsiPersen}</span>
        </div>`
            : ''
        }
      </div>

      <div class="info-modal-explanation">
        <strong>Penjelasan Istilah:</strong>
        <p>${data.penjelasan || 'Penjelasan menyusul (menunggu rujukan dokumen resmi bersumber).'}</p>
      </div>

      <div class="info-modal-badge-wrapper">
        ${badgeHtml}
      </div>
    </div>

    <div class="info-modal-footer">
      <button type="button" class="button button-primary btn-modal-done" id="btn-done-info-modal">Mengerti</button>
    </div>
  </div>
</div>`.trim();
}
