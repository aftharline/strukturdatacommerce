/**
 * Toko Byte — lapisan DOM.
 * Meng-konsumsi generator dari lib/toko.js satu langkah demi satu langkah
 * (FR-09: jalan otomatis dengan jeda; kecepatan diatur slider).
 */
import {
  buatKatalog,
  bubbleSort,
  insertionSort,
  linearSearch,
  binarySearch,
  iterasiLinear,
  terurut,
  rujuk,
  ubahStok,
  rupiah,
  NAMA_KUNCI,
} from '../lib/toko.js';

const KECEPATAN = [900, 600, 400, 200, 60]; // ms per langkah
const NAMA_ALGO = { bubble: 'Bubble Sort', insertion: 'Insertion Sort' };
const $ = (sel) => document.querySelector(sel);

let katalog = buatKatalog();
const keranjang = []; // array of REFERENCE (Produk *ptr), bukan salinan
let kunciUrut = null; // kunci + arah + algoritma terakhir yang dijalankan
let sedangJalan = false;
let tandai = { mode: '', idx: [] };
let metrik = { pass: 0, cmp: 0, swap: 0, ms: 0 };
let saring = ''; // filter nama dari kontrol header

// Kontrol jeda (FR-09): pause / resume / satu langkah.
const kontrol = { jeda: false, langkahSekali: false, potong: false, resolusiJeda: null };
let lanjutManual = null; // membangunkan `tunggu` yang sedang tidur

const el = {
  grid: $('#grid'),
  ram: $('#ram-list'),
  cart: $('#cart-list'),
  cartTotal: $('#cart-total'),
  log: $('#log'),
  logStatus: $('#log-status'),
  pill: $('#pill-urut'),
  banner: $('#banner'),
  kunci: $('#sort-kunci'),
  algo: $('#sort-algo'),
  speed: $('#sort-speed'),
  speedLabel: $('#sort-speed-label'),
  target: $('#search-target'),
  node: $('#foot-node'),
  m: { pass: $('#m-pass'), cmp: $('#m-cmp'), swap: $('#m-swap'), time: $('#m-time') },
};

/* ------------------------------ utilitas ------------------------------ */
const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Tidur yang bisa dibangunkan duluan (agar pause terasa seketika).
function tunggu(ms) {
  return new Promise((res) => {
    const timer = setTimeout(() => {
      lanjutManual = null;
      res();
    }, ms);
    lanjutManual = () => {
      clearTimeout(timer);
      lanjutManual = null;
      res();
    };
  });
}

function tungguJedaManual() {
  return new Promise((res) => (kontrol.resolusiJeda = res));
}

function perbaruiTombolJeda() {
  const j = $('#btn-jeda');
  const l = $('#btn-langkah');
  if (!j || !l) return;
  j.disabled = l.disabled = !sedangJalan;
  j.textContent = kontrol.jeda ? 'Lanjut' : 'Jeda';
  el.logStatus.textContent = sedangJalan ? (kontrol.jeda ? 'PAUSED' : 'RUNNING') : 'READY';
}

const nilaiTeks = (p, kunci) => (kunci === 'harga' ? rupiah(p.harga) : kunci === 'nama' ? `"${p.nama}"` : `★ ${p.rating.toFixed(1)}`);

function log(html, cls = '') {
  const div = document.createElement('div');
  if (cls) div.className = cls;
  div.innerHTML = html;
  el.log.appendChild(div);
  el.log.scrollTop = el.log.scrollHeight;
}

function garis(teks = '') {
  log(teks || '─'.repeat(66), 'log-dim');
}

function metrikSet() {
  el.m.pass.textContent = metrik.pass;
  el.m.cmp.textContent = metrik.cmp;
  el.m.swap.textContent = metrik.swap;
  el.m.time.textContent = `${metrik.ms}ms`;
}

function kunciKontrol(aksi) {
  for (const id of ['#btn-naik', '#btn-turun', '#btn-linear', '#btn-binary', '#btn-reset', '#sort-kunci', '#sort-algo', '#head-cari', '#head-urut']) {
    const n = $(id);
    if (n) n.disabled = aksi;
  }
  el.target.disabled = aksi;
}

const ukuran = () => KECEPATAN[Number(el.speed.value)];

