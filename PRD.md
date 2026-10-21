# PRD — paJAK-Kita

**Konteks:** WIA MIA 2026, tema "Designing Digital Futures – Powering Public Transparency" (gabungan subtema Open Government Data dan Public Service Tracking)
**Status dokumen:** Draf berdasarkan hasil brainstorming. Setiap keputusan ditandai **[Diputuskan]** (sudah ditetapkan penulis) atau **[Usulan]** (belum dikonfirmasi).
**Sumber data:** satudatajakarta.go.id, data asli (bukan dummy)

---

## 1. Problem Statement

Sebagian warga Jakarta tidak melihat ke mana pajak daerah mengalir, dan menurut pengamatan penulis hal ini berkontribusi pada rendahnya kepercayaan terhadap pengelolaan dana publik. Data penerimaan pajak dan belanja daerah sebenarnya sudah dipublikasikan, tetapi tersebar dalam bentuk dataset teknis yang sulit dipahami warga awam. Jika tidak ditangani, informasi yang sudah terbuka tetap tidak dipakai, dan kepercayaan warga tidak punya dasar yang bisa diperiksa.

*Catatan bukti:* premis tentang rendahnya kepercayaan berasal dari pengamatan dan bacaan penulis, belum diuji dengan data survei. Kepercayaan hanyalah salah satu faktor perilaku pajak; faktor lain adalah pemahaman cara membayar dan kesadaran tujuan penggunaan pajak.

## 2. Goals

1. **Warga dapat melihat dan memahami penerimaan pajak daerah Jakarta** per jenis pajak, wilayah, dan periode, dalam bahasa yang mudah dimengerti.
2. **Warga dapat melihat anggaran dan realisasi belanja APBD Jakarta** per OPD dan periode, tanpa kesan bahwa pajak tertentu membiayai proyek tertentu.
3. **Setiap angka dapat ditelusuri.** Sumber, tahun data, dan metodologi tampil di setiap angka, grafik, dan insight (Trust Layer).
4. **Warga dapat membuat kartu insight yang menarik dan berisi pengetahuan baru**, sehingga warga yang taat pajak menjadi corong penyebaran paJAK-Kita.
5. **Memenuhi tema lomba:** data publik diolah dan disajikan secara fungsional, dengan pelacakan anggaran terhadap realisasi.

## 3. Non-Goals

- **Pajak pusat (PPh, PPN, PPnBM).** Berada di luar cakupan karena masuk APBN; produk hanya mencakup pajak daerah yang bermuara ke APBD DKI Jakarta.
- **Verifikasi atau pembayaran pajak per warga.** Produk tidak menyimpan, menerima, atau memverifikasi data pembayaran pribadi.
- **Klaim hubungan langsung pajak ke proyek tertentu.** Data tidak mendukungnya, dan klaim seperti itu merusak kepercayaan.
- **Kartu berbasis nominal pajak pribadi.** Dibatalkan karena menimbulkan masalah privasi, verifikasi, dan perbedaan sifat antar jenis pajak.
- **Data real-time.** Data pemerintah dirilis dengan jeda; produk memposisikan diri sebagai penyaji sejarah perjalanan pajak dan APBD.
- **Subtema Civic Reporting dan Data-Driven Decision Support.** Bukan fokus versi ini.
- **Backend, database, dan akun pengguna [Usulan].** Versi lomba menyajikan data dari berkas statis hasil olahan dan tidak menyimpan data pengguna; ini menyederhanakan pengerjaan dan sejalan dengan janji privasi.

## 4. Pengguna dan User Stories

**Pengguna utama [Diputuskan]:** warga Jakarta yang sudah taat membayar pajak. **Pengguna sekunder:** penerima kartu yang dibagikan, yaitu warga lain yang mengenal paJAK-Kita lewat kartu.

