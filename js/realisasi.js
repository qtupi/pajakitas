/**
 * paJAK-Kita — Logika Realisasi APBD 2026 & Fitur Interaktif
 * File: js/realisasi.js
 *
 * Mengimplementasikan:
 * 1. Baris KPI dengan animasi count-up.
 * 2. Cincin progres total belanja & bullet chart 9 jenis belanja dengan garis acuan tanggal.
 * 3. Sakelar "Dipakai untuk apa?": Batang horizontal 10 SKPD vs Diagram Mawar V4.
 * 4. Penjelajah Unit (Unit Explorer): pencarian, filter kategori, pengurutan, mini-bar, hover sync.
 * 5. Waffle Chart 10x10 ("Jika belanja APBD Jakarta Rp100") dengan kalimat dinamis dan disclaimer.
 * 6. Halaman Dinas: tab pemilih (Pendidikan, Kesehatan, Bina Marga & SDA gabungan), pembanding unit, dan empty state.
 * 7. Penerimaan Pajak: 3 kartu statistik (anggaran, realisasi, sisa menuju anggaran), cincin progres capaian 74,4%, bullet chart 6 akun pendapatan.
 * 8. Bantuan Baca ("Cara membaca grafik ini") dari content/teks-bantu.json.
 * 9. Pencarian Cepat (Ctrl/Cmd + K) dengan navigasi keyboard.
 * 10. Tautan yang bisa dibagikan via URL Query String.
 */

import {
  getMeta,
  getRealisasiMeta,
  getRealisasiPerAkun,
  getRealisasiPerSkpd,
  getTurunanRealisasi,
  getPendapatanPerAkun,
} from './dataClient.js';

import {
  formatRupiahRingkas,
  formatRupiahPenuh,
  formatPersen,
  formatTanggalIndonesia,
  hitungPosisiHariDalamTahun,
  formatSerapan,
} from './format.js';

import { VIZ_COLORS, getVizPalette } from './vizColors.js';
import { getEchartsTheme } from './echartsTheme.js';

// State global modul realisasi
let realisasiMeta = null;
let realisasiAkun = null;
let realisasiSkpd = null;
let turunanRealisasi = null;
let teksBantuData = null;

let skpdBarChartInstance = null;
let currentSkpdViewLimit = 10; // 10 atau 43
let unitSortCol = 'anggaran'; // 'nama' | 'anggaran' | 'realisasi' | 'serapan'
let unitSortAsc = false;
let unitFilterJenis = 'all';
let unitSearchQuery = '';

let currentDinasKey = 'pendidikan'; // 'pendidikan' | 'kesehatan' | 'binamarga-sda'
let compareUnitNo = null;

const prefersReducedMotion = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// =============================================================================
// ANIMASI COUNT-UP (KPI)
// =============================================================================

function animateCountUp(el, targetValue, duration = 1200, isPercent = false) {
  if (prefersReducedMotion()) {
    el.textContent = isPercent ? formatPersen(targetValue) : formatRupiahRingkas(targetValue);
    return;
  }

  const startTime = performance.now();
  const startVal = 0;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Easing easeOutQuart
    const ease = 1 - Math.pow(1 - progress, 4);
    const current = startVal + (targetValue - startVal) * ease;

    el.textContent = isPercent ? formatPersen(current) : formatRupiahRingkas(current);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = isPercent ? formatPersen(targetValue) : formatRupiahRingkas(targetValue);
    }
  }

  requestAnimationFrame(update);
}

function initKpiCountUp() {
  const totBelanjaAnggaran = realisasiAkun.total_halaman.jumlah_belanja.anggaran;
  const totBelanjaRealisasi = realisasiAkun.total_halaman.jumlah_belanja.realisasi;
  const serapanBelanjaPct = (totBelanjaRealisasi / totBelanjaAnggaran) * 100;

  const totPendapatanAnggaran = realisasiAkun.total_halaman.jumlah_pendapatan.anggaran;
  const totPendapatanRealisasi = realisasiAkun.total_halaman.jumlah_pendapatan.realisasi;
  const capaianPendapatanPct = (totPendapatanRealisasi / totPendapatanAnggaran) * 100;

  const kpiAnggaranEl = document.getElementById('kpi-belanja-anggaran');
  const kpiRealisasiEl = document.getElementById('kpi-belanja-realisasi');
  const kpiSerapanEl = document.getElementById('kpi-belanja-serapan');
  const kpiPendapatanEl = document.getElementById('kpi-pendapatan-capaian');

  if (kpiAnggaranEl) {
    kpiAnggaranEl.setAttribute('title', `Nilai penuh: ${formatRupiahPenuh(totBelanjaAnggaran)}`);
    animateCountUp(kpiAnggaranEl, totBelanjaAnggaran);
  }
  if (kpiRealisasiEl) {
    kpiRealisasiEl.setAttribute('title', `Nilai penuh: ${formatRupiahPenuh(totBelanjaRealisasi)}`);
    animateCountUp(kpiRealisasiEl, totBelanjaRealisasi);
  }
  if (kpiSerapanEl) {
    animateCountUp(kpiSerapanEl, serapanBelanjaPct, 1200, true);
  }
  if (kpiPendapatanEl) {
    animateCountUp(kpiPendapatanEl, capaianPendapatanPct, 1200, true);
  }
}

// =============================================================================
// CINCIN PROGRES & BULLET CHART BELANJA
// =============================================================================

