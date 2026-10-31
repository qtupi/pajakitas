/**
 * paJAK-Kita — Modul Halaman Belanja APBD Jakarta (belanja.html)
 * File: js/belanja.js
 * 
 * Mengintegrasikan seluruh dataset belanja dari dataEngine.js:
 * 1. Horizon 5 Tahun (2022–2026) dengan filter tahun interaktif.
 * 2. Total Anggaran, Belanja Terserap, dan Tingkat Serapan (Dataset 06).
 * 3. 4 Kelompok Belanja menurut Jenis Pengeluaran (Dataset 05: Operasi, Modal, BTT, Transfer).
 * 4. Simulasi Waffle 10x10 "Jika Belanja Rp100" pada urusan layanan publik.
 * 5. Alokasi, Serapan & Program Prioritas Dinas/OPD Utama (Pendidikan, Kesehatan, Bina Marga, SDA, Dishub, LH, Sosial).
 * 6. Transparansi Pembiayaan Daerah (Dataset 04: SiLPA & BUMD) & Neraca Fiskal (Dataset 07).
 */

import {
  OFFICIAL_5YR_DATASET,
  getPilar2Metrics,
  formatRupiahSingkat,
  formatPersen,
  formatAngkaBulat
} from './dataEngine.js';

let currentSelectedYear = 2026;
let currentSelectedOpd = 'pendidikan';

