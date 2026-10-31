/**
 * paJAK-Kita — Logika Data Realisasi APBD Jakarta
 * File: js/realisasi.js
 *
 * Menyederhanakan situs ke DUA TOPIK DATA SAJA:
 * 1. Penerimaan Pajak:
 *    - Pajak Daerah (4.1.01) sebagai satu cincin progres + tiga angka (anggaran, terkumpul, persen)
 *    - Satu kalimat porsi terhadap total pendapatan
 *    - Per-jenis dan per-wilayah berstatus jujur "Data belum tersedia"
 * 2. Belanja APBD:
 *    - Total anggaran dan terpakai (beserta persentase)
 *    - Waffle Chart 10x10 "Jika belanja Rp100" (top 6 dinas dan instansi)
 *    - Daftar per-dinas: top 10 berdasarkan anggaran, dapat diperluas dengan "Lihat semua dinas dan instansi",
 *      setiap baris berupa bullet bar (anggaran vs terpakai)
 * 3. Halaman/Detail Dinas dan Instansi:
 *    - HANYA menampilkan: anggaran, terpakai, persen.
 *
 * Aturan Kebahasaan:
 * - Menggunakan "dinas dan instansi" (bukan SKPD)
 * - "terkumpul" untuk realisasi pendapatan
 * - "terpakai" untuk realisasi belanja
 * - Kata "realisasi" HANYA pada tooltip dan SourceBadge
 */

import {
  getRealisasiMeta,
  getRealisasiPerAkun,
  getRealisasiPerSkpd,
  getTurunanRealisasi,
} from './dataClient.js';

import {
  formatRupiahRingkas,
  formatRupiahPenuh,
  formatPersen,
  hitungPosisiHariDalamTahun,
  formatSerapan,
} from './format.js';

import { VIZ_COLORS, getVizPalette } from './vizColors.js';

// State global
let realisasiMeta = null;
let realisasiAkun = null;
let realisasiSkpd = null;
let turunanRealisasi = null;

let isDinasExpanded = false;
let currentDinasKey = 'pendidikan'; // 'pendidikan' | 'kesehatan' | 'binamarga-sda' atau nomor dinas (string)

const prefersReducedMotion = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// =============================================================================
// TOPIK 1: PENERIMAAN PAJAK DAERAH
// =============================================================================

function renderPenerimaanRealisasi() {
  if (!realisasiAkun || !realisasiAkun.pendapatan) return;

  const akunPajak = realisasiAkun.pendapatan.find((p) => p.kode === '4.1.01');
  if (!akunPajak) return;

  const angPajak = akunPajak.anggaran; // 49.898.218.773.411
  const terkumpulPajak = akunPajak.realisasi; // 37.138.893.774.592
  const persenPajak = akunPajak.persen_hitung; // 74.43%

  const totalPendapatanAng = realisasiAkun.total_halaman.jumlah_pendapatan.anggaran; // 71.450.673.065.697
  const totalPendapatanTerkumpul = realisasiAkun.total_halaman.jumlah_pendapatan.realisasi; // 48.601.300.211.899
  const porsiTarget = (angPajak / totalPendapatanAng) * 100; // ~69,8%
  const porsiTerkumpul = (terkumpulPajak / totalPendapatanTerkumpul) * 100; // ~76,4%

  // Tiga angka kunci (Anggaran, Terkumpul, Persen)
  const angEl = document.getElementById('stat-pajak-anggaran');
  const terkumpulEl = document.getElementById('stat-pajak-realisasi');
  const persenEl = document.getElementById('stat-pajak-persen') || document.getElementById('stat-pajak-sisa');

  if (angEl) {
    angEl.textContent = formatRupiahRingkas(angPajak);
    angEl.setAttribute('title', `Target Anggaran Pajak Daerah: ${formatRupiahPenuh(angPajak)}`);
  }
  if (terkumpulEl) {
    terkumpulEl.textContent = formatRupiahRingkas(terkumpulPajak);
    terkumpulEl.setAttribute('title', `Pajak Terkumpul (realisasi per 25 Okt 2026): ${formatRupiahPenuh(terkumpulPajak)}`);
  }
  if (persenEl) {
    persenEl.textContent = formatPersen(persenPajak);
    persenEl.setAttribute('title', `Capaian target: ${persenPajak}%`);
  }

  // Cincin Progres Capaian Pajak
  const circleVal = document.getElementById('progress-ring-pajak-val');
  const percentText = document.getElementById('progress-ring-pajak-text');
  if (circleVal && percentText) {
    circleVal.setAttribute('fill', 'none');
    const trackEl = circleVal.parentElement?.querySelector('.progress-ring-track');
    if (trackEl) trackEl.setAttribute('fill', 'none');
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    circleVal.style.strokeDasharray = `${circumference}`;
    const offset = circumference - (persenPajak / 100) * circumference;
    circleVal.style.strokeDashoffset = `${offset}`;
    percentText.textContent = formatPersen(persenPajak);
  }

  // Kalimat porsi terhadap total pendapatan
  const shareEl = document.getElementById('pajak-share-text');
  if (shareEl) {
    shareEl.innerHTML = `Pajak daerah menyumbang <strong>${formatPersen(porsiTarget)}</strong> dari total target pendapatan APBD Jakarta (${formatRupiahRingkas(totalPendapatanAng)}), dan mencakup <strong>${formatPersen(porsiTerkumpul)}</strong> dari total pendapatan yang telah terkumpul (${formatRupiahRingkas(totalPendapatanTerkumpul)}).`;
  }
}

