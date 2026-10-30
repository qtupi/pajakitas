/**
 * paJAK-Kita — Modul Akses Data Tunggal (Single Source of Truth)
 * File: src/data/dataClient.ts
 *
 * Aturan Mengikat (docs/README-data-anggaran.md):
 * 1. Satu-satunya tempat yang membaca JSON data anggaran.
 * 2. Seluruh angka adalah ANGGARAN (bukan realisasi).
 * 3. getBelanjaPerUrusanPorsi hanya mengembalikan kode, nama_pendek, kelompok,
 *    dan porsi_dari_jumlah_urusan_persen. Nilai dashboard dilarang diekspos (potensi dobel).
 * 4. getInsight mengembalikan daftar kosong jika bank data belum tersedia.
 */

// =============================================================================
// Tipe Data TypeScript
// =============================================================================

export interface MetaSumber {
  nama: string;
  url: string;
  halaman: string[];
}

export interface Meta {
  judul: string;
  jenis_data: string;
  sumber: MetaSumber;
  cara_pengambilan: string;
  tanggal_pengambilan: string | null;
  tanggal_pengambilan_catatan?: string;
  satuan: string;
  istilah: {
    APBD: string;
    APBDP: string;
  };
  basis_tahun_pada_data_per_akun_dan_per_urusan: {
    '2026': string;
    '2025': string;
  };
  status: string;
}

export interface RingkasanTahun {
  tahun: number;
  apbd: number;
  apbdp: number;
}

export interface RingkasanApbd {
  pendapatan: RingkasanTahun[];
  belanja: RingkasanTahun[];
  pembiayaan_penerimaan: RingkasanTahun[];
  pembiayaan_pengeluaran: RingkasanTahun[];
}

export interface NilaiDuaTahun {
  '2026': number;
  '2025': number;
}

export interface AkunItem {
  kode: string;
  nama: string;
  nilai: NilaiDuaTahun;
}

export interface BelanjaPerAkunGroup {
  operasi: AkunItem[];
  modal: AkunItem[];
  tidak_terduga: AkunItem[];
  transfer: AkunItem[];
}

export interface PembiayaanPerAkunGroup {
  penerimaan: AkunItem[];
  pengeluaran: AkunItem[];
}

export interface BelanjaUrusanPorsiItem {
  kode: string;
  nama_pendek: string;
  kelompok: string;
  porsi_dari_jumlah_urusan_persen: NilaiDuaTahun;
}

export interface LimaUrusanTerbesarItem {
  kode: string;
  nama_pendek: string;
  porsi_dari_jumlah_urusan_persen: number;
}

export interface Turunan {
  catatan: string;
  porsi_pendapatan_persen: {
    pajak_daerah: NilaiDuaTahun;
    pad_total: NilaiDuaTahun;
    transfer_pusat: NilaiDuaTahun;
  };
  perubahan_2025_ke_2026: {
    pajak_daerah: { selisih: number; persen: number };
    transfer_pusat: { selisih: number; persen: number };
    total_belanja: { selisih: number; persen: number };
  };
  porsi_belanja_per_jenis_persen_2026: {
    operasi: number;
    modal: number;
    tidak_terduga: number;
    transfer: number;
  };
  lima_urusan_terbesar_2026: LimaUrusanTerbesarItem[];
}

export interface InsightItem {
  id: string;
  wilayah: string;
  judul: string;
  nilai: string;
  keterangan: string;
  kueri_sumber?: string;
  sumber?: string;
  tahun?: number;
  tanggal_data?: string;
}

export interface RealisasiMeta {
  judul: string;
  jenis_data: string;
  tahun_anggaran: number;
  tanggal_data: string;
  tanggal_data_catatan?: string;
  tanggal_pengambilan: string | null;
  tanggal_pengambilan_catatan?: string;
  sumber: {
    nama: string;
    url: string;
    halaman: string[];
  };
  cara_pengambilan: string;
  satuan: string;
  basis_anggaran: string;
  peringatan: string[];
}

export interface RealisasiAkunItem {
  kode: string;
  nama: string;
  anggaran: number;
  realisasi: number;
  persen_dashboard: number;
  persen_hitung: number;
  selisih_menuju_anggaran: number;
}