function renderBelanjaProgressAndBullets() {
  const totBelanjaAnggaran = realisasiAkun.total_halaman.jumlah_belanja.anggaran;
  const totBelanjaRealisasi = realisasiAkun.total_halaman.jumlah_belanja.realisasi;
  const serapanBelanjaPct = (totBelanjaRealisasi / totBelanjaAnggaran) * 100;

  // 1. Cincin Progres
  const circleVal = document.getElementById('progress-ring-belanja-val');
  const percentText = document.getElementById('progress-ring-belanja-text');
  if (circleVal && percentText) {
    circleVal.setAttribute('fill', 'none');
    const trackEl = circleVal.parentElement?.querySelector('.progress-ring-track');
    if (trackEl) trackEl.setAttribute('fill', 'none');
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    circleVal.style.strokeDasharray = `${circumference}`;
    const offset = circumference - (serapanBelanjaPct / 100) * circumference;
    circleVal.style.strokeDashoffset = `${offset}`;
    percentText.textContent = formatPersen(serapanBelanjaPct);
  }

  // 2. Posisi Tanggal dalam Tahun
  const posTanggal = hitungPosisiHariDalamTahun(realisasiMeta.tanggal_data);
  const posPills = document.querySelectorAll('.posisi-tanggal-pill');
  posPills.forEach((p) => {
    p.textContent = `Posisi tanggal data: Hari ke-${posTanggal.hariKe} dari ${posTanggal.totalHari} (${formatPersen(posTanggal.persen)})`;
  });

  // 3. Bullet Chart 9 Jenis Belanja
  const bulletContainer = document.getElementById('bullet-chart-belanja-list');
  if (!bulletContainer) return;

  const belanjaList = realisasiAkun.belanja || [];
  let html = '';

  belanjaList.forEach((item) => {
    const ang = item.anggaran;
    const real = item.realisasi;
    const pct = ang > 0 ? (real / ang) * 100 : 0;
    const pctClamped = Math.min(Math.max(pct, 0), 100);

    // Pembersihan nama agar ringkas
    let displayName = item.nama;
    if (displayName.startsWith('Belanja Modal')) {
      displayName = 'Belanja Modal (Agregat)';
    }

    html += `
      <div class="bullet-item" data-kode="${item.kode}">
        <div class="bullet-header">
          <span class="bullet-title">${displayName}</span>
          <span class="bullet-stats">
            <strong>${formatPersen(pct)}</strong> · ${formatRupiahRingkas(real)} / ${formatRupiahRingkas(ang)}
          </span>
        </div>
        <div class="bullet-track-container" title="Anggaran: ${formatRupiahPenuh(ang)} | Realisasi: ${formatRupiahPenuh(real)} (${formatPersen(pct)})">
          <div class="bullet-bar-fill" style="width: ${pctClamped}%;"></div>
          <div class="bullet-date-marker" style="left: ${posTanggal.persen}%;" title="${posTanggal.label}: ${formatPersen(posTanggal.persen)} (Hari ke-${posTanggal.hariKe})"></div>
        </div>
      </div>
    `;
  });

  bulletContainer.innerHTML = html;
}

// =============================================================================
// SAKELAR "DIPAKAI UNTUK APA?": BATANG SKPD VS MAWAR V4
// =============================================================================

