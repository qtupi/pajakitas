/**
 * paJAK-Kita — Komponen Kepercayaan: FreshnessBanner
 * File: src/components/FreshnessBanner.ts
 *
 * Menampilkan:
 * Tahun data terakhir dan status keterbaruan data APBD DKI Jakarta.
 */

export interface FreshnessBannerProps {
  tahunTerakhir?: number | string;
  statusText?: string;
  className?: string;
}

export function renderFreshnessBanner(props: FreshnessBannerProps = {}): string {
  const tahun = props.tahunTerakhir || 2026;
  const status =
    props.statusText ||
    'Anggaran Penetapan APBD 2026 (sama dengan APBDP). Realisasi dan transparansi menyusul.';

  return `
<aside class="trust-freshness-banner ${props.className || ''}" role="status" aria-label="Status Keterkinian Data">
  <div class="freshness-inner">
    <span class="freshness-pill">DATA TERAKHIR: ${tahun}</span>
    <span class="freshness-desc">${status}</span>
  </div>
</aside>`.trim();
}