export interface RealisasiPerAkun {
  pendapatan: RealisasiAkunItem[];
  belanja: RealisasiAkunItem[];
  pembiayaan_penerimaan: RealisasiAkunItem[];
  pembiayaan_pengeluaran: RealisasiAkunItem[];
  total_halaman: {
    jumlah_pad: { anggaran: number; realisasi: number };
    jumlah_pendapatan: { anggaran: number; realisasi: number };
    jumlah_belanja_operasi: { anggaran: number; realisasi: number };
    jumlah_belanja: { anggaran: number; realisasi: number };
    jumlah_penerimaan_pembiayaan: { anggaran: number; realisasi: number };
    jumlah_pengeluaran_pembiayaan: { anggaran: number; realisasi: number };
    pembiayaan_netto: { anggaran: number; realisasi: number };
    total_apbd_belanja_plus_pengeluaran_pembiayaan: number;
    total_realisasi_penerimaan: number;
    total_realisasi_pengeluaran: number;
    sisa_lebih_pembiayaan_anggaran: number;
  };
}

export interface RealisasiSkpdItem {
  no: number;
  nama: string;
  nama_pendek: string;
  jenis_unit: string;
  wilayah: string | null;
  pendapatan: { anggaran: number; realisasi: number };
  belanja: {
    anggaran: number;
    realisasi: number;
    serapan_persen: number | null;
  };
  pembiayaan: { anggaran: number; realisasi: number };
  peringkat_belanja?: number;
  porsi_dari_total_belanja_persen?: number;
}

export interface RealisasiPerSkpd {
  jumlah: {
    pendapatan_anggaran: number;
    pendapatan_realisasi: number;
    belanja_anggaran: number;
    belanja_realisasi: number;
    pembiayaan_anggaran: number;
    pembiayaan_realisasi: number;
  };
  data: RealisasiSkpdItem[];
}

export interface TurunanRealisasi {
  catatan: string;
  capaian_persen: {
    pendapatan: number;
    pajak_daerah: number;
    belanja: number;
    belanja_modal: number;
  };
  porsi_pajak_daerah_dari_realisasi_pendapatan_persen: number;
  belanja_terbesar_menurut_anggaran: Array<{
    no: number;
    nama_pendek: string;
    anggaran: number;
    realisasi: number;
    serapan_persen: number;
  }>;
  serapan_belanja_terendah_unit_di_atas_100_miliar: Array<{
    no: number;
    nama_pendek: string;
    anggaran: number;
    realisasi: number;
    serapan_persen: number;
  }>;
  serapan_belanja_tertinggi_unit_di_atas_100_miliar: Array<{
    no: number;
    nama_pendek: string;
    anggaran: number;
    realisasi: number;
    serapan_persen: number;
  }>;
}

interface RawDataRealisasi {
  meta: RealisasiMeta;
  realisasi_per_akun: {
    pendapatan: Array<{
      kode: string;
      nama: string;
      anggaran: number;
      realisasi: number;
      persen_dashboard: number;
      persen_hitung: number;
    }>;
    belanja: Array<{
      kode: string;
      nama: string;
      anggaran: number;
      realisasi: number;
      persen_dashboard: number;
      persen_hitung: number;
    }>;
    pembiayaan_penerimaan: Array<{
      kode: string;
      nama: string;
      anggaran: number;
      realisasi: number;
      persen_dashboard: number;
      persen_hitung: number;
    }>;
    pembiayaan_pengeluaran: Array<{
      kode: string;
      nama: string;
      anggaran: number;
      realisasi: number;
      persen_dashboard: number;
      persen_hitung: number;
    }>;
    total_halaman: any;
  };
  realisasi_per_skpd: {
    jumlah: any;
    data: Array<{
      no: number;
      nama: string;
      nama_pendek: string;
      jenis_unit: string;
      wilayah: string | null;
      pendapatan: { anggaran: number; realisasi: number };
      belanja: {
        anggaran: number;
        realisasi: number;
        serapan_persen: number;
      };
      pembiayaan: { anggaran: number; realisasi: number };
    }>;
  };
  turunan: TurunanRealisasi;
}