**Warga taat pajak**
1. Sebagai warga Jakarta, saya ingin melihat total penerimaan tiap jenis pajak daerah dari waktu ke waktu agar saya tahu seberapa besar pajak daerah terkumpul.
2. Sebagai warga Jakarta, saya ingin memfilter penerimaan pajak berdasarkan wilayah agar saya melihat gambaran di sekitar tempat tinggal saya.
3. Sebagai warga Jakarta, saya ingin melihat anggaran dan realisasi belanja APBD per dinas agar saya tahu penggunaan anggaran daerah secara keseluruhan.
4. Sebagai warga Jakarta, saya ingin mengecek sumber, tahun, dan cara hitung setiap angka agar saya bisa memastikan angka itu bisa dipercaya.
5. Sebagai warga Jakarta, saya ingin membuat kartu dengan nama dan wilayah saya agar saya bisa membagikan pengetahuan baru tentang pajak daerah dengan cara yang menarik.

**Penerima kartu**
6. Sebagai penerima kartu, saya ingin menangkap satu fakta menarik dan tahu ke mana mencari selengkapnya agar saya tertarik membuka paJAK-Kita.

**Kasus tepi**
7. Sebagai warga, saya ingin diberi tahu dengan jelas jika data untuk wilayah, jenis pajak, atau tahun yang saya pilih tidak tersedia agar saya tidak salah mengira angka nol sebagai data.
8. Sebagai warga, saya ingin tahu bahwa data yang ditampilkan adalah data terakhir yang tersedia, bukan data hari ini, agar saya tidak salah membaca kondisi saat ini.

## 5. Requirements

### Must-Have (P0)

**R1 — Dashboard penerimaan pajak daerah [Diputuskan]** (dataset realisasi penerimaan pajak daerah: periode, bulan, wilayah, jenis pajak, realisasi)
- [ ] Menampilkan semua jenis pajak daerah yang ada di data, termasuk pajak transaksi (hiburan, parkir, reklame, dan sejenisnya) sebagai data umum
- [ ] Filter berdasarkan jenis pajak, wilayah, dan periode
- [ ] Nilai realisasi tampil dalam rupiah dengan format yang mudah dibaca (satuan dipastikan dari metadata dataset)
- [ ] Label wilayah ditulis "Jakarta Pusat", "Jakarta Barat", dan seterusnya; label "PUSAT" tidak pernah tampil sendiri
- [ ] Wilayah/jenis pajak/periode tanpa data menampilkan keterangan "data tidak tersedia", bukan angka 0

**R2 — Dashboard belanja APBD [Diputuskan]** (dataset realisasi dan target belanja daerah: tanggal, kode/nama OPD, akun jenis, anggaran, realisasi)
- [ ] Menampilkan anggaran dibandingkan realisasi per OPD dan per periode
- [ ] Setiap tampilan berlabel "belanja APBD Jakarta" dan tidak menyebut "dibiayai pajak Anda"
- [ ] Belanja ditampilkan se-Jakarta, bukan per wilayah, karena data hanya tersedia per OPD

**R3 — Pemisahan penerimaan dan belanja [Diputuskan]**
- [ ] Penerimaan pajak (Bagian A) dan belanja APBD (Bagian B) berada pada bagian yang jelas terpisah
- [ ] Di antara keduanya ada penjelasan: penerimaan pajak daerah adalah salah satu sumber pendapatan daerah, dan informasi belanja diberikan sebagai konteks penggunaan anggaran secara keseluruhan, bukan untuk menyatakan pajak tertentu membiayai proyek tertentu
- [ ] Tidak ada visual (panah, aliran, diagram sankey) yang menyiratkan aliran uang langsung dari jenis pajak ke program

**R4 — Trust Layer [Diputuskan]**
- [ ] Setiap angka, grafik, dan insight menampilkan sumber data, tahun data, dan definisi atau cara hitung
- [ ] Tahun data terakhir yang tersedia tampil mencolok di halaman
- [ ] Dataset berstatus sementara diberi label "sementara"
- [ ] Setiap angka bisa dilacak ke dataset asalnya

**R5 — Penerjemahan nama jenis pajak [Diputuskan]**
- [ ] Nama teknis jenis pajak di dataset dipetakan ke penjelasan bahasa awam (misalnya apa yang dikenai pajak dan siapa yang membayarnya)
- [ ] Pemetaan hanya memuat hal yang bisa dipastikan dari sumber resmi

