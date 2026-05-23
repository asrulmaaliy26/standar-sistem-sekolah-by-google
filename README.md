# EduSmart (LPI Al Hidayah) - Sistem Akademik Terintegrasi Google

Proyek ini adalah sistem informasi manajemen sekolah berbasis **Laravel** dan **React (Inertia.js)** yang terintegrasi secara langsung dengan akun Google menggunakan OAuth 2.0. Sistem ini mengatur login pengguna, manajemen peran (*Role-based Access Control*), dan berbagai fungsionalitas kalender sekolah.

## 🚀 Fitur Utama
- **Autentikasi Google**: Login cepat dan aman melalui Single Sign-On (SSO) Google.
- **Role-Based Access Control (RBAC)**: Pembatasan akses untuk tipe akun *Superadmin*, *Guru*, dan *Murid*.
- **Kalender Kegiatan**: Sistem penjadwalan akademik yang terpusat.
- **Frontend Interaktif**: Antarmuka dinamis dan responsif dibangun dengan React, Tailwind CSS, dan Vite.
- **Pengarsipan & Dokumen**: Mendukung unggah (*upload*) dan tautan kelas.

## 🛠️ Persyaratan Sistem
Sebelum menjalankan proyek ini, pastikan sistem Anda telah menginstal:
- **PHP** >= 8.1
- **Composer** (untuk dependensi PHP)
- **Node.js** & **npm** (untuk dependensi JavaScript/Frontend)
- **MySQL** / MariaDB

## 📦 Panduan Instalasi & Setup

### 1. Kloning Repositori
```bash
git clone <url-repositori-anda>
cd laravel-google-auth
```

### 2. Instal Dependensi
Jalankan perintah berikut untuk menginstal dependensi backend dan frontend:
```bash
composer install
npm install
```

### 3. Konfigurasi Environment (`.env`)
Salin file `.env.example` menjadi `.env` (jika belum ada, buat file `.env` baru dengan mengacu ke template).
```bash
cp .env.example .env
```
Sesuaikan konfigurasi koneksi database:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nama_database_anda
DB_USERNAME=root
DB_PASSWORD=
```
Sesuaikan juga konfigurasi kunci Google API untuk OAuth (dapatkan dari [Google Cloud Console](https://console.cloud.google.com/)):
```env
GOOGLE_CLIENT_ID=client_id_google_anda.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=client_secret_anda
GOOGLE_REDIRECT_URL=http://127.0.0.1:8000/auth/google/callback
```
*(Catatan: Pastikan URI redirect pada Console Google sama persis dengan `GOOGLE_REDIRECT_URL` Anda)*

Konfigurasi pengiriman email (SMTP) untuk notifikasi/pengingat:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=email_sekolah_anda@gmail.com
MAIL_PASSWORD=app_password_anda
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=email_sekolah_anda@gmail.com
MAIL_FROM_NAME="${APP_NAME}"
```
*(Disarankan menggunakan **App Password** dari akun Google Anda alih-alih password utama email)*

Generate Application Key Laravel:
```bash
php artisan key:generate
```

### 4. Setup Database
Jalankan migrasi database beserta data awal (seeder):
```bash
php artisan migrate --seed
```
*Seeder otomatis akan membuat role dasar seperti `superadmin`, `guru`, `murid`, dll.*

### 5. Setup Storage
Tautkan folder *storage* agar file yang diunggah (seperti lampiran kalender) dapat diakses publik:
```bash
php artisan storage:link
```

### 6. Menjalankan Server Development
Anda perlu menjalankan server backend (Laravel) dan server frontend (Vite) secara bersamaan. Buka dua terminal berbeda:

**Terminal 1 (Backend):**
```bash
php artisan serve
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```
*(Untuk keperluan server produksi, gunakan `npm run build` alih-alih `npm run dev`)*

Situs dapat diakses pada browser melalui URL: `http://localhost:8000` (atau sesuai konfigurasi `php artisan serve` Anda).

## 👑 Mengelola Akses Superadmin
Sistem ini menggunakan struktur peran khusus di mana konfigurasi sistem utama dipegang oleh `superadmin`.

Jika Anda ingin menjadikan sebuah email (yang sudah terdaftar) sebagai superadmin, gunakan perintah *console* Artisan yang telah disediakan:

```bash
php artisan make:admin email_anda@gmail.com
```

Untuk menghapus peran *superadmin* dari sebuah akun:
```bash
php artisan make:admin email_anda@gmail.com --remove
```

## 📝 Catatan Penting
1. **Scopes OAuth Google**: Karena sistem ini menggunakan fitur **Pengarsipan ke Google Drive**, pastikan Anda telah mengaktifkan **Google Drive API** di Google Cloud Console. Pada halaman *OAuth Consent Screen*, tambahkan scope untuk Google Drive (seperti `.../auth/drive.file`).
2. **Setup Drive Master**: Setelah menunjuk akun email sebagai `superadmin` lewat command `make:admin`, **Anda wajib melakukan login** dengan akun Google tersebut. Sistem akan menyimpan `google_refresh_token` dari akun `superadmin` tersebut yang nantinya digunakan sebagai "*Drive Master*" (media penyimpanan utama seluruh file arsip sistem).
3. **Pendaftaran User Baru**: Saat pertama kali login melalui Google, akun akan didaftarkan sebagai `user` biasa jika tidak ada konfigurasi spesifik. Administrator (*superadmin*) perlu menyesuaikan peran pengguna melalui dashboard **Manajemen User**.
4. **Penyimpanan Lokal**: File dokumen/lampiran pada *Kalender Kegiatan* disimpan secara lokal di dalam `storage/app/public/calendar_files/`.
