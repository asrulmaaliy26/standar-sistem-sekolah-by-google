# Repository Guidelines & Agent Rules

## 1. UI & Layout Principles (Critical Rule)
- **Sidebar & Content Non-Overlap**:
  - Komponen sidebar desktop (`<Sidebar />` di `resources/js/components/ui/sidebar.tsx`) menggunakan layout flexbox dengan kombinasi `spacer` dan fixed navigation.
  - Wrapper dan spacer sidebar desktop **HARUS SELALU** memiliki class `shrink-0` dan `min-w-(--sidebar-width)` agar engine CSS flexbox browser tidak pernah mengompresi lebar sidebar menjadi nol ketika terdapat konten lebar (seperti tabel atau kartu).
  - Elemen `SidebarInset` **HARUS** memiliki `min-w-0 max-w-full flex-1 flex-col overflow-x-hidden`.
  - Root `html` dan `body` di `app.css` **HARUS** memiliki `overflow-x: hidden` dan `max-width: 100vw` agar halaman browser tidak pernah memiliki scrollbar horizontal (*page horizontal scroll* / bergeser ke kanan).

- **Penyesuaian Breakpoint dengan Sidebar Aktif (Content Area = Viewport - 256px)**:
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

## 2. Null-Safety & Robustness
- Relasi opsional (`rombel`, `kamar`, `madinKelas`) dapat bernilai `null`. Selalu gunakan *optional chaining* (`rombel?.name`, `rombel?.id`) dan defensive fallback agar React tidak mengalami *unhandled runtime error* (layar putih).
- Filter query backend untuk kelas formal wajib mengecualikan data non-formal / madin (`whereNotNull('rombel_id')` atau `where('kategori', 'formal')`).

## 3. Technology Stack & Coding Standards
- **Backend**: Laravel 11 / 12, Inertia.js (React), Spatie Permissions.
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React icons.
- **Aesthetic**: Modern, clean, rounded-xl/rounded-2xl, glassmorphism, responsive light/dark mode.
