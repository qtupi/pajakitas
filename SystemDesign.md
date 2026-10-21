# System Design — paJAK-Kita

Dokumen ini menjabarkan arsitektur sistem untuk memenuhi PRD paJAK-Kita (R1–R10). Semua keputusan teknis berstatus **[Usulan]** sampai dibahas bersama tim. Dokumen ini membahas arsitektur, alur data, kontrak data, dan trade-off. **Desain visual** (font, palet warna, komponen visual) dibahas terpisah bersama tim; arsitektur ini hanya menyediakan titik sambungnya berupa token styling.

---

## 1. Requirements

### Fungsional (ringkasan dari PRD)

| Kode PRD | Kebutuhan | Dampak pada arsitektur |
|---|---|---|
| R1 | Dashboard penerimaan pajak daerah, filter jenis pajak, wilayah, periode | Data penerimaan teragregasi, mesin filter di sisi klien |
| R2 | Dashboard belanja APBD (anggaran vs realisasi per OPD) | Data belanja pra-agregasi per tahun dan OPD |
| R3 | Pemisahan penerimaan (A) dan belanja (B) dengan penjelasan | Dua modul data dan dua bagian UI yang tidak saling menurunkan angka |
| R4 | Trust Layer: sumber, tahun, definisi, label "sementara" | Metadata disimpan bersama data dan dibawa sampai ke UI dan kartu |
| R5 | Terjemahan nama jenis pajak ke bahasa awam | Tabel referensi jenis pajak |
| R6 | Pembuat kartu: nama, wilayah, 3 template, 3:4, ekspor gambar | Modul kartu sepenuhnya di sisi klien |
| R7 | Bank insight terverifikasi, dipilih acak | Pipeline pembuatan dan validasi insight sebelum runtime |
| R8 | Nama dan wilayah tidak disimpan | Tidak ada penyimpanan sisi server untuk data pengguna |
| R9 | Kesiapan data sebelum dipakai | Tahap validasi pada pipeline data |
| R10 | Panel informasi saat grafik diklik | Satu komponen panel dan satu berkas definisi |

### Non-fungsional

- **Tidak ada data pribadi di server.** Nama dan wilayah hanya ada di memori browser pengguna.
- **Mobile-first.** Kartu dibagikan dari ponsel, jadi dashboard dan pembuat kartu harus nyaman di layar sempit.
- **Akurasi lebih penting dari fitur.** Angka yang tampil harus bisa ditelusuri ke dataset asal.
- **Ringan dan tangguh.** Tidak ada komponen yang bisa mati saat demo selain hosting statis.
- **Skala trafik bukan kendala utama.** Seluruh isi disajikan sebagai berkas statis lewat CDN; yang perlu dijaga adalah ukuran berkas data dan memori browser.

### Batasan

Tim mahasiswa, waktu pengerjaan sekitar 2 minggu, keahlian yang sudah ada: React, TypeScript, Tailwind CSS, Python. Data bersumber dari satudatajakarta.go.id dan dirilis dengan jeda, sehingga sebagian besar data berupa data historis (banyak yang ditemukan berasal dari 2023).

### Asumsi

1. Dataset dapat diunduh dalam bentuk berkas tabular (CSV atau Excel) dan diolah offline. Belum diverifikasi apakah portal menyediakan API.
2. Satuan kolom realisasi adalah rupiah penuh (tampak dari contoh baris), perlu dipastikan dari metadata dataset.
3. Nama wilayah di data dapat dipetakan ke enam wilayah administratif dengan tabel pemetaan; ketersediaan Jakarta Utara dan Kepulauan Seribu belum dipastikan.

---

## 2. High-Level Design

### Prinsip

1. **Statis dulu.** Tidak ada backend untuk versi lomba; data disajikan sebagai berkas JSON.
2. **Hitung sebelum runtime.** Agregasi, perbandingan dasar, dan insight dihitung dan divalidasi saat build, bukan saat pengguna membuka halaman.
3. **Kartu di sisi klien.** Pembuatan dan ekspor gambar terjadi di browser.
4. **Tidak ada AI saat runtime.** AI hanya membantu merumuskan redaksi insight di tahap persiapan.

### Diagram komponen

