# Panduan Lengkap dan Detail: Otomatisasi Deploy (CI/CD) Menggunakan GitHub Actions

Dokumen ini adalah panduan teknis mendalam tentang bagaimana mengubah alur kerja (workflow) pengembangan website React dari yang awalnya dilakukan secara **manual** (meng-upload via FTP/Webuzo) menjadi sepenuhnya **otomatis** menggunakan **GitHub Actions**.

Pendekatan ini sering disebut sebagai *Continuous Integration / Continuous Deployment (CI/CD)*.

---

## 📚 1. Mengapa Kita Harus Pindah ke GitHub Actions?

### ❌ Masalah pada Deploy Manual (Cara Lama)
Pada proyek sebelumnya, ketika Anda ingin memperbarui website:
1. Anda mengetik `npm run build` di terminal laptop Anda. Menunggu proses build memakan waktu dan resource komputer Anda.
2. Anda harus membuka FileZilla, WinSCP, atau File Manager di panel hosting (cPanel/Webuzo).
3. Anda harus menghapus file lama di server satu per satu.
4. Meng-upload isi folder `dist` secara manual. Jika internet Anda lambat, ini bisa memakan waktu lama.
5. Anda harus memperbaiki *file permissions* (gembok) secara manual di server.
**Risiko:** Rawan *human error* (ada file yang terlewat), sangat merepotkan jika sehari harus *deploy* 10 kali, dan developer lain di tim Anda harus diberi password server untuk bisa melakukan deploy.

### ✅ Keuntungan GitHub Actions (Cara Baru)
1. **Otomatis:** Anda hanya perlu melakukan `git push origin main`. Sisanya dikerjakan oleh robot/server GitHub.
2. **Aman:** Kredensial server (IP dan Password/SSH Key) disimpan rahasia di GitHub. Anda tidak perlu membagikan password VPS ke developer lain. Mereka cukup menekan *push* ke repository.
3. **Standar & Konsisten:** Setiap build menggunakan lingkungan mesin virtual bersih (Ubuntu) di server GitHub, jadi tidak akan ada masalah *"di laptop saya jalan, kok di server error"*.
4. **Jejak Audit:** Anda bisa melihat riwayat (log) deploy dengan jelas. Jika gagal, GitHub akan memberi tahu Anda di baris ke berapa kegagalan itu terjadi.

---

## 🛠️ 2. Persiapan Sebelum Menggunakan GitHub Actions

Sebelum script berjalan, ada dua sisi yang harus dikonfigurasi: **Sisi Server (VPS)** dan **Sisi GitHub**.

### A. Sisi Server (VPS / Hosting)
GitHub Actions menggunakan protokol **SSH (Secure Shell) / SCP (Secure Copy)** untuk mengirim file ke server Anda. 
1. Pastikan VPS Anda memiliki IP Publik.
2. Pastikan layanan SSH berjalan (biasanya di Port `22`).
3. **Penting:** Pastikan Firewall di VPS Anda (seperti `firewalld` pada AlmaLinux, atau *Security Group* di dashboard provider VPS) mengizinkan koneksi masuk (*Inbound*) di port 22 dari semua IP (`0.0.0.0/0`). Jika diblokir, GitHub Actions akan mengalami *Timeout*.

### B. Sisi GitHub (Mengatur Secrets)
Agar script GitHub bisa masuk ke server tanpa menuliskan IP dan Password secara terang-terangan di kode, kita menggunakan fitur **Secrets**.
1. Buka Repository Anda di browser (GitHub.com).
2. Klik tab **Settings** (Pengaturan).
3. Di menu sebelah kiri, cari dan klik **Secrets and variables**, lalu klik **Actions**.
4. Klik tombol hijau **New repository secret**.
5. Buat dua rahasia (*secret*) berikut:
   - **Name:** `VPS_HOST`
     - **Secret:** Masukkan IP Address IPv4 VPS Anda (contoh: `103.123.45.67`). Jangan gunakan IPv6 (seperti `2a02:...`) kecuali server dan runner sangat mendukungnya.
   - **Name:** `VPS_SSH_KEY`
     - **Secret:** Masukkan *Private Key* SSH dari VPS Anda, atau jika menggunakan password, Anda bisa mengganti konfigurasinya menjadi `password` (walaupun SSH Key lebih disarankan untuk keamanan).

---

## 📝 3. Bedah File `deploy.yml` Baris per Baris

File yang mengendalikan semua ini berada di dalam folder `.github/workflows/deploy.yml`. Berikut adalah penjelasan baris per barisnya:

```yaml
name: 🚀 Auto Deploy - staialmannan.ac.id
```
Ini adalah nama *workflow* yang akan muncul di tab "Actions" pada GitHub.

```yaml
on:
  push:
    branches:
      - main
  workflow_dispatch:
```
**`on:`** menentukan *kapan* script ini dijalankan. 
- `push: branches: - main` : Script akan otomatis jalan begitu ada kode yang di-push atau di-merge ke branch `main`.
- `workflow_dispatch` : Memunculkan tombol "Run workflow" di GitHub agar Anda bisa memicu deploy secara manual melalui tombol di website.

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
```
Menyuruh GitHub untuk meminjamkan kita sebuah komputer virtual dengan sistem operasi Ubuntu versi terbaru untuk menjalankan proses ini.

```yaml
      - name: 🟢 Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
