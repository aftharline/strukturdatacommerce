# Toko Byte — Belanja Sambil Melihat Algoritmanya Bekerja

Platform e-commerce edukatif satu halaman yang menjadikan **struktur data dan algoritma sebagai fitur utama yang dipajang**: Array of Struct, Pointer Aliasing, Bubble Sort, Linear Search, dan Binary Search — semuanya dengan log langkah-demi-langkah yang terlihat.

> **Unduh versi PDF:** setelah `npm run build`, guidebook tersedia di [`/Toko-Byte-Guidebook.pdf`](./public/Toko-Byte-Guidebook.pdf) dan bisa diunduh lewat tombol **Unduh Guidebook** di Beranda & Simulator.

## Identitas Pengembang

| | |
|---|---|
| **Nama** | Muhammad Abdee Nur Fatih |
| **NIM** | 25050974063 |
| **Mata Kuliah** | Struktur Data |
| **Kelas** | 2025B |

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Halaman](#halaman)
- [Teknologi](#teknologi)
- [Struktur Proyek](#struktur-proyek)
- [Cara Menjalankan](#cara-menjalankan)
- [Manual Guide](#manual-guide)
  - [1. Beranda](#1-beranda--landing-page)
  - [2. Simulator Algoritma](#2-simulator-algoritma)
  - [3. Dashboard Analytics](#3-dashboard-analytics)
- [Matriks Test Case (TC-01 – TC-10)](#matriks-test-case-tc-01--tc-10)
- [Format Log](#format-log)
- [Skrip Demo 10 Menit (untuk Sidang)](#skrip-demo-10-menit-untuk-sidang)
- [Pertanyaan Dosen yang Sering Muncul](#pertanyaan-dosen-yang-sering-muncul)
- [Troubleshooting](#troubleshooting)

## Fitur Utama

- **Katalog 10 produk** sebagai Array of Struct (`Produk katalog[10]`), tiap elemen punya alamat heap simulasi `0x1A40 – 0x1A49`.
- **Panel Memori** — melihat alamat & isi tiap struct secara transparan.
- **Keranjang pointer** — menyimpan *reference*, bukan salinan; ubah stok lewat `ptr->stok`, katalog ikut berubah (TC-09).
- **Bubble Sort visual** — kunci harga / nama / rating, arah naik / turun, highlight banding vs tukar, ringkasan pass · banding · tukar.
- **Linear Search (nama)** + **Binary Search (harga)** — log `low / high / mid` per iterasi; auto-sort bila data belum terurut (TC-08).
- **Kontrol langkah** — kecepatan 60–900 ms per langkah.
- **Dashboard audit** — benchmark, kurva kompleksitas, matriks TC-01–TC-10, audit trail, ekspor JSON/TXT.
- **Panduan Sidang** — modal berisi jawaban atas pertanyaan penguji, tersedia di halaman Simulator.

## Halaman

| Rute | Isi |
|---|---|
| `/` | Beranda: hero, statistik, arsitektur pembelajaran, pemetaan C → JS, checklist TC, identitas pengembang, CTA |
| `/simulator` | Workbench: Bubble Sort visualizer, searching, panel memori, keranjang pointer, terminal log |
| `/dashboard` | Metrik eksekusi, grafik kompleksitas, siklus hidup pointer, matriks verifikasi TC, audit trail |

## Teknologi

- [Astro](https://astro.build) 5 — static site, 3 rute
- Vanilla JS (ES2022) — tanpa framework frontend, tanpa CDN; jalan offline setelah build
- Font: Plus Jakarta Sans (display), Geist (body), JetBrains Mono (mono) via `@fontsource-variable`
- Test: `node --test` (14 test, 12+ assertion) — generator algoritma di-drain langsung

## Struktur Proyek

```
├── src/
│   ├── lib/toko.js          # Inti logika: struct, bubble/insertion sort,
│   │                        # linear/binary search (generator), pointer, rupiah
│   ├── scripts/app.js       # Lapisan DOM simulator (konsumen generator)
│   ├── scripts/dashboard.js # Lapisan DOM dashboard (audit + metrik)
│   ├── layouts/Base.astro   # Header, nav, footer (identitas pengembang), ikon SVG
│   ├── pages/index.astro    # Beranda
│   ├── pages/simulator.astro# Simulator
│   ├── pages/dashboard.astro# Dashboard
│   └── styles/global.css    # Design token + seluruh stylesheet
├── public/
│   ├── Toko-Byte-Guidebook.pdf  # Guidebook (hasil generate, siap unduh)
│   ├── favicon.svg
│   └── images/
├── test/                    # Suite node:test untuk lib/toko.js
├── DESIGN/                  # Dokumen desain visual
├── PRD.md                   # Product Requirements Document
└── README.md
```

## Cara Menjalankan

```bash
npm install
npm run dev      # server dev → http://localhost:4321
npm test         # 14 test harus lulus semua
npm run build    # output statis ke dist/
npm run preview  # pratinjau hasil build
```

> Tidak ada backend, database, autentikasi, atau penyimpanan — semua state hidup di memori browser dan bisa di-reset (TC-10).

## Manual Guide

### 1. Beranda — Landing Page (`/`)

1. **Hero** — ringkasan konsep + mockup browser yang menunjukkan aliasing pointer (`*ptr_keranjang → 0x1A42`).
2. **Statistik** — 10 produk di RAM, kompleksitas algoritma, waktu komputasi.
3. **Lab Struktur Data** — 4 kartu: Array of Struct, Pointer Aliasing, Bubble Sort, Binary vs Linear.
4. **Pemetaan C → JS** — korespondensi 1-to-1 (`Produk *ptr` vs reference JS) untuk bahan jawaban sidang.
5. **Checklist TC-01 – TC-10** — status kesiapan sidang.
6. **Identitas Pengembang** — kartu Nama / NIM / Mata Kuliah / Kelas.
7. **CTA** — lompat ke Simulator atau Dashboard; tombol **Unduh Guidebook (PDF)** mengunduh manual ini dalam bentuk PDF.

### 2. Simulator Algoritma (`/simulator`)

**Memulai:** buka `/simulator`. Status bar menampilkan `Produk katalog[10]` dan pil `Belum Terurut (Acak)`.

**Bubble Sort:**
1. Pilih **Kunci Sorting**: Harga (IDR), Nama (alfabetik), atau Rating (★).
2. Atur **Kecepatan Langkah** (slider 60–900 ms).
3. Klik **Naik (Asc)** untuk TC-02 atau **Turun (Desc)** untuk TC-03.
4. Amati: kartu berwarna amber saat **banding** (`i ↔ i+1`), rose saat **tukar**; terminal mencatat tiap langkah; metrik Pass / Komparasi / Pertukaran / Waktu diperbarui realtime; ringkasan akhir + pil status berubah menjadi `Terurut …`.

**Linear Search (berdasarkan nama):**
1. Ketik nama persis di kolom target, mis. `Mousepad Speed XL`.
2. Klik **Linear (Nama)**. Tiap iterasi tercatat (`cek idxN … → lanjut / DITEMUKAN`); kartu hasil berwarna hijau.
3. Coba nama yang tidak ada (mis. `Kulkas 2 Pintu`) untuk TC-05 → `TIDAK DITEMUKAN` setelah idx terakhir.

**Binary Search (berdasarkan harga):**
1. Ketik harga, mis. `650000` atau `Rp 650.000`.
2. Klik **Binary (Harga)**. Jika array belum terurut, sistem otomatis sort harga naik dulu dan mencatatnya (TC-08, banner peringatan menyala sesaat).
3. Amati log `low / high / mid` tiap iterasi — target yang ada ketemu dalam ≤ 4 iterasi (TC-06).

**Keranjang Pointer (TC-09):**
1. Klik **+ Keranjang** pada kartu produk → panel kanan mencatat `[POINTER ASSIGN] keranjang[k] → &Produk @ 0x1A4X`.
2. Tekan **− / +** pada stepper keranjang → angka stok di **kartu katalog ikut berubah seketika** (satu alamat, dua tampilan — bukti aliasing).
3. Tombol **×** melepas referensi (`[POINTER FREE]`).

**Reset (TC-10):** tombol **Reset Data** mengembalikan 10 struct ke urutan acak awal, mengosongkan keranjang & metrik.

**Panduan Sidang:** tombol **Panduan Sidang Dosen** membuka modal berisi 3 bahan presentasi + daftar TC.

### 3. Dashboard Analytics (`/dashboard`)

1. Klik **Jalankan Audit Otomatis** — menjalankan seluruh TC-01–TC-10 terhadap engine dan mengisi:
   - KPI: heap/stack, benchmark sort, binary vs linear, integritas pointer, rasio kelulusan;
   - kurva kompleksitas teoritis vs titik ukur nyata;
   - siklus hidup pointer (trigger → ekstraksi → aliasing);
   - **matriks verifikasi TC** (klik ▶ per baris untuk menjalankan ulang satu TC);
   - **audit trail** (filter per jenis operasi).
2. Ganti **Dataset** 10 / 100 produk untuk melihat skala benchmark.
3. **Ekspor Bukti (JSON)** mengunduh hasil audit; **Unduh .TXT** mengunduh jejak audit terfilter — keduanya bisa dilampirkan ke laporan.

## Matriks Test Case (TC-01 – TC-10)

| ID | Skenario | Ekspektasi |
|---|---|---|
| TC-01 | Buka halaman | 10 produk tampil; 10 alamat berbeda di panel Memori |
| TC-02 | Urutkan harga naik | Log tiap banding/tukar; array terurut; ringkasan muncul |
| TC-03 | Urutkan harga turun | Log & hasil sesuai arah turun |
| TC-04 | Linear search nama yang ada | Log per iterasi + produk ter-highlight |
| TC-05 | Linear search nama tak ada | Log sampai idx terakhir + `TIDAK DITEMUKAN` |
| TC-06 | Binary search harga ada (sesudah sort) | `low/high/mid` benar; ≤ 4 iterasi |
| TC-07 | Binary search harga tak ada | Berhenti saat `low > high` + `TIDAK DITEMUKAN` |
| TC-08 | Binary search saat data acak | Auto-sort tercatat di log, lalu mencari |
| TC-09 | Tambah ke keranjang, ubah stok | Stok katalog ikut berubah, alamat sama (aliasing) |
| TC-10 | Reset | Data kembali awal, log dibersihkan |

## Format Log

**Bubble Sort:**
```
[PASS 1 | LANGKAH 1] BANDING idx0↔idx1: Mouse Ergonomis (Rp 150.000) vs Monitor 24 Inch (Rp 1.850.000) → TETAP
          └ swap katalog[1] ⇄ katalog[2] — struct 0x1A41 pindah ke slot idx2
── RINGKASAN: 9 pass · 45 perbandingan · 31 pertukaran · ARRAY TERURUT (Harga naik) ──
```

**Binary Search (mencari Rp 650.000):**
```
[ITERASI 1] low=0 high=9 mid=4 → katalog[4].harga = Rp 310.000 < target → geser ke KANAN (low=5)
[ITERASI 3] low=6 high=6 mid=6 → katalog[6].harga = Rp 650.000 == target → DITEMUKAN di idx 6
── RINGKASAN: 3 iterasi · DITEMUKAN … linear butuh 7 iterasi untuk kasus yang sama ──
```

**Linear Search:**
```
[ITERASI 1] cek idx0: "Mouse Ergonomis" ≠ "Mousepad Speed XL" → lanjut
[ITERASI 7] cek idx6: "Mousepad Speed XL" == target → DITEMUKAN
```

## Skrip Demo 10 Menit (untuk Sidang)

| Menit | Aksi | Menjawab TC |
|---|---|---|
| 0–2 | Beranda: tunjukkan mockup memori + pemetaan C → JS | Konsep |
| 2–4 | Simulator: Bubble Sort harga naik, tunjuk highlight & ringkasan | TC-02 |
| 4–6 | Binary Search `650000` (biarkan auto-sort bekerja), bandingkan dengan Linear | TC-06, TC-08 |
| 6–8 | Keranjang: tambah produk → ubah stok → tunjuk katalog ikut berubah | TC-09 |
| 8–10 | Dashboard: Jalankan Audit Otomatis → tunjukkan 10/10 PASS + ekspor JSON | TC-01–TC-10 |

## Pertanyaan Dosen yang Sering Muncul

**"JavaScript tidak punya pointer. Bagaimana ini membuktikan pointer?"**
Reference ke object di JS berperilaku identik dengan pointer: `keranjang[0] === katalog[i]` bernilai `true` — satu objek di memori, dua jalur akses. Demo TC-09 (mutasi stok lewat keranjang mengubah katalog) adalah bukti perilakunya, dan alamat `0x…` adalah simulasi visual agar konsep konkret.

**"Kenapa harus sort dulu sebelum binary search?"**
Binary search memakai divide & conquer atas asumsi array monoton — pada data acak hasilnya salah. Sistem menegakkannya: `terurut()` dicek dulu, bila gagal auto-sort dijalankan dan *dicatat di log* (TC-08), bukan disembunyikan.

**"Kenapa bubble sort, bukan yang cepat?"**
Tujuan edukasi: bubble sort punya jejak perbandingan/pertukaran yang paling mudah diikuti langkahnya dan early-exit-nya mendemonstrasikan best case O(N). Benchmark di dashboard menunjukkan biayanya secara jujur (O(N²)).

## Troubleshooting

| Gejala | Penyebab & Solusi |
|---|---|
| Klik Naik/Turun tidak terjadi apa-apa | Pastikan memakai build terbaru — bug pemanggilan fungsi jeda sudah diperbaiki (`tunggu()` di `src/scripts/app.js`). Refresh halaman. |
| Binary search selalu auto-sort | Normal (TC-08): lakukan sort naik sekali, pencarian berikutnya langsung jalan. |
| Linear search menolak input angka | Linear memakai kunci nama; untuk harga gunakan tombol Binary. |
| Tombol terkunci (disabled) | Algoritma sedang berjalan — tunggu hingga ringkasan muncul. |
| `npm run dev` gagal | Pastikan Node ≥ 18 dan sudah `npm install`. |

---

© 2026 Toko Byte · Muhammad Abdee Nur Fatih (25050974063) · Struktur Data · Kelas 2025B
