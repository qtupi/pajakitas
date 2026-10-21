# paJAK-Kita — Pusat Transparansi & Verifikasi Pajak Daerah Jakarta

> **Konteks:** Kompetisi WIA MIA 2026  
> **Tema:** *"Designing Digital Futures – Powering Public Transparency"* (Open Government Data & Public Service Tracking)  
> **Gaya Desain:** **Modern Editorial Minimalist** dengan perpaduan arsitektural kontemporer, pola dot-grid presisi, asimetris dinamis, dan floating action bar kaca buram (*frosted glass*).

---

## 🏛️ 1. Filosofi & Estetika Desain

Situs web ini dirancang mengikuti pedoman visual kelas dunia:
- **Style Desain:** Modern Editorial Minimalist arsitektural kelas atas, mengedepankan fotografi infrastruktur berskala besar, tipografi neo-grotesque presisi (`Plus Jakarta Sans` & `JetBrains Mono`), dan kontras geometris tegas.
- **Hero Section:**
  - Latar belakang fotografi transit hub modern (MRT Jakarta elevated station & pedestrian skybridge) dengan langit biru alami.
  - Pola **Dot Grid Overlay** (titik-titik matriks presisi) yang memberi kesan struktural, teknis, dan presisi.
  - Pemotongan asimetris dinamis di bagian bawah hero section (*asymmetric cut*) menuju latar belakang kertas hangat solid (`#F5F4F0`).
  - **Floating Action Bar ("Cari alokasi pajak di kotamu..."):** Kapsul mengambang dengan efek *frosted glass* (`backdrop-filter: blur(18px)` dan transparansi gelap) lengkap dengan autocomplete pencarian instan wilayah dan dinas.
  - Indikator metrik di kanan bawah: `100% Data Terbuka`, `38 Provinsi Cakupan Daerah`, `Real-time Pembaruan Aliran Dana`.
- **Palet Warna:**
  - Background Konten: `#F5F4F0` / `#F7F7F5` (Warm Gray / Off-white premium paper).
  - Teks & UI Gelap: `#111111` / `#18181B` (Deep Charcoal pekat).
  - Aksen Arsitektur: Biru langit (`#0284C7`), terakota bata (`#C2410C`), dan hijau verifikasi (`#059669`).
- **Border Radius:**
  - *Pill-shaped* (`rounded-full`) untuk tombol CTA dan floating search bar.
  - *Sharp corners* (`rounded-none` / `< 4px`) untuk kartu layout, gambar, dan tabel arsitektur.

---

## 📋 2. Pemenuhan Kebutuhan PRD & System Design (R1 – R10)

| Kode PRD | Fitur & Implementasi | Status |
|---|---|---|
| **R1** | **Dashboard Penerimaan Pajak Daerah:** Filter 12 jenis pajak, 6 wilayah DKI Jakarta, periode 2021-2024, format rupiah penuh, penanganan kondisi kosong (*"Data tidak tersedia untuk kombinasi ini"*, bukan 0), label wilayah resmi tanpa "PUSAT" mandiri. | ✅ Selesai |
| **R2** | **Dashboard Belanja APBD Jakarta:** Pagu anggaran vs realisasi serapan per OPD (Disdik, Dinkes, Dishub, DSDA, Bina Marga, DLH, dll.), berlabel tegas *"Belanja APBD Jakarta"* se-DKI. | ✅ Selesai |
| **R3** | **Pemisahan Metodologis (Bridge):** Pemisahan tegas antara Bagian A (Penerimaan) dan Bagian B (Belanja) dengan penjelasan prinsip *Rekening Kas Umum Daerah (single pool fund)* tanpa ilusi hubungan 1:1 langsung. | ✅ Selesai |
| **R4** | **Trust Layer & Freshness Ticker:** Sumber resmi `satudatajakarta.go.id`, tahun data audited 2023 & sementara 2024, indikator akurasi dokumen APBD (98.4%). | ✅ Selesai |
| **R5** | **Kamus Pajak Awam:** Penerjemahan istilah pajak teknis (PKB, BBNKB, PBB-P2, BPHTB, PBJT Resto/Hotel/Parkir/Hiburan, PAT, Reklame) ke bahasa warga awam beserta dasar hukum Perda No. 1/2024 & UU HKPD. | ✅ Selesai |
| **R6** | **Pembuat Kartu Insight Warga (3:4):** Generator kartu vertikal 3:4 dengan nama pengguna, wilayah domisili, maskot paJAK-Kita, dekorasi khas Betawi, dan 3 template visual (*Minimalist Editorial*, *Jakarta Blueprint Modern*, *Batik Terakota Kontemporer*). | ✅ Selesai |
| **R7** | **Bank Insight Terverifikasi:** Angka dihitung dari dataset nyata, pola kalimat *"Pajak yang terkumpul di wilayah [Wilayah]"*, insight belanja berlaku se-Jakarta. | ✅ Selesai |
| **R8** | **Privasi Data Kartu:** 100% diproses di browser klien menggunakan HTML5 Canvas, tanpa login, dan tidak ada data pribadi yang dikirim ke server. | ✅ Selesai |
| **R9** | **Kesiapan & Validasi Data:** Dataset terstruktur JSON di folder `data/` dengan validasi skema dan metadata lengkap. | ✅ Selesai |
| **R10** | **InfoPanel Kontekstual:** Modal/drawer slide-over interaktif saat grafik atau angka diklik, menampilkan rumus, cara hitung, dan sumber dataset. | ✅ Selesai |
| **P1** | **Rupiah Tracker & Peta Interaktif:** Galeri proyek nyata (MRT Jakarta Fase 2A, JPO Phinisi Sudirman, Tebet Eco Park) dan peta interaktif wilayah DKI Jakarta. | ✅ Selesai |

