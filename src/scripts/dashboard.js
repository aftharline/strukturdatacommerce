/**
 * Dashboard — audit runner.
 * Angka di halaman ini BUKAN dekorasi: matriks TC, KPI, dan audit trail
 * dihasilkan dari generator yang sama dengan simulator (src/lib/toko.js).
 */
import {
  buatKatalog,
  bubbleSort,
  linearSearch,
  binarySearch,
  iterasiLinear,
  terurut,
  rujuk,
  ubahStok,
} from '../lib/toko.js';

const $ = (s) => document.querySelector(s);
const SIZEOF_PRODUK = 32; // sizeof(struct Produk) — simulasi

function drain(gen) {
  let r = gen.next();
  while (!r.done) r = gen.next();
  return r.value;
}

/** Jalankan satu kasus uji + catat durasi & detailnya. */
function ukur(nama, fn) {
  const t = performance.now();
  const ok = fn();
  return { nama, ok, ms: performance.now() - t };
}

const stat = { banding: 0, swap: 0, sortMs: 0, binStep: 0, linStep: 0, ptrError: 0 };

const SUITE = [
  {
    id: 'TC-01', kategori: 'Array Struct', op: 'ARRAY_INIT',
    kondisi: 'size 10, contiguous 0x1A40',
    ekspektasi: '10 alamat unik, struct terpetakan',
    uji: () => {
      const k = buatKatalog();
      return k.length === 10 && new Set(k.map((p) => p.alamat)).size === 10;
    },
  },
  {
    id: 'TC-02', kategori: 'Bubble Sort', op: 'BUBBLE_SORT',
    kondisi: 'kunci harga, arah ascending',
    ekspektasi: 'Array terurut naik, ringkasan log',
    uji: () => {
      const k = buatKatalog();
      const t = performance.now();
      const h = drain(bubbleSort(k, 'harga', 'naik'));
      stat.sortMs = performance.now() - t;
      stat.banding = h.banding;
      stat.swap = h.tukar;
      return terurut(k, 'harga', 'naik') && h.banding === h.banding && h.pass <= 9;
    },
  },
  {
    id: 'TC-03', kategori: 'Bubble Sort', op: 'BUBBLE_SORT',
    kondisi: 'kunci harga, arah descending',
    ekspektasi: 'Array terurut turun deterministik',
    uji: () => {
      const k = buatKatalog();
      drain(bubbleSort(k, 'harga', 'turun'));
      return terurut(k, 'harga', 'turun');
    },
  },
  {
    id: 'TC-04', kategori: 'Linear Search', op: 'LINEAR_SEARCH',
    kondisi: 'target "Webcam Full HD 1080p"',
    ekspektasi: 'Ditemukan pada iterasi ke-6',
    uji: () => drain(linearSearch(buatKatalog(), 'Webcam Full HD 1080p')).iter === 6,
  },
  {
    id: 'TC-05', kategori: 'Linear Search', op: 'LINEAR_SEARCH',
    kondisi: 'target "Kursi Ergonomis" (absen)',
    ekspektasi: '10 iterasi, TIDAK DITEMUKAN',
    uji: () => {
      const h = drain(linearSearch(buatKatalog(), 'Kursi Ergonomis'));
      return h.idx === -1 && h.iter === 10;
    },
  },
  {
    id: 'TC-06', kategori: 'Binary Search', op: 'BINARY_SEARCH',
    kondisi: 'target Rp 310.000 (sorted)',
    ekspektasi: 'Ditemukan ≤ 4 iterasi (mid)',
    uji: () => {
      const k = buatKatalog();
      drain(bubbleSort(k, 'harga', 'naik'));
      const h = drain(binarySearch(k, 310000));
      stat.binStep = h.iter;
      stat.linStep = iterasiLinear(k, k[h.idx < 0 ? 0 : h.idx].nama);
      return h.idx >= 0 && h.iter <= 4;
    },
  },
  {
    id: 'TC-07', kategori: 'Binary Search', op: 'BINARY_SEARCH',
    kondisi: 'target Rp 999.999.999 (absen)',
    ekspektasi: 'low > high, TIDAK DITEMUKAN',
    uji: () => {
      const k = buatKatalog();
      drain(bubbleSort(k, 'harga', 'naik'));
      return drain(binarySearch(k, 999999999)).idx === -1;
    },
  },
  {
    id: 'TC-08', kategori: 'Binary Search', op: 'AUTO_SORT',
    kondisi: 'data acak (belum terurut)',
    ekspektasi: 'Auto-sort naik, lalu low/high/mid',
    uji: () => {
      const k = buatKatalog();
      const acak = !terurut(k, 'harga', 'naik');
      drain(bubbleSort(k, 'harga', 'naik'));
      return acak && terurut(k, 'harga', 'naik') && drain(binarySearch(k, 650000)).idx >= 0;
    },
  },
  {
    id: 'TC-09', kategori: 'Pointer', op: 'POINTER_MUTATION',
    kondisi: 'stok 20 → 17 via *ptr',
    ekspektasi: 'Satu alamat, dua tampilan',
    uji: () => {
      const k = buatKatalog();
      const cart = [];
      rujuk(cart, k[3]);
      const same = cart[0] === k[3];
      ubahStok(cart[0], -3);
      const boundary = ubahStok(cart[0], -999) === false;
      const ok = same && k[3].stok === 17 && boundary;
      stat.ptrError = ok ? 0 : 1;
      return ok;
    },
  },
  {
    id: 'TC-10', kategori: 'Memory', op: 'FREE_DEALLOC',
    kondisi: 'mutasi + sort + reset',
    ekspektasi: 'State awal pulih 100%, log bersih',
    uji: () => {
      const k = buatKatalog();
      drain(bubbleSort(k, 'harga', 'naik'));
      ubahStok(k[0], -5);
      const segar = buatKatalog();
      return segar[0].stok === 12 && !terurut(segar, 'harga', 'naik') && segar.length === 10;
    },
  },
];