/* ------------------------------ render ------------------------------ */
function renderKatalog() {
  el.grid.innerHTML = katalog
    .map((p, i) => {
      const aktif = tandai.idx.includes(i);
      const badge =
        aktif && tandai.mode
          ? `<span class="tag tag--state" style="background:${WARNA[tandai.mode].bg};color:${WARNA[tandai.mode].teks}">${
              WARNA[tandai.mode].label
            }</span>`
          : '';
            return `<article class="card ${aktif ? 'is-' + PETA_MODE[tandai.mode] : ''} ${kunciUrut ? 'is-sorted' : ''}" data-alamat="${p.alamat}"${
        saring && !p.nama.toLowerCase().includes(saring) ? ' style="display:none"' : ''
      }>
        <div class="card__top">
          <span style="display:flex;gap:4px">
            <span class="tag">idx[${i}]</span><span class="tag tag--addr">${p.alamat}</span>
          </span>${badge}
        </div>
        <div class="card__body">
          <span class="card__icon">${p.nama[0]}</span>
          <div style="min-width:0">
            <div class="card__name" title="${esc(p.nama)}">${esc(p.nama)}</div>
            <div class="card__meta"><span>${esc(p.kategori)}</span><span>·</span><span class="rating">★ ${p.rating.toFixed(1)}</span></div>
            <div class="card__meta stok">Stok: <b>${p.stok}</b></div>
          </div>
        </div>
        <div class="card__foot">
          <span class="card__harga"><small>Harga</small><b>${rupiah(p.harga)}</b></span>
          <button class="btn btn--sm" data-alamat="${p.alamat}" data-aksi="tambah">+ Keranjang</button>
        </div>
      </article>`;
    })
    .join('');
}

const WARNA = {
  banding: { bg: '#fde68a', teks: '#92400e', label: 'Banding' },
  tukar: { bg: '#fecdd3', teks: '#9f1239', label: 'Swap' },
  ditemukan: { bg: '#a7f3d0', teks: '#065f46', label: 'Ditemukan' },
};
// mode 'banding'/'tukar'/'ditemukan' -> kelas CSS is-compare/is-swap/is-found
const PETA_MODE = { banding: 'compare', tukar: 'swap', ditemukan: 'found' };

function renderRAM(alamatAktif = '') {
  const urut = [...katalog].sort((a, b) => a.alamat.localeCompare(b.alamat));
  el.ram.innerHTML = urut
    .map((p) => {
      const slot = katalog.indexOf(p);
      return `<div class="ram ${alamatAktif === p.alamat ? 'is-active' : ''} ${keranjang.includes(p) ? 'is-cart' : ''}">
        <span class="ram__left"><span class="ram__addr">${p.alamat}</span><span class="ram__name" title="${esc(p.nama)}">${esc(p.nama)}</span></span>
        <span class="ram__right"><span>idx[${slot}]</span><span class="ram__stok">stok:<b>${p.stok}</b></span></span>
      </div>`;
    })
    .join('');
}

function renderCart() {
  if (!keranjang.length) {
    el.cart.innerHTML = `<div class="cart-empty">Keranjang kosong. Tekan <b>+ Keranjang</b> pada kartu produk untuk menyimpan pointer ke struct-nya.</div>`;
  } else {
    el.cart.innerHTML = keranjang
      .map(
        (p) => `<div class="cart-row">
          <div style="min-width:0">
            <div class="cart-row__ptr">*ptr → ${p.alamat}</div>
            <div class="cart-row__name">${esc(p.nama)}</div>
            <div class="cart-row__price">${rupiah(p.harga)}</div>
          </div>
          <div style="display:flex;gap:6px;align-items:center">
            <div class="stepper" title="Ubah stok lewat pointer (aliasing)">
              <button data-alamat="${p.alamat}" data-aksi="stok-" aria-label="Kurangi stok">−</button>
              <span>${p.stok}</span>
              <button data-alamat="${p.alamat}" data-aksi="stok+" aria-label="Tambah stok">+</button>
            </div>
            <button class="btn btn--ghost btn--sm" data-alamat="${p.alamat}" data-aksi="lepas" aria-label="Lepas pointer"><svg class="i"><use href="#i-close" /></svg></button>
          </div>
        </div>`
      )
      .join('');
  }
  el.cartTotal.textContent = rupiah(keranjang.reduce((t, p) => t + p.harga, 0));
  el.node.textContent = `${keranjang.length} Ptr`;
}

function renderStatus() {
  const naik = kunciUrut?.kunci === 'harga' && kunciUrut?.arah === 'naik';
  el.pill.className = 'pill ' + (naik ? 'pill--naik' : kunciUrut ? 'pill--lain' : 'pill--acak');
  el.pill.innerHTML = `<span class="pill__dot"></span>${
    naik ? 'Terurut Naik (Harga)' : kunciUrut ? `Terurut (${NAMA_KUNCI[kunciUrut.kunci]} ${kunciUrut.arah})` : 'Belum Terurut (Acak)'
  }`;
}

