# UI, Sidebar, and Layout Rules

## 1. Aturan Layout & Pencegahan Sidebar Tumpang Tindih (No Content Overlap)
- **Struktur Flexbox & Sidebar**:
  - Komponen Desktop Sidebar (`<Sidebar />` di `resources/js/components/ui/sidebar.tsx`) menggunakan container flex dengan posisi `fixed` untuk navigasi dan elemen `spacer` untuk mendorong konten utama.
  - Wrapper Desktop Sidebar dan elemen spacer **HARUS SELALU** memiliki class `shrink-0` dan `min-w-(--sidebar-width)` agar engine CSS flexbox browser tidak pernah mengecilkan/mengompresi lebar sidebar menjadi 0 ketika terdapat konten lebar (seperti tabel atau kartu).
  - Elemen `SidebarInset` **HARUS** memiliki `min-w-0 max-w-full flex-1 flex-col overflow-x-hidden`.
  - Root `html` dan `body` di `app.css` **HARUS** memiliki `overflow-x: hidden` dan `max-width: 100vw` agar halaman browser tidak pernah memiliki scrollbar horizontal (*page horizontal scroll* / bergeser ke kanan).

## 2. Penyesuaian Breakpoint dengan Sidebar Aktif (Content Area = Viewport - 256px)
- Karena sidebar desktop mengambil ruang selebar 256px (`16rem`), area konten pada viewport 1024px hanya tersisa ~768px.
- **Grid 4 Kolom (Statistik / Filter)**:
  - Selalu gunakan `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` (BUKAN `lg:grid-cols-4`). Hal ini memastikan pada resolusi layar 768px–1279px (seperti split-screen atau tablet), kartu tersusun rapi 2 kolom tanpa ada kartu atau filter yang terpotong ke kanan.
- **Hero Banner & Header Aksi**:
  - Selalu gunakan `flex-col xl:flex-row xl:items-center justify-between gap-6`.
  - Tombol aksi wajib memiliki `shrink-0 self-start xl:self-auto` agar tombol tidak terdorong keluar layar atau terpotong.
- **Tabel Responsif Tanpa Scroll Layar (No Horizontal Page Scroll)**:
  - Dilarang keras menggunakan `min-w-[700px]` atau `min-w-[800px]` pada tabel yang memaksa seluruh halaman melebar dan harus digeser ke kanan.
  - Gunakan `w-full text-left text-sm` dengan teknik *responsive column visibility*:
    - Kolom sekunder (seperti Ustadz Penilai, Catatan tambahan) wajib menggunakan `hidden xl:table-cell` atau `hidden lg:table-cell`.
    - 4-5 kolom esensial (Tanggal, Santri, Materi, Status/Nilai, Aksi) tetap tampil ringkas sehingga seluruh tabel muat 100% pas di layar tanpa perlu digeser ke kanan.

## 3. Padding & Breakpoint Standar
- Setiap halaman aplikasi yang dibungkus `<AppLayout>` harus menggunakan padding responsif standar:
  ```tsx
  <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0 max-w-screen-2xl mx-auto space-y-8">
  ```
- Header dan Banner hero harus menggunakan flexbox adaptif dengan tombol aksi menggunakan `shrink-0`.

## 4. Null-Safety & Defensive Rendering
- Semua relasi data yang bisa bernilai `null` (seperti `link.rombel`, `user.kamar`, `user.madinKelas`) **WAJIB** menggunakan optional chaining (`?.`) dan fallback value (`?? ''` atau `|| null`).
- Jangan pernah memanggil property langsung pada objek bertingkat (`rombel.id`, `kamar.nama_kamar`) tanpa memastikan objek tersebut tidak `null` / `undefined`, untuk mencegah terjadinya layar putih (*blank screen* / *unhandled React runtime error*).