function renderSkpdBarChart() {
  const mount = document.getElementById('chart-skpd-mount');
  if (!mount) return;

  if (!skpdBarChartInstance) {
    skpdBarChartInstance = window.echarts.init(mount, getEchartsTheme());
  }

  const sorted = [...realisasiSkpd.data].sort((a, b) => b.belanja.anggaran - a.belanja.anggaran);
  const items = sorted.slice(0, currentSkpdViewLimit).reverse(); // reverse for bottom-to-top horizontal bar

  const categories = items.map((i) => i.nama_pendek);
  const anggaranVals = items.map((i) => i.belanja.anggaran);
  const realisasiVals = items.map((i) => i.belanja.realisasi);

  const option = {
    animation: !prefersReducedMotion(),
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const item = items[params[0].dataIndex];
        const ang = item.belanja.anggaran;
        const real = item.belanja.realisasi;
        const pct = item.belanja.serapan_persen;
        return `
          <div style="font-weight:700; margin-bottom:4px;">${item.nama_pendek}</div>
          <div style="font-size:11px; color:#6B6159; margin-bottom:6px;">Peringkat Belanja #${item.peringkat_belanja} (${item.jenis_unit})</div>
          <div>Anggaran: <strong>${formatRupiahRingkas(ang)}</strong> <span style="font-size:11px; color:#6B6159;">(${formatRupiahPenuh(ang)})</span></div>
          <div>Realisasi: <strong>${formatRupiahRingkas(real)}</strong> <span style="font-size:11px; color:#6B6159;">(${formatRupiahPenuh(real)})</span></div>
          <div>Serapan: <strong>${formatSerapan(pct)}</strong></div>
          <div style="font-size:10px; color:#B07A0A; margin-top:4px;">* Porsi ${formatPersen(item.porsi_dari_total_belanja_persen)} dari total belanja APBD Jakarta</div>
        `;
      },
    },
    legend: {
      data: ['Anggaran Belanja', 'Realisasi Belanja'],
      bottom: 0,
    },
    grid: {
      top: 10,
      left: 12,
      right: 48,
      bottom: 36,
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        formatter: (val) => formatRupiahRingkas(val),
        color: '#6B6159',
      },
      splitLine: { lineStyle: { color: '#EAE4DC', type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        fontSize: 11,
        color: '#1F1A17',
        width: 150,
        overflow: 'truncate',
      },
    },
    series: [
      {
        name: 'Anggaran Belanja',
        type: 'bar',
        data: anggaranVals,
        itemStyle: { color: '#E6DACB', borderRadius: [0, 4, 4, 0] },
      },
      {
        name: 'Realisasi Belanja',
        type: 'bar',
        data: realisasiVals,
        itemStyle: { color: VIZ_COLORS.viz5, borderRadius: [0, 4, 4, 0] },
      },
    ],
  };

  skpdBarChartInstance.setOption(option, true);

  // Hover sync dengan tabel penjelajah unit
  skpdBarChartInstance.off('mouseover');
  skpdBarChartInstance.off('mouseout');

  skpdBarChartInstance.on('mouseover', (params) => {
    const item = items[params.dataIndex];
    if (!item) return;
    const row = document.querySelector(`.unit-row[data-no="${item.no}"]`);
    if (row) {
      row.classList.add('is-highlighted');
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  skpdBarChartInstance.on('mouseout', (params) => {
    const item = items[params.dataIndex];
    if (!item) return;
    const row = document.querySelector(`.unit-row[data-no="${item.no}"]`);
    if (row) row.classList.remove('is-highlighted');
  });

  // Klik batang membuka detail unit
  skpdBarChartInstance.off('click');
  skpdBarChartInstance.on('click', (params) => {
    const item = items[params.dataIndex];
    if (item) showSkpdModal(item);
  });
}

function initDipakaiUntukApaToggle() {
  const btnDinas = document.getElementById('toggle-dipakai-dinas');
  const btnUrusan = document.getElementById('toggle-dipakai-urusan');
  const containerDinas = document.getElementById('dipakai-container-dinas');
  const containerUrusan = document.getElementById('dipakai-container-urusan');
  const btnViewAll = document.getElementById('btn-skpd-view-all');

  btnDinas?.addEventListener('click', () => {
    btnDinas.classList.add('active');
    btnUrusan.classList.remove('active');
    if (containerDinas) containerDinas.style.display = 'block';
    if (containerUrusan) containerUrusan.style.display = 'none';
    setTimeout(() => {
      renderSkpdBarChart();
      skpdBarChartInstance?.resize();
    }, 50);
  });

  btnUrusan?.addEventListener('click', () => {
    btnUrusan.classList.add('active');
    btnDinas.classList.remove('active');
    if (containerDinas) containerDinas.style.display = 'none';
    if (containerUrusan) containerUrusan.style.display = 'block';
    // Trigger resize on V4
    window.dispatchEvent(new Event('resize'));
  });

  btnViewAll?.addEventListener('click', () => {
    if (currentSkpdViewLimit === 10) {
      currentSkpdViewLimit = 43;
      btnViewAll.textContent = 'Tampilkan 10 Unit Terbesar';
      const mount = document.getElementById('chart-skpd-mount');
      if (mount) mount.style.height = '900px';
    } else {
      currentSkpdViewLimit = 10;
      btnViewAll.textContent = 'Lihat Semua 43 Unit';
      const mount = document.getElementById('chart-skpd-mount');
      if (mount) mount.style.height = '420px';
    }
    renderSkpdBarChart();
    skpdBarChartInstance?.resize();
  });
}

// =============================================================================
// PENJELAJAH UNIT (UNIT EXPLORER TABLE)
// =============================================================================

function renderUnitExplorerTable() {
  const tbody = document.getElementById('unit-table-body');
  if (!tbody) return;

  let units = [...realisasiSkpd.data];

  // Filter Kategori
  if (unitFilterJenis !== 'all') {
    units = units.filter((u) => u.jenis_unit === unitFilterJenis);
  }

  // Filter Pencarian
  if (unitSearchQuery.trim()) {
    const q = unitSearchQuery.toLowerCase().trim();
    units = units.filter(
      (u) =>
        u.nama.toLowerCase().includes(q) ||
        u.nama_pendek.toLowerCase().includes(q)
    );
  }

  // Pengurutan (Sorting)
  units.sort((a, b) => {
    let valA = a.belanja.anggaran;
    let valB = b.belanja.anggaran;

    if (unitSortCol === 'nama') {
      return unitSortAsc
        ? a.nama_pendek.localeCompare(b.nama_pendek)
        : b.nama_pendek.localeCompare(a.nama_pendek);
    } else if (unitSortCol === 'realisasi') {
      valA = a.belanja.realisasi;
      valB = b.belanja.realisasi;
    } else if (unitSortCol === 'serapan') {
      valA = a.belanja.serapan_persen ?? -1;
      valB = b.belanja.serapan_persen ?? -1;
    }

    return unitSortAsc ? valA - valB : valB - valA;
  });

  if (units.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding:32px; color:var(--color-muted);">
          Tidak ditemukan unit yang sesuai dengan kata kunci "<strong>${unitSearchQuery}</strong>".
        </td>
      </tr>
    `;
    return;
  }

  let rowsHtml = '';
  units.forEach((u) => {
    const ang = u.belanja.anggaran;
    const real = u.belanja.realisasi;
    const serapan = u.belanja.serapan_persen;
    const serapanPct = serapan !== null ? Math.min(Math.max(serapan, 0), 100) : 0;

    rowsHtml += `
      <tr class="unit-row" data-no="${u.no}" tabindex="0" role="button" aria-label="Lihat rincian ${u.nama_pendek}">
        <td>
          <div style="font-weight:700; color:var(--color-ink);">${u.nama_pendek}</div>
          <div style="font-size:0.7rem; color:var(--color-muted); text-transform:uppercase;">#${u.peringkat_belanja} · ${u.jenis_unit}</div>
        </td>
        <td class="tabular-nums" title="${formatRupiahPenuh(ang)}">${formatRupiahRingkas(ang)}</td>
        <td class="tabular-nums" title="${formatRupiahPenuh(real)}">${formatRupiahRingkas(real)}</td>
        <td>
          <div class="unit-mini-bar">
            <div class="unit-mini-track">
              <div class="unit-mini-fill" style="width: ${serapanPct}%;"></div>
            </div>
            <span class="tabular-nums" style="font-weight:700;">${formatSerapan(serapan)}</span>
          </div>
        </td>
        <td style="text-align:center;">
          <span style="font-size:1.1rem; color:var(--color-muted);">›</span>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = rowsHtml;

  // Pasang event listener per baris
  tbody.querySelectorAll('.unit-row').forEach((row) => {
    const no = parseInt(row.getAttribute('data-no'), 10);
    const unit = realisasiSkpd.data.find((u) => u.no === no);

    row.addEventListener('click', () => {
      if (unit) showSkpdModal(unit);
    });

    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (unit) showSkpdModal(unit);
      }
    });

    // Hover sync dengan grafik batang ECharts
    row.addEventListener('mouseenter', () => {
      row.classList.add('is-highlighted');
    });
    row.addEventListener('mouseleave', () => {
      row.classList.remove('is-highlighted');
    });
  });
}

function initUnitExplorerControls() {
  const searchInput = document.getElementById('unit-search-input');
  searchInput?.addEventListener('input', (e) => {
    unitSearchQuery = e.target.value;
    renderUnitExplorerTable();
  });

  const filterBtns = document.querySelectorAll('.unit-filter-btn');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');
      unitFilterJenis = e.target.dataset.jenis;
      renderUnitExplorerTable();
    });
  });

  const sortHeaders = document.querySelectorAll('.unit-table th.sortable');
  sortHeaders.forEach((th) => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (unitSortCol === col) {
        unitSortAsc = !unitSortAsc;
      } else {
        unitSortCol = col;
        unitSortAsc = false;
      }

      sortHeaders.forEach((h) => {
        h.classList.remove('sort-asc', 'sort-desc');
      });
      th.classList.add(unitSortAsc ? 'sort-asc' : 'sort-desc');

      renderUnitExplorerTable();
    });
  });
}

