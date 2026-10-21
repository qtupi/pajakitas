/**
 * dashboard.js — R1, R2, R3, R5 Dashboard Engine for paJAK-Kita
 */

import { dataClient } from './dataClient.js';

export class Dashboard {
  constructor(infoPanel) {
    this.infoPanel = infoPanel;
    
    // R1 Filters
    this.filterTahun = document.getElementById('filter-penerimaan-tahun');
    this.filterWilayah = document.getElementById('filter-penerimaan-wilayah');
    this.filterJenis = document.getElementById('filter-penerimaan-jenis');
    this.resetFilterBtn = document.getElementById('btn-reset-filter');

    // R1 Display Containers
    this.totalPajakValEl = document.getElementById('penerimaan-total-val');
    this.totalPajakSubtitleEl = document.getElementById('penerimaan-total-subtitle');
    this.emptyStateEl = document.getElementById('penerimaan-empty-state');
    this.chartContainerEl = document.getElementById('penerimaan-chart-bars');
    this.breakdownListEl = document.getElementById('penerimaan-breakdown-list');

    // R2 Belanja Display Container
    this.belanjaContainerEl = document.getElementById('belanja-opd-container');

    // R5 Kamus Display Container
    this.kamusContainerEl = document.getElementById('kamus-pajak-grid');
    this.kamusSearchInput = document.getElementById('kamus-search-input');

    this._init();
  }

  async _init() {
    this._bindEvents();
    await this.renderPenerimaan();
    await this.renderBelanja();
    await this.renderKamus();
  }

  _bindEvents() {
    if (this.filterTahun) {
      this.filterTahun.addEventListener('change', () => this.renderPenerimaan());
    }
    if (this.filterWilayah) {
      this.filterWilayah.addEventListener('change', () => this.renderPenerimaan());
    }
    if (this.filterJenis) {
      this.filterJenis.addEventListener('change', () => this.renderPenerimaan());
    }
    if (this.resetFilterBtn) {
      this.resetFilterBtn.addEventListener('click', () => {
        this.filterTahun.value = '2023';
        this.filterWilayah.value = 'semua';
        this.filterJenis.value = 'semua';
        this.renderPenerimaan();
      });
    }

    if (this.kamusSearchInput) {
      this.kamusSearchInput.addEventListener('input', (e) => {
        this.renderKamus(e.target.value.toLowerCase().trim());
      });
    }
  }

  formatRupiah(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return 'Data Tidak Tersedia';
    if (amount >= 1e12) {
      return `Rp ${(amount / 1e12).toFixed(2).replace('.', ',')} Triliun`;
    }
    if (amount >= 1e9) {
      return `Rp ${(amount / 1e9).toFixed(2).replace('.', ',')} Miliar`;
    }
    if (amount >= 1e6) {
      return `Rp ${(amount / 1e6).toFixed(2).replace('.', ',')} Juta`;
    }
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  }

  formatFullRupiah(amount) {
    if (!amount) return 'Data Tidak Tersedia';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  }