**R6 — Pembuat kartu insight [Diputuskan]**
- [ ] Pengguna mengisi nama dan wilayah domisili (kota administrasi)
- [ ] Tiga pilihan template visual; ukuran tetap 3:4 vertikal
- [ ] Setiap kartu memuat: judul, beberapa insight (masing-masing 2–3 kalimat, dipilih acak dari bank insight), maskot paJAK-Kita, nama pengguna, ajakan kecil menuju paJAK-Kita, serta sumber dan tahun data
- [ ] Dekorasi bernuansa khas Jakarta/Betawi (misalnya batik) dengan pilihan penyesuaian yang terbatas
- [ ] Insight yang spesifik wilayah hanya berasal dari data penerimaan; insight belanja berlaku se-Jakarta dan ditulis demikian
- [ ] Kalimat wilayah memakai pola "pajak yang terkumpul di wilayah X" (tempat pemungutan), bukan "pajak warga X"
- [ ] Kartu tidak menyerupai dokumen atau bukti resmi pemerintah
- [ ] Penting elemen kartu (judul, insight, ajakan) berada di area tengah agar tetap terbaca bila dipotong platform

**R7 — Bank insight terverifikasi [Diputuskan]**
- [ ] Setiap insight memiliki angka yang dihitung dari dataset (bukan dikarang), sumber, dan tahun
- [ ] AI boleh membantu merumuskan redaksi, tetapi angka dan fakta divalidasi terhadap data sebelum masuk bank
- [ ] Kartu hanya memilih acak dari bank yang sudah terverifikasi
- [ ] Tidak ada insight yang menyatakan sebab-akibat yang tidak didukung data
- [ ] AI diberi pemahaman dan instruksi tentang data (skills) untuk merumuskan redaksi **[Diputuskan]**; namun pemeriksaan angka tidak hanya diserahkan ke AI: skrip pemeriksa otomatis menghitung ulang angka dari dataset dan membandingkannya dengan teks insight, dan insight yang tidak cocok ditolak **[Usulan]**

**R8 — Privasi data kartu [Usulan]**
- [ ] Nama dan wilayah diproses di sisi pengguna, tanpa login, dan tidak disimpan di server
- [ ] Pernyataan privasi singkat tercantum di halaman pembuat kartu

**R9 — Kesiapan data sebelum dipakai [Usulan]**
- [ ] Setiap dataset yang dipakai dicatat: penerbit, periode dan granularitas, kelengkapan bulan, definisi tiap kolom, konsistensi nama kategori, tanggal pembaruan, cara hitung, dan keterbatasan
- [ ] Fokus awal pada dua dataset inti (penerimaan pajak daerah dan realisasi belanja daerah)
- [ ] Dataset dinyatakan siap mendukung filter, grafik, dan perbandingan yang direncanakan **[Diputuskan]**; anggota tim yang menangani data mengolahnya menjadi format siap pakai. Pertanyaan data pada bagian Open Questions tetap dijawab oleh pengolah data saat pemrosesan

**R10 — Informasi kontekstual pada dashboard [Diputuskan]**
- [ ] Setiap grafik dan angka kunci dapat diklik atau diketuk untuk memunculkan panel berisi penjelasan bahasa awam dan insight terkait
- [ ] Panel menampilkan sumber dan tahun data yang sama dengan Trust Layer
- [ ] Interaksi berfungsi pada layar sentuh (tidak bergantung pada hover)
- [ ] Isi panel tidak memuat klaim sebab-akibat yang tidak didukung data

### Nice-to-Have (P1)

- **Tren lintas tahun** untuk penerimaan pajak (rentang sekitar 2020 sampai tahun terakhir yang tersedia). Syarat: nama dan cakupan jenis pajak konsisten antar tahun, dan periode pandemi diberi anotasi.
- **Indikator kinerja APBD** (persentase pengelolaan pelaksanaan APBD, persentase akurasi dokumen APBD) sebagai angka pendamping di Trust Layer.
- **Rupiah tracker berbentuk peta** dari data kegiatan konstruksi. Syarat: status pembiayaan (APBD atau non-APBD) terkonfirmasi, dan ditentukan apakah ada nilai kontrak.

### Future Considerations (P2)