// Modal Detail SKPD
function showSkpdModal(unit) {
  const modalContainer = document.getElementById('info-modal-container');
  if (!modalContainer) return;

  const ang = unit.belanja.anggaran;
  const real = unit.belanja.realisasi;
  const serapan = unit.belanja.serapan_persen;

  const pendapatanAng = unit.pendapatan.anggaran;
  const pendapatanReal = unit.pendapatan.realisasi;
  const pendapatanSerapan = pendapatanAng > 0 ? (pendapatanReal / pendapatanAng) * 100 : 0;

  const totalBelanja = realisasiAkun.total_halaman.jumlah_belanja.anggaran;
  const porsiBelanja = (ang / totalBelanja) * 100;

  let pendapatanHtml = '';
  if (pendapatanAng > 0 || pendapatanReal > 0) {
    pendapatanHtml = `
      <div class="info-modal-stat-box" style="margin-top:12px;">
        <div class="info-modal-stat-label">Pendapatan Unit (Bukan Pajak Daerah)</div>
        <div class="info-modal-stat-val">${formatRupiahRingkas(pendapatanReal)} / ${formatRupiahRingkas(pendapatanAng)} (${formatPersen(pendapatanSerapan)})</div>
        <div style="font-size:11px; color:var(--color-muted); margin-top:2px;">
          * Berasal dari retribusi/jasa layanan teknis unit terkait, bukan penerimaan akun Pajak Daerah.
        </div>
      </div>
    `;
  }

  modalContainer.innerHTML = `
    <div class="info-modal-backdrop is-open" id="info-modal-backdrop" role="dialog" aria-modal="true">
      <div class="info-modal-card">
        <button class="info-modal-close" id="info-modal-close-btn" aria-label="Tutup jendela penjelasan">×</button>
        
        <span class="info-modal-code">PERINGKAT #${unit.peringkat_belanja} · ${unit.jenis_unit.toUpperCase()}</span>
        <h3 class="info-modal-title">${unit.nama}</h3>
        
        <div class="info-modal-stats">
          <div class="info-modal-stat-box">
            <div class="info-modal-stat-label">Anggaran Belanja 2026</div>
            <div class="info-modal-stat-val">${formatRupiahRingkas(ang)}</div>
            <div style="font-size:11px; color:var(--color-muted); margin-top:2px;">${formatRupiahPenuh(ang)}</div>
          </div>
          <div class="info-modal-stat-box">
            <div class="info-modal-stat-label">Realisasi (per 25 Okt 2026)</div>
            <div class="info-modal-stat-val">${formatRupiahRingkas(real)}</div>
            <div style="font-size:11px; color:var(--color-muted); margin-top:2px;">${formatRupiahPenuh(real)}</div>
          </div>
          <div class="info-modal-stat-box">
            <div class="info-modal-stat-label">Tingkat Serapan</div>
            <div class="info-modal-stat-val">${formatSerapan(serapan)}</div>
            <div style="font-size:11px; color:var(--color-muted); margin-top:2px;">Target pagu belanja</div>
          </div>
          <div class="info-modal-stat-box">
            <div class="info-modal-stat-label">Porsi dari Total Belanja APBD</div>
            <div class="info-modal-stat-val">${formatPersen(porsiBelanja)}</div>
            <div style="font-size:11px; color:var(--color-muted); margin-top:2px;">Dari Rp74,29 T total APBD</div>
          </div>
        </div>

        ${pendapatanHtml}

        <div class="info-modal-explanation">
          <div class="info-modal-explanation-title">
            <span aria-hidden="true">ⓘ</span> Rincian Program &amp; Sub-Kegiatan
          </div>
          <p class="info-modal-explanation-text">
            Data program spesifik dan rincian sub-kegiatan SKPD ini belum tersedia dalam berkas dashboard BPKD. paJAK-Kita hanya menyajikan data resmi terverifikasi tanpa mengarang rincian tugas dinas.
          </p>
        </div>

        <div class="trust-source-badge" role="note" style="margin-top:0;">
          <span class="badge-tag-anggaran">[REALISASI KUMULATIF]</span>
          <span class="badge-info">Basis <strong>Realisasi per 25 Oktober 2026</strong></span>
          <span class="badge-separator" aria-hidden="true">•</span>
          <span class="badge-source">Sumber: <em>Dashboard Keuangan Daerah BPKD Provinsi DKI Jakarta</em></span>
        </div>
      </div>
    </div>
  `;

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
}

// =============================================================================
// WAFFLE CHART 10x10 ("JIKA BELANJA APBD JAKARTA RP100")
// =============================================================================