  async renderPenerimaan() {
    const tahun = this.filterTahun ? this.filterTahun.value : '2023';
    const wilayah = this.filterWilayah ? this.filterWilayah.value : 'semua';
    const jenis = this.filterJenis ? this.filterJenis.value : 'semua';

    try {
      const records = await dataClient.getPenerimaan({ tahun, wilayah, jenisPajak: jenis });

      // Handle Empty State (PRD R1: wilayah/jenis tanpa data menampilkan keterangan data tidak tersedia, bukan 0)
      const validRecords = records.filter(r => r.status === 'tersedia' && r.realisasi_rp !== null);
      
      if (validRecords.length === 0) {
        if (this.emptyStateEl) this.emptyStateEl.style.display = 'block';
        if (this.totalPajakValEl) this.totalPajakValEl.textContent = 'Data Tidak Tersedia';
        if (this.chartContainerEl) this.chartContainerEl.innerHTML = '';
        if (this.breakdownListEl) this.breakdownListEl.innerHTML = '';
        return;
      }

      if (this.emptyStateEl) this.emptyStateEl.style.display = 'none';

      const totalRealisasi = validRecords.reduce((acc, cur) => acc + (cur.realisasi_rp || 0), 0);
      
      if (this.totalPajakValEl) {
        this.totalPajakValEl.textContent = this.formatRupiah(totalRealisasi);
      }
      
      if (this.totalPajakSubtitleEl) {
        let label = `Tahun Anggaran ${tahun}`;
        if (wilayah !== 'semua') label += ` • ${wilayah}`;
        if (jenis !== 'semua') label += ` • ${jenis}`;
        if (tahun === '2024') label += ' (Status: Sementara Triwulan III)';
        this.totalPajakSubtitleEl.textContent = label;
      }

      // Group for chart
      // If single tax selected, show breakdown across 6 regions
      // If single region selected, show breakdown across tax types
      // If all selected, show top contributors
      let chartItems = [];
      if (jenis !== 'semua') {
        // Group by Wilayah
        const byWilayah = {};
        validRecords.forEach(r => {
          byWilayah[r.wilayah] = (byWilayah[r.wilayah] || 0) + r.realisasi_rp;
        });
        chartItems = Object.entries(byWilayah).map(([name, val]) => ({ name, val }));
      } else {
        // Group by Jenis Pajak
        const byJenis = {};
        validRecords.forEach(r => {
          byJenis[r.jenis_pajak] = (byJenis[r.jenis_pajak] || 0) + r.realisasi_rp;
        });
        chartItems = Object.entries(byJenis).map(([name, val]) => ({ name, val }));
      }

      chartItems.sort((a, b) => b.val - a.val);
      const maxVal = Math.max(...chartItems.map(i => i.val)) || 1;

      // Render Visual Bars
      if (this.chartContainerEl) {
        this.chartContainerEl.innerHTML = chartItems.map(item => {
          const pct = ((item.val / maxVal) * 100).toFixed(1);
          return `
            <div style="margin-bottom: 1.25rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.86rem; margin-bottom: 0.35rem;">
                <span style="font-weight: 600; color: #111111;">${item.name}</span>
                <span style="font-family: var(--font-mono); font-weight: 500; color: #52525B;">${this.formatRupiah(item.val)}</span>
              </div>
              <div class="progress-bar-bg" style="height: 8px;">
                <div class="progress-bar-fill" style="width: ${pct}%; background-color: #0284C7;"></div>
              </div>
            </div>
          `;
        }).join('');
      }

      // Render Breakdown table / list
      if (this.breakdownListEl) {
        this.breakdownListEl.innerHTML = validRecords.slice(0, 8).map(r => `
          <div class="arch-card" style="padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; cursor: pointer;" onclick="window.infoPanelInstance.open('penerimaan_per_wilayah')">
            <div>
              <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: #0284C7; letter-spacing: 0.05em;">${r.wilayah}</div>
              <div style="font-size: 0.92rem; font-weight: 600; color: #111111;">${r.jenis_pajak}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-family: var(--font-mono); font-size: 0.95rem; font-weight: 700; color: #111111;">${this.formatRupiah(r.realisasi_rp)}</div>
              <div style="font-size: 0.68rem; color: #64748B;">Klik untuk info detail & cara hitung</div>
            </div>
          </div>
        `).join('');
      }

    } catch (err) {
      console.error('Error rendering penerimaan:', err);
    }
  }