interface RawDataAnggaran {
  meta: Meta;
  ringkasan_apbd: RingkasanApbd;
  pendapatan_per_akun: AkunItem[];
  belanja_per_akun: BelanjaPerAkunGroup;
  belanja_per_urusan: {
    PERINGATAN: string;
    kelompok_catatan: string;
    data: Array<{
      kode: string;
      nama: string;
      nama_pendek: string;
      kelompok: string;
      nilai_dashboard: NilaiDuaTahun;
      porsi_dari_jumlah_urusan_persen: NilaiDuaTahun;
    }>;
  };
  pembiayaan_per_akun: PembiayaanPerAkunGroup;
  turunan: {
    catatan: string;
    porsi_pendapatan_persen: {
      pajak_daerah: NilaiDuaTahun;
      pad_total: NilaiDuaTahun;
      transfer_pusat: NilaiDuaTahun;
    };
    perubahan_2025_ke_2026: {
      pajak_daerah: { selisih: number; persen: number };
      transfer_pusat: { selisih: number; persen: number };
      total_belanja: { selisih: number; persen: number };
    };
    porsi_belanja_per_jenis_persen_2026: {
      operasi: number;
      modal: number;
      tidak_terduga: number;
      transfer: number;
    };
    lima_urusan_terbesar_2026: Array<{
      kode: string;
      nama_pendek: string;
      nilai_dashboard?: number;
      porsi_dari_jumlah_urusan_persen: number;
    }>;
  };
  pemeriksaan_konsistensi?: any[];
}

// =============================================================================
// Cache & Validasi Saat Dimuat
// =============================================================================

let cachedData: RawDataAnggaran | null = null;

/**
 * Validasi struktur JSON data anggaran saat dimuat.
 * Bentuk tidak sesuai akan melempar galat eksplisit.
 */
export function validateDataAnggaran(data: any): data is RawDataAnggaran {
  if (!data || typeof data !== 'object') {
    throw new Error('Galat Validasi: Data anggaran kosong atau bukan objek JSON');
  }

  const requiredSections = [
    'meta',
    'ringkasan_apbd',
    'pendapatan_per_akun',
    'belanja_per_akun',
    'belanja_per_urusan',
    'pembiayaan_per_akun',
    'turunan',
  ];

  for (const section of requiredSections) {
    if (!(section in data)) {
      throw new Error(`Galat Validasi: Bagian wajib '${section}' tidak ditemukan dalam data anggaran`);
    }
  }

  // Validasi meta
  if (!data.meta.sumber || !data.meta.sumber.nama || !data.meta.istilah) {
    throw new Error('Galat Validasi: Struktur metadata tidak lengkap');
  }

  // Validasi ringkasan_apbd
  if (
    !Array.isArray(data.ringkasan_apbd.pendapatan) ||
    !Array.isArray(data.ringkasan_apbd.belanja) ||
    !Array.isArray(data.ringkasan_apbd.pembiayaan_penerimaan) ||
    !Array.isArray(data.ringkasan_apbd.pembiayaan_pengeluaran)
  ) {
    throw new Error('Galat Validasi: Struktur ringkasan_apbd harus memuat daftar pendapatan, belanja, dan pembiayaan');
  }

  // Validasi pendapatan_per_akun
  if (!Array.isArray(data.pendapatan_per_akun)) {
    throw new Error('Galat Validasi: pendapatan_per_akun harus berupa array');
  }

  // Validasi belanja_per_urusan
  if (!data.belanja_per_urusan || !Array.isArray(data.belanja_per_urusan.data)) {
    throw new Error('Galat Validasi: belanja_per_urusan.data harus berupa array');
  }

  return true;
}

/**
 * Fungsi internal pemuat data tunggal (bisa berjalan di Node.js dan Browser).
 */
export async function loadData(): Promise<RawDataAnggaran> {
  if (cachedData) {
    return cachedData;
  }

  // 1. Coba baca dari Node.js filesystem jika tersedia
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const fs = await import('node:fs');
      const path = await import('node:path');

      const possiblePaths = [
        path.resolve(process.cwd(), 'public/data/pajak-kita-data-anggaran.json'),
        path.resolve(process.cwd(), 'data/data.anggaran.json'),
        path.resolve(process.cwd(), 'data/pajak-kita-data-anggaran.json'),
      ];

      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          const raw = fs.readFileSync(p, 'utf-8');
          const parsed = JSON.parse(raw);
          validateDataAnggaran(parsed);
          cachedData = parsed;
          return cachedData;
        }
      }
    } catch (e: any) {
      if (e.message && e.message.startsWith('Galat Validasi')) throw e;
      // Lanjutkan ke fetch jika fs gagal
    }
  }

  // 2. Lingkungan Browser (fetch via HTTP)
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    const urls = [
      '/public/data/pajak-kita-data-anggaran.json',
      '/data/data.anggaran.json',
      'public/data/pajak-kita-data-anggaran.json',
      'data/data.anggaran.json',
    ];

    for (const url of urls) {
      try {
        const res = await window.fetch(url);
        if (res.ok) {
          const parsed = await res.json();
          validateDataAnggaran(parsed);
          cachedData = parsed;
          return cachedData;
        }
      } catch {
        // Coba url berikutnya
      }
    }
  }

  throw new Error('Galat: Tidak dapat memuat berkas data anggaran APBD (pajak-kita-data-anggaran.json)');
}