// =============================================================================
// TOPIK 2: BELANJA APBD JAKARTA
// =============================================================================

function renderTotalBelanjaSummary() {
  if (!realisasiAkun || !realisasiAkun.total_halaman) return;

  const totBelanjaAng = realisasiAkun.total_halaman.jumlah_belanja.anggaran; // 74.285.299.931.740
  const totBelanjaTerpakai = realisasiAkun.total_halaman.jumlah_belanja.realisasi; // 44.467.474.197.668
  const serapanPct = (totBelanjaTerpakai / totBelanjaAng) * 100; // 59.86%

  const angEl = document.getElementById('stat-belanja-anggaran') || document.getElementById('kpi-belanja-anggaran');
  const terpakaiEl = document.getElementById('stat-belanja-terpakai') || document.getElementById('kpi-belanja-realisasi');
  const persenEl = document.getElementById('stat-belanja-persen') || document.getElementById('kpi-belanja-serapan');

  if (angEl) {
    angEl.textContent = formatRupiahRingkas(totBelanjaAng);
    angEl.setAttribute('title', `Pagu Anggaran Belanja: ${formatRupiahPenuh(totBelanjaAng)}`);
  }
  if (terpakaiEl) {
    terpakaiEl.textContent = formatRupiahRingkas(totBelanjaTerpakai);
    terpakaiEl.setAttribute('title', `Belanja Terpakai (realisasi per 25 Okt 2026): ${formatRupiahPenuh(totBelanjaTerpakai)}`);
  }
  if (persenEl) {
    persenEl.textContent = formatPersen(serapanPct);
    persenEl.setAttribute('title', `Tingkat serapan: ${serapanPct.toFixed(2)}%`);
  }

  // Cincin Progres Belanja jika ada
  const circleVal = document.getElementById('progress-ring-belanja-val');
  const percentText = document.getElementById('progress-ring-belanja-text');
  if (circleVal && percentText) {
    circleVal.setAttribute('fill', 'none');
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    circleVal.style.strokeDasharray = `${circumference}`;
    const offset = circumference - (serapanPct / 100) * circumference;
    circleVal.style.strokeDashoffset = `${offset}`;
    percentText.textContent = formatPersen(serapanPct);
  }
}

// -----------------------------------------------------------------------------
// WAFFLE CHART 10x10 ("Jika Belanja Rp100" - Top 6 Dinas dan Instansi)
// -----------------------------------------------------------------------------