---

## 🚀 3. Cara Menjalankan Proyek Secara Lokal

Proyek ini dibangun mengikuti prinsip **Statis Dulu** (Zero-backend runtime, performa tinggi, privasi terjamin).

### Menggunakan Python (yang sudah terpasang di sistem):
```bash
python -m http.server 3000
```
Buka peramban di: **`http://localhost:3000`**

### Struktur Berkas:
```
PaJAK-Kita/
├── index.html                   # Halaman utama aplikasi web semantik
├── css/
│   └── style.css                # Sistem desain Modern Editorial Minimalist
├── js/
│   ├── app.js                   # Orkesrator utama aplikasi
│   ├── dataClient.js            # Modul akses data statis (System Design 3.2)
│   ├── dashboard.js             # Engine dashboard Penerimaan (R1) & Belanja (R2)
│   ├── cardGenerator.js         # Generator kartu 3:4 Canvas & Web Share (R6, R8)
│   └── infoPanel.js             # Drawer info kontekstual & cara hitung (R10)
├── data/
│   ├── meta.json                # Metadata & Trust Layer
│   ├── penerimaan.json          # Dataset realisasi pajak daerah
│   ├── penerimaan_ringkasan.json# Ringkasan cepat pra-agregasi
│   ├── belanja.json             # Dataset realisasi belanja APBD per OPD
│   ├── referensi_pajak.json     # Kamus pajak awam (R5)
│   ├── bank_insight.json        # Bank insight terverifikasi (R7)
│   ├── proyek_infrastruktur.json# Portofolio proyek nyata (P1)
│   └── definisi_panel.json      # Kamus definisi InfoPanel (R10)
├── assets/
│   ├── hero_mrt.jpg             # Foto arsitektur stasiun MRT elevated & skybridge
│   ├── jpo_phinisi.jpg          # Foto arsitektur JPO Phinisi Sudirman
│   ├── urban_eco_park.jpg       # Foto lanskap modern Tebet Eco Park
│   └── mascot.jpg               # Maskot paJAK-Kita berselendang batik Betawi
└── scripts/
    └── prepare_data.py          # Skrip pembuatan & rekonsiliasi data JSON
```

---

## 🔒 4. Jaminan Privasi & Kejujuran Data

1. **Zero Data Tracking:** Tidak ada pelacak atau penyimpanan nama warga di server.
2. **Kepatuhan Narasi:** Sesuai checklist integritas PRD, 0% kalimat yang menghubungkan jenis pajak secara langsung dengan proyek tertentu (single pool fund compliance).
3. **Standar Data Hilang:** Wilayah atau jenis pajak tanpa data ditampilkan secara transparan sebagai *"Data tidak tersedia untuk kombinasi ini"*, bukan angka nol yang dapat disalahartikan.