const renderSemuanya = () => { renderKatalog(); renderRAM(); renderCart(); renderStatus(); };

function sorot(mode, idx = []) {
  tandai = PETA_MODE[mode] ? { mode, idx } : { mode: '', idx: [] };
  renderKatalog();
}

/* ------------------------------ runner ------------------------------ */
// metrik.ms = waktu algoritma murni (gen.next()), bukan jeda animasi & bukan cat DOM.
async function jalankan(gen, lukis, internal = false) {
  sedangJalan = true;
  kunciKontrol(true);
  perbaruiTombolJeda();
  let cpu = 0;
  let langkah = gen.next();
  while (!langkah.done) {
    lukis(langkah.value);
    await tunggu(ukuran());
    const t = performance.now();
    langkah = gen.next();
    cpu += performance.now() - t;
  }
  metrik.ms = Math.max(0, Math.round(cpu));
  sedangJalan = false;
  kunciKontrol(false);
  metrikSet();
  return langkah.value;
}

/* ------------------------------ bubble sort ------------------------------ */
async function sort(arah) {
  if (sedangJalan) return;
  const kunci = el.kunci.value;
  metrik = { pass: 0, cmp: 0, swap: 0, ms: 0 };
  metrikSet();

  garis();
  log(`[SORT START] Bubble Sort — kunci: <span class="log-key">${NAMA_KUNCI[kunci]}</span>, arah: <span class="log-key">${arah}</span>`, 'log-info');
  log(`Array sebelum diurutkan (${katalog.length} elemen): ${katalog.map((p) => p.alamat).join(' ')}`, 'log-dim');

  let nTukar = 0;
  const hasil = await jalankan(bubbleSort(katalog, kunci, arah), (s) => {
    if (s.t === 'pass') {
      metrik.pass = s.pass;
      metrikSet();
      log(`<span class="log-key">[PASS ${s.pass}]</span> iterasi luar — ptrA = idx0, batas bandingan sampai idx${s.batas}`, '');
    } else if (s.t === 'banding') {
      metrik.cmp = s.banding;
      metrikSet();
      sorot('banding', [s.i, s.i + 1]);
      renderRAM(s.a.alamat);
      const ekor = s.perlu ? '<span class="log-swap">TUKAR (swap)</span>' : '<span class="log-dim">TETAP (no swap)</span>';
      log(
        `[PASS ${s.pass} | LANGKAH ${s.langkah}] BANDING idx${s.i}↔idx${s.i + 1}: ${esc(s.a.nama)} (${nilaiTeks(s.a, kunci)}) vs ${esc(s.b.nama)} (${nilaiTeks(s.b, kunci)}) → ${ekor}`,
        s.perlu ? 'log-swap' : 'log-cmp',
      );
    } else if (s.t === 'tukar') {
      nTukar++;
      metrik.swap = nTukar;
      metrikSet();
      sorot('tukar', [s.i, s.i + 1]);
      log(`          └ swap katalog[${s.i}] ⇄ katalog[${s.i + 1}] — struct ${s.a.alamat} pindah ke slot idx${s.i + 1}`, 'log-swap');
    } else if (s.t === 'henti') {
      log(`[EARLY EXIT] Pass ${s.pass} selesai tanpa pertukaran → array sudah terurut, algoritma dihentikan (O(N) best case).`, 'log-ok');
    }
  });

  kunciUrut = { kunci, arah };
  tandai = { mode: '', idx: [] };
  renderSemuanya();
  log(`── RINGKASAN: ${hasil.pass} pass · ${hasil.banding} perbandingan · ${hasil.tukar} pertukaran · ${metrik.ms}ms · ARRAY TERURUT (${NAMA_KUNCI[kunci]} ${arah}) ──`, 'log-ok');
  garis();
}

/* ------------------------------ searching ------------------------------ */
// Input dianggap "harga" hanya kalau seluruh isinya angka.
const adalahNumeric = (s) => /^[\d.\s]+$/.test(s.trim()) && Number(s.replace(/[^\d]/g, '')) > 0;