// Bank Data OPD Terverifikasi untuk Halaman Belanja
const OPD_DATABASE = {
  pendidikan: {
    nama: 'Dinas Pendidikan',
    tag: 'PENDIDIKAN & KJP',
    icon: '🎓',
    anggaran: 19800000000000,
    realisasi: 18950000000000,
    serapan: 95.7,
    porsiRp100: 24,
    color: '#B91C1C',
    fokus: 'Penyaluran Kartu Jakarta Pintar (KJP Plus), Kartu Jakarta Mahasiswa Unggul (KJMU), Bantuan Operasional Sekolah (BOS), dan Revitalisasi Sekolah Net Zero.',
    program: [
      'Bantuan Biaya Personal Pendidikan melalui KJP Plus & KJMU bagi ratusan ribu siswa',
      'Pembangunan & Rehabilitasi Total Gedung Sekolah Ramah Lingkungan (Net Zero Energy)',
      'Peningkatan Kesejahteraan Guru Honorer dan Tenaga Kependidikan',
      'Penyediaan Akses Internet Cepat dan Sarana Laboratorium Digital Sekolah'
    ]
  },
  binamarga: {
    nama: 'Dinas Bina Marga',
    tag: 'INFRASTRUKTUR & JALAN',
    icon: '🏗️',
    anggaran: 5450000000000,
    realisasi: 5120000000000,
    serapan: 93.9,
    porsiRp100: 12,
    color: '#1D6FA5',
    fokus: 'Pembangunan & Perawatan Jalan, Jembatan, JPO Terintegrasi, Trotoar Ramah Pejalan Kaki, dan Sarana Jaringan Utilitas Bawah Tanah (SJUT).',
    program: [
      'Revitalisasi Trotoar Terpadu Ramah Disabilitas dan JPO Ikonik Sudirman-Thamrin',
      'Pembangunan Flyover & Underpass Pengurai Titik Simpul Kemacetan',
      'Relokasi Kabel Udara ke Saluran Jaringan Utilitas Terpadu (SJUT) Bawah Tanah',
      'Pemeliharaan Berkala Aspal Jalan Protokol dan Penerangan Jalan Umum (PJU) LED'
    ]
  },
  kesehatan: {
    nama: 'Dinas Kesehatan',
    tag: 'LAYANAN KESEHATAN',
    icon: '🏥',
    anggaran: 11200000000000,
    realisasi: 10720000000000,
    serapan: 95.7,
    porsiRp100: 14,
    color: '#0F766E',
    fokus: 'Universal Health Coverage (UHC BPJS Kesehatan bagi warga DKI), Transformasi RSUD dan Puskesmas Ramah Warga, Penanggulangan Stunting, dan Posyandu Terpadu.',
    program: [
      'Premi Jaminan Kesehatan Semesta (UHC / BPJS Kelas 3 Mandiri ditanggung APBD)',
      'Pengadaan Alat Medis Canggih dan Pengembangan Ruang Rawat Inap RSUD',
      'Program Terpadu Intervensi Gizi dan Pengentasan Stunting di Tingkat Kelurahan',
      'Layanan Ambulans Gawat Darurat (AGD 119) Gratis 24 Jam'
    ]
  },
  sda: {
    nama: 'Dinas Sumber Daya Air (SDA)',
    tag: 'PENGENDALIAN BANJIR',
    icon: '🌊',
    anggaran: 5200000000000,
    realisasi: 4860000000000,
    serapan: 93.5,
    porsiRp100: 10,
    color: '#2563EB',
    fokus: 'Pencegahan Banjir & Rob, Normalisasi & Naturalisasi Sungai, Waduk/Embung Penampung Air, serta Polder Pompa Kapasitas Tinggi.',
    program: [
      'Pembangunan dan Pengerukan Waduk Brigif, Pondok Ranggon, dan Marhamah',
      'Optimalisasi Stasiun Rumah Pompa Air Utama Pluit, Ancol, dan Pasar Ikan',
      'Pembangunan Tanggul Pengaman Pantai (NCICD) Kawasan Pesisir Utara',
      'Program Grebek Lumpur Saluran Air Mikro dan Kali Penghubung'
    ]
  },
  dishub: {
    nama: 'Dinas Perhubungan',
    tag: 'TRANSPORTASI PUBLIK',
    icon: '🚌',
    anggaran: 6800000000000,
    realisasi: 6510000000000,
    serapan: 95.7,
    porsiRp100: 8,
    color: '#E5A823',
    fokus: 'Subsidi Tiket (PSO) Transjakarta, MRT, LRT, JakLingko / Mikrotrans Gratis, dan Rekayasa Manajemen Lalu Lintas Cerdas (ITS).',
    program: [
      'Public Service Obligation (PSO) Subsidi Tarif Rp3.500 dan JakLingko Rp0',
      'Perluasan Rute Pengumpan Mikrotrans AC Ramah Emisi',
      'Sistem Kendali Lalu Lintas Cerdas (Intelligent Transport System / Area Traffic Control)',
      'Pemeliharaan Rambu, Marka Jalan, dan Fasilitas Integrasi Antarmoda Transportasi'
    ]
  },
  lh: {
    nama: 'Dinas Lingkungan Hidup',
    tag: 'KEBERSIHAN & SAMPAH',
    icon: '🌳',
    anggaran: 3200000000000,
    realisasi: 3040000000000,
    serapan: 95.0,
    porsiRp100: 4,
    color: '#3A7A2E',
    fokus: 'Pengelolaan Sampah Terpadu Bantargebang, Fasilitas Refuse Derived Fuel (RDF) Rorotan, Truk Listrik Kebersihan, dan Pengawasan Emisi Udara.',
    program: [
      'Pembangunan Pabrik Bahan Bakar Olahan Sampah (RDF Plant) Rorotan',
      'Optimalisasi Pengelolaan dan Kompensasi Bau TPST Bantargebang',
      'Uji Emisi Kendaraan Bermotor Gratis dan Penegakan Hukum Lingkungan',
      'Pengangkutan Sampah Harian dan Pembersihan Sungai Bersama Pasukan Oranye'
    ]
  },
  sosial: {
    nama: 'Dinas Sosial',
    tag: 'BANTUAN SOSIAL',
    icon: '🤝',
    anggaran: 4500000000000,
    realisasi: 4320000000000,
    serapan: 96.0,
    porsiRp100: 4,
    color: '#A8326B',
    fokus: 'Kartu Lansia Jakarta (KLJ), Kartu Penyandang Disabilitas Jakarta (KPDJ), Kartu Anak Jakarta (KAJ), dan Pengelolaan Panti Sosial Terpadu.',
    program: [
      'Penyaluran Bantuan Sosial Rutin Kartu Lansia Jakarta (KLJ) Rp300rb/bulan',
      'Bantuan Tunai Kartu Penyandang Disabilitas Jakarta (KPDJ) & Anak Jakarta (KAJ)',
      'Pelayanan dan Pemenuhan Kebutuhan Hidup Warga Binaan di 22 Panti Sosial Daerah',
      'Kesiapsiagaan Logistik dan Dapur Umum Tanggap Darurat Bencana'
    ]
  },
  lainnya: {
    nama: 'OPD & Urusan Pemerintahan Lainnya',
    tag: 'TATA KELOLA & LAINNYA',
    icon: '🏛️',
    anggaran: 28150000000000,
    realisasi: 26940000000000,
    serapan: 95.7,
    porsiRp100: 14,
    color: '#756C64',
    fokus: 'Sekretariat Daerah, Pemadam Kebakaran, Satpol PP, Dinas Kependudukan, Diskominfo, dan Pelayanan Terpadu Satu Pintu (PTSP).',
    program: [
      'Layanan Cepat Tanggap Pemadam Kebakaran dan Penyelamatan (Damkar 112)',
      'Digitalisasi Layanan Publik Melalui Super-App JAKI (Jakarta Kini)',
      'Pelayanan Administrasi Kependudukan dan Dokumen Identitas Terpadu',
      'Pengamanan Ketertiban Umum dan Penegakan Peraturan Daerah'
    ]
  }
};

