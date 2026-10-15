/**
 * Toko Byte — inti logika (tanpa DOM).
 * Semua algoritma ditulis sebagai generator: UI meng-KONSMSI langkahnya,
 * test cukup DRAIN generator-nya. Satu implementasi, dua konsumen.
 */

/** State pabrik: struct Produk[id] pada alamat simulasi 0x1A40..0x1A49 */
export const INITIAL = [
  { id: 1, nama: 'Mouse Ergonomis', kategori: 'Peripheral', harga: 150000, stok: 12, rating: 4.5 },
  { id: 2, nama: 'Monitor 24 Inch', kategori: 'Peripheral', harga: 1850000, stok: 5, rating: 4.8 },
  { id: 3, nama: 'Keyboard Mekanikal', kategori: 'Peripheral', harga: 650000, stok: 8, rating: 4.7 },
  { id: 4, nama: 'USB Hub 7-Port', kategori: 'Aksesori', harga: 95000, stok: 20, rating: 4.1 },
  { id: 5, nama: 'Headset Gaming 7.1', kategori: 'Audio', harga: 420000, stok: 10, rating: 4.4 },
  { id: 6, nama: 'Webcam Full HD 1080p', kategori: 'Aksesori', harga: 310000, stok: 7, rating: 4.3 },
  { id: 7, nama: 'Mousepad Speed XL', kategori: 'Aksesori', harga: 45000, stok: 35, rating: 4.2 },
  { id: 8, nama: 'Speaker Bluetooth Pro', kategori: 'Audio', harga: 580000, stok: 6, rating: 4.6 },
  { id: 9, nama: 'Stand Laptop Alu', kategori: 'Aksesori', harga: 135000, stok: 15, rating: 4.5 },
  { id: 10, nama: 'Kabel HDMI 2.1 8K', kategori: 'Kabel', harga: 75000, stok: 25, rating: 4.9 },
];

export const NAMA_KUNCI = { harga: 'Harga', nama: 'Nama', rating: 'Rating' };

/** Klon state pabrik + pasang field `alamat` (alamat ikut tersalin saat swap). */
export function buatKatalog() {
  return INITIAL.map((p, i) => ({ ...p, alamat: hex(i) }));
}

/** Alamat heap simulasi: 0x1A40 + i */
export function hex(i) {
  return '0x' + (0x1a40 + i).toString(16).toUpperCase();
}

/** Nilai yang bisa dibandingkan untuk sebuah kunci sorting. */
export function nilai(p, kunci) {
  return kunci === 'nama' ? p.nama.toLowerCase() : p[kunci];
}

/** Apakah array sudah monoton naik (kunci + arah tertentu). */
export function terurut(katalog, kunci = 'harga', arah = 'naik') {
  for (let i = 0; i < katalog.length - 1; i++) {
    const a = nilai(katalog[i], kunci);
    const b = nilai(katalog[i + 1], kunci);
    if (arah === 'naik' ? a > b : a < b) return false;
  }
  return true;
}

/**
 * Insertion Sort — diungkapkan sebagai adjacent-swap agar kontrak langkahnya
 * identik dengan bubble sort: {t:'pass'} | {t:'banding'} | {t:'tukar'}.
 * Satu perbedaan jujur: langkah 'tukar' menandai {geser:true} (pergeseran,
 * bukan pertukaran sepasang arbitrer). Mengubah katalog DI TEMPAT.
 */
export function* insertionSort(katalog, kunci = 'harga', arah = 'naik') {
  const n = katalog.length;
  let banding = 0;
  let geser = 0;
  let pass = 0;

  for (let i = 1; i < n; i++) {
    pass++;
    let langkah = 0;
    yield { t: 'pass', pass, i };

    let j = i - 1;
    while (j >= 0) {
      langkah++;
      banding++;
      const a = katalog[j];
      const b = katalog[j + 1];
      const va = nilai(a, kunci);
      const vb = nilai(b, kunci);
      const perlu = arah === 'naik' ? va > vb : va < vb;
      yield { t: 'banding', pass, langkah, banding, i: j, a, b, perlu, geser: true };

      if (!perlu) break;
      [katalog[j], katalog[j + 1]] = [b, a];
      geser++;
      yield { t: 'tukar', pass, langkah, i: j, a: b, b: a, geser: true };
      j--;
    }
  }
  return { pass, banding, tukar: geser, kunci, arah };
}
/**
 * Bubble Sort (FR-04/FR-05). Mengubah katalog DI TEMPAT (in-place swap).
 * Menghasilkan: {t:'pass'} | {t:'banding'} | {t:'tukar'} | {t:'henti'}
 */