function renderWaffleChart() {
  const container = document.getElementById('waffle-chart-grid');
  const sentenceEl = document.getElementById('waffle-sentence-box') || document.getElementById('waffle-sentence-text') || document.getElementById('waffle-sentence');
  const legendEl = document.getElementById('waffle-legend-box');
  if (!container) return;

  let groups = [];
  const palette = getVizPalette();

  if (realisasiAkun?.total_halaman?.jumlah_belanja?.anggaran && realisasiSkpd?.data?.length) {
    const totalBelanja = realisasiAkun.total_halaman.jumlah_belanja.anggaran;
    const sorted = [...realisasiSkpd.data].sort((a, b) => b.belanja.anggaran - a.belanja.anggaran);

    // Top 6 units
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
        color: palette[idx % 7],
      };
    });

    // Hitung total kotak terisi untuk alokasi 'Lainnya'
    const filled = groups.reduce((sum, g) => sum + g.count, 0);
    const remainingCount = Math.max(100 - filled, 0);

    groups.push({
      nama: 'Lainnya (37 Unit SKPD)',
      porsi: (remainingAnggaran / totalBelanja) * 100,
      count: remainingCount,
      color: VIZ_COLORS.viz8 || '#9CA3AF',
    });
  } else {
    // Fallback data representatif sektor belanja jika data belum siap
    groups = [
      { nama: 'Dinas Pendidikan', porsi: 24.5, count: 25, color: '#BA1A1A' },
      { nama: 'Dinas Kesehatan', porsi: 14.0, count: 14, color: '#F59E0B' },
      { nama: 'Dinas Bina Marga', porsi: 6.8, count: 7, color: '#2563EB' },
      { nama: 'Dinas Sumber Daya Air', porsi: 5.6, count: 6, color: '#059669' },
      { nama: 'Dinas Perhubungan', porsi: 4.8, count: 5, color: '#7C3AED' },
      { nama: 'Dinas Lingkungan Hidup', porsi: 4.2, count: 4, color: '#D97706' },
      { nama: 'Lainnya (37 Unit SKPD)', porsi: 40.1, count: 39, color: '#9CA3AF' },
    ];
  }

  // Susun 100 cell
  const cells = [];
  groups.forEach((g) => {
    for (let i = 0; i < g.count; i++) {
      if (cells.length < 100) {
        cells.push(g);
      }
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
  if (sentenceEl) {
    sentenceEl.innerHTML = `
      Dari setiap <strong>Rp100</strong> anggaran belanja APBD Jakarta 2026, sekitar <strong>Rp${defaultGroup.count}</strong> dianggarkan lewat <strong>${defaultGroup.nama}</strong> (${formatPersen(defaultGroup.porsi)}).
    `;
  }

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

  // Hover Listener
  container.querySelectorAll('.waffle-cell').forEach((cell) => {
    cell.addEventListener('mouseenter', () => {
      const unit = cell.dataset.unit;
      const count = cell.dataset.count;
      const porsi = cell.dataset.porsi;

      if (sentenceEl) {
        sentenceEl.innerHTML = `
          Dari setiap <strong>Rp100</strong> anggaran belanja APBD Jakarta 2026, sekitar <strong>Rp${count}</strong> dianggarkan lewat <strong>${unit}</strong> (${formatPersen(Number(porsi))}).
        `;
      }

      if (legendEl) {
        legendEl.querySelectorAll('.waffle-legend-item').forEach((item) => {
          item.classList.toggle('is-active', item.dataset.unit === unit);
        });
      }
    });
  });

  if (legendEl) {
    legendEl.querySelectorAll('.waffle-legend-item').forEach((item) => {
    item.addEventListener('mouseenter', () => {
      const unit = item.dataset.unit;
      const group = groups.find((g) => g.nama === unit);
      if (!group) return;

      sentenceEl.innerHTML = `
        Dari setiap <strong>Rp100</strong> anggaran belanja APBD Jakarta 2026, sekitar <strong>Rp${group.count}</strong> dianggarkan lewat <strong>${group.nama}</strong> (${formatPersen(group.porsi)}).
      `;

      container.querySelectorAll('.waffle-cell').forEach((cell) => {
        if (cell.dataset.unit === unit) {
          cell.style.transform = 'scale(1.22)';
          cell.style.filter = 'brightness(1.1)';
        } else {
          cell.style.transform = 'scale(0.9)';
          cell.style.opacity = '0.5';
        }
      });
    });

    item.addEventListener('mouseleave', () => {
      container.querySelectorAll('.waffle-cell').forEach((cell) => {
        cell.style.transform = '';
        cell.style.filter = '';
        cell.style.opacity = '1';
      });
    });
  });
  }
}

// =============================================================================
// HALAMAN DINAS (PENDIDIKAN, KESEHATAN, BINA MARGA & SDA)
// =============================================================================

function renderDinasPage() {
  const titleEl = document.getElementById('dinas-page-title');
  const badgeEl = document.getElementById('dinas-page-badge');
  const angEl = document.getElementById('dinas-kpi-anggaran');
  const realEl = document.getElementById('dinas-kpi-realisasi');
  const serapanEl = document.getElementById('dinas-kpi-serapan');
  const rankEl = document.getElementById('dinas-kpi-rank');
  const porsiEl = document.getElementById('dinas-kpi-porsi');
  const descEl = document.getElementById('dinas-page-desc');
  const revCard = document.getElementById('dinas-revenue-box');
  const revValEl = document.getElementById('dinas-revenue-val');

  if (!titleEl) return;

  const totalBelanja = realisasiAkun.total_halaman.jumlah_belanja.anggaran;

  let currentData;

  if (currentDinasKey === 'pendidikan') {
    const unit = realisasiSkpd.data.find((u) => u.nama_pendek === 'Dinas Pendidikan');
    currentData = {
      nama: 'Dinas Pendidikan',
      badge: 'SKPD TUNGGAL · PERINGKAT #1',
      anggaran: unit.belanja.anggaran,
      realisasi: unit.belanja.realisasi,
      serapan: unit.belanja.serapan_persen,
      rank: '#1 dari 43 Unit',
      porsi: (unit.belanja.anggaran / totalBelanja) * 100,
      desc: 'Dinas Pendidikan mengelola alokasi anggaran belanja terbesar di DKI Jakarta untuk mendanai operasional sekolah negeri, bantuan operasional pendidikan, Kartu Jakarta Pintar (KJP), serta gaji dan tunjangan guru.',
      revenueAnggaran: unit.pendapatan.anggaran,
      revenueRealisasi: unit.pendapatan.realisasi,
    };
  } else if (currentDinasKey === 'kesehatan') {
    const unit = realisasiSkpd.data.find((u) => u.nama_pendek === 'Dinas Kesehatan');
    currentData = {
      nama: 'Dinas Kesehatan',
      badge: 'SKPD TUNGGAL · PERINGKAT #4',
      anggaran: unit.belanja.anggaran,
      realisasi: unit.belanja.realisasi,
      serapan: unit.belanja.serapan_persen,
      rank: `#${unit.peringkat_belanja} dari 43 Unit`,
      porsi: (unit.belanja.anggaran / totalBelanja) * 100,
      desc: 'Dinas Kesehatan bertanggung jawab atas layanan fasilitas kesehatan masyarakat, rumah sakit umum daerah (RSUD), puskesmas kecamatan/kelurahan, dan jaminan kesehatan warga Jakarta.',
      revenueAnggaran: unit.pendapatan.anggaran,
      revenueRealisasi: unit.pendapatan.realisasi,
    };
  } else {
    // Gabungan Bina Marga dan SDA
    const unitBM = realisasiSkpd.data.find((u) => u.nama_pendek === 'Dinas Bina Marga');
    const unitSDA = realisasiSkpd.data.find((u) => u.nama_pendek === 'Dinas Sumber Daya Air');

    const angGabung = unitBM.belanja.anggaran + unitSDA.belanja.anggaran;
    const realGabung = unitBM.belanja.realisasi + unitSDA.belanja.realisasi;
    const serapanGabung = (realGabung / angGabung) * 100;

    currentData = {
      nama: 'Bina Marga dan Sumber Daya Air (Gabungan)',
      badge: 'ANALISIS GABUNGAN 2 SKPD INFRASTRUKTUR',
      anggaran: angGabung,
      realisasi: realGabung,
      serapan: serapanGabung,
      rank: 'Gabungan Peringkat #2 & #3',
      porsi: (angGabung / totalBelanja) * 100,
      desc: '<strong>Catatan Transparansi:</strong> Ini adalah gabungan dari dua SKPD terpisah di Pemprov DKI Jakarta (Dinas Bina Marga: Rp5,36 T & Dinas Sumber Daya Air: Rp5,32 T) yang dijumlahkan untuk memberikan gambaran utuh anggaran pembangunan jalan, jembatan, trotoar, tanggul pantai, dan sistem drainase/pengendali banjir Jakarta.',
      revenueAnggaran: unitBM.pendapatan.anggaran + unitSDA.pendapatan.anggaran,
      revenueRealisasi: unitBM.pendapatan.realisasi + unitSDA.pendapatan.realisasi,
    };
  }

  titleEl.textContent = currentData.nama;
  if (badgeEl) badgeEl.textContent = currentData.badge;
  if (angEl) angEl.textContent = formatRupiahRingkas(currentData.anggaran);
  if (realEl) realEl.textContent = formatRupiahRingkas(currentData.realisasi);
  if (serapanEl) serapanEl.textContent = formatSerapan(currentData.serapan);
  if (rankEl) rankEl.textContent = currentData.rank;
  if (porsiEl) porsiEl.textContent = formatPersen(currentData.porsi);
  if (descEl) descEl.innerHTML = currentData.desc;

  if (revCard && revValEl) {
    if (currentData.revenueRealisasi > 0 || currentData.revenueAnggaran > 0) {
      revCard.style.display = 'block';
      revValEl.textContent = `${formatRupiahRingkas(currentData.revenueRealisasi)} / ${formatRupiahRingkas(currentData.revenueAnggaran)}`;
    } else {
      revCard.style.display = 'none';
    }
  }

  // Pembandingan dengan unit lain
  renderDinasCompare(currentData);
}

function renderDinasCompare(currentData) {
  const select = document.getElementById('dinas-compare-select');
  const resultCol = document.getElementById('dinas-compare-target-col');
  if (!select || !resultCol) return;

  // Update data kolom primer
  const primTitle = document.getElementById('dinas-compare-primary-title');
  const primAng = document.getElementById('dinas-compare-prim-ang');
  const primReal = document.getElementById('dinas-compare-prim-real');
  const primSerapan = document.getElementById('dinas-compare-prim-serapan');
  if (primTitle) primTitle.textContent = currentData.nama;
  if (primAng) primAng.textContent = formatRupiahRingkas(currentData.anggaran);
  if (primReal) primReal.textContent = formatRupiahRingkas(currentData.realisasi);
  if (primSerapan) primSerapan.textContent = formatSerapan(currentData.serapan);

  if (select.children.length <= 1) {
    // Isi dropdown dengan 43 unit
    const sorted = [...realisasiSkpd.data].sort((a, b) => a.nama_pendek.localeCompare(b.nama_pendek));
    select.innerHTML = '<option value="">Pilih unit SKPD untuk dibandingkan...</option>';
    sorted.forEach((u) => {
      const opt = document.createElement('option');
      opt.value = u.no;
      opt.textContent = `${u.nama_pendek} (#${u.peringkat_belanja})`;
      select.appendChild(opt);
    });
  }

  const updateCompareBox = (unitNo) => {
    if (!unitNo) {
      resultCol.innerHTML = `
        <div style="text-align:center; padding:32px; color:var(--color-muted);">
          Pilih salah satu unit SKPD di atas untuk melihat perbandingan berdampingan.
        </div>
      `;
      return;
    }

    const targetUnit = realisasiSkpd.data.find((u) => u.no === parseInt(unitNo, 10));
    if (!targetUnit) return;

    resultCol.innerHTML = `
      <div class="dinas-compare-box">
        <span class="info-modal-code">PERINGKAT #${targetUnit.peringkat_belanja} · ${targetUnit.jenis_unit.toUpperCase()}</span>
        <h4 style="font-size:1.1rem; font-weight:800; color:var(--color-ink); margin:6px 0 14px 0;">${targetUnit.nama_pendek}</h4>
        
        <div style="display:flex; flex-direction:column; gap:10px;">
          <div>
            <div style="font-size:0.75rem; color:var(--color-muted); font-weight:700;">ANGGARAN BELANJA</div>
            <div style="font-size:1.25rem; font-weight:800; color:var(--color-ink);">${formatRupiahRingkas(targetUnit.belanja.anggaran)}</div>
            <div style="font-size:11px; color:var(--color-muted);">${formatRupiahPenuh(targetUnit.belanja.anggaran)}</div>
          </div>
          <div>
            <div style="font-size:0.75rem; color:var(--color-muted); font-weight:700;">REALISASI BELANJA</div>
            <div style="font-size:1.25rem; font-weight:800; color:var(--color-ink);">${formatRupiahRingkas(targetUnit.belanja.realisasi)}</div>
            <div style="font-size:11px; color:var(--color-muted);">${formatRupiahPenuh(targetUnit.belanja.realisasi)}</div>
          </div>
          <div>
            <div style="font-size:0.75rem; color:var(--color-muted); font-weight:700;">TINGKAT SERAPAN</div>
            <div style="font-size:1.25rem; font-weight:800; color:var(--color-ink);">${formatSerapan(targetUnit.belanja.serapan_persen)}</div>
          </div>
        </div>
      </div>
    `;
  };

  select.onchange = (e) => {
    compareUnitNo = e.target.value;
    updateCompareBox(compareUnitNo);
  };

  if (compareUnitNo) {
    select.value = compareUnitNo;
    updateCompareBox(compareUnitNo);
  }
}

function initDinasTabs() {
  const tabs = document.querySelectorAll('.dinas-tab-btn');
  tabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      tabs.forEach((t) => t.classList.remove('active'));
      e.target.classList.add('active');
      currentDinasKey = e.target.dataset.dinas;
      renderDinasPage();
      updateUrlState();
    });
  });
}