async function cariLinear() {
  if (sedangJalan) return;
  const q = el.target.value.trim();
  if (!q) return log('[INPUT] Ketik nama produk terlebih dahulu (contoh: Mousepad Speed XL).', 'log-warn');
  if (adalahNumeric(q)) return log('[INPUT] Linear Search memakai kunci NAMA. Untuk harga gunakan tombol Binary (Harga).', 'log-warn');

  metrik = { pass: 0, cmp: 0, swap: 0, ms: 0 };
  metrikSet();
  garis();
  log(`[LINEAR SEARCH START] target: <span class="log-key">"${esc(q)}"</span> — pemindaian satu per satu dari idx0 (O(N)).`, 'log-info');

  const hasil = await jalankan(linearSearch(katalog, q), (s) => {
    metrik.cmp = s.iter;
    metrikSet();
    renderRAM(s.el.alamat);
    if (s.cocok) sorot('ditemukan', [s.i]);
    else sorot('banding', [s.i]);
    const tanda = s.cocok ? '<span class="log-ok">== target → DITEMUKAN</span>' : '<span class="log-dim">≠ target → lanjut</span>';
    log(`[ITERASI ${s.iter}] cek idx${s.i}: "${esc(s.el.nama)}" ${tanda}`, s.cocok ? 'log-ok' : 'log-cmp');
  });

  if (hasil.idx === -1) {
    sorot('');
    log(`── RINGKASAN: ${hasil.iter} iterasi · TIDAK DITEMUKAN ("${esc(q)}" tidak ada di katalog[0..${katalog.length - 1}]) ──`, 'log-warn');
  } else {
    const p = katalog[hasil.idx];
    log(`── RINGKASAN: ${hasil.iter} iterasi · DITEMUKAN: ${esc(p.nama)} @ ${p.alamat} (katalog[${hasil.idx}]) · ${metrik.ms}ms ──`, 'log-ok');
    renderRAM(p.alamat);
  }
  garis();
}

async function cariBinary() {
  if (sedangJalan) return;
  const target = Number(el.target.value.replace(/[^\d]/g, ''));
  if (!Number.isFinite(target) || target <= 0)
    return log('[INPUT] Binary Search memakai kunci HARGA. Contoh: 650000 atau "Rp 650.000".', 'log-warn');

  // TC-08 — binary search butuh array monoton naik.
  if (!terurut(katalog, 'harga', 'naik')) {
    el.banner.classList.add('is-on');
    log('[TC-08] Prasyarat binary search GAGAL: katalog belum terurut naik berdasarkan harga.', 'log-warn');
    log('[TC-08] Menjalankan auto-sort harga naik terlebih dahulu…', 'log-info');
    await sort('naik');
    el.banner.classList.remove('is-on');
    log('[TC-08] Prasyarat terpenuhi — array monoton naik. Melanjutkan binary search.', 'log-ok');
  }

  metrik = { pass: 0, cmp: 0, swap: 0, ms: 0 };
  metrikSet();
  garis();
  log(`[BINARY SEARCH START] target harga: <span class="log-key">${rupiah(target)}</span> — divide & conquer, batas low=0 high=${katalog.length - 1} (O(log N)).`, 'log-info');

  const hasil = await jalankan(binarySearch(katalog, target), (s) => {
    metrik.cmp = s.iter;
    metrikSet();
    renderRAM(s.el.alamat);
    if (s.arah === 'ditemukan') sorot('ditemukan', [s.mid]);
    else sorot('banding', [s.mid]);
    const nilai = rupiah(s.el.harga);
    let ekor;
    if (s.arah === 'ditemukan') ekor = '<span class="log-ok">== target → DITEMUKAN di idx' + s.mid + '</span>';
    else if (s.arah === 'kanan') ekor = `<span class="log-dim">&lt; target → geser ke KANAN (low=${s.mid + 1})</span>`;
    else ekor = `<span class="log-dim">&gt; target → geser ke KIRI (high=${s.mid - 1})</span>`;
    log(`[ITERASI ${s.iter}] low=${s.low} high=${s.high} mid=${s.mid} → katalog[${s.mid}].harga = ${nilai} ${ekor}`, s.arah === 'ditemukan' ? 'log-ok' : 'log-info');
  });

  const linearButuh = hasil.idx === -1 ? katalog.length : iterasiLinear(katalog, katalog[hasil.idx].nama);
  if (hasil.idx === -1) {
    sorot('');
    log(`── RINGKASAN: ${hasil.iter} iterasi · TIDAK DITEMUKAN (low > high, ruang pencarian habis) · Linear search butuh ${linearButuh} iterasi untuk kasus yang sama ──`, 'log-warn');
  } else {
    const p = katalog[hasil.idx];
    log(`── RINGKASAN: ${hasil.iter} iterasi · DITEMUKAN: ${esc(p.nama)} @ ${p.alamat} (katalog[${hasil.idx}]) · linear butuh ${linearButuh} iterasi untuk kasus yang sama ──`, 'log-ok');
    renderRAM(p.alamat);
  }
  garis();
}