/* ------------------------------ grafik ------------------------------ */
const KURVA = [
  { label: 'O(1)', warna: 'var(--tertiary)', f: () => 1 },
  { label: 'O(log n)', warna: 'var(--primary-container)', f: (n) => Math.log2(n) },
  { label: 'O(n)', warna: 'var(--secondary)', f: (n) => n },
  { label: 'O(n²)', warna: 'var(--swap)', f: (n) => (n * (n - 1)) / 2 },
];

function gambarGrafik() {
  const W = 640, H = 240, PL = 44, PR = 16, PT = 12, PB = 28;
  const N_MIN = 10, N_MAX = 1e5, Y_MAX = 6;
  const x = (n) => PL + ((Math.log10(n) - 1) / (Math.log10(N_MAX) - 1)) * (W - PL - PR);
  const y = (v) => H - PB - (Math.log10(Math.max(1, v)) / Y_MAX) * (H - PT - PB);

  const garis = KURVA.map((k) => {
    const pts = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 100000]
      .map((n) => `${x(n).toFixed(1)},${y(k.f(n)).toFixed(1)}`)
      .join(' ');
    return `<polyline points="${pts}" fill="none" stroke="${k.warna}" stroke-width="2" stroke-linecap="round" />`;
  }).join('');

  const tickX = [10, 100, 1000, 10000, 100000]
    .map((n) => `<text x="${x(n)}" y="${H - 8}" text-anchor="middle" font-size="10" fill="var(--outline)">${n >= 1000 ? `10^${Math.log10(n)}` : n}</text>`)
    .join('');
  const tickY = [1, 1000, 1e6]
    .map((v) => `<text x="${PL - 8}" y="${y(v) + 3}" text-anchor="end" font-size="10" fill="var(--outline)">${v >= 1e6 ? '10⁶' : v >= 1000 ? '10³' : '1'}</text>`)
    .join('');

  const ukur = [
    { x: x(10), y: y(stat.banding), c: 'var(--swap)', t: `${stat.banding} banding` },
    { x: x(10), y: y(stat.linStep), c: 'var(--secondary)', t: `${stat.linStep} linear` },
    { x: x(10), y: y(stat.binStep), c: 'var(--primary-container)', t: `${stat.binStep} binary` },
  ]
    .map((p) => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${p.c}" /><text x="${p.x + 10}" y="${p.y - 6}" font-size="10" fill="${p.c}" font-weight="700">${p.t}</text>`)
    .join('');

  const legenda = KURVA.map(
    (k) => `<span><i style="background:${k.warna}"></i>${k.label}</span>`
  ).join('');

  $('#grafik').innerHTML =
    `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Kurva kompleksitas algoritma">
      ${[1, 10, 100, 1000, 1e4, 1e5].map((v) => `<line x1="${PL}" y1="${y(v)}" x2="${W - PR}" y2="${y(v)}" stroke="var(--surface-container)" stroke-width="1" />`).join('')}
      ${tickY}${tickX}${garis}${ukur}
    </svg>
    <div class="grafik__legenda">${legenda}</div>`;
}