// =============================================================================
// PENERIMAAN PAJAK REALISASI (STAT CARDS & BULLET CHART)
// =============================================================================

function renderPenerimaanRealisasi() {
  const akunPajak = realisasiAkun.pendapatan.find((p) => p.kode === '4.1.01');
  if (!akunPajak) return;

  const ang = akunPajak.anggaran;
  const real = akunPajak.realisasi;
  const sisa = akunPajak.selisih_menuju_anggaran; // "Sisa menuju anggaran"
  const capaianPct = akunPajak.persen_hitung;

  // Stat Cards
  const angEl = document.getElementById('stat-pajak-anggaran');
  const realEl = document.getElementById('stat-pajak-realisasi');
  const sisaEl = document.getElementById('stat-pajak-sisa');

  if (angEl) angEl.textContent = formatRupiahRingkas(ang);
  if (realEl) realEl.textContent = formatRupiahRingkas(real);
  if (sisaEl) sisaEl.textContent = formatRupiahRingkas(sisa);

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
    const offset = circumference - (capaianPct / 100) * circumference;
    circleVal.style.strokeDashoffset = `${offset}`;
    percentText.textContent = formatPersen(capaianPct);
  }

  // Bullet Chart 6 Akun Pendapatan
  const bulletContainer = document.getElementById('bullet-chart-pendapatan-list');
  if (!bulletContainer) return;

  const posTanggal = hitungPosisiHariDalamTahun(realisasiMeta.tanggal_data);
  let html = '';

  realisasiAkun.pendapatan.forEach((p) => {
    const pAng = p.anggaran;
    const pReal = p.realisasi;
    const pPct = p.persen_hitung;
    const pPctClamped = Math.min(Math.max(pPct, 0), 100);

    html += `
      <div class="bullet-item">
        <div class="bullet-header">
          <span class="bullet-title">${p.nama} (${p.kode})</span>
          <span class="bullet-stats">
            <strong>${formatPersen(pPct)}</strong> · ${formatRupiahRingkas(pReal)} / ${formatRupiahRingkas(pAng)}
          </span>
        </div>
        <div class="bullet-track-container" title="Target: ${formatRupiahPenuh(pAng)} | Masuk: ${formatRupiahPenuh(pReal)} (${formatPersen(pPct)})">
          <div class="bullet-bar-fill ${p.kode === '4.1.01' ? 'bullet-pajak' : ''}" style="width: ${pPctClamped}%;"></div>
          <div class="bullet-date-marker" style="left: ${posTanggal.persen}%;" title="${posTanggal.label}: ${formatPersen(posTanggal.persen)}"></div>
        </div>
      </div>
    `;
  });

  bulletContainer.innerHTML = html;
}

