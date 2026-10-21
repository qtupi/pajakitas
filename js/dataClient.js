/**
 * dataClient.js — Single gateway to local static datasets
 * Adheres to paJAK-Kita System Design section 3.2 contract.
 */

export const dataClient = {
  _cache: {},

  async _fetch(path) {
    if (this._cache[path]) {
      return this._cache[path];
    }
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Gagal memuat dataset: ${path} (status: ${response.status})`);
      }
      const data = await response.json();
      this._cache[path] = data;
      return data;
    } catch (err) {
      console.error(`[dataClient] Error fetching ${path}:`, err);
      throw err;
    }
  },

  async getMeta() {
    return await this._fetch('data/meta.json');
  },

  async getReferensiPajak() {
    return await this._fetch('data/referensi_pajak.json');
  },

  async getPenerimaanRingkasan() {
    return await this._fetch('data/penerimaan_ringkasan.json');
  },

  async getPenerimaan({ tahun, wilayah, jenisPajak } = {}) {
    const all = await this._fetch('data/penerimaan.json');
    return all.filter(item => {
      if (tahun && item.tahun !== parseInt(tahun)) return false;
      if (wilayah && wilayah !== 'semua' && item.wilayah !== wilayah) return false;
      if (jenisPajak && jenisPajak !== 'semua' && item.jenis_pajak !== jenisPajak) return false;
      return true;
    });
  },

  async getBelanja() {
    return await this._fetch('data/belanja.json');
  },

  async getBankInsight({ wilayah, topik } = {}) {
    const list = await this._fetch('data/bank_insight.json');
    return list.filter(item => {
      if (wilayah && wilayah !== 'semua' && item.wilayah !== wilayah && item.cakupan !== 'jakarta') return false;
      if (topik && item.topik !== topik) return false;
      return true;
    });
  },

  async getProyekInfrastruktur() {
    return await this._fetch('data/proyek_infrastruktur.json');
  },

  async getDefinisiPanel(panelId) {
    const defs = await this._fetch('data/definisi_panel.json');
    return defs[panelId] || null;
  }
};
