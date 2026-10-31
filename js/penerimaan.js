/**
 * paJAK-Kita — Modul Halaman Penerimaan Pajak Daerah (penerimaan.html)
 * File: js/penerimaan.js
 * 
 * Mengintegrasikan seluruh dataset penerimaan dari dataEngine.js:
 * 1. Horizon 5 Tahun (2022–2026) dengan filter tahun interaktif.
 * 2. Cincin progres capaian target dan metrik target vs realisasi (Dataset 08).
 * 3. Komparasi capaian Pajak Daerah vs Retribusi Daerah (Dataset 01 & 02).
 * 4. Rincian 12 Jenis Pajak Daerah dengan filter kategori & porsi belanja (Dataset 10 & 03).
 * 5. Tren Musiman Bulanan 12 Bulan (Seasonality Pattern) dengan 3 bulan puncak (Dataset 09).
 * 6. Wajib Pajak & Rasio Kepatuhan Warga (Dataset 11).
 */

import {
  OFFICIAL_5YR_DATASET,
  getPilar1Metrics,
  formatRupiahSingkat,
  formatPersen,
  formatAngkaBulat
} from './dataEngine.js';

let currentSelectedYear = 2026;
let currentSelectedCategory = 'all';
let currentSelectedMonthIndex = 7; // Default: Agustus (Puncak Jatuh Tempo PBB-P2)

export function initPenerimaanPage() {
  renderYearSelector();
  updatePenerimaanData(currentSelectedYear);
  renderJenisPajak(currentSelectedCategory);
  renderSeasonalityChart();
  renderSeasonalityDetail(currentSelectedMonthIndex);
  renderWajibPajakHistory();
  initCategoryFilterTabs();
}

/**
 * 1. Render Tombol Pemilih Tahun (Horizon 2022–2026)
 */
function renderYearSelector() {
  const container = document.querySelector('#penerimaan-year-selector');
  if (!container) return;

  const years = OFFICIAL_5YR_DATASET.horizon;
  container.innerHTML = years.map((yr) => {
    const isCurrent = yr === currentSelectedYear;
    const label = yr === 2026 ? `${yr} (APBD Penetapan)` : yr === 2025 ? `${yr} (Proyeksi)` : `${yr}`;
    return `
      <button type="button" class="year-pill-btn ${isCurrent ? 'active' : ''}" data-year="${yr}">
        ${label}
      </button>
    `;
  }).join('');

  container.querySelectorAll('.year-pill-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const yr = parseInt(btn.getAttribute('data-year'), 10);
      if (yr && yr !== currentSelectedYear) {
        currentSelectedYear = yr;
        container.querySelectorAll('.year-pill-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        updatePenerimaanData(currentSelectedYear);
      }
    });
  });
}

/**
 * 2. Update Seluruh Angka Kunci & Cincin Progres Berdasarkan Tahun Terpilih
 */