// =============================================================================
// BANTUAN BACA ("CARA MEMBACA GRAFIK INI")
// =============================================================================

async function loadTeksBantu() {
  if (teksBantuData) return teksBantuData;
  try {
    const res = await fetch('content/teks-bantu.json');
    if (res.ok) {
      teksBantuData = await res.json();
      return teksBantuData;
    }
  } catch {
    // fallback
  }
  return null;
}

function showHelpModal(key) {
  if (!teksBantuData) return;
  const guide = teksBantuData.panduan_grafik[key];
  if (!guide) return;

  const modalContainer = document.getElementById('info-modal-container');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="info-modal-backdrop is-open" id="info-modal-backdrop" role="dialog" aria-modal="true">
      <div class="info-modal-card">
        <button class="info-modal-close" id="info-modal-close-btn" aria-label="Tutup panduan">×</button>
        
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
          <img src="assets/maskot-ondi/ondi-01-berdiri.svg" alt="Maskot Ondi" style="width:36px; height:36px;">
          <div>
            <span class="info-modal-code">PANDUAN MEMBACA GRAFIK</span>
            <h3 class="info-modal-title" style="margin:0;">${guide.judul}</h3>
          </div>
        </div>

        <ul style="padding-left:20px; line-height:1.6; font-size:0.875rem; color:var(--color-ink-muted); margin-bottom:20px;">
          ${guide.petunjuk.map((p) => `<li style="margin-bottom:8px;">${p}</li>`).join('')}
        </ul>

        <div class="info-modal-explanation">
          <div class="info-modal-explanation-title">
            <span aria-hidden="true">ⓘ</span> Catatan Redaksi
          </div>
          <p class="info-modal-explanation-text">
            ${teksBantuData.catatan}
          </p>
        </div>
      </div>
    </div>
  `;

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
}

function initHelpButtons() {
  document.querySelectorAll('[data-help-key]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showHelpModal(btn.dataset.helpKey);
    });
  });
}

// =============================================================================
// PENCARIAN CEPAT (CTRL/CMD + K)
// =============================================================================

function initQuickSearch() {
  const backdrop = document.getElementById('quick-search-backdrop');
  const input = document.getElementById('quick-search-input');
  const resultsBox = document.getElementById('quick-search-results');
  const triggerBtn = document.getElementById('quick-search-trigger');

  if (!backdrop || !input || !resultsBox) return;

  const openSearch = () => {
    backdrop.classList.add('is-open');
    input.value = '';
    renderSearchResults('');
    setTimeout(() => input.focus(), 50);
  };

  const closeSearch = () => {
    backdrop.classList.remove('is-open');
  };

  triggerBtn?.addEventListener('click', openSearch);

  // Keyboard shortcut Ctrl+K / Cmd+K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (backdrop.classList.contains('is-open')) {
        closeSearch();
      } else {
        openSearch();
      }
    } else if (e.key === 'Escape' && backdrop.classList.contains('is-open')) {
      closeSearch();
    }
  });

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeSearch();
  });

  // Pencarian items
  const buildIndex = () => {
    const items = [
      { nama: 'Penerimaan Pajak Daerah', tipe: 'Bagian', url: '#penerimaan' },
      { nama: 'Belanja APBD Jakarta', tipe: 'Bagian', url: '#apbd' },
      { nama: 'Alokasi Belanja Per Dinas', tipe: 'Bagian', url: '#dinas' },
      { nama: 'Penjelajah 43 Unit SKPD', tipe: 'Tabel', url: '#unit-explorer' },
      { nama: 'Waffle Chart Jika Belanja Rp100', tipe: 'Grafik', url: '#waffle-section' },
      { nama: 'Pembuat Kartu Insight Warga', tipe: 'Fitur', url: '#generator' },
      { nama: 'Kamus Pajak Daerah', tipe: 'Glosarium', url: '#kamus' },
    ];

    if (realisasiSkpd) {
      realisasiSkpd.data.forEach((u) => {
        items.push({
          nama: u.nama_pendek,
          tipe: u.jenis_unit,
          action: () => {
            closeSearch();
            showSkpdModal(u);
          },
        });
      });
    }

    if (realisasiAkun) {
      realisasiAkun.pendapatan.forEach((p) => {
        items.push({
          nama: `${p.nama} (${p.kode})`,
          tipe: 'Akun Pendapatan',
          url: '#penerimaan',
        });
      });
      realisasiAkun.belanja.forEach((b) => {
        items.push({
          nama: `${b.nama} (${b.kode})`,
          tipe: 'Akun Belanja',
          url: '#apbd',
        });
      });
    }

    return items;
  };

  let searchIndex = [];

  const renderSearchResults = (q) => {
    if (searchIndex.length === 0) searchIndex = buildIndex();
    const query = q.toLowerCase().trim();

    const filtered = query
      ? searchIndex.filter((item) => item.nama.toLowerCase().includes(query))
      : searchIndex.slice(0, 8);

    if (filtered.length === 0) {
      resultsBox.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--color-muted); font-size: 0.875rem;">
          Tidak ada hasil untuk "<strong>${q}</strong>"
        </div>
      `;
      return;
    }

    resultsBox.innerHTML = filtered
      .map(
        (item, idx) => `
          <a class="quick-search-item ${idx === 0 ? 'is-selected' : ''}" data-idx="${idx}" href="${item.url || '#'}" role="option">
            <span style="font-weight: 600;">${item.nama}</span>
            <span class="quick-search-tag">${item.tipe}</span>
          </a>
        `
      )
      .join('');

    resultsBox.querySelectorAll('.quick-search-item').forEach((link, idx) => {
      const item = filtered[idx];
      link.addEventListener('click', (e) => {
        if (item.action) {
          e.preventDefault();
          item.action();
        } else {
          closeSearch();
        }
      });
    });
  };

  input.addEventListener('input', (e) => {
    renderSearchResults(e.target.value);
  });

  // Navigasi keyboard Panah atas/bawah & Enter
  input.addEventListener('keydown', (e) => {
    const items = resultsBox.querySelectorAll('.quick-search-item');
    let selectedIdx = -1;
    items.forEach((item, idx) => {
      if (item.classList.contains('is-selected')) selectedIdx = idx;
    });

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = (selectedIdx + 1) % items.length;
      items.forEach((item, idx) => item.classList.toggle('is-selected', idx === nextIdx));
      items[nextIdx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = (selectedIdx - 1 + items.length) % items.length;
      items.forEach((item, idx) => item.classList.toggle('is-selected', idx === prevIdx));
      items[prevIdx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIdx >= 0 && items[selectedIdx]) {
        items[selectedIdx].click();
      }
    }
  });
}