/**
 * Reset cache (untuk kebutuhan pengujian/mock testing).
 */
export function _resetCacheForTesting(): void {
  cachedData = null;
}

// =============================================================================
// Fungsi Akses Bertipe (Public API Data Client)
// =============================================================================

/**
 * Mengambil metadata sumber, satuan, basis tahun, dan status anggaran.
 */
export async function getMeta(): Promise<Meta> {
  const data = await loadData();
  return { ...data.meta };
}

/**
 * Mengambil ringkasan APBD (pendapatan, belanja, pembiayaan) tahun 2022-2026.
 */
export async function getRingkasanApbd(): Promise<RingkasanApbd> {
  const data = await loadData();
  return {
    pendapatan: [...data.ringkasan_apbd.pendapatan],
    belanja: [...data.ringkasan_apbd.belanja],
    pembiayaan_penerimaan: [...data.ringkasan_apbd.pembiayaan_penerimaan],
    pembiayaan_pengeluaran: [...data.ringkasan_apbd.pembiayaan_pengeluaran],
  };
}

/**
 * Mengambil 6 akun pendapatan daerah (Pajak, Retribusi, Hasil Pengelolaan, dll).
 */
export async function getPendapatanPerAkun(): Promise<AkunItem[]> {
  const data = await loadData();
  return data.pendapatan_per_akun.map((item) => ({
    kode: item.kode,
    nama: item.nama,
    nilai: { ...item.nilai },
  }));
}

/**
 * Mengambil belanja per akun (Operasi, Modal, Tidak Terduga, Transfer).
 */
export async function getBelanjaPerAkun(): Promise<BelanjaPerAkunGroup> {
  const data = await loadData();
  return {
    operasi: data.belanja_per_akun.operasi.map((i) => ({ ...i, nilai: { ...i.nilai } })),
    modal: data.belanja_per_akun.modal.map((i) => ({ ...i, nilai: { ...i.nilai } })),
    tidak_terduga: data.belanja_per_akun.tidak_terduga.map((i) => ({ ...i, nilai: { ...i.nilai } })),
    transfer: data.belanja_per_akun.transfer.map((i) => ({ ...i, nilai: { ...i.nilai } })),
  };
}

/**
 * Mengambil porsi belanja per urusan pemerintahan.
 * PERINGATAN: Hanya mengembalikan kode, nama_pendek, kelompok, dan porsi_dari_jumlah_urusan_persen.
 * Nilai dashboard (nominal rupiah) SENGAJA TIDAK DIEKSPOS karena indikasi dobel di sistem sumber BPKD.
 */
export async function getBelanjaPerUrusanPorsi(): Promise<BelanjaUrusanPorsiItem[]> {
  const data = await loadData();
  return data.belanja_per_urusan.data.map((item) => ({
    kode: item.kode,
    nama_pendek: item.nama_pendek,
    kelompok: item.kelompok,
    porsi_dari_jumlah_urusan_persen: { ...item.porsi_dari_jumlah_urusan_persen },
  }));
}

/**
 * Mengambil pembiayaan daerah per akun (penerimaan dan pengeluaran).
 */
export async function getPembiayaanPerAkun(): Promise<PembiayaanPerAkunGroup> {
  const data = await loadData();
  return {
    penerimaan: data.pembiayaan_per_akun.penerimaan.map((i) => ({ ...i, nilai: { ...i.nilai } })),
    pengeluaran: data.pembiayaan_per_akun.pengeluaran.map((i) => ({ ...i, nilai: { ...i.nilai } })),
  };
}

/**
 * Mengambil kalkulasi turunan (porsi pajak, PAD, lima urusan terbesar, perubahan tahunan).
 */
export async function getTurunan(): Promise<Turunan> {
  const data = await loadData();
  return {
    catatan: data.turunan.catatan,
    porsi_pendapatan_persen: { ...data.turunan.porsi_pendapatan_persen },
    perubahan_2025_ke_2026: { ...data.turunan.perubahan_2025_ke_2026 },
    porsi_belanja_per_jenis_persen_2026: { ...data.turunan.porsi_belanja_per_jenis_persen_2026 },
    lima_urusan_terbesar_2026: data.turunan.lima_urusan_terbesar_2026.map((item) => ({
      kode: item.kode,
      nama_pendek: item.nama_pendek,
      porsi_dari_jumlah_urusan_persen: item.porsi_dari_jumlah_urusan_persen,
      // nilai_dashboard sengaja dibuang demi keamanan konsistensi data
    })),
  };
}