```
┌─────────────────────────── TAHAP BUILD (offline, dikerjakan tim data) ───────────────────────────┐
│                                                                                                   │
│  satudatajakarta.go.id        ┌──────────────┐    ┌──────────────┐    ┌────────────────────┐      │
│  (CSV/Excel mentah)  ───────► │ Python:      │──► │ Python:      │──► │ JSON olahan        │      │
│                               │ bersihkan &  │    │ validasi data│    │ + meta.json        │      │
│                               │ normalisasi  │    │ (skema,      │    │ (data/*.json)      │      │
│                               └──────────────┘    │ rekonsiliasi)│    └─────────┬──────────┘      │
│                                                   └──────────────┘              │                 │
│                                                                                  ▼                 │
│                               ┌──────────────┐    ┌──────────────┐    ┌────────────────────┐      │
│                               │ Hitung fakta │──► │ AI bantu     │──► │ Skrip pemeriksa:   │      │
│                               │ insight dari │    │ redaksi      │    │ hitung ulang angka │      │
│                               │ data (kode)  │    │ 2–3 kalimat  │    │ lalu cocokkan teks │      │
│                               └──────────────┘    └──────────────┘    └─────────┬──────────┘      │
│                                                                                  ▼                 │
│                                                                     insight/bank.json (lolos saja)│
└───────────────────────────────────────────────────────────────────────────────────┬───────────────┘
                                                                                    │ di-bundle
                                                                                    ▼
┌────────────────────────────── TAHAP RUNTIME (browser pengguna) ───────────────────────────────────┐
│                                                                                                    │
│   Hosting statis / CDN ──► React app (Vite + TypeScript)                                           │
│                                │                                                                   │
│                                ├─ dataClient (satu-satunya pintu akses data)                        │
│                                │     └─ membaca data/*.json, meta.json, referensi, insight/bank    │
│                                │                                                                   │
│                                ├─ Dashboard                                                        │
│                                │     ├─ Bagian A: Penerimaan pajak  (R1)                           │
│                                │     ├─ Bagian B: Belanja APBD      (R2)                           │
│                                │     ├─ Catatan metodologi di antara A dan B (R3)                  │
│                                │     ├─ InfoPanel (klik grafik/angka)  (R10)                       │
│                                │     └─ Trust Layer: SourceBadge, FreshnessBanner (R4)             │
│                                │                                                                   │
│                                └─ Pembuat Kartu (R6, R8)                                           │
│                                      form nama+wilayah ─► pemilih insight ─► CardTemplate (3 tema) │
│                                      ─► ekspor PNG di browser ─► unduh / Web Share                 │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Alur data

**Dashboard:** pengguna membuka halaman → aplikasi memuat `meta.json` dan ringkasan → pengguna memilih filter → `dataClient` memuat berkas tahun yang relevan secara lazy → utilitas agregasi menghitung tampilan → grafik dirender → klik pada grafik membuka `InfoPanel` dengan definisi dan insight dari berkas definisi.

**Kartu:** pengguna mengisi nama dan wilayah → memilih template → pemilih insight mengambil beberapa insight acak dari bank untuk wilayah itu (ditambah insight se-Jakarta untuk belanja) → komponen `CardTemplate` dirender sebagai pratinjau 3:4 → pengguna menekan unduh atau bagikan → komponen diekspor menjadi PNG di browser. Tidak ada permintaan jaringan yang membawa nama atau wilayah.

### Pilihan penyimpanan

Tidak ada database. Seluruh data disimpan sebagai berkas JSON statis di bawah `public/data/` dan berpindah bersama setiap build, sehingga versi data selalu cocok dengan versi aplikasi. Preferensi pengguna tidak disimpan.

---

## 3. Deep Dive

### 3.1 Model data (kontrak berkas JSON)

Seluruh berkas diturunkan dari dataset sumber oleh pipeline Python. Nama kolom asli dipertahankan di berkas mentah, sedangkan JSON olahan memakai skema bersih berikut.

**`meta.json` — metadata dan sumber (basis Trust Layer)**

```json
{
  "build": "[id build]",
  "tanggal_olah": "[tanggal]",
  "dataset": [
    {
      "id": "penerimaan_pajak",
      "judul": "Data Realisasi Penerimaan Pajak Daerah",
      "sumber": "satudatajakarta.go.id",
      "tanggal_ambil": "[tanggal]",
      "tahun_tersedia": [],
      "granularitas": "[bulanan/tahunan, hasil cek]",
      "status": "final",
      "catatan": "[keterbatasan yang diketahui]"
    }
  ],
  "tahun_data_terakhir": { "penerimaan_pajak": 0, "belanja": 0 }
}
```

**`penerimaan/{tahun}.json` — dari dataset realisasi penerimaan pajak daerah**

```json
[
  { "tahun": 2023, "bulan": 8, "wilayah": "Jakarta Barat", "jenis_pajak": "HIBURAN", "realisasi_rp": 11344236302 }
]
```

(Contoh baris diambil dari tangkapan layar dataset; satuan rupiah perlu dipastikan.) Nama wilayah dinormalisasi lewat tabel pemetaan, misalnya `PUSAT` menjadi `Jakarta Pusat`.

**`penerimaan/ringkasan.json`:** total per tahun, per jenis pajak, dan per wilayah, dihitung sekali oleh pipeline agar tampilan awal tidak memuat seluruh baris bulanan.

**`referensi/jenis_pajak.json` — dukungan R5**

```json
[
  { "kode": "HIBURAN", "nama_dataset": "HIBURAN", "nama_awam": "[nama yang dikenal warga]", "penjelasan": "[penjelasan singkat, bahasa awam]", "sumber_penjelasan": "[rujukan resmi]" }
]
```

Penjelasan hanya diisi dari sumber resmi yang bisa dirujuk.

**`belanja/{tahun}.json` — dari dataset realisasi dan target belanja daerah**

```json
[
  { "tahun": 0, "bulan": 0, "kode_opd": "", "nama_opd": "", "akun_jenis": "", "anggaran_rp": 0, "realisasi_rp": 0 }
]
```

Data belanja bersifat per OPD dan jenis akun, bukan per wilayah, sehingga tidak ada kolom wilayah. `belanja/ringkasan.json` menyimpan agregat per OPD per tahun.

**`kinerja/apbd.json` (P1):** gabungan dataset persentase pengelolaan pelaksanaan APBD dan akurasi dokumen APBD (`jumlah_realisasi`, `jumlah_target`, `persentase`, per tahun).

**`definisi/panel.json` — isi `InfoPanel` (R10)**

```json
{ "[id-grafik]": { "judul": "", "penjelasan": "", "cara_hitung": "", "dataset": ["penerimaan_pajak"], "catatan": "" } }
```

**`insight/bank.json` — hasil pipeline R7**

```json
{
  "id": "[id insight]",
  "cakupan": "wilayah | jakarta",
  "wilayah": "Jakarta Barat",
  "topik": "penerimaan | belanja | tren",
  "kueri": { "dataset": "penerimaan_pajak", "filter": { "wilayah": "Jakarta Barat", "jenis_pajak": "[jenis]", "tahun": 0 }, "operasi": "[jumlah | perbandingan | perubahan]" },
  "angka": "[hasil hitung dari kueri]",
  "teks": "[2–3 kalimat yang memuat angka]",
  "sumber": "satudatajakarta.go.id",
  "tahun_data": 0,
  "diverifikasi": true
}
```

Field `kueri` membuat setiap insight dapat dihitung ulang secara otomatis, dan `cakupan` memastikan kalimat belanja tidak pernah diberi label wilayah.

### 3.2 Kontrak akses data (`dataClient`)

Seluruh pembacaan data lewat satu modul, bukan tersebar di komponen. Antarmuka (sketsa TypeScript):

```ts
interface DataClient {
  getMeta(): Promise<Meta>;
  getPenerimaan(q: { tahun?: number; wilayah?: Wilayah; jenisPajak?: string }): Promise<BarisPenerimaan[]>;
  getBelanja(q: { tahun?: number; opd?: string }): Promise<BarisBelanja[]>;
  getJenisPajak(): Promise<JenisPajak[]>;
  getPanel(idGrafik: string): Promise<Panel>;
  getInsight(q: { wilayah: Wilayah; jumlah: number }): Promise<Insight[]>;
}
```

Implementasi versi lomba membaca berkas statis. Jika suatu saat sistem memerlukan API, antarmuka yang sama dipetakan menjadi `GET /api/penerimaan`, `GET /api/belanja`, dan seterusnya tanpa mengubah komponen.

### 3.3 Pipeline data dan validasi (R7, R9)

1. **Normalisasi:** nama kolom, format angka (pemisah ribuan), nama wilayah, dan nama jenis pajak dipetakan ke skema bersih.
2. **Validasi data:** skema (tipe dan kolom wajib), nilai tidak negatif, tidak ada duplikat kunci (tahun, bulan, wilayah, jenis pajak), semua wilayah dan jenis pajak ada di tabel pemetaan, dan rekonsiliasi (misalnya jumlah bulanan terhadap total tahunan bila tersedia). Baris yang gagal dilaporkan, tidak dibuang diam-diam.
3. **Pencatatan keterbatasan:** hasil cek granularitas (bulanan atau kumulatif), tahun tersedia, dan konsistensi nama jenis pajak antar tahun ditulis ke `meta.json`.
4. **Pembuatan insight:** kode menghitung fakta berdasarkan `kueri`; AI hanya merumuskan teks dari fakta itu dengan instruksi tidak menambah klaim; skrip pemeriksa menghitung ulang angka dari data dan mencocokkannya dengan teks; hanya insight yang lolos masuk `bank.json`.

### 3.4 Pemilihan insight pada kartu

- Kartu memuat satu insight sorotan dan satu sampai dua insight pendukung (jumlah akhir mengikuti keputusan desain).
- Insight spesifik wilayah hanya berasal dari topik penerimaan. Insight belanja berlaku se-Jakarta dan ditampilkan dengan label tersebut.
- Pemilihan acak tanpa pengulangan dalam satu kartu. Tombol "acak ulang" memilih ulang dari bank. Jika bank suatu wilayah kurang dari jumlah yang dibutuhkan, kartu memakai insight yang tersedia, tidak mengarang pengganti.
- Teks kalimat wilayah selalu memakai pola "pajak yang terkumpul di wilayah X".

### 3.5 Pembuatan dan ekspor kartu

- Nama dibatasi panjangnya dan dibersihkan sebelum dirender.
- Font kartu dimuat dari berkas sendiri dan ekspor menunggu font siap (`document.fonts.ready`), karena font eksternal sering gagal ikut tereksport ke gambar.
- Ekspor memakai `html-to-image` dari komponen berukuran 3:4 (misalnya 1080 × 1440 piksel). Elemen penting ditempatkan di area tengah agar tetap aman jika platform memotong tepi.
- Berbagi memakai Web Share API pada ponsel yang mendukungnya, dengan cadangan unduh berkas.
- Pada kartu selalu tercetak label bahwa kartu adalah kartu insight paJAK-Kita dan bukan dokumen resmi, bersama sumber dan tahun data.

### 3.6 Penanganan error dan kondisi kosong

| Situasi | Perilaku |
|---|---|
| Berkas data gagal dimuat | Tampilkan pesan galat dan tombol coba lagi; bagian lain tetap berfungsi |
| Filter tidak punya data | Tampilkan "data tidak tersedia" dan bukan 0 |
| Wilayah tanpa insight di bank | Kartu memakai insight yang ada, atau menampilkan pemberitahuan bahwa insight wilayah ini belum tersedia |
| Font gagal dimuat saat ekspor | Gunakan font cadangan; tampilan sedikit berbeda tapi kartu tetap jadi |
| Web Share tidak didukung | Tombol berubah menjadi unduh |
| Data bertanda sementara | Selalu diberi label "sementara" di UI |

### 3.7 Caching dan performa

- Hosting statis dengan CDN; berkas JSON memakai nama berversi agar cache panjang aman dipakai.
- Muat awal hanya `meta.json` dan berkas ringkasan; berkas per tahun dimuat saat dibutuhkan (lazy loading).
- Dataset belanja yang besar dipra-agregasi dan dipecah per tahun sehingga browser tidak memuat seluruh baris sekaligus.
- Hasil agregasi yang mahal di-memoize di sisi klien selama sesi.
- Bila ukuran berkas ternyata terlalu besar untuk browser, opsi berikutnya adalah format kolumnar atau basis data di browser (lihat bagian 5).

### 3.8 Aksesibilitas

Kontras warna, ukuran sentuh minimum, label teks untuk grafik, dan navigasi keyboard untuk `InfoPanel` diperlakukan sebagai syarat tampilan, bukan tambahan. Detail visual mengikuti keputusan desain tim.

---

## 4. Trade-off Analysis

| Keputusan | Pilihan | Alternatif | Alasan dan konsekuensi |
|---|---|---|---|
| Backend | Tanpa backend, data statis | API tipis (FastAPI) | Lebih sederhana, privasi otomatis terjaga, tidak ada kegagalan server saat demo. Konsekuensinya, pembaruan data memerlukan build ulang, dan ada risiko dinilai "hanya menampilkan berkas"; mitigasinya menampilkan pipeline dan validasi sebagai bagian sistem |
| Insight | Bank terverifikasi, dipilih acak | AI dipanggil saat runtime | Akurat, cepat, murah, tidak butuh kunci API di klien. Konsekuensinya, variasi terbatas pada isi bank |
| Pemilihan insight | Acak (keputusan penulis) | Deterministik berdasarkan input | Acak memberi variasi dan terasa seperti rangkuman tahunan. Deterministik membuat kartu yang sama bisa direproduksi. Karena isi bank sudah terverifikasi, kedua opsi sama-sama jujur; acak dipilih dengan tombol acak ulang |
| Ekspor kartu | `html-to-image` dari komponen React | Canvas atau SVG manual | Template mudah dirancang dengan HTML/CSS dan Tailwind. Risikonya, rendering font dan efek tertentu perlu diuji lintas browser |
| Tiga template | Satu layout dengan tiga set token | Tiga layout terpisah | Lebih murah dibuat dan dijaga. Perbedaan antar template terbatas pada warna, dekorasi, dan maskot |
| Grafik | Recharts | Apache ECharts | Integrasi React sederhana dan cukup untuk kebutuhan P0. ECharts lebih kaya (termasuk peta) tetapi lebih berat dipelajari |
| Kerangka web | React + Vite | Next.js static export | Tidak butuh SSR sehingga Vite lebih ringan. Next.js masuk akal jika tim lebih terbiasa |
| Data | Pra-agregasi saat build | Mengolah baris mentah di browser | Tampilan cepat dan angka sudah divalidasi. Konsekuensinya, fleksibilitas filter terbatas pada agregasi yang disiapkan |

---

## 5. Yang Akan Ditinjau Ulang Saat Sistem Berkembang

1. **Lapisan API tipis** (misalnya FastAPI, agar kode pandas tim data dapat dipakai ulang) bila data membesar, jumlah dataset bertambah, atau diperlukan filter yang tidak bisa dipra-agregasi.
2. **Pembaruan data terjadwal** bila portal menyediakan API atau unduhan terstruktur yang stabil (belum diverifikasi).
3. **Tautan kartu yang dapat dibagikan** dengan pratinjau gambar di media sosial, yang membutuhkan server atau fungsi serverless untuk membuat gambar pratinjau.
4. **Analitik pemakaian** (jumlah kartu dibuat dan dibagikan) lewat layanan analitik pihak ketiga yang menjaga privasi, bukan database sendiri.
5. **Penyimpanan data di browser** (format kolumnar atau basis data dalam browser) bila dataset detail terlalu besar untuk JSON biasa.
6. **Dataset tambahan dan dokumen anggaran yang belum terstruktur**, yang membutuhkan tahap ekstraksi sebelum masuk pipeline.
7. **Pengujian otomatis** untuk skrip validasi dan komponen kartu agar regresi data atau tampilan terdeteksi sebelum rilis.

## 6. Asumsi dan Hal yang Belum Dipastikan

Hasil cek berikut akan mengubah detail desain ini dan harus dijawab oleh pengolah data: apakah nilai realisasi per bulan atau kumulatif; tahun apa saja yang tersedia per dataset; apakah seluruh wilayah ada; apakah penamaan jenis pajak konsisten antar tahun; dan apakah ada API resmi untuk pengambilan data. Selain itu, ketentuan teknologi pada juknis atau rubrik lomba perlu dicek karena dapat mengubah keputusan soal backend.