function updatePenerimaanData(year) {
  const p1 = getPilar1Metrics(year);
  const data = OFFICIAL_5YR_DATASET;
  const penerimaan = data.penerimaanTahunan[year] || data.penerimaanTahunan[2026];
  const pajakRetribusi = data.pajakVsRetribusi[year] || data.pajakVsRetribusi[2026];
  const wp = data.wajibPajak[year] || data.wajibPajak[2026];

  // A. Ringkasan 3 Angka Kunci
  const elAnggaran = document.querySelector('#stat-pajak-anggaran');
  const elRealisasi = document.querySelector('#stat-pajak-realisasi');
  const elPersen = document.querySelector('#stat-pajak-persen');
  const elStatus = document.querySelector('#stat-pajak-status');
  const elSurplusDefisit = document.querySelector('#stat-pajak-surplus-val');

  if (elAnggaran) elAnggaran.textContent = formatRupiahSingkat(penerimaan.target);
  if (elRealisasi) elRealisasi.textContent = formatRupiahSingkat(penerimaan.realisasi);
  if (elPersen) elPersen.textContent = formatPersen(penerimaan.capaian);

  const surplusNominal = penerimaan.realisasi - penerimaan.target;
  const isSurplus = surplusNominal >= 0;
  if (elStatus) {
    elStatus.textContent = isSurplus ? 'Surplus Anggaran' : 'Sisa Target';
    elStatus.className = `stat-chip ${isSurplus ? 'chip-success' : 'chip-warning'}`;
  }
  if (elSurplusDefisit) {
    elSurplusDefisit.textContent = `${isSurplus ? '+' : '-'}${formatRupiahSingkat(Math.abs(surplusNominal))}`;
  }

  // B. Circular Progress Gauge
  const ringValEl = document.querySelector('#progress-ring-pajak-val');
  const ringTextEl = document.querySelector('#progress-ring-pajak-text');
  const ringSubEl = document.querySelector('#progress-ring-pajak-sub');

  if (ringTextEl) ringTextEl.textContent = formatPersen(penerimaan.capaian);
  if (ringSubEl) ringSubEl.textContent = `Tahun Anggaran ${year}`;

  if (ringValEl) {
    const radius = 45;
    const circumference = 2 * Math.PI * radius; // ~282.743
    ringValEl.style.strokeDasharray = `${circumference}`;
    const fillPercent = Math.min(Math.max(penerimaan.capaian, 0), 100);
    const offset = circumference - (fillPercent / 100) * circumference;
    ringValEl.style.strokeDashoffset = `${offset}`;
  }

  // C. Komparasi Pajak Daerah vs Retribusi Daerah (Dataset 01 & 02)
  const elPajakVal = document.querySelector('#metric-comp-pajak-val');
  const elPajakBar = document.querySelector('#metric-comp-pajak-bar');
  const elRetribusiVal = document.querySelector('#metric-comp-retribusi-val');
  const elRetribusiBar = document.querySelector('#metric-comp-retribusi-bar');
  const elPajakVsRetribusiNote = document.querySelector('#pajak-retribusi-insight-text');

  if (elPajakVal) elPajakVal.textContent = formatPersen(pajakRetribusi.pajak);
  if (elPajakBar) elPajakBar.style.width = `${Math.min(pajakRetribusi.pajak, 100)}%`;
  if (elRetribusiVal) elRetribusiVal.textContent = formatPersen(pajakRetribusi.retribusi);
  if (elRetribusiBar) elRetribusiBar.style.width = `${Math.min(pajakRetribusi.retribusi, 100)}%`;

  if (elPajakVsRetribusiNote) {
    elPajakVsRetribusiNote.innerHTML = `Pajak Daerah murni mencapai <strong>${formatPersen(pajakRetribusi.pajak)}</strong> dari target tahun ${year}, sedangkan Retribusi Daerah (retribusi jasa umum, usaha, dan perizinan tertentu) mencapai <strong>${formatPersen(pajakRetribusi.retribusi)}</strong>.`;
  }

  // D. Ringkasan Wajib Pajak Header
  const elWpTotal = document.querySelector('#stat-wp-total-val');
  const elWpPertumbuhan = document.querySelector('#stat-wp-growth-val');
  const elWpKepatuhan = document.querySelector('#stat-wp-patuh-val');

  if (elWpTotal) elWpTotal.textContent = `${(wp.total / 1e6).toFixed(2).replace('.', ',')} Juta WP`;
  if (elWpPertumbuhan) elWpPertumbuhan.textContent = `+${wp.pertumbuhanYoY.toFixed(1).replace('.', ',')}% YoY`;
  if (elWpKepatuhan) elWpKepatuhan.textContent = formatPersen(wp.kepatuhanPersen);

  // E. Update Keterangan Ondi Edukasi
  const elOndiInsight = document.querySelector('#penerimaan-ondi-narrative');
  if (elOndiInsight) {
    elOndiInsight.innerHTML = `Di tahun <strong>${year}</strong>, realisasi pajak daerah DKI Jakarta tercatat sebesar <strong>${formatRupiahSingkat(penerimaan.realisasi)}</strong> (${formatPersen(penerimaan.capaian)} dari pagu). Penerimaan terbesar konsisten ditopang oleh PBB-P2 dan PKB yang menyumbang hampir 40% dari kas masuk daerah!`;
  }
}

/**
 * 3. Render 12 Rincian Jenis Pajak Daerah dengan Filter Kategori (Dataset 10 & 03)
 */