// =============================================================================
// SHAREABLE URL STATE
// =============================================================================

function updateUrlState() {
  const params = new URLSearchParams(window.location.search);
  params.set('dinas', currentDinasKey);
  const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
  window.history.replaceState(null, '', newUrl);
}

function restoreUrlState() {
  const params = new URLSearchParams(window.location.search);
  const dinasParam = params.get('dinas');
  if (dinasParam && ['pendidikan', 'kesehatan', 'binamarga-sda'].includes(dinasParam)) {
    currentDinasKey = dinasParam;
    const tabBtn = document.querySelector(`.dinas-tab-btn[data-dinas="${dinasParam}"]`);
    if (tabBtn) {
      document.querySelectorAll('.dinas-tab-btn').forEach((b) => b.classList.remove('active'));
      tabBtn.classList.add('active');
    }
  }
}

// =============================================================================
// INISIALISASI UTAMA MODUL REALISASI
// =============================================================================

export async function initRealisasiModule() {
  try {
    const [metaR, akunR, skpdR, turunanR, teksB] = await Promise.all([
      getRealisasiMeta(),
      getRealisasiPerAkun(),
      getRealisasiPerSkpd(),
      getTurunanRealisasi(),
      loadTeksBantu(),
    ]);

    realisasiMeta = metaR;
    realisasiAkun = akunR;
    realisasiSkpd = skpdR;
    turunanRealisasi = turunanR;
    teksBantuData = teksB;

    restoreUrlState();

    // 1. KPI Count-up
    initKpiCountUp();

    // 2. Cincin Progres & Bullet Chart 9 Belanja
    renderBelanjaProgressAndBullets();

    // 3. Sakelar Dipakai Untuk Apa
    initDipakaiUntukApaToggle();
    renderSkpdBarChart();

    // 4. Penjelajah Unit
    initUnitExplorerControls();
    renderUnitExplorerTable();

    // 5. Waffle Chart
    renderWaffleChart();

    // 6. Halaman Dinas
    initDinasTabs();
    renderDinasPage();

    // 7. Penerimaan Pajak Realisasi
    renderPenerimaanRealisasi();

    // 8. Bantuan Baca
    initHelpButtons();

    // 9. Quick Search
    initQuickSearch();

    // Resize event
    window.addEventListener('resize', () => {
      skpdBarChartInstance?.resize();
    });
  } catch (err) {
    console.error('[paJAK-Kita] Gagal memuat modul realisasi:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRealisasiModule);
} else {
  initRealisasiModule();
}
