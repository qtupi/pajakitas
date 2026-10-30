# README — Data Realisasi APBD DKI Jakarta TA 2026 (paJAK-Kita)

Berkas data: `pajak-kita-data-realisasi.json`. Pendamping dari `pajak-kita-data-anggaran.json` dan `README-data-anggaran.md`; aturan di README itu tetap berlaku.
Sumber: Dashboard Keuangan Daerah BPKD Provinsi DKI Jakarta (dashboard-bpkd.jakarta.go.id), menu Realisasi, halaman Per-Akun dan Per-SKPD.
Cara pengambilan: disalin dari tampilan dashboard oleh pengguna, bukan unduhan berkas resmi.

> **Isi dulu:** `meta.tanggal_pengambilan` masih `null`. `meta.tanggal_data` sudah terisi **2026-10-25**, diambil dari judul halaman ("Sampai dengan 25/10/2026").

## Isi berkas

| Kunci | Isi |
|---|---|
| `meta` | Sumber, tanggal data, satuan, peringatan |
| `realisasi_per_akun` | Pendapatan (6 akun), belanja (9 baris), penerimaan dan pengeluaran pembiayaan, beserta total yang tertera di halaman. Tiap akun punya `anggaran`, `realisasi`, `persen_dashboard`, `persen_hitung` |
| `realisasi_per_skpd` | 43 unit (dinas, badan, wilayah administrasi, dst.) dengan pendapatan, belanja, dan pembiayaan (anggaran dan realisasi), plus `serapan_persen` belanja yang dihitung kode |
| `turunan` | Capaian persen, porsi pajak daerah dari realisasi pendapatan, belanja terbesar, serapan terendah dan tertinggi, dan perbandingan dua tanggal |
| `pemeriksaan_*` | Hasil pencocokan jumlah dan persen |

## Cara membaca nilai

- **Realisasi bersifat kumulatif sampai `meta.tanggal_data`** pada tahun anggaran berjalan. Itu bukan angka akhir tahun. Jangan membandingkannya langsung dengan angka setahun penuh dan jangan memproyeksikannya ke akhir tahun.
- **Angka berubah per tanggal.** Contoh: realisasi Pajak Daerah Rp37.036.293.202.422 pada 23/10/2026 menjadi Rp37.138.893.774.592 pada 25/10/2026. Karena itu tanggal data wajib tampil di setiap label sumber.
- **Anggaran** di berkas ini adalah APBD 2026 dan cocok persis dengan berkas anggaran.
- **Belanja modal** hanya tersedia sebagai satu angka agregat (kode 5.2) pada halaman realisasi ini.
- **Kolom pembiayaan per SKPD** adalah penerimaan dan pengeluaran pembiayaan yang digabung, bukan pembiayaan netto.
- **Pendapatan per SKPD bukan pajak daerah.** Badan Pendapatan Daerah mencatat Rp50,80 T anggaran pendapatan, sedangkan akun Pajak Daerah Rp49,90 T.
- **Baris Kota Administrasi** adalah anggaran SKPD milik pemerintah kota administrasi itu, bukan seluruh belanja yang jatuh di wilayahnya. Field `wilayah` hanya terisi pada enam baris ini.

## Hasil pemeriksaan

Dari 27 pencocokan jumlah, 20 cocok persis dan 7 berselisih tepat Rp1 (pembulatan tampilan pada halaman sumber, bukan salah salin). Tidak ada selisih yang lebih besar. Persen yang dihitung ulang cocok dengan persen di halaman untuk semua akun. Anggaran 2026 pada berkas ini cocok dengan berkas anggaran untuk pendapatan, belanja, dan pembiayaan.

**Temuan yang berguna:** pada tangkapan layar 23/10/2026, total belanja realisasi di Per-SKPD dan Per-Akun masih berselisih sekitar Rp30 miliar. Pada tanggal yang sama (25/10/2026) kedua tampilan kini cocok. Jadi selisih sebelumnya berasal dari perbedaan waktu pengambilan, bukan kesalahan data. Ini alasan lain angka tanpa tanggal tidak boleh dipakai.

Dengan Per-SKPD yang jumlahnya cocok dengan total belanja, **nominal belanja per dinas aman ditampilkan.** Itu berbeda dengan angka per-urusan pada berkas anggaran, yang tetap tidak boleh ditampilkan sebagai nominal.

## Aturan pakai data

1. Setiap angka dari berkas ini berlabel **"realisasi per [tanggal_data]"** dan menampilkan sumbernya.
2. Jangan menilai "baik" atau "buruk" dari serapan. Serapan kumulatif sampai satu tanggal belum mencerminkan kinerja setahun.
3. Jangan menulis sebab-akibat yang tidak ada di data, dan jangan menyatakan bahwa pajak tertentu membiayai belanja tertentu.
4. Belanja disebut "belanja APBD Jakarta".
5. Persen dan selisih dihitung kode dari nilai, bukan ditulis tangan.
6. Tampilkan angka besar secara ringkas (triliun atau miliar) dan nilai penuh di tooltip atau panel detail.
7. Nama dinas pada dropdown dan halaman dinas diambil dari field `nama_pendek`. Halaman "Bina Marga dan SDA" menggabungkan dua unit (Dinas Bina Marga dan Dinas Sumber Daya Air) dan harus ditulis demikian.

## Belum ada di berkas ini

Realisasi tahun-tahun sebelumnya (2022 sampai 2025), rincian belanja modal per akun, data per wilayah untuk penerimaan pajak (data satudata), dan seluruh isi halaman Transparansi (ditunda).