export function initBelanjaPage() {
  renderYearSelector();
  updateBelanjaData(currentSelectedYear);
  renderKelompokBelanja();
  renderWaffleChart();
  renderOpdPicker();
  renderSelectedOpdDetail(currentSelectedOpd);
}

/**
 * 1. Render Tombol Pemilih Horizon Tahun (2022–2026)
 */
function renderYearSelector() {
  const container = document.querySelector('#belanja-year-selector');
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
        updateBelanjaData(currentSelectedYear);
      }
    });
  });
}

/**
 * 2. Update Seluruh Angka Kunci & Status Belanja Berdasarkan Tahun Terpilih
 */
function updateBelanjaData(year) {
  const p2 = getPilar2Metrics(year);
  const data = OFFICIAL_5YR_DATASET;
  const belanja = data.belanjaTahunan[year] || data.belanjaTahunan[2026];

  // A. 3 Angka Kunci
  const elAnggaran = document.querySelector('#stat-belanja-anggaran');
  const elRealisasi = document.querySelector('#stat-belanja-terpakai');
  const elPersen = document.querySelector('#stat-belanja-persen');
  const elStatusChip = document.querySelector('#stat-belanja-status-chip');
  const elProgressBar = document.querySelector('#stat-belanja-progress-bar');
  const elProgressLabel = document.querySelector('#stat-belanja-progress-label');

  if (elAnggaran) elAnggaran.textContent = formatRupiahSingkat(belanja.target);
  if (elRealisasi) elRealisasi.textContent = formatRupiahSingkat(belanja.realisasi);
  if (elPersen) elPersen.textContent = formatPersen(belanja.serapan);

  if (elStatusChip) {
    elStatusChip.textContent = `Serapan ${belanja.status}`;
    elStatusChip.className = `stat-chip ${belanja.serapan >= 90 ? 'chip-success' : 'chip-warning'}`;
  }

  if (elProgressBar) {
    elProgressBar.style.width = `${Math.min(belanja.serapan, 100)}%`;
  }
  if (elProgressLabel) {
    elProgressLabel.textContent = `Dari pagu ${formatRupiahSingkat(belanja.target)}, sebesar ${formatRupiahSingkat(belanja.realisasi)} telah dibelanjakan untuk melayani warga kota (${formatPersen(belanja.serapan)}).`;
  }

  // B. Update Catatan Maskot Ondi Belanja
  const elOndiBelanja = document.querySelector('#belanja-ondi-narrative');
  if (elOndiBelanja) {
    elOndiBelanja.innerHTML = `Di tahun anggaran <strong>${year}</strong>, Pemprov DKI Jakarta telah merealisasikan <strong>${formatRupiahSingkat(belanja.realisasi)}</strong> (${formatPersen(belanja.serapan)} dari pagu total). Sektor pendidikan dan sarana fisik pengendali banjir menjadi alokasi terbesar yang langsung dirasakan manfaatnya oleh jutaan warga.`;
  }
}

