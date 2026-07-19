# Food Recognizer 🍽️✨
> **Aplikasi Web Pintar Pendeteksi Makanan, Informasi Gizi & Resep Kuliner Berbasis Kecerdasan Buatan (Google Gemini API & TheMealDB API).**

Aplikasi web modern full-stack yang tangguh dengan performa tinggi yang dirancang khusus untuk mengidentifikasi hidangan makanan dari kamera atau galeri, mendeteksi kandungan gizi lengkap secara akurat melalui integrasi **Google Gemini API**, dan menyajikan resep kuliner yang dipasok langsung dari **TheMealDB API**. 

Aplikasi ini di-rewrite secara penuh dari Android (Kotlin/Jetpack Compose) menjadi **React + Vite + Express** dengan penyimpanan lokal berbasis **LocalStorage** sehingga seluruh riwayat pemindaian tersimpan aman secara luring (*offline*) pada browser perangkat pengguna.

---

## 🎨 Spesifikasi Teknis & Arsitektur Sistem

Sistem aplikasi ini dibangun dengan standard industri terbaru web menggunakan teknologi berkinerja tinggi:

| Komponen | Spesifikasi & Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite | Kecepatan render yang tinggi, bundler modern, dan HMR instan. |
| **Backend** | Express.js, TypeScript | Menyediakan proxy aman server-side untuk berkomunikasi dengan Google Gemini API tanpa mengekspos kunci API ke browser. |
| **Desain & Styling** | Tailwind CSS v4, Lucide Icons | Desain antarmuka modern yang bersih, responsif, dan elegan dengan animasi lancar. |
| **Animasi** | motion/react | Transisi antar layar yang elegan dan interaktif. |
| **Konektivitas AI** | @google/genai SDK | Menggunakan model `gemini-3.5-flash` server-side untuk analisis gambar dan ekstraksi nutrisi instan. |
| **Resep Makanan** | TheMealDB API | Mengintegrasikan database resep kuliner global secara dinamis berdasarkan nama hidangan yang diidentifikasi. |
| **Penyimpanan Lokal** | Browser LocalStorage | Riwayat hasil pemindaian tersimpan aman secara persisten pada browser pengguna. |

---

## 🔑 Konfigurasi Kunci API (Google Gemini)

Untuk menjaga keamanan, kunci API disimpan secara aman di sisi server menggunakan variabel lingkungan.

### Langkah-langkah Pengaturan Kunci API:
1. Buat file `.env` di direktori utama (workspace root).
2. Tambahkan kunci API Anda:
   ```env
   GEMINI_API_KEY=KUNCI_API_GEMINI_ANDA
   ```
3. **Mekanisme Fallback Cerdas**: Apabila kunci API tidak dikonfigurasi, sistem secara otomatis akan mengaktifkan **Simulator Nutrisi Luring** berdasarkan kamus pencarian kata kunci nama makanan agar fungsionalitas visualisasi aplikasi tetap berjalan maksimal.

---

## 🚀 Panduan Penggunaan Aplikasi

1. **Memulai Pemindaian**:
   * Ketuk tombol **📸 Kamera** atau **Identifikasi Real-Time** untuk membuka webcam stream secara langsung dan menangkap foto makanan di tengah bingkai crosshair.
   * Ketuk tombol **🖼️ Galeri** atau seret & jatuhkan (*drag and drop*) file gambar langsung ke kartu pengunggah.
2. **Menampilkan Hasil**:
   * Aplikasi akan menampilkan layar loading dengan animasi status interaktif.
   * Setelah analisis selesai, Anda akan disajikan rincian kandungan nutrisi lengkap (Kalori, Protein, Karbohidrat, Lemak, dan Serat) serta informasi resep masakan referensi di bagian bawah.
3. **Membuka Riwayat**:
   * Di layar utama, Anda dapat melihat daftar riwayat pemindaian terdahulu secara luring lengkap dengan akurasi, waktu pemindaian, dan ringkasan makronutrisi.
   * Ketuk salah satu kartu riwayat untuk kembali membuka layar rincian penuh.
   * Anda bisa menghapus item riwayat tertentu dengan menekan tombol **Hapus [🗑️]**, atau membersihkan seluruh riwayat dengan tombol **Hapus Semua Riwayat** di bar atas.

---

## 💻 Cara Menjalankan Aplikasi

1. Pastikan Anda telah menginstal **Node.js** (v18 atau yang lebih tinggi).
2. Instal semua dependensi:
   ```bash
   npm install
   ```
3. Jalankan server dalam mode pengembangan:
   ```bash
   npm run dev
   ```
   *Aplikasi dapat diakses di http://localhost:3000.*

4. Bangun aplikasi untuk produksi:
   ```bash
   npm run build
   ```
5. Jalankan server produksi:
   ```bash
   npm start
   ```

---
*Dibuat dengan penuh dedikasi untuk menghadirkan solusi teknologi pangan berbasis kecerdasan buatan yang ramah guna dan bernilai tinggi.*