```
Karena ini proyek React (Node.js), kita menyuruh komputer virtual GitHub tersebut untuk menginstall Node.js versi 20. Fitur `cache: "npm"` berfungsi mempercepat instalasi untuk proses deploy berikutnya dengan menyimpan cache *node_modules*.

```yaml
      - name: 📦 Install Dependencies
        run: npm ci

      - name: 🏗️ Build Project
        run: npm run build
```
Komputer virtual GitHub kini mengunduh *library* (`npm ci`) dan mem-build project Anda menjadi file statis siap rilis (`npm run build`). Hasil *build* ini akan disimpan di folder `dist/`.

```yaml
      - name: 📤 Upload dist/ ke VPS
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.VPS_HOST }}
          username: root
          key: ${{ secrets.VPS_SSH_KEY }}
          port: 22
          source: "dist/*"
          target: "/home/staialmannan/staialmannan.ac.id"
          strip_components: 1
```
Bagian paling krusial. Kita menggunakan plugin pihak ketiga bernama `scp-action`.
- `host`, `username`, `key`: Mengambil dari pengaturan rahasia (Secrets) yang Anda buat sebelumnya.
- `port`: Port default SSH. Jika VPS Anda pakai custom port (misal 2222), ubah ini.
- `source`: Mengambil semua file yang ada di dalam folder `dist/`.
- `target`: Lokasi akhir (*DocumentRoot*) website Anda di server VPS.
- `strip_components: 1`: Ini trik penting agar yang dikirim hanya **isi** dari foldernya, bukan foldernya itu sendiri. (Sehingga jadinya `target/index.html`, bukan `target/dist/index.html`).

```yaml
      - name: ♻️ Reload Apache di VPS
        uses: appleboy/ssh-action@v1.0.3
        with:
          ...
          script: |
            chown -R staialmannan:staialmannan /home/staialmannan/staialmannan.ac.id
            rm -f /home/staialmannan/staialmannan.ac.id/default.html
            /usr/local/apps/apache2/bin/apachectl graceful
```
Plugin ini bertindak seolah-olah Anda mengetik di terminal VPS secara otomatis setelah file berhasil ditransfer.
- `chown`: Karena file di-upload menggunakan user `root` (lewat SSH Key server), kita harus mengembalikan kepemilikannya (Ownership) ke *user* lokal hosting panel (`staialmannan`) agar file bisa dibaca dengan normal oleh web server tanpa error "Forbidden".
- `rm -f default.html`: Menghapus file *placeholder* bawaan Webuzo/cPanel agar tidak bentrok dengan `index.html` React.
- `apachectl graceful`: Merestart web server (Apache) tanpa memutus koneksi pengunjung yang sedang aktif, guna memastikan web langsung memuat versi terbaru tanpa nyangkut di *cache* server lama.

---

## 🐛 4. Pemecahan Masalah Umum (Troubleshooting)

1. **Error: `dial tcp ***:22: i/o timeout`**
   * **Penyebab:** GitHub tidak bisa menghubungi VPS Anda di port 22.
   * **Solusi:** Pastikan IP di `VPS_HOST` benar (gunakan angka **IPv4**, hindari IPv6 seperti *2a02:..*), cek apakah port SSH sudah benar, dan pastikan **Firewall OS** maupun **Firewall Provider** tidak memblokir koneksi port 22 dari publik.

2. **Halaman Blank atau Tampil Halaman Default Webuzo**
   * **Penyebab:** Ada file `default.html` atau `index.php` bawaan panel hosting yang posisinya berada bersamaan dengan `index.html` React Anda. Server memprioritaskan file default tersebut.
   * **Solusi:** Pastikan skrip hapus (contoh: `rm -f /lokasi/target/default.html`) masih ada di bagian `script:` pada SSH action.

3. **Error Permission Denied (Forbidden 403 di Website)**
   * **Penyebab:** File di server Anda ter-lock oleh user `root`, sedangkan web server (Apache/Nginx) mencoba mengaksesnya menggunakan user lain (misal `staialmannan` atau `www-data`).
   * **Solusi:** Pastikan perintah `chown -R userAnda:groupAnda /folder/target` dijalankan dengan benar pada file `deploy.yml`.

---

## 🎯 5. Cara Menerapkan Alur Ini di Proyek Lain (Langkah Cepat)

Jika Anda membuat proyek web baru (misal: *pmb.staialmannan.ac.id*), lakukan langkah-langkah ini agar proyek tersebut juga ter-deploy otomatis:
1. *Copy-paste* folder `.github` (beserta isinya) dari proyek ini ke direktori utama (root) proyek baru Anda.
2. Buka file `.github/workflows/deploy.yml` di proyek baru tersebut. **Wajib ubah bagian `target:`** dengan *path* folder yang baru di server (misal: `/home/staialmannan/pmb.staialmannan.ac.id`).
3. Sesuaikan juga *path* folder dan nama *user* pada bagian perintah `chown` dan `rm -f`.
4. Buka halaman repository GitHub proyek baru tersebut. Masuk ke **Settings > Secrets and variables > Actions**.
5. Buat rahasia `VPS_HOST` dan `VPS_SSH_KEY` persis seperti yang ada di proyek lama.
6. Lakukan `git commit` dan `git push origin main`. GitHub Actions akan langsung mengotomatisasi proyek baru Anda!