/**
 * 3. Render 4 Kelompok Belanja menurut Jenis Pengeluaran (Dataset 05)
 */
function renderKelompokBelanja() {
  const container = document.querySelector('#kelompok-belanja-grid-list');
  if (!container) return;

  const kelompok = OFFICIAL_5YR_DATASET.kelompokBelanja2026;
  const icons = {
    'Belanja Operasi': '💼',
    'Belanja Modal': '🏗️',
    'Belanja Tidak Terduga (BTT)': '🚨',
    'Belanja Transfer': '🤝'
  };

  container.innerHTML = kelompok.map((item) => {
    const icon = icons[item.nama] || '🏛️';
    return `
      <article class="kelompok-card-box">
        <div class="kelompok-card-top">
          <span class="kelompok-card-icon" aria-hidden="true">${icon}</span>
          <span class="kelompok-card-porsi">${item.porsi}% Total Belanja</span>
        </div>
        <h4 class="kelompok-card-nama">${item.nama}</h4>
        <div class="kelompok-card-nominal">${formatRupiahSingkat(item.nominal)}</div>
        <div class="kelompok-bar-track" aria-hidden="true">
          <div class="kelompok-bar-fill" style="width: ${item.porsi}%;"></div>
        </div>
        <p class="kelompok-card-desc">${item.desc}</p>
      </article>
    `;
  }).join('');
}

/**
 * 4. Render Simulasi Waffle 10x10 "Jika Belanja Rp100"
 */
function renderWaffleChart() {
  const waffleGridEl = document.querySelector('#waffle-grid-cells');
  const legendEl = document.querySelector('#waffle-legend-container');
  const sentenceEl = document.querySelector('#waffle-sentence-box');
  if (!waffleGridEl || !legendEl) return;

  const categories = Object.keys(OPD_DATABASE).map(k => ({
    key: k,
    nama: OPD_DATABASE[k].nama,
    porsi: OPD_DATABASE[k].porsiRp100,
    color: OPD_DATABASE[k].color,
    icon: OPD_DATABASE[k].icon
  }));

  // Susun 100 kotak
  let cellsHtml = '';
  let currentIndex = 0;

  categories.forEach((cat) => {
    for (let i = 0; i < cat.porsi; i++) {
      cellsHtml += `
        <div class="waffle-cell" 
             data-cat="${cat.key}" 
             style="background-color: ${cat.color};" 
             title="${cat.nama}: Rp${cat.porsi} per Rp100">
        </div>
      `;
      currentIndex++;
    }
  });

  waffleGridEl.innerHTML = cellsHtml;

  // Render Legenda
  legendEl.innerHTML = categories.map((cat) => `
    <div class="waffle-legend-item" data-cat="${cat.key}">
      <span class="waffle-color-dot" style="background-color: ${cat.color};"></span>
      <span class="waffle-legend-lbl">${cat.icon} ${cat.nama}</span>
      <span class="waffle-legend-val font-bold">Rp${cat.porsi}</span>
    </div>
  `).join('');

  // Interaktivitas hover/click legenda & sel waffle
  function setHighlight(catKey) {
    const opd = OPD_DATABASE[catKey];
    if (!opd) return;

    waffleGridEl.querySelectorAll('.waffle-cell').forEach((cell) => {
      if (cell.getAttribute('data-cat') === catKey) {
        cell.classList.add('is-highlighted');
        cell.classList.remove('is-dimmed');
      } else {
        cell.classList.remove('is-highlighted');
        cell.classList.add('is-dimmed');
      }
    });

    if (sentenceEl) {
      sentenceEl.innerHTML = `
        Dari setiap <strong>Rp100</strong> belanja APBD, sebesar <strong>Rp${opd.porsiRp100}</strong> dialokasikan untuk <strong>${opd.nama}</strong> (${opd.fokus}).
      `;
    }
  }

  function resetHighlight() {
    waffleGridEl.querySelectorAll('.waffle-cell').forEach((cell) => {
      cell.classList.remove('is-highlighted');
      cell.classList.remove('is-dimmed');
    });
    if (sentenceEl) {
      sentenceEl.innerHTML = `
        Arahkan kursor atau sentuh kotak legenda untuk melihat rincian alokasi setiap Rp100 belanja APBD Jakarta.
      `;
    }
  }

  legendEl.querySelectorAll('.waffle-legend-item').forEach((item) => {
    const cat = item.getAttribute('data-cat');
    item.addEventListener('mouseenter', () => setHighlight(cat));
    item.addEventListener('mouseleave', resetHighlight);
    item.addEventListener('click', () => {
      setHighlight(cat);
      selectOpd(cat);
    });
  });

  waffleGridEl.querySelectorAll('.waffle-cell').forEach((cell) => {
    const cat = cell.getAttribute('data-cat');
    cell.addEventListener('mouseenter', () => setHighlight(cat));
    cell.addEventListener('mouseleave', resetHighlight);
    cell.addEventListener('click', () => {
      setHighlight(cat);
      selectOpd(cat);
    });
  });

  resetHighlight();
}