/**
 * Mengambil bank insight untuk generator kartu.
 * Menghubungkan fakta yang dihasilkan dari data resmi APBD & Realisasi.
 */
export async function getInsight(wilayah?: string): Promise<InsightItem[]> {
  try {
    let facts: InsightItem[] = [];

    // Coba baca dari file content/insight-facts.json
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const p = path.resolve(process.cwd(), 'content/insight-facts.json');
      if (fs.existsSync(p)) {
        facts = JSON.parse(fs.readFileSync(p, 'utf-8'));
      }
    } else if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
      const urls = ['/content/insight-facts.json', 'content/insight-facts.json'];
      for (const u of urls) {
        try {
          const res = await window.fetch(u);
          if (res.ok) {
            facts = await res.json();
            break;
          }
        } catch {
          // coba url berikutnya
        }
      }
    }

    if (!facts || facts.length === 0) {
      return [];
    }

    if (!wilayah || wilayah === 'Semua Wilayah' || wilayah === 'Seluruh DKI Jakarta') {
      return facts;
    }

    // Filter fakta berdasarkan wilayah yang dipilih dan sertakan fakta skala Jakarta
    const normalized = wilayah.toLowerCase().trim();
    const matched = facts.filter(
      (f) =>
        f.wilayah.toLowerCase().includes(normalized) ||
        normalized.includes(f.wilayah.toLowerCase()) ||
        f.cakupan === 'jakarta'
    );

    return matched.length > 0 ? matched : facts;
  } catch {
    return [];
  }
}

// =============================================================================
// Cache & Validasi Realisasi APBD
// =============================================================================

let cachedRealisasiData: RawDataRealisasi | null = null;

export function validateDataRealisasi(data: any): data is RawDataRealisasi {
  if (!data || typeof data !== 'object') {
    throw new Error('Galat Validasi Realisasi: Data realisasi kosong atau bukan objek JSON');
  }

  const requiredSections = [
    'meta',
    'realisasi_per_akun',
    'realisasi_per_skpd',
    'turunan',
  ];

  for (const s of requiredSections) {
    if (!(s in data)) {
      throw new Error(`Galat Validasi Realisasi: Bagian wajib '${s}' tidak ditemukan dalam data realisasi`);
    }
  }

  if (!data.meta || !data.meta.sumber || !data.meta.tanggal_data) {
    throw new Error('Galat Validasi Realisasi: Struktur metadata realisasi tidak lengkap');
  }

  if (
    !Array.isArray(data.realisasi_per_akun.pendapatan) ||
    !Array.isArray(data.realisasi_per_akun.belanja)
  ) {
    throw new Error('Galat Validasi Realisasi: Daftar pendapatan dan belanja per akun harus berupa array');
  }

  if (!data.realisasi_per_skpd.data || !Array.isArray(data.realisasi_per_skpd.data)) {
    throw new Error('Galat Validasi Realisasi: Daftar SKPD harus berupa array');
  }

  return true;
}

export async function loadRealisasiData(): Promise<RawDataRealisasi> {
  if (cachedRealisasiData) {
    return cachedRealisasiData;
  }

  // 1. Coba baca dari Node.js filesystem jika tersedia
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const fs = await import('node:fs');
      const path = await import('node:path');

      const possiblePaths = [
        path.resolve(process.cwd(), 'public/data/pajak-kita-data-realisasi.json'),
        path.resolve(process.cwd(), 'data/data.realisasi.json'),
        path.resolve(process.cwd(), 'data/pajak-kita-data-realisasi.json'),
      ];

      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          const raw = fs.readFileSync(p, 'utf-8');
          const parsed = JSON.parse(raw);
          validateDataRealisasi(parsed);
          cachedRealisasiData = parsed;
          return cachedRealisasiData;
        }
      }
    } catch (e: any) {
      if (e.message && e.message.startsWith('Galat Validasi')) throw e;
    }
  }

  // 2. Lingkungan Browser (fetch via HTTP)
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    const urls = [
      '/public/data/pajak-kita-data-realisasi.json',
      '/data/data.realisasi.json',
      'public/data/pajak-kita-data-realisasi.json',
      'data/data.realisasi.json',
    ];

    for (const url of urls) {
      try {
        const res = await window.fetch(url);
        if (res.ok) {
          const parsed = await res.json();
          validateDataRealisasi(parsed);
          cachedRealisasiData = parsed;
          return cachedRealisasiData;
        }
      } catch {
        // Coba url berikutnya
      }
    }
  }

  throw new Error('Galat: Tidak dapat memuat berkas data realisasi APBD (pajak-kita-data-realisasi.json)');
}