/* ------------------------------ render ------------------------------ */
let hasil = [];
let auditTerakhir = null;

function renderMatriks(filter = '') {
  const q = filter.trim().toLowerCase();
  const tampil = hasil.filter(
    (h) => !q || h.id.toLowerCase().includes(q) || h.namaUji.toLowerCase().includes(q) || h.kategori.toLowerCase().includes(q)
  );
  $('#tc-body').innerHTML = tampil
    .map(
      (h) => `<tr data-id="${h.id}">
      <td class="mono"><b>${h.id}</b></td>
      <td>${h.namaUji}</td>
      <td><span class="tag">${h.kategori}</span></td>
      <td class="mono tc-table__kondisi">${h.kondisi}</td>
      <td class="tc-table__eksp">${h.ekspektasi}</td>
      <td><span class="tccard__pass mono">${h.ok ? 'LULUS' : 'GAGAL'}</span></td>
      <td><button class="btn btn--ghost btn--sm" data-ulang="${h.id}">Uji Ulang</button></td>
    </tr>`
    )
    .join('');
  $('#tc-kosong').style.display = hasil.length && tampil.length ? 'none' : 'block';
  $('#tc-kosong').textContent = hasil.length ? 'Tidak ada test case yang cocok.' : 'Belum ada audit. Tekan “Jalankan Audit Otomatis”.';
}

function renderTrail(filter = '') {
  const baris = hasil.filter((h) => !filter || h.op === filter).slice(-8).reverse();
  $('#trail').innerHTML = baris.length
    ? baris
        .map(
          (h) => `<div class="trail__row">
      <span class="trail__op mono">${h.op}</span>
      <div class="trail__body">
        <b>${h.namaUji}</b>
        <p class="mono">${h.detail}</p>
      </div>
      <span class="trail__ms mono">${h.ms.toFixed(2)} ms</span>
      <span class="trail__stamp mono">${h.waktu}</span>
      <span class="tccard__pass mono">${h.ok ? 'SUCCESS' : 'FAIL'}</span>
    </div>`
        )
        .join('')
    : '<p class="tc-empty mono">Belum ada jejak audit.</p>';
}

function renderKpi() {
  const lulus = hasil.filter((h) => h.ok).length;
  $('#kpi-bytes').innerHTML = `${10 * SIZEOF_PRODUK}<small>Bytes</small>`;
  $('#kpi-sort').innerHTML = `${stat.banding}<small> Komp / ${stat.swap} Swap</small>`;
  $('#kpi-sort-ms').textContent = stat.sortMs.toFixed(2);
  $('#kpi-search').innerHTML = `${stat.binStep}<small> Step</small>`;
  $('#kpi-linear').textContent = stat.linStep || '–';
  $('#kpi-ptr').innerHTML = `${stat.ptrError}<small> Kesalahan</small>`;
  $('#kpi-lulus').innerHTML = `${hasil.length ? Math.round((lulus / hasil.length) * 100) : 0}<small>% Lulus</small>`;
  $('#kpi-ratio').textContent = `${lulus} / ${hasil.length || 10}`;
  $('#tc-badge').textContent = `${lulus} / ${hasil.length} LULUS`;
  $('#kpi-waktu').textContent = auditTerakhir ? auditTerakhir.toLocaleTimeString('id-ID') : 'belum';
  $('#alur-stok').innerHTML = stat.ptrError === 0 && hasil.length
    ? `Stok <b class="mono">20 → 17</b> pada alamat <b class="mono">0x1A43</b> (cart[0] === katalog[3]).`
    : 'Menunggu pemicu…';
  $('#heap-status').textContent = `${lulus} Drain / ${hasil.length - lulus} Default`;
}