function renderJenisPajak(category = 'all') {
  const container = document.querySelector('#jenis-pajak-grid-list');
  if (!container) return;

  const list = OFFICIAL_5YR_DATASET.jenisPajak2026;
  
  // Klasifikasi kategori
  const filtered = list.filter((item) => {
    if (category === 'all') return true;
    if (category === 'kendaraan') return ['PKB', 'BBNKB', 'PBBKB'].includes(item.kode);
    if (category === 'properti') return ['PBB-P2', 'BPHTB'].includes(item.kode);
    if (category === 'pbjt') return item.kode.startsWith('PBJT') || ['ROKOK', 'REKLAME'].includes(item.kode);
    return true;
  });

  container.innerHTML = filtered.map((item, index) => {
    const isAboveTarget = item.persen >= 100;
    return `
      <article class="jenis-pajak-card" data-kode="${item.kode}">
        <div class="jenis-pajak-head">
          <div class="jenis-rank-badge">0${index + 1}</div>
          <div class="jenis-name-wrap">
            <h4 class="jenis-pajak-title">${item.nama}</h4>
            <span class="jenis-kode-tag">${item.kode}</span>
          </div>
          <div class="jenis-share-pill">${item.share}% Porsi Kas</div>
        </div>

        <div class="jenis-pajak-body">
          <div class="jenis-numbers-row">
            <div>
              <span class="num-caption">Realisasi Kas</span>
              <span class="num-val-highlight">${formatRupiahSingkat(item.realisasi)}</span>
            </div>
            <div class="text-right">
              <span class="num-caption">Pagu Target</span>
              <span class="num-val-muted">${formatRupiahSingkat(item.target)}</span>
            </div>
          </div>

          <div class="jenis-bar-track" aria-hidden="true">
            <div class="jenis-bar-fill ${isAboveTarget ? 'bar-success' : 'bar-normal'}" style="width: ${Math.min(item.persen, 100)}%;"></div>
          </div>

          <div class="jenis-pajak-footer">
            <span class="jenis-status-pill ${isAboveTarget ? 'status-green' : 'status-amber'}">
              ${isAboveTarget ? '✓ Melampaui Target' : 'Progres Berjalan'} (${item.persen.toFixed(1).replace('.', ',')}%)
            </span>
            <span class="jenis-sisa-label">
              ${isAboveTarget ? 'Surplus' : 'Sisa'}: ${formatRupiahSingkat(Math.abs(item.realisasi - item.target))}
            </span>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function initCategoryFilterTabs() {
  const tabs = document.querySelectorAll('.jenis-filter-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const cat = tab.getAttribute('data-cat');
      if (cat && cat !== currentSelectedCategory) {
        currentSelectedCategory = cat;
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        renderJenisPajak(currentSelectedCategory);
      }
    });
  });
}

/**
 * 4. Render Grafik Musiman Bulanan 12 Bulan (Dataset 09)
 */
function renderSeasonalityChart() {
  const container = document.querySelector('#seasonality-bars-container');
  if (!container) return;

  const data = OFFICIAL_5YR_DATASET.seasonalityBulanan;
  const maxPercent = Math.max(...data.map(d => d.persen)); // ~11.4%

  container.innerHTML = data.map((item, idx) => {
    const heightPercent = ((item.persen / maxPercent) * 100).toFixed(1);
    const isPeak = Boolean(item.puncak);
    const isSelected = idx === currentSelectedMonthIndex;

    return `
      <div class="season-bar-col ${isSelected ? 'is-selected' : ''}" data-idx="${idx}">
        <div class="season-bar-track">
          <div class="season-bar-fill ${isPeak ? 'bar-peak' : ''}" style="height: ${heightPercent}%;">
            <span class="season-val-tooltip">${item.persen.toFixed(1).replace('.', ',')}%</span>
          </div>
        </div>
        <div class="season-month-label ${isPeak ? 'lbl-peak' : ''}">${item.bulan}</div>
        ${isPeak ? '<span class="season-peak-indicator" title="Bulan Puncak Penerimaan">★</span>' : ''}
      </div>
    `;
  }).join('');

  container.querySelectorAll('.season-bar-col').forEach((col) => {
    col.addEventListener('click', () => {
      const idx = parseInt(col.getAttribute('data-idx'), 10);
      if (!isNaN(idx)) {
        currentSelectedMonthIndex = idx;
        container.querySelectorAll('.season-bar-col').forEach((c) => c.classList.remove('is-selected'));
        col.classList.add('is-selected');
        renderSeasonalityDetail(currentSelectedMonthIndex);
      }
    });
  });
}

function renderSeasonalityDetail(index) {
  const detailEl = document.querySelector('#seasonality-month-detail-card');
  if (!detailEl) return;

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const item = OFFICIAL_5YR_DATASET.seasonalityBulanan[index] || OFFICIAL_5YR_DATASET.seasonalityBulanan[7];
  const fullMonth = monthNames[index] || 'Agustus';

  detailEl.innerHTML = `
    <div class="season-detail-header">
      <div class="season-detail-tag">${item.puncak ? 'BULAN PUNCAK PENERIMAAN' : 'POLA PENERIMAAN RUTIN'}</div>
      <h4 class="season-detail-title">${fullMonth} · Kontribusi ${item.persen.toFixed(1).replace('.', ',')}% Kas Tahunan</h4>
    </div>
    <p class="season-detail-desc">${item.catatan}</p>
    <div class="season-detail-context">
      <strong>Catatan Bapenda:</strong> Siklus kas DKI Jakarta sangat dipengaruhi jatuh tempo ketetapan PBB-P2 massal di kuartal III dan diskon HUT DKI untuk PKB di kuartal II. Warga yang membayar tepat waktu sebelum jatuh tempo menghindari denda bunga 1% per bulan.
    </div>
  `;
}

/**
 * 5. Render Riwayat Kepatuhan Wajib Pajak 5 Tahun (Dataset 11)
 */
function renderWajibPajakHistory() {
  const tableBody = document.querySelector('#table-wp-history-body');
  if (!tableBody) return;

  const years = OFFICIAL_5YR_DATASET.horizon;
  const wpData = OFFICIAL_5YR_DATASET.wajibPajak;

  tableBody.innerHTML = years.map((yr) => {
    const item = wpData[yr];
    return `
      <tr>
        <td class="font-bold text-ink">${yr}</td>
        <td class="tabular-nums">${(item.total / 1e6).toFixed(2).replace('.', ',')} Juta WP</td>
        <td class="tabular-nums text-success font-bold">+${item.pertumbuhanYoY.toFixed(1).replace('.', ',')}%</td>
        <td class="tabular-nums font-bold">${formatPersen(item.kepatuhanPersen)}</td>
        <td>
          <div class="wp-mini-bar-track">
            <div class="wp-mini-bar-fill" style="width: ${item.kepatuhanPersen}%;"></div>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Auto-boot on DOM ready in browser environment
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPenerimaanPage);
  } else {
    initPenerimaanPage();
  }
}