- Dataset tambahan yang sudah ditemukan dan belum dicatat.
- File transparansi anggaran yang masih berbentuk dokumen (memerlukan pengolahan menjadi data terstruktur).
- Dataset teks kebijakan dan proyeksi PAD sebagai konteks narasi, dengan label "sementara".
- Template kartu tambahan dan opsi penyesuaian yang lebih kaya.
- Insight belanja yang lebih rinci bila ditemukan data per wilayah atau per program.

## 6. Tech Stack dan Arsitektur

**Status: seluruhnya [Usulan]**, disusun dari kebutuhan produk dan keahlian yang sudah ada (React, TypeScript, Tailwind CSS, Python). Keputusan akhir dibahas bersama tim.

Arsitektur mengikuti empat prinsip. Pertama, **statis dulu**: tidak ada backend; data diolah sebelumnya menjadi berkas JSON yang dibaca dashboard. Kedua, **semua hitungan dikerjakan sebelum runtime**, sehingga angka yang tampil sudah diperiksa. Ketiga, **kartu dibuat di browser pengguna**, sehingga nama dan wilayah tidak pernah meninggalkan perangkat. Keempat, **tidak ada panggilan AI saat runtime**; AI hanya dipakai saat menyusun bank insight, sehingga kartu tidak bisa menampilkan angka karangan.

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Pengolahan data | Python (pandas) | Membersihkan dataset, mengagregasi per jenis pajak, wilayah, OPD, tahun, dan bulan, lalu menghasilkan JSON beserta metadata. Ini pekerjaan tim yang menangani data. |
| Format data | Berkas JSON statis di folder `public/data`, dipecah per dataset dan tahun, ditambah satu berkas metadata (sumber, tanggal pengambilan, tahun terbaru) | Dashboard cepat tanpa server, dan metadata langsung dipakai Trust Layer. Dataset belanja yang besar dipra-agregasi dan dimuat per tahun. |
| Dashboard (UI) | React 18 + Vite, bahasa TypeScript | Komponen dan state filter mudah dikelola. Vite ringan untuk situs tanpa kebutuhan SSR. Alternatif: Next.js dengan static export bila tim lebih terbiasa. |
| Styling | Tailwind CSS dengan token warna dan font lewat CSS variables | Font dan palet warna belum diputuskan; dengan token, keputusan itu bisa diganti tanpa mengubah komponen. |
| Grafik | Recharts (alternatif: Apache ECharts) | Terintegrasi dengan React, cukup untuk bar, line, dan komposisi, serta mendukung klik untuk membuka panel informasi (R10). Untuk peta (P1) memakai Leaflet. |
| Panel informasi | Satu komponen popover/panel yang dipakai semua grafik, isi diambil dari berkas definisi dan insight | Konsistensi tampilan dan satu tempat untuk menjaga isi tetap benar. |
| Kartu insight | Komponen React (HTML dan CSS) berukuran 3:4, diekspor ke PNG di browser dengan `html-to-image` (alternatif: Canvas atau SVG), misalnya 1080 × 1440 piksel | Tanpa server dan tanpa unggahan data. Template mudah dirancang dengan HTML/CSS. |
| Template kartu | Satu komponen layout dengan tiga set token (warna, dekorasi Betawi/batik, pose maskot) | Tiga tampilan tanpa tiga layout terpisah, sehingga lebih murah dibuat dan dijaga. |
| Font pada kartu | Dimuat dari berkas sendiri (self-hosted) | Font eksternal sering gagal ikut tereksport ke gambar. |
| Berbagi kartu | Tombol unduh PNG, ditambah Web Share API di ponsel dengan cadangan unduh | Tujuan produk adalah penyebaran lewat media sosial dan pesan. |
| Bank insight | Berkas JSON yang dihasilkan skrip Python (angka dihitung dari data), redaksi dibantu AI, lalu diverifikasi; pemilihan acak dilakukan di sisi klien | Menjaga insight akurat dan konsisten untuk pengguna yang sama. |
| Validasi insight | Skrip Python pemeriksa: tiap insight menyimpan rujukan dataset dan filter, skrip menghitung ulang angka lalu membandingkannya dengan teks | Menjadi jaminan akurasi yang bisa dijelaskan di Trust Layer. |
| Hosting dan repositori | Hosting statis (Vercel, Netlify, atau GitHub Pages) dan GitHub | Gratis, penerapan langsung dari repositori, dan tanpa konfigurasi server. |

