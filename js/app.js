/**
 * app.js — Main application orchestrator for paJAK-Kita
 */

import { InfoPanel } from './infoPanel.js';
import { Dashboard } from './dashboard.js';
import { CardGenerator } from './cardGenerator.js';
import { dataClient } from './dataClient.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize InfoPanel (R10)
  const infoPanel = new InfoPanel();
  window.infoPanelInstance = infoPanel;

  // 2. Initialize Dashboard (R1, R2, R3, R5)
  const dashboard = new Dashboard(infoPanel);
  window.dashboardInstance = dashboard;

  // 3. Initialize Card Generator (R6, R8)
  const cardGenerator = new CardGenerator(infoPanel);
  window.cardGeneratorInstance = cardGenerator;

  // 4. Initialize Floating Search Bar Autocomplete
  setupFloatingSearch(dashboard);

  // 5. Initialize Scroll Watcher for Bottom Pill Bar
  setupScrollWatcher();

  // 6. Initialize Interactive Jakarta Map
  setupInteractiveMap(dashboard, cardGenerator);

  // 7. Load Trust Layer Metadata & Freshness Banner (R4)
  setupTrustLayer();
});

function setupFloatingSearch(dashboard) {
  const input = document.getElementById('hero-search-input');
  const dropdown = document.getElementById('search-dropdown');
  if (!input || !dropdown) return;

  const quickItems = [
    { label: 'Jakarta Selatan (Penerimaan Terbesar Rp 16,77 T)', type: 'wilayah', value: 'Jakarta Selatan', target: 'dashboard-penerimaan' },
    { label: 'Jakarta Pusat (Komersial & Perhotelan Rp 14,67 T)', type: 'wilayah', value: 'Jakarta Pusat', target: 'dashboard-penerimaan' },
    { label: 'Jakarta Barat (Pajak Kendaraan Rp 9,43 T)', type: 'wilayah', value: 'Jakarta Barat', target: 'dashboard-penerimaan' },
    { label: 'Jakarta Timur (Industri & Pajak Kendaraan Rp 6,28 T)', type: 'wilayah', value: 'Jakarta Timur', target: 'dashboard-penerimaan' },
    { label: 'Jakarta Utara (Pelabuhan & Logistik Rp 5,13 T)', type: 'wilayah', value: 'Jakarta Utara', target: 'dashboard-penerimaan' },
    { label: 'Kepulauan Seribu (Pariwisata Bahari & Restoran Rp 104 M)', type: 'wilayah', value: 'Kepulauan Seribu', target: 'dashboard-penerimaan' },
    { label: 'Dinas Perhubungan (Subsidi PSO Tiket MRT & Transjakarta)', type: 'opd', value: 'DISHUB', target: 'dashboard-belanja' },
    { label: 'Dinas Pendidikan (KJP Plus & Sekolah Net Zero)', type: 'opd', value: 'DISDIK', target: 'dashboard-belanja' },
    { label: 'Dinas Sumber Daya Air (Polder & Waduk Pengendali Banjir)', type: 'opd', value: 'DSDA', target: 'dashboard-belanja' },
    { label: 'PBB-P2 (Pajak Bumi & Bangunan)', type: 'jenis', value: 'PBB-P2', target: 'dashboard-penerimaan' },
    { label: 'PKB (Pajak Kendaraan Bermotor)', type: 'jenis', value: 'PKB', target: 'dashboard-penerimaan' },
    { label: 'Pembuat Kartu Insight Warga 3:4', type: 'tool', value: '', target: 'pembuat-kartu' }
  ];

  input.addEventListener('focus', () => {
    renderDropdownItems(quickItems);
    dropdown.classList.add('active');
  });

  input.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      renderDropdownItems(quickItems);
    } else {
      const filtered = quickItems.filter(item => item.label.toLowerCase().includes(q));
      renderDropdownItems(filtered);
    }
    dropdown.classList.add('active');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.floating-search-bar')) {
      dropdown.classList.remove('active');
    }
  });

  function renderDropdownItems(items) {
    if (items.length === 0) {
      dropdown.innerHTML = `<div style="padding: 0.75rem; font-size: 0.8rem; color: #94A3B8;">Tidak ada hasil ditemukan</div>`;
      return;
    }
    dropdown.innerHTML = items.map(item => `
      <div class="search-result-item" data-type="${item.type}" data-val="${item.value}" data-target="${item.target}">
        <span>${item.label}</span>
        <span style="font-size: 0.72rem; opacity: 0.7;">Lihat Data →</span>
      </div>
    `).join('');

    dropdown.querySelectorAll('.search-result-item').forEach(el => {
      el.addEventListener('click', () => {
        const type = el.getAttribute('data-type');
        const val = el.getAttribute('data-val');
        const targetId = el.getAttribute('data-target');

        dropdown.classList.remove('active');
        input.value = '';

        if (type === 'wilayah') {
          const sel = document.getElementById('filter-penerimaan-wilayah');
          if (sel) {
            sel.value = val;
            dashboard.renderPenerimaan();
          }
        } else if (type === 'jenis') {
          const sel = document.getElementById('filter-penerimaan-jenis');
          if (sel) {
            sel.value = val;
            dashboard.renderPenerimaan();
          }
        }

        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }
}

function setupScrollWatcher() {
  const fixedBar = document.getElementById('fixed-floating-bar');
  const heroSection = document.getElementById('hero-section');
  if (!fixedBar || !heroSection) return;

  window.addEventListener('scroll', () => {
    const heroBottom = heroSection.getBoundingClientRect().bottom;
    if (heroBottom < 100) {
      fixedBar.classList.add('visible');
    } else {
      fixedBar.classList.remove('visible');
    }
  });
}

function setupInteractiveMap(dashboard, cardGenerator) {
  const mapPaths = document.querySelectorAll('.map-region-path');
  const mapTooltip = document.getElementById('map-region-info');
  if (!mapPaths.length) return;

  const regionRevenue = {
    'Jakarta Pusat': 'Rp 14,67 Triliun',
    'Jakarta Barat': 'Rp 9,43 Triliun',
    'Jakarta Selatan': 'Rp 16,77 Triliun',
    'Jakarta Timur': 'Rp 6,28 Triliun',
    'Jakarta Utara': 'Rp 5,13 Triliun',
    'Kepulauan Seribu': 'Rp 104,8 Miliar'
  };

  mapPaths.forEach(path => {
    path.addEventListener('mouseenter', () => {
      const region = path.getAttribute('data-region');
      if (mapTooltip) {
        mapTooltip.innerHTML = `<strong>${region}</strong>: Pajak Terkumpul 2023: <span style="font-family: var(--font-mono); color: #0284C7; font-weight: bold;">${regionRevenue[region] || '-'}</span> (Klik untuk filter dashboard & kartu)`;
      }
    });

    path.addEventListener('click', () => {
      const region = path.getAttribute('data-region');
      mapPaths.forEach(p => p.classList.remove('active'));
      path.classList.add('active');

      // Sync filter in R1
      const sel = document.getElementById('filter-penerimaan-wilayah');
      if (sel) {
        sel.value = region;
        dashboard.renderPenerimaan();
      }

      // Sync Card Generator region
      const cardRegionSel = document.getElementById('card-input-region');
      if (cardRegionSel) {
        cardRegionSel.value = region;
        cardRegionSel.dispatchEvent(new Event('change'));
      }

      const dashEl = document.getElementById('dashboard-penerimaan');
      if (dashEl) {
        dashEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

async function setupTrustLayer() {
  try {
    const meta = await dataClient.getMeta();
    const buildEl = document.getElementById('meta-build-id');
    const dateEl = document.getElementById('meta-process-date');
    if (buildEl) buildEl.textContent = meta.build;
    if (dateEl) dateEl.textContent = meta.tanggal_olah;
  } catch (e) {
    console.error('Error loading trust layer meta:', e);
  }
}