  async renderBelanja() {
    if (!this.belanjaContainerEl) return;
    try {
      const belanjaData = await dataClient.getBelanja();
      const opdList = belanjaData.opd;

      this.belanjaContainerEl.innerHTML = `
        <div style="margin-bottom: 2rem; background: #FFFFFF; border: 1px solid var(--border-subtle); padding: 1.5rem 2rem; border-radius: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
            <div>
              <div class="tracking-widest-tag" style="color: #64748B; margin-bottom: 0.25rem;">Total Belanja Daerah APBD 2023 (Se-DKI Jakarta)</div>
              <div style="font-size: clamp(1.8rem, 2.5vw, 2.5rem); font-weight: 800; letter-spacing: -0.03em;">
                ${this.formatRupiah(belanjaData.total_realisasi_apbd_2023)}
              </div>
              <div style="font-size: 0.86rem; color: #64748B;">
                Dari pagu anggaran disahkan: <span style="font-family: var(--font-mono); font-weight: 600;">${this.formatRupiah(belanjaData.total_anggaran_apbd_2023)}</span>
              </div>
            </div>
            <div style="text-align: right;">
              <div class="badge-trust" style="font-size: 0.82rem; padding: 0.4rem 0.9rem;">
                ✓ Serapan Anggaran: ${belanjaData.serapan_total_persen}%
              </div>
              <div style="font-size: 0.72rem; color: #64748B; margin-top: 0.35rem;">Status: Audited Final BPKAD</div>
            </div>
          </div>
          <div class="progress-bar-bg" style="height: 10px;">
            <div class="progress-bar-fill" style="width: ${belanjaData.serapan_total_persen}%; background-color: #111111;"></div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.5rem;">
          ${opdList.map(opd => `
            <div class="arch-card" style="display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                  <span class="tracking-widest-tag" style="color: #0284C7;">${opd.kode}</span>
                  <span class="badge-trust" style="font-size: 0.7rem;">${opd.tahun_2023.serapan_persen}% Terealisasi</span>
                </div>
                <h4 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.4rem; color: #111111;">${opd.nama_opd}</h4>
                <p style="font-size: 0.82rem; color: #52525B; line-height: 1.45; margin-bottom: 1rem;">${opd.fokus_layanan}</p>
                
                <div style="background: #FAFAF9; padding: 0.85rem; border: 1px solid #E7E5E4; border-radius: 2px; margin-bottom: 1rem;">
                  <div style="display: flex; justify-content: space-between; font-size: 0.78rem; margin-bottom: 0.25rem;">
                    <span style="color: #78716C;">Pagu Anggaran</span>
                    <span style="font-family: var(--font-mono); font-weight: 600;">${this.formatRupiah(opd.tahun_2023.anggaran_rp)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 0.86rem; font-weight: 700;">
                    <span style="color: #111111;">Realisasi</span>
                    <span style="font-family: var(--font-mono); color: #0284C7;">${this.formatRupiah(opd.tahun_2023.realisasi_rp)}</span>
                  </div>
                </div>

                <div style="font-size: 0.75rem; color: #44403C;">
                  <strong>Program Utama:</strong>
                  <ul style="padding-left: 1.1rem; margin-top: 0.35rem; line-height: 1.4;">
                    ${opd.program_utama.map(p => `<li>${p}</li>`).join('')}
                  </ul>
                </div>
              </div>

              <div style="margin-top: 1.25rem; padding-top: 0.85rem; border-top: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.7rem; color: #71717A;">Belanja APBD Jakarta</span>
                <button class="btn-pill-outline" style="padding: 0.35rem 0.85rem; font-size: 0.75rem; color: #111111; border-color: #D4D4D8; background: transparent;" onclick="window.infoPanelInstance.open('belanja_opd')">
                  Verifikasi Data →
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      console.error('Error rendering belanja:', err);
    }
  }

  async renderKamus(searchQuery = '') {
    if (!this.kamusContainerEl) return;
    try {
      const list = await dataClient.getReferensiPajak();
      const filtered = list.filter(item => {
        if (!searchQuery) return true;
        return item.kode.toLowerCase().includes(searchQuery) ||
               item.nama_resmi.toLowerCase().includes(searchQuery) ||
               item.nama_awam.toLowerCase().includes(searchQuery) ||
               item.objek.toLowerCase().includes(searchQuery);
      });

      this.kamusContainerEl.innerHTML = filtered.map(item => `
        <div class="arch-card" style="border-left: 3px solid #0284C7;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.35rem;">
            <span class="tracking-widest-tag" style="color: #0284C7;">${item.kode} • ${item.kategori}</span>
            <span style="font-family: var(--font-mono); font-size: 0.78rem; font-weight: 600; color: #C2410C;">Tarif: ${item.tarif_resmi.split(' ')[0]}</span>
          </div>
          <h4 style="font-size: 1.1rem; font-weight: 700; color: #111111; margin-bottom: 0.15rem;">${item.nama_awam}</h4>
          <div style="font-size: 0.78rem; color: #71717A; margin-bottom: 0.75rem;">Nama Resmi: ${item.nama_resmi}</div>
          
          <div style="font-size: 0.84rem; color: #374151; line-height: 1.5; margin-bottom: 0.75rem;">
            <strong>Objek Pengenaan:</strong> ${item.objek}
          </div>
          
          <div style="font-size: 0.8rem; color: #4B5563; background: #F8FAFC; padding: 0.65rem 0.85rem; border-radius: 2px; border: 1px solid #E2E8F0; margin-bottom: 0.75rem;">
            <div><strong>Wajib Pajak:</strong> ${item.wajib_pajak}</div>
            <div style="margin-top: 0.25rem;"><strong>Ketentuan Tarif:</strong> ${item.tarif_resmi}</div>
          </div>

          <div style="font-size: 0.7rem; color: #94A3B8;">
            Dasar Hukum: ${item.dasar_hukum}
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error('Error rendering kamus:', err);
    }
  }
}