function renderWaffleChart() {
  const container = document.getElementById('waffle-chart-grid') || document.getElementById('waffle-container');
  const sentenceEl = document.getElementById('waffle-sentence-box') || document.getElementById('waffle-sentence-text') || document.getElementById('waffle-sentence');
  const legendEl = document.getElementById('waffle-legend-box') || document.getElementById('waffle-legend');
  if (!container) return;

  let groups = [];
  const palette = getVizPalette();

  if (realisasiAkun?.total_halaman?.jumlah_belanja?.anggaran && realisasiSkpd?.data?.length) {
    const totalBelanja = realisasiAkun.total_halaman.jumlah_belanja.anggaran;
    const sorted = [...realisasiSkpd.data].sort((a, b) => b.belanja.anggaran - a.belanja.anggaran);

    // Top 6 dinas dan instansi
    const top6 = sorted.slice(0, 6);
    const remaining = sorted.slice(6);
    const remainingAnggaran = remaining.reduce((sum, u) => sum + u.belanja.anggaran, 0);

    groups = top6.map((u, idx) => {
      const porsi = (u.belanja.anggaran / totalBelanja) * 100;
      const count = Math.round(porsi);
      return {
        nama: u.nama_pendek,
        porsi,
        count,
        color: palette[idx % palette.length],
      };
    });

    // Kotak tersisa untuk kelompok lainnya
    const filled = groups.reduce((sum, g) => sum + g.count, 0);
    const remainingCount = Math.max(100 - filled, 0);

    groups.push({
      nama: 'Lainnya (37 dinas dan instansi)',
      porsi: (remainingAnggaran / totalBelanja) * 100,
      count: remainingCount,
      color: VIZ_COLORS.viz8 || '#9CA3AF',
    });
  } else {
    // Fallback
    groups = [
      { nama: 'Dinas Pendidikan', porsi: 24.5, count: 25, color: '#BA1A1A' },
      { nama: 'Dinas Bina Marga', porsi: 7.2, count: 7, color: '#2563EB' },
      { nama: 'Dinas Sumber Daya Air', porsi: 7.2, count: 7, color: '#059669' },
      { nama: 'Dinas Kesehatan', porsi: 6.9, count: 7, color: '#F59E0B' },
      { nama: 'Dinas Perhubungan', porsi: 5.1, count: 5, color: '#7C3AED' },
      { nama: 'Dinas Lingkungan Hidup', porsi: 3.8, count: 4, color: '#D97706' },
      { nama: 'Lainnya (37 dinas dan instansi)', porsi: 45.3, count: 45, color: '#9CA3AF' },
    ];
  }

  // Susun 100 kotak
  const cells = [];
  groups.forEach((g) => {
    for (let i = 0; i < g.count; i++) {
      if (cells.length < 100) cells.push(g);
    }
  });
  while (cells.length < 100) {
    cells.push(groups[groups.length - 1]);
  }

  // Render Grid
  container.innerHTML = cells
    .map(
      (cell, idx) => `
        <div 
          class="waffle-cell" 
          data-unit="${cell.nama}" 
          data-porsi="${cell.porsi.toFixed(1)}" 
          data-count="${cell.count}"
          style="background-color: ${cell.color};"
          title="Kotak #${idx + 1}: ${cell.nama} (~Rp${cell.count} dari Rp100)"
        ></div>
      `
    )
    .join('');

  // Default sentence
  const defaultGroup = groups[0];
  const updateSentence = (group) => {
    if (!sentenceEl) return;
    sentenceEl.innerHTML = `
      Dari setiap <strong>Rp100</strong> anggaran belanja APBD Jakarta 2026, sekitar <strong>Rp${group.count}</strong> dialokasikan lewat <strong>${group.nama}</strong> (${formatPersen(group.porsi)}).
    `;
  };
  updateSentence(defaultGroup);

  // Render Legend
  if (legendEl) {
    legendEl.innerHTML = groups
      .map(
        (g) => `
          <div class="waffle-legend-item" data-unit="${g.nama}">
            <span class="waffle-legend-dot" style="background:${g.color};"></span>
            <span>${g.nama} (~Rp${g.count})</span>
          </div>
        `
      )
      .join('');
  }

  // Hover listeners pada cell
  container.querySelectorAll('.waffle-cell').forEach((cell) => {
    cell.addEventListener('mouseenter', () => {
      const unit = cell.dataset.unit;
      const count = cell.dataset.count;
      const porsi = cell.dataset.porsi;

      if (sentenceEl) {
        sentenceEl.innerHTML = `
          Dari setiap <strong>Rp100</strong> anggaran belanja APBD Jakarta 2026, sekitar <strong>Rp${count}</strong> dialokasikan lewat <strong>${unit}</strong> (${formatPersen(Number(porsi))}).
        `;
      }

      if (legendEl) {
        legendEl.querySelectorAll('.waffle-legend-item').forEach((item) => {
          item.classList.toggle('is-active', item.dataset.unit === unit);
        });
      }
    });

    cell.addEventListener('mouseleave', () => {
      updateSentence(defaultGroup);
      if (legendEl) {
        legendEl.querySelectorAll('.waffle-legend-item').forEach((item) => {
          item.classList.remove('is-active');
        });
      }
    });
  });

  // Hover listeners pada legend
  if (legendEl) {
    legendEl.querySelectorAll('.waffle-legend-item').forEach((item) => {
      item.addEventListener('mouseenter', () => {
        const unit = item.dataset.unit;
        const group = groups.find((g) => g.nama === unit);
        if (!group) return;

        updateSentence(group);

        container.querySelectorAll('.waffle-cell').forEach((cell) => {
          if (cell.dataset.unit === unit) {
            cell.style.transform = 'scale(1.22)';
            cell.style.filter = 'brightness(1.1)';
          } else {
            cell.style.transform = 'scale(0.9)';
            cell.style.opacity = '0.45';
          }
        });
      });

      item.addEventListener('mouseleave', () => {
        updateSentence(defaultGroup);
        container.querySelectorAll('.waffle-cell').forEach((cell) => {
          cell.style.transform = '';
          cell.style.filter = '';
          cell.style.opacity = '1';
        });
      });
    });
  }
}

