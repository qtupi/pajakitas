/**
 * paJAK-Kita — Komponen Kepercayaan: SourceBadge
 * File: src/components/SourceBadge.ts
 *
 * Menampilkan:
 * 1. Label eksplisit "ANGGARAN" (bukan realisasi)
 * 2. Basis data (APBD atau APBDP)
 * 3. Tahun data
 * 4. Sumber data resmi (BPKD DKI Jakarta)
 * 5. Tanggal pengambilan data
 */

export interface SourceBadgeProps {
  sumber?: string;
  basis?: string;
  tahun?: number | string;
  tanggalPengambilan?: string | null;
  jenisData?: string;
  className?: string;
}

export function renderSourceBadge(props: SourceBadgeProps = {}): string {
  const sumber = props.sumber || 'Dashboard BPKD DKI Jakarta';
  const basis = props.basis || 'APBD';
  const tahun = props.tahun || 2026;
  const tanggal = props.tanggalPengambilan || 'Tangkapan layar (tanggal belum tercatat)';
  const jenis = props.jenisData || 'Anggaran';

  return `
<div class="trust-source-badge ${props.className || ''}" role="note" aria-label="Informasi Sumber dan Basis Data">
  <span class="badge-tag-anggaran">[${jenis.toUpperCase()}]</span>
  <span class="badge-info">Basis <strong>${basis} ${tahun}</strong></span>
  <span class="badge-separator" aria-hidden="true">•</span>
  <span class="badge-source">Sumber: <em>${sumber}</em></span>
  <span class="badge-separator" aria-hidden="true">•</span>
  <span class="badge-date">Tgl data: ${tanggal}</span>
</div>`.trim();
}