Contoh bentuk satu entri bank insight (nilai dalam kurung siku adalah placeholder, bukan data):

```json
{
  "id": "ins-[nomor]",
  "wilayah": "Jakarta Barat",
  "jenis_pajak": "[jenis pajak]",
  "tahun": [tahun data],
  "kueri": { "dataset": "[id dataset]", "filter": { "wilayah": "BARAT", "jenis_pajak": "[jenis pajak]", "tahun": [tahun data] } },
  "angka": "[hasil hitung dari kueri]",
  "teks": "[2-3 kalimat redaksi, memuat angka di atas]",
  "sumber": "satudatajakarta.go.id",
  "diverifikasi": true
}
```

**Belum diputuskan (dibahas bersama tim):** font, palet warna, dan informasi desain situs lainnya. Karena styling memakai token, keputusan ini tidak menghambat pengembangan komponen.

---

## 7. Success Metrics

Produk ini dibangun untuk lomba, belum diluncurkan ke warga, sehingga ukuran keberhasilan awal berupa standar kualitas yang bisa diperiksa. Target adopsi belum ditetapkan karena belum ada data dasar.

**Leading (dapat diverifikasi saat demo atau review):**
- 100% angka, grafik, dan insight menampilkan sumber dan tahun data
- 100% insight di bank sudah dicocokkan dengan data aslinya
- 0 kalimat yang menyiratkan hubungan langsung pajak tertentu ke proyek tertentu (diperiksa dengan daftar tilik pada seluruh teks)
- Alur pembuatan kartu (nama, wilayah, template, hasil) selesai tanpa kesalahan untuk setiap wilayah yang datanya tersedia

**Lagging (jika produk diuji kepada warga setelah lomba) [Usulan]:**
- Proporsi pengguna yang membagikan kartu setelah membuatnya
- Proporsi penerima kartu yang membuka paJAK-Kita
- Kemampuan penguji menjawab dengan benar dari mana pajak daerah terkumpul setelah memakai produk

Target angka untuk metrik lagging ditentukan setelah ada pengujian awal dengan pengguna.

## 8. Open Questions

**Blocking (perlu dijawab sebelum pengembangan fitur terkait):**
- **[Data]** Jenis pajak apa saja yang ada di dataset penerimaan, dan apakah penamaan serta cakupannya konsisten dari 2020 hingga tahun terakhir (mengingat kemungkinan perubahan klasifikasi pajak daerah)?
- **[Data]** Apakah nilai realisasi per bulan atau kumulatif, dan apa satuannya secara resmi? Keterangan periode dataset menyebut satu tahun sekali padahal ada kolom bulan.
- **[Data]** Tahun apa saja yang benar-benar tersedia per dataset? Sebagian besar data yang ditemukan berasal dari 2023.
- **[Data]** Apakah seluruh wilayah, termasuk Jakarta Utara dan Kepulauan Seribu, ada di data penerimaan?
- **[Desain]** Berapa jumlah insight per kartu (2–3), dan seperti apa ketiga template visual serta ajakan kecilnya?

**Non-blocking:**
- **[Data]** Dataset konstruksi: apakah dibiayai APBD atau non-APBD (judul dan deskripsi bertentangan), dan adakah nilai kontrak?
- **[Data/Legal]** Apa ketentuan penggunaan ulang dan atribusi untuk data satudatajakarta.go.id?
- **[Desain]** Bagaimana layout 3:4 tampil di format story (9:16) dan platform lain?
- **[Desain]** Apakah aset maskot dan motif Betawi/batik dibuat orisinal atau memakai sumber berlisensi?
- **[Desain/Tim]** Font, palet warna, dan informasi desain situs lainnya: dibahas bersama tim.
- **[Tim]** Pembagian tugas dan jadwal pengerjaan: ditentukan oleh ketua tim.

## 9. Timeline Considerations

Waktu pengerjaan yang tersedia sekitar **2 minggu** **[Diputuskan]**. Pembagian tugas, detail fitur per anggota, dan jadwal belum ditetapkan; akan ditentukan oleh ketua tim dan PRD ini diperbarui setelahnya.