/* ------------------------------ aksi UI ------------------------------ */
function tambahKeKeranjang(alamat) {
  const produk = katalog.find((p) => p.alamat === alamat);
  if (!produk) return;
  const sudah = keranjang.includes(produk);
  rujuk(keranjang, produk);
  if (sudah) {
    log(`[POINTER] ${alamat} sudah dirujuk keranjang.`, 'log-info');
  } else {
    log(`[POINTER ASSIGN] keranjang[${keranjang.length - 1}] → &Produk @ ${alamat} (${esc(produk.nama)}). Objek tidak disalin.`, 'log-info');
    if (keranjang.length === 1) log('[BUKTI] keranjang[0] === katalog[idx yang sama] → true. Satu alamat, dua tampilan.', 'log-dim');
  }
  renderCart();
  renderRAM();
}

function ubahStokLewatPointer(alamat, delta) {
  const produk = katalog.find((p) => p.alamat === alamat);
  if (!produk) return;
  if (!ubahStok(produk, delta)) return log(`[POINTER ERROR] stok ${alamat} tidak boleh turun di bawah 0.`, 'log-warn');
  log(`[POINTER MUTATION] (*ptr).stok pada ${alamat} → ${produk.stok}. Kartu katalog ikut berubah (aliasing).`, 'log-info');
  renderSemuanya();
}

function lepas(alamat) {
  const i = keranjang.findIndex((p) => p.alamat === alamat);
  if (i === -1) return;
  keranjang.splice(i, 1);
  log(`[POINTER FREE] keranjang[${i}] melepas referensi ke ${alamat}.`, 'log-warn');
  renderSemuanya();
}

function reset() {
  if (sedangJalan) return;
  katalog = buatKatalog();
  keranjang.length = 0;
  kunciUrut = null;
  tandai = { mode: '', idx: [] };
  metrik = { pass: 0, cmp: 0, swap: 0, ms: 0 };
  metrikSet();
  renderSemuanya();
  garis();
  log('[TC-10 RESET] Memori heap & pointer dipulihkan ke state pabrik: 10 struct (0x1A40 – 0x1A49), urutan acak, log direset.', 'log-ok');
  garis();
}

el.grid.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-aksi="tambah"]');
  if (btn) tambahKeKeranjang(btn.dataset.alamat);
});

el.cart.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-aksi]');
  if (!btn) return;
  const { alamat, aksi } = btn.dataset;
  if (aksi === 'stok+') ubahStokLewatPointer(alamat, +1);
  else if (aksi === 'stok-') ubahStokLewatPointer(alamat, -1);
  else if (aksi === 'lepas') lepas(alamat);
});

$('#btn-naik').addEventListener('click', () => sort('naik'));
$('#btn-turun').addEventListener('click', () => sort('turun'));
$('#btn-linear').addEventListener('click', cariLinear);
$('#btn-binary').addEventListener('click', cariBinary);
$('#btn-reset').addEventListener('click', reset);
$('#btn-tutup-banner').addEventListener('click', () => el.banner.classList.remove('is-on'));

el.speed.addEventListener('input', () => (el.speedLabel.textContent = `${ukuran()}ms`));
el.target.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') (adalahNumeric(el.target.value) ? cariBinary : cariLinear)();
});

$('#btn-bersihkan').addEventListener('click', () => {
  el.log.innerHTML = '<div class="log-dim">// log dibersihkan. Memori tetap utuh.</div>';
});
$('#btn-salin').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(el.log.innerText);
    log('// log eksekusi disalin ke clipboard.', 'log-dim');
  } catch {
    log('// clipboard ditolak browser — salin manual dari panel log.', 'log-warn');
  }
});

const modal = $('#modal');
const bukaModal = () => modal.classList.add('is-on');
const tutupModal = () => modal.classList.remove('is-on');
for (const id of ['#btn-panduan', '#btn-panduan-2']) $(id).addEventListener('click', bukaModal);
for (const id of ['#btn-tutup-modal', '#btn-tutup-modal-2']) $(id).addEventListener('click', tutupModal);
modal.addEventListener('click', (e) => e.target === modal && tutupModal());
addEventListener('keydown', (e) => e.key === 'Escape' && tutupModal());

/* ------------------------------ boot ------------------------------ */
metrikSet();
renderSemuanya();
garis();
log('// Inisialisasi memori Toko Byte: 10 struct Produk pada 0x1A40 – 0x1A49.', 'log-dim');
log('// Pointer: Produk *ptrKeranjang = NULL (belum ada referensi).', 'log-dim');
log('&gt;&gt; System ready. Pilih Bubble Sort, Linear Search, atau Binary Search.', 'log-ok');
garis();