export function* bubbleSort(katalog, kunci = 'harga', arah = 'naik') {
  const n = katalog.length;
  let banding = 0;
  let tukar = 0;
  let pass = 0;

  for (let i = 0; i < n - 1; i++) {
    pass++;
    let adaTukar = false;
    yield { t: 'pass', pass, batas: n - 1 - i };

    for (let j = 0; j < n - 1 - i; j++) {
      banding++;
      const a = katalog[j];
      const b = katalog[j + 1];
      const va = nilai(a, kunci);
      const vb = nilai(b, kunci);
      const perlu = arah === 'naik' ? va > vb : va < vb;
      yield { t: 'banding', pass, langkah: j + 1, banding, i: j, a, b, perlu };

      if (perlu) {
        [katalog[j], katalog[j + 1]] = [b, a];
        tukar++;
        adaTukar = true;
        yield { t: 'tukar', pass, langkah: j + 1, i: j, a: b, b: a };
      }
    }

    // Optimasi: tanpa pertukaran pada satu pass => array pasti sudah terurut.
    if (!adaTukar) {
      if (pass < n - 1) yield { t: 'henti', pass };
      break;
    }
  }
  return { pass, banding, tukar, kunci, arah };
}

/**
 * Linear Search berdasarkan nama (FR-06/FR-07). Cocok persis, case-insensitive.
 * Menghasilkan {t:'cek', ...} lalu return {idx, iter}.
 */
export function* linearSearch(katalog, target) {
  const q = String(target).trim().toLowerCase();
  for (let i = 0; i < katalog.length; i++) {
    const cocok = katalog[i].nama.toLowerCase() === q;
    yield { t: 'cek', iter: i + 1, i, el: katalog[i], cocok };
    if (cocok) return { idx: i, iter: i + 1 };
  }
  return { idx: -1, iter: katalog.length };
}

/**
 * Binary Search berdasarkan harga (FR-06). Prasyarat: array terurut naik.
 * Menghasilkan {t:'cek', iter, low, high, mid, el, arah} lalu return {idx, iter}.
 */
export function* binarySearch(katalog, target) {
  let low = 0;
  let high = katalog.length - 1;
  let iter = 0;

  while (low <= high) {
    iter++;
    const mid = Math.floor((low + high) / 2);
    const el = katalog[mid];
    const ditemukan = el.harga === target;
    yield {
      t: 'cek',
      iter,
      low,
      high,
      mid,
      el,
      ditemukan,
      arah: ditemukan ? 'ditemukan' : el.harga < target ? 'kanan' : 'kiri',
    };
    if (ditemukan) return { idx: mid, iter };
    if (el.harga < target) low = mid + 1;
    else high = mid - 1;
  }
  return { idx: -1, iter };
}

/** Jumlah iterasi linear untuk produk yang sama (pembanding di ringkasan). */
export function iterasiLinear(katalog, nama) {
  let iter = 0;
  for (const p of katalog) {
    iter++;
    if (p.nama.toLowerCase() === String(nama).trim().toLowerCase()) break;
  }
  return iter;
}

/** Tambah referensi (pointer) ke keranjang — BUKAN salinan (FR-03). */
export function rujuk(keranjang, produk) {
  const ada = keranjang.find((p) => p === produk);
  if (!ada) keranjang.push(produk);
  return keranjang.length;
}

/** Ubah stok lewat pointer: objek asli ikut berubah (aliasing, TC-09). */
export function ubahStok(produk, delta) {
  if (produk.stok + delta < 0) return false;
  produk.stok += delta;
  return true;
}

export const rupiah = (v) => 'Rp ' + Number(v).toLocaleString('id-ID');