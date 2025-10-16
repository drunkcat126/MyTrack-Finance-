MyTrack adalah aplikasi web pelacak keuangan pribadi (Personal Finance Tracker) yang dirancang untuk membantu pengguna memantau pemasukan, pengeluaran, dan target keuangan mereka dengan antarmuka yang intuitif dan visualisasi data yang informatif. 
Dibangun menggunakan HTML, CSS, dan JavaScript murni (Vanilla JS) serta Chart.js untuk visualisasi data, MyTrack menawarkan solusi yang ringan dan responsif untuk manajemen keuangan sehari-hari.

MyTrack dilengkapi dengan serangkaian fitur lengkap untuk manajemen keuangan yang efektif:

1. Dashboard Ringkas dan Informatif
-Ringkasan Keuangan: Menampilkan Total Saldo, Total Pemasukan, dan Total Pengeluaran secara real-time dalam bentuk kartu (card) yang mudah dibaca.
-Transaksi Terakhir: Menyajikan 5 transaksi terbaru untuk memantau aktivitas terkini secara sekilas.
-Grafik Bulanan Interaktif: Visualisasi data menggunakan Chart.js untuk menampilkan perbandingan antara pemasukan dan pengeluaran setiap bulan dalam setahun (Bar Chart).
-Rekomendasi Cerdas: Memberikan saran keuangan yang dipersonalisasi berdasarkan rasio tabungan, kategori pengeluaran dominan, dan progres pencapaian target.

2. Manajemen Data Utama
-Manajemen Transaksi:
-Tambah/Edit/Hapus Transaksi: Pengguna dapat mencatat transaksi Pemasukan (income) atau Pengeluaran (expense), lengkap dengan jumlah, tanggal, kategori, dan deskripsi.
-Tabel Transaksi Lengkap: Menyajikan daftar transaksi secara terperinci, disortir berdasarkan tanggal terbaru.

3. Manajemen Kategori:

-Pengguna dapat menambah kategori baru untuk Pemasukan (misalnya: Gaji, Hadiah) atau Pengeluaran (misalnya: Makanan, Hiburan).
-Terdapat validasi yang mencegah penghapusan kategori yang sudah digunakan dalam transaksi, menjamin integritas data.
-Target Keuangan (Milestones):
-Penetapan Target: Memungkinkan pengguna menetapkan target tabungan spesifik (misalnya: Beli Motor, Liburan) dengan target jumlah dan tanggal tertentu.
-Pelacakan Progres: Secara otomatis menghitung dan menampilkan progres (%) pencapaian target berdasarkan saldo saat ini, serta memvisualisasikannya dengan progress bar yang dinamis.

4. Laporan dan Analisis Mendalam
-Jenis Laporan: Pengguna dapat memilih laporan Bulanan (Garis) atau Berdasarkan Kategori (Pie Chart).
-Visualisasi Laporan: Menyajikan grafik yang detail:
-Laporan Bulanan menggunakan Line Chart untuk melihat tren dari waktu ke waktu.
-Laporan Kategori menggunakan Pie Chart untuk melihat alokasi dana secara proporsional.
-Ringkasan Laporan: Menyediakan ringkasan teks terperinci di samping grafik, termasuk total, saldo bersih, dan bulan/kategori pengeluaran/pemasukan tertinggi.
-Fungsi Export PDF: Memungkinkan pengguna untuk mengekspor laporan (grafik dan ringkasan) ke dalam format PDF menggunakan jsPDF, ideal untuk dokumentasi atau berbagi.

5. Pengalaman Pengguna (UX)
-Dukungan Mode Gelap/Terang: Memiliki theme switcher untuk beralih antara Mode Terang dan Mode Gelap demi kenyamanan visual. Preferensi tema disimpan di Local Storage.
-Penyimpanan Lokal: Semua data (transaksi, kategori, target) disimpan di Local Storage browser, memastikan data tetap ada bahkan setelah pengguna menutup aplikasi.
-Desain Responsif: Antarmuka dioptimalkan untuk tampilan desktop, tablet, dan mobile.
