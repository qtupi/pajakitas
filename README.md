# paJAK-Kita — Platform Transparansi Pajak Daerah & APBD Jakarta

**paJAK-Kita** adalah platform berbasis web untuk membantu warga memahami penerimaan pajak daerah dan alokasi belanja APBD Provinsi DKI Jakarta secara transparan, mudah diakses, dan berakar pada data publik resmi.

---

## 🏛️ Arsitektur Halaman

1. **Beranda (`index.html`) — Executive Summary:**
   - **Hero Section:** Pengantar interaktif dengan maskot Ondi dan banner status data terkini (*Freshness Banner*).
   - **Kartu Ringkasan Eksekutif (Executive Summary Cards):**
     - **Pilar Penerimaan Pajak:** Target Rp49,90 T, Realisasi Rp40,27 T, Capaian 74,43%, progress bar tipis rapi, dan tombol CTA ke analisis lengkap.
     - **Pilar Belanja APBD:** Pagu Rp74,29 T, Realisasi Rp44,47 T, Serapan 59,86%, 3 sektor terbesar (Pendidikan 24,47%, Kesehatan 14,03%, Infrastruktur PU & Tata Air 12,40%), dan tombol CTA ke eksplorasi belanja.
   - **Pembuat Kartu Insight (Rasio 3:4):** Generator kartu fakta warga dengan privasi terjamin 100% diproses di browser klien (ekspor PNG).
   - **Kamus Pajak:** Glosarium istilah perpajakan awam berlandaskan peraturan perundang-undangan.
   - **Transparansi & Metodologi:** Landasan hukum UU No. 1/2022 (HKPD), Perda APBD DKI Jakarta, dan Dashboard BPKD.

2. **Halaman Khusus Penerimaan Pajak (`penerimaan.html`):**
   - KPI Capaian & Cincin Progres Realisasi Pajak Daerah.
   - Bullet Chart 6 Akun Pendapatan Daerah.
   - Grafik Donut Separuh (V1: *Dari Mana Uang Jakarta Berasal?*).
   - Grafik Cincin Ganda (V2: *Peran Pajak Daerah*).
   - Grafik Batang Divergen (V6: *Perubahan Anggaran 2025 vs 2026*).
   - Status Kosong Informatif (V7 & V8).

3. **Halaman Khusus Belanja APBD & OPD (`belanja.html`):**
   - KPI Count-up & Cincin Progres Penyerapan Total Belanja.
   - Bullet Chart 9 Jenis Belanja Daerah.
   - Sakelar Komposisi Belanja: Diagram Batang 43 SKPD vs Diagram Mawar Urusan (V4).
   - Diagram Waffle 10x10 (*Jika Belanja APBD Jakarta Rp100*).
   - Penjelajah 43 Unit SKPD (Tabel pencarian, pengurutan, filter kategori, dan modal detail).
   - Grafik Donut Drill-Down (V3: *Kelompok Jenis Belanja Operasi, Modal, BTT, Transfer*).
   - Grafik Area Deret Waktu (V5: *Tren Anggaran APBD 2022-2026*).
   - Halaman Dinas Prioritas (Dinas Pendidikan, Kesehatan, Bina Marga & Sumber Daya Air).

---

## 🚀 Cara Menjalankan Proyek Secara Lokal

### Menggunakan Python (yang sudah terpasang di sistem):
```bash
python -m http.server 3000
```
Buka peramban di: **`http://localhost:3000`**

### Menjalankan Pengujian Unit:
```bash
npm test
```

---

## 🔒 Jaminan Privasi & Kejujuran Data

1. **Zero Data Tracking:** Tidak ada pelacak atau penyimpanan nama warga di server. Pembuatan kartu insight dilakukan secara lokal via canvas.
2. **Kepatuhan Narasi:** Pemisahan tegas antara pilar penerimaan dan pilar belanja sesuai prinsip Rekening Kas Umum Daerah (*single pool fund*).
3. **Data Terverifikasi:** Seluruh angka bersumber resmi dari Dashboard Keuangan Daerah BPKD Provinsi DKI Jakarta posisi 25 Oktober 2026.