// -----------------------------------------------------------------------------
// PER-DINAS LIST: TOP 10 DENGAN TOMBOL "LIHAT SEMUA" & BULLET BAR
// -----------------------------------------------------------------------------

function renderDinasBulletList() {
  const container = document.getElementById('dinas-bullet-list');
  const toggleBtn = document.getElementById('btn-toggle-all-dinas');
  if (!container || !realisasiSkpd?.data) return;

  const posTanggal = hitungPosisiHariDalamTahun(realisasiMeta?.tanggal_data || '2026-10-25');
  const sorted = [...realisasiSkpd.data].sort((a, b) => b.belanja.anggaran - a.belanja.anggaran);
  const items = isDinasExpanded ? sorted : sorted.slice(0, 10);

  let html = '';
  items.forEach((u, idx) => {
    const ang = u.belanja.anggaran;
    const terpakai = u.belanja.realisasi;
    const serapanPct = ang > 0 ? (terpakai / ang) * 100 : 0;
    const barWidth = Math.min(Math.max(serapanPct, 0), 100);

    const isSelected = String(u.no) === String(currentDinasKey) ||
      (currentDinasKey === 'pendidikan' && u.nama_pendek === 'Dinas Pendidikan') ||
      (currentDinasKey === 'kesehatan' && u.nama_pendek === 'Dinas Kesehatan');

    html += `
      <div 
        class="bullet-item dinas-bullet-row ${isSelected ? 'is-selected' : ''}" 
        data-dinas-no="${u.no}" 
        role="button" 
        tabindex="0"
        title="Klik untuk melihat detail ${u.nama_pendek}"
        style="cursor: pointer; padding: 10px 14px; border-radius: 8px; transition: background 0.15s ease; border: 1px solid ${isSelected ? 'var(--color-primary)' : 'transparent'}; background: ${isSelected ? 'var(--color-surface-warm)' : 'transparent'}; margin-bottom: 8px;"
      >
        <div class="bullet-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:6px;">
          <span class="bullet-title" style="font-weight:700; color:var(--color-ink); font-size:0.875rem;">
            ${idx + 1}. ${u.nama_pendek}
          </span>
          <span class="bullet-stats" style="font-size:0.75rem; color:var(--color-muted);">
            Terpakai: <strong>${formatRupiahRingkas(terpakai)}</strong> dari <strong>${formatRupiahRingkas(ang)}</strong> (${formatPersen(serapanPct)})
          </span>
        </div>
        <div class="bullet-track-container" title="Anggaran: ${formatRupiahPenuh(ang)} | Terpakai (realisasi): ${formatRupiahPenuh(terpakai)} (${formatPersen(serapanPct)})">
          <div class="bullet-bar-fill" style="width: ${barWidth}%;"></div>
          <div class="bullet-date-marker" style="left: ${posTanggal.persen}%;" title="Posisi data: 25 Oktober 2026 (Hari ke-${posTanggal.hariKe} / ${formatPersen(posTanggal.persen)})"></div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Pasang klik pada baris dinas untuk memilih dan memperbarui detail dinas
  container.querySelectorAll('.dinas-bullet-row').forEach((row) => {
    row.addEventListener('click', () => {
      const dinasNo = row.getAttribute('data-dinas-no');
      currentDinasKey = dinasNo;
      renderDinasBulletList();
      renderDinasPage();

      // Gulir lembut ke area detail dinas
      const detailEl = document.getElementById('dinas-page-content') || document.getElementById('dinas');
      detailEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        row.click();
      }
    });
  });

  // Tombol toggle ekspansi
  if (toggleBtn) {
    toggleBtn.textContent = isDinasExpanded
      ? 'Tampilkan 10 dinas teratas ↑'
      : `Lihat semua dinas dan instansi (${sorted.length}) ↓`;
  }
}

function initDinasToggle() {
  const toggleBtn = document.getElementById('btn-toggle-all-dinas');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    isDinasExpanded = !isDinasExpanded;
    renderDinasBulletList();
  });
}

// =============================================================================
// HALAMAN / DETAIL DINAS DAN INSTANSI
// HANYA MENAMPILKAN: ANGGARAN, TERPAKAI, PERSEN
// =============================================================================

function renderDinasPage() {
  const titleEl = document.getElementById('dinas-page-title');
  const angEl = document.getElementById('dinas-kpi-anggaran');
  const terpakaiEl = document.getElementById('dinas-kpi-realisasi');
  const persenEl = document.getElementById('dinas-kpi-serapan');
  const descEl = document.getElementById('dinas-page-desc');
  const selectPicker = document.getElementById('dinas-picker-select');

  if (!titleEl || !realisasiSkpd?.data) return;

  let currentData;

  // Kasus gabungan khusus atau pencarian berdasar key / no
  if (currentDinasKey === 'binamarga-sda') {
    const unitBM = realisasiSkpd.data.find((u) => u.nama_pendek === 'Dinas Bina Marga');
    const unitSDA = realisasiSkpd.data.find((u) => u.nama_pendek === 'Dinas Sumber Daya Air');

    const angGabung = (unitBM?.belanja.anggaran || 0) + (unitSDA?.belanja.anggaran || 0);
    const terpakaiGabung = (unitBM?.belanja.realisasi || 0) + (unitSDA?.belanja.realisasi || 0);
    const persenGabung = angGabung > 0 ? (terpakaiGabung / angGabung) * 100 : 0;

    currentData = {
      nama: 'Bina Marga & Sumber Daya Air (Gabungan)',
      anggaran: angGabung,
      terpakai: terpakaiGabung,
      persen: persenGabung,
      desc: 'Gabungan data anggaran belanja dua dinas infrastruktur utama DKI Jakarta untuk jalan, trotoar, jembatan, dan sistem drainase/tata air kota.',
    };
  } else if (currentDinasKey === 'pendidikan') {
    const unit = realisasiSkpd.data.find((u) => u.nama_pendek === 'Dinas Pendidikan');
    currentData = {
      nama: unit.nama_pendek,
      anggaran: unit.belanja.anggaran,
      terpakai: unit.belanja.realisasi,
      persen: unit.belanja.serapan_persen,
      desc: 'Mengelola anggaran belanja sekolah, operasional pendidikan warga, bantuan belajar, dan sarana prasarana sekolah.',
    };
  } else if (currentDinasKey === 'kesehatan') {
    const unit = realisasiSkpd.data.find((u) => u.nama_pendek === 'Dinas Kesehatan');
    currentData = {
      nama: unit.nama_pendek,
      anggaran: unit.belanja.anggaran,
      terpakai: unit.belanja.realisasi,
      persen: unit.belanja.serapan_persen,
      desc: 'Mengelola anggaran fasilitas kesehatan umum, rumah sakit daerah, puskesmas, dan pelayanan kesehatan warga.',
    };
  } else {
    // Cari berdasarkan nomor unit
    const unitNo = parseInt(currentDinasKey, 10);
    const unit = realisasiSkpd.data.find((u) => u.no === unitNo) || realisasiSkpd.data[0];
    currentData = {
      nama: unit.nama_pendek,
      anggaran: unit.belanja.anggaran,
      terpakai: unit.belanja.realisasi,
      persen: unit.belanja.serapan_persen,
      desc: unit.nama,
    };
  }

  // Tampilkan HANYA: Nama, Anggaran, Terpakai, Persen
  titleEl.textContent = currentData.nama;
  if (descEl) descEl.textContent = currentData.desc;

  if (angEl) {
    angEl.textContent = formatRupiahRingkas(currentData.anggaran);
    angEl.setAttribute('title', `Anggaran Belanja: ${formatRupiahPenuh(currentData.anggaran)}`);
  }
  if (terpakaiEl) {
    terpakaiEl.textContent = formatRupiahRingkas(currentData.terpakai);
    terpakaiEl.setAttribute('title', `Belanja Terpakai (realisasi per 25 Okt 2026): ${formatRupiahPenuh(currentData.terpakai)}`);
  }
  if (persenEl) {
    persenEl.textContent = formatPersen(currentData.persen);
    persenEl.setAttribute('title', `Persen Terpakai: ${currentData.persen?.toFixed(2)}%`);
  }

  // Sinkronisasi tab aktif
  document.querySelectorAll('.dinas-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.dinas === currentDinasKey);
    btn.setAttribute('aria-selected', String(btn.dataset.dinas === currentDinasKey));
  });

  // Sinkronisasi dropdown pemilih dinas jika ada
  if (selectPicker) {
    selectPicker.value = currentDinasKey;
  }
}

function initDinasPicker() {
  const tabs = document.querySelectorAll('.dinas-tab-btn');
  tabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      tabs.forEach((t) => t.classList.remove('active'));
      e.target.classList.add('active');
      currentDinasKey = e.target.dataset.dinas;
      renderDinasPage();
      renderDinasBulletList();
    });
  });

  const selectPicker = document.getElementById('dinas-picker-select');
  if (selectPicker && realisasiSkpd?.data) {
    const sorted = [...realisasiSkpd.data].sort((a, b) => a.nama_pendek.localeCompare(b.nama_pendek));
    selectPicker.innerHTML = `
      <option value="pendidikan">Dinas Pendidikan</option>
      <option value="kesehatan">Dinas Kesehatan</option>
      <option value="binamarga-sda">Bina Marga &amp; SDA (Gabungan)</option>
      <optgroup label="Semua 43 Dinas dan Instansi">
        ${sorted
          .map((u) => `<option value="${u.no}">${u.nama_pendek}</option>`)
          .join('')}
      </optgroup>
    `;

    selectPicker.addEventListener('change', (e) => {
      currentDinasKey = e.target.value;
      renderDinasPage();
      renderDinasBulletList();
    });
  }
}

// =============================================================================
// INISIALISASI UTAMA
// =============================================================================

export async function initRealisasiModule() {
  try {
    const [metaR, akunR, skpdR, turunanR] = await Promise.all([
      getRealisasiMeta(),
      getRealisasiPerAkun(),
      getRealisasiPerSkpd(),
      getTurunanRealisasi(),
    ]);

    realisasiMeta = metaR;
    realisasiAkun = akunR;
    realisasiSkpd = skpdR;
    turunanRealisasi = turunanR;

    // 1. Topik 1: Penerimaan Pajak (Ring + 3 Angka + Porsi)
    renderPenerimaanRealisasi();

    // 2. Topik 2: Belanja APBD (Total Anggaran & Terpakai)
    renderTotalBelanjaSummary();

    // 3. Waffle Chart ("Jika belanja Rp100")
    renderWaffleChart();

    // 4. Per-dinas bullet bar list
    renderDinasBulletList();
    initDinasToggle();

    // 5. Halaman Dinas (Hanya Anggaran, Terpakai, Persen)
    initDinasPicker();
    renderDinasPage();
  } catch (err) {
    console.error('[paJAK-Kita] Gagal memuat modul data realisasi:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRealisasiModule);
} else {
  initRealisasiModule();
}