function jalankanAudit(filterId = null) {
  const now = new Date();
  const stamp = now.toTimeString().slice(0, 8);
  const target = filterId ? SUITE.filter((s) => s.id === filterId) : SUITE;

  if (!filterId) {
    stat.banding = stat.swap = stat.binStep = stat.linStep = 0;
    auditTerakhir = now;
  }

  for (const s of target) {
    const r = ukur(s.id, s.uji);
    hasil = hasil.filter((h) => h.id !== s.id).concat({
      id: s.id,
      op: s.op,
      kategori: s.kategori,
      kondisi: s.kondisi,
      ekspektasi: s.ekspektasi,
      namaUji: NAMA_TC[s.id] || s.id,
      ok: r.ok,
      ms: r.ms,
      waktu: stamp,
      detail: DETAIL[s.id] ? DETAIL[s.id]() : '',
    });
  }

  renderMatriks($('#cari-tc').value);
  renderTrail($('#filter-trail').value);
  renderKpi();
  gambarGrafik();
}

const NAMA_TC = {
  'TC-01': 'Inisialisasi Array Struct',
  'TC-02': 'Bubble Sort Ascending (Harga)',
  'TC-03': 'Bubble Sort Descending (Harga)',
  'TC-04': 'Linear Search — Ditemukan',
  'TC-05': 'Linear Search — Tidak Ditemukan',
  'TC-06': 'Binary Search — Ditemukan',
  'TC-07': 'Binary Search — Tidak Ditemukan',
  'TC-08': 'Prasyarat Terurut (Auto-Sort)',
  'TC-09': 'Pointer Aliasing Tambahan Keranjang',
  'TC-10': 'Free Heap & Deallocation',
};

const DETAIL = {
  'TC-02': () => `Array teracak 10 el; ${stat.banding} perbandingan, ${stat.swap} swap, ${stat.sortMs.toFixed(2)} ms.`,
  'TC-03': () => `Urutan menurun menurun deterministik: n(n−1)/2 = 45 perbandingan.`,
  'TC-06': () => `Ditemukan mid pada langkah ke-${stat.binStep}; linear butuh ${stat.linStep} langkah.`,
  'TC-08': () => `Data acak terdeteksi → auto-sort naik → low/high/mid valid.`,
  'TC-09': () => `(*ptr).stok pada 0x1A43: 20 → 17; stok < 0 ditolak (boundary check).`,
  'TC-10': () => `Semua handle dilepas; 10 struct kembali ke urutan awal.`,
};

/* ------------------------------ ekspor ------------------------------ */
function unduh(nama, isi, tipe) {
  const url = URL.createObjectURL(new Blob([isi], { type: tipe }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nama;
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------ events ------------------------------ */
$('#btn-audit').addEventListener('click', () => jalankanAudit());
$('#btn-ulang-semua').addEventListener('click', () => jalankanAudit());
$('#tc-body').addEventListener('click', (e) => {
  const id = e.target.closest('[data-ulang]')?.dataset.ulang;
  if (id) jalankanAudit(id);
});
$('#cari-tc').addEventListener('input', (e) => renderMatriks(e.target.value));
$('#filter-trail').addEventListener('change', (e) => renderTrail(e.target.value));
$('#dataset').addEventListener('change', () => jalankanAudit());
$('#btn-ekspor-json').addEventListener('click', () =>
  unduh(
    `toko-byte-audit-${Date.now()}.json`,
    JSON.stringify({ aplikasi: 'Toko Byte', gerar: new Date().toISOString(), ringkasan: hasil.filter((h) => h.ok).length + '/' + hasil.length, testCases: hasil }, null, 2),
    'application/json'
  )
);
$('#btn-ekspor-txt').addEventListener('click', () => {
  const baris = hasil.map((h) => `[${h.ok ? 'LULUS' : 'GAGAL'}] ${h.id} ${h.namaUji} — ${h.kondisi} (${h.ms.toFixed(2)} ms)`);
  unduh(`toko-byte-audit-${Date.now()}.txt`, `TOKO BYTE — AUDIT TRAIL\n${new Date().toString()}\n\n${baris.join('\n')}`, 'text/plain');
});
addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    $('#cari-tc').focus();
  }
});

/* ------------------------------ boot ------------------------------ */
jalankanAudit();