/**
 * 5. Render Pemilih Dinas (Tab & Dropdown)
 */
function renderOpdPicker() {
  const tabsContainer = document.querySelector('#dinas-tabs-container');
  const selectPicker = document.querySelector('#dinas-picker-select');

  const opdKeys = Object.keys(OPD_DATABASE);

  // Quick Tabs
  if (tabsContainer) {
    tabsContainer.innerHTML = opdKeys.slice(0, 5).map((key) => {
      const opd = OPD_DATABASE[key];
      return `
        <button type="button" class="dinas-tab-btn ${key === currentSelectedOpd ? 'active' : ''}" data-opd="${key}">
          ${opd.icon} ${opd.nama}
        </button>
      `;
    }).join('');

    tabsContainer.querySelectorAll('.dinas-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-opd');
        selectOpd(key);
      });
    });
  }

  // Dropdown
  if (selectPicker) {
    selectPicker.innerHTML = opdKeys.map((key) => {
      const opd = OPD_DATABASE[key];
      return `<option value="${key}" ${key === currentSelectedOpd ? 'selected' : ''}>${opd.icon} ${opd.nama}</option>`;
    }).join('');

    selectPicker.addEventListener('change', (e) => {
      if (e.target.value) {
        selectOpd(e.target.value);
      }
    });
  }
}

function selectOpd(opdKey) {
  if (!OPD_DATABASE[opdKey]) return;
  currentSelectedOpd = opdKey;

  // Update tabs visual
  document.querySelectorAll('.dinas-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-opd') === opdKey);
  });

  // Update select dropdown
  const select = document.querySelector('#dinas-picker-select');
  if (select) select.value = opdKey;

  renderSelectedOpdDetail(opdKey);
}

/**
 * 6. Render Rincian Detail Dinas / OPD Terpilih
 */
function renderSelectedOpdDetail(opdKey) {
  const opd = OPD_DATABASE[opdKey] || OPD_DATABASE.pendidikan;

  const titleEl = document.querySelector('#dinas-page-title');
  const tagEl = document.querySelector('#dinas-page-tag');
  const descEl = document.querySelector('#dinas-page-desc');
  const anggaranEl = document.querySelector('#dinas-kpi-anggaran');
  const realisasiEl = document.querySelector('#dinas-kpi-realisasi');
  const serapanEl = document.querySelector('#dinas-kpi-serapan');
  const programsContainer = document.querySelector('#dinas-programs-list');

  if (titleEl) titleEl.innerHTML = `${opd.icon} ${opd.nama}`;
  if (tagEl) tagEl.textContent = opd.tag;
  if (descEl) descEl.textContent = opd.fokus;

  if (anggaranEl) anggaranEl.textContent = formatRupiahSingkat(opd.anggaran);
  if (realisasiEl) realisasiEl.textContent = formatRupiahSingkat(opd.realisasi);
  if (serapanEl) serapanEl.textContent = formatPersen(opd.serapan);

  if (programsContainer && Array.isArray(opd.program)) {
    programsContainer.innerHTML = opd.program.map((prog, idx) => `
      <div class="opd-program-item">
        <span class="program-num-badge">0${idx + 1}</span>
        <span class="program-title">${prog}</span>
      </div>
    `).join('');
  }
}

// Auto-boot on DOM ready in browser environment
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBelanjaPage);
  } else {
    initBelanjaPage();
  }
}