/**
 * Reset cache realisasi (untuk keperluan testing).
 */
export function _resetRealisasiCacheForTesting(): void {
  cachedRealisasiData = null;
}

/**
 * Mengambil metadata resmi data realisasi APBD DKI Jakarta.
 */
export async function getRealisasiMeta(): Promise<RealisasiMeta> {
  const data = await loadRealisasiData();
  return { ...data.meta };
}

/**
 * Mengambil realisasi per akun (pendapatan, belanja, pembiayaan, dan total halaman).
 * Semua persen dan selisih dihitung kode secara otomatis.
 */
export async function getRealisasiPerAkun(): Promise<RealisasiPerAkun> {
  const data = await loadRealisasiData();

  const mapAkun = (item: any): RealisasiAkunItem => {
    const anggaran = item.anggaran || 0;
    const realisasi = item.realisasi || 0;
    const persen_hitung = anggaran > 0 ? Math.round((realisasi / anggaran) * 10000) / 100 : 0;
    const selisih_menuju_anggaran = anggaran - realisasi;

    return {
      kode: item.kode,
      nama: item.nama,
      anggaran,
      realisasi,
      persen_dashboard: item.persen_dashboard,
      persen_hitung,
      selisih_menuju_anggaran,
    };
  };

  return {
    pendapatan: data.realisasi_per_akun.pendapatan.map(mapAkun),
    belanja: data.realisasi_per_akun.belanja.map(mapAkun),
    pembiayaan_penerimaan: (data.realisasi_per_akun.pembiayaan_penerimaan || []).map(mapAkun),
    pembiayaan_pengeluaran: (data.realisasi_per_akun.pembiayaan_pengeluaran || []).map(mapAkun),
    total_halaman: { ...data.realisasi_per_akun.total_halaman },
  };
}

/**
 * Mengambil realisasi per SKPD untuk seluruh 43 unit di DKI Jakarta.
 * Peringkat belanja, porsi total, dan serapan persen dihitung oleh kode.
 */
export async function getRealisasiPerSkpd(): Promise<RealisasiPerSkpd> {
  const data = await loadRealisasiData();
  const totalBelanjaAnggaran = data.realisasi_per_skpd.jumlah.belanja_anggaran || 74285299931740;

  // Urutkan berdasarkan anggaran belanja untuk menetapkan peringkat 1-43
  const sorted = [...data.realisasi_per_skpd.data].sort(
    (a, b) => b.belanja.anggaran - a.belanja.anggaran
  );

  const peringkatMap = new Map<number, number>();
  sorted.forEach((item, index) => {
    peringkatMap.set(item.no, index + 1);
  });

  const unitList: RealisasiSkpdItem[] = data.realisasi_per_skpd.data.map((item) => {
    const ang = item.belanja.anggaran;
    const real = item.belanja.realisasi;
    const serapan_persen = ang > 0 ? Math.round((real / ang) * 10000) / 100 : null;
    const porsi_dari_total_belanja_persen =
      totalBelanjaAnggaran > 0 ? Math.round((ang / totalBelanjaAnggaran) * 10000) / 100 : 0;

    return {
      no: item.no,
      nama: item.nama,
      nama_pendek: item.nama_pendek,
      jenis_unit: item.jenis_unit,
      wilayah: item.wilayah,
      pendapatan: { ...item.pendapatan },
      belanja: {
        anggaran: ang,
        realisasi: real,
        serapan_persen,
      },
      pembiayaan: { ...item.pembiayaan },
      peringkat_belanja: peringkatMap.get(item.no) || 0,
      porsi_dari_total_belanja_persen,
    };
  });

  return {
    jumlah: { ...data.realisasi_per_skpd.jumlah },
    data: unitList,
  };
}

/**
 * Mengambil turunan statistik realisasi.
 */
export async function getTurunanRealisasi(): Promise<TurunanRealisasi> {
  const data = await loadRealisasiData();
  return { ...data.turunan };
}

