# README — Data Anggaran APBD DKI Jakarta untuk paJAK-Kita

Berkas data: `pajak-kita-data-anggaran.json`
Sumber: Dashboard Keuangan Daerah BPKD Provinsi DKI Jakarta (dashboard-bpkd.jakarta.go.id), menu Anggaran.
Cara pengambilan: disalin dari tangkapan layar oleh pengguna, bukan unduhan berkas resmi.
Jenis data: **anggaran**, bukan realisasi. Realisasi dan transparansi menyusul.

> **Isi dulu sebelum dipakai:** field `meta.tanggal_pengambilan` masih `null`. Isi dengan tanggal data diambil, karena angka ini harus tampil di setiap label sumber.

## Isi berkas

| Kunci | Isi |
|---|---|
| `meta` | Sumber, satuan, istilah, basis tahun, status |
| `ringkasan_apbd` | Pendapatan, belanja, penerimaan pembiayaan, dan pengeluaran pembiayaan, 2022–2026, kolom `apbd` dan `apbdp` |
| `pendapatan_per_akun` | 6 akun pendapatan (4.1.01 Pajak Daerah sampai 4.3.01 Hibah), nilai 2026 dan 2025 |
| `belanja_per_akun` | Belanja operasi (6 akun), modal (6 akun), tidak terduga, dan transfer, nilai 2026 dan 2025 |
| `belanja_per_urusan` | 44 urusan/unsur, nilai 2026 dan 2025. **Lihat peringatan di bawah** |
| `pembiayaan_per_akun` | Penerimaan (4 akun) dan pengeluaran (2 akun) pembiayaan, nilai 2026 dan 2025 |
| `turunan` | Angka yang dihitung kode: porsi pendapatan, perubahan 2025 ke 2026, porsi belanja per jenis, lima urusan terbesar |
| `pemeriksaan_konsistensi` | Hasil pencocokan jumlah antar tampilan |

## Cara membaca nilai

- **Satuan:** rupiah penuh, bilangan bulat. Semua nilai masih di bawah batas aman `Number` JavaScript, jadi tidak perlu BigInt.
- **APBD dan APBDP:** APBD adalah anggaran penetapan awal tahun, APBDP adalah APBD Perubahan. Untuk 2026 keduanya sama karena belum ada perubahan.
- **Basis tahun pada data per akun dan per urusan:** 2026 memakai APBD (sama dengan APBDP), sedangkan **2025 memakai APBDP**. Ini terbukti dari pencocokan jumlah (lihat di bawah). Jangan membandingkannya dengan kolom `apbd` 2025 pada `ringkasan_apbd`.

## Hasil pemeriksaan konsistensi

Sembilan pemeriksaan **cocok** hingga rupiah terakhir: jumlah akun pendapatan, belanja, penerimaan pembiayaan, dan pengeluaran pembiayaan terhadap ringkasan untuk 2026 dan 2025, serta jumlah PAD 2026 (Rp57.670.647.712.697).

Satu pemeriksaan **tidak cocok dan menjadi temuan penting:**

> Jumlah semua urusan pada `belanja_per_urusan` **persis 2 kali** total belanja, pada kedua tahun. Selain itu, 1.01 Pendidikan 2026 (36.348.041.712.714) persis 2 kali anggaran belanja Dinas Pendidikan pada tabel Realisasi Per-SKPD (18.174.020.856.357), dan 1.02 Kesehatan persis 2 kali Dinas Kesehatan. Kemungkinan besar angka per-urusan di dashboard terhitung dobel. Penyebabnya belum dipastikan.

Akibatnya, `nilai_dashboard` per urusan **tidak boleh ditampilkan sebagai nominal rupiah** sebelum diverifikasi. Field `porsi_dari_jumlah_urusan_persen` aman dipakai sebagai proporsi, karena kedobelannya seragam (jumlah persis 2 kali).

## Aturan pakai data

1. Ambil semua angka dari JSON. Jangan menulis angka langsung di kode atau teks.
2. Setiap angka, grafik, dan insight menampilkan sumber, tahun, basis (APBD atau APBDP), dan tanggal pengambilan.
3. Beri label **"anggaran"** pada angka dari berkas ini. Jangan menyebutnya realisasi.
4. Belanja disebut **"belanja APBD Jakarta"**. Jangan menulis bahwa belanja atau program tertentu "dibiayai pajak" tertentu.
5. Jangan menulis alasan atau sebab-akibat yang tidak ada di data. Contoh: berkas ini mencatat transfer pusat turun dari 2025 ke 2026, tetapi tidak memuat penyebabnya.
6. Nominal per urusan tidak ditampilkan. Gunakan proporsi atau tunggu verifikasi.
7. Field `kelompok` pada urusan diturunkan dari angka depan kode dan belum diverifikasi ke dokumen resmi. Tampilkan sebagai pengelompokan bantu, bukan istilah resmi.
8. Tampilkan angka besar secara ringkas (triliun atau miliar) dan sediakan nilai penuh pada tooltip atau panel detail.

## Belum ada di berkas ini

Realisasi (Per-Akun dan Per-SKPD per tanggal), halaman Transparansi, penerimaan pajak per jenis dan per wilayah (data satudata), dan rincian pajak daerah per jenis pajak.