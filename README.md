# Duit. — Struk Pengeluaran (Expense Tracker)

Aplikasi web sederhana untuk mencatat pengeluaran harian dengan tampilan
**struk belanja digital**. Dibangun murni dengan HTML, CSS, dan JavaScript
(tanpa framework, tanpa backend).

> **NIM:** 535250128
> **Nama:** Haafizh Arkan Tiasno

---

## Daftar Isi
- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Struktur Proyek](#struktur-proyek)
- [Cara Menjalankan](#cara-menjalankan)
- [Cara Kerja Website](#cara-kerja-website)
  - [1. Gambaran Umum](#1-gambaran-umum)
  - [2. Alur Data](#2-alur-data)
  - [3. Menambah Pengeluaran](#3-menambah-pengeluaran)
  - [4. Menampilkan & Menghitung Total](#4-menampilkan--menghitung-total)
  - [5. Menghapus Satu Data](#5-menghapus-satu-data)
  - [6. Menghapus Semua Data](#6-menghapus-semua-data)
  - [7. Pencarian Data](#7-pencarian-data)
  - [8. Penyimpanan (localStorage)](#8-penyimpanan-localstorage)
- [Tema Visual](#tema-visual)
- [Lisensi](#lisensi)

---

## Fitur

- Menambah data pengeluaran (keterangan, kategori, nominal)
- Menampilkan seluruh riwayat pengeluaran dalam bentuk struk
- Menghitung **total nominal** seluruh pengeluaran
- Menghitung **jumlah transaksi** yang sudah dicatat
- Menghapus satu data pengeluaran
- Menghapus seluruh data dengan dialog konfirmasi
- Pencarian riwayat berdasarkan keterangan atau kategori
- Tombol cepat nominal (+10rb, +25rb, +50rb, +100rb)
- Format nominal otomatis dengan pemisah ribuan
- Data tersimpan permanen di browser (localStorage)
- Notifikasi toast untuk setiap aksi
- Tampilan responsif (desktop & mobile)

---

## Teknologi

| Bagian | Digunakan |
|---|---|
| Struktur | HTML5 |
| Tampilan | CSS3 (Flexbox, Grid, Custom Properties, Animasi) |
| Logika | JavaScript (Vanilla, ES6+) |
| Font | Plus Jakarta Sans & JetBrains Mono (Google Fonts) |
| Penyimpanan | Web Storage API (`localStorage`) |

Tanpa dependensi eksternal, tanpa build tools, tanpa backend.

---

## Struktur Proyek

```
duit-expense-tracker/
├── index.html    ← Struktur halaman
├── style.css     ← Tampilan (tema struk belanja)
├── app.js        ← Logika aplikasi
└── README.md     ← Dokumentasi
```

---

## Cara Menjalankan

### Lokal
1. Clone repo ini:
   ```bash
   git clone https://github.com/k4nnn-969/front-end.git
   ```
2. Buka folder, klik dua kali `index.html` di browser.
   Atau jalankan server lokal:
   ```bash
   python3 -m http.server 8000
   ```
   lalu buka `http://localhost:8000`

### Online (GitHub Pages)
Buka langsung: `https://USERNAME.github.io/duit-expense-tracker/`

---

## Cara Kerja Website

### 1. Gambaran Umum

Website ini adalah **Single Page Application** yang berjalan sepenuhnya
di sisi klien (*client-side*). Tidak ada server, tidak ada database.
Semua data disimpan di **localStorage** browser.

Halaman dibagi menjadi dua area utama:

```
┌────────────────────────────────────────────────┐
│  HEADER  — logo & tanggal hari ini             │
├───────────────┬────────────────────────────────┤
│               │                                │
│  FORM         │  RECEIPT (struk)               │
│  (kasir)      │  - Header toko                 │
│               │  - Nomor struk & tanggal       │
│  - Nama       │  - Daftar item pengeluaran     │
│  - Kategori   │  - Total & jumlah transaksi    │
│  - Nominal    │  - Barcode + kode struk        │
│  - Chip cepat │                                │
│  - Tombol     │                                │
│               │                                │
└───────────────┴────────────────────────────────┘
```

### 2. Alur Data

Aplikasi memakai pola **single source of truth**. Satu array `expenses`
adalah satu-satunya sumber kebenaran. Tampilan selalu di-render ulang
dari array ini setiap kali ada perubahan.

```
   ┌─────────┐  input  ┌──────────┐  push  ┌──────────┐
   │  Form   │────────▶│ validate │───────▶│ expenses │
   └─────────┘         └──────────┘        │  array   │
                                            └────┬─────┘
                                                 │
                                            saveToStorage()
                                                 │
                                                 ▼
                                          ┌─────────────┐
                                          │ localStorage│
                                          └─────────────┘
                                                 │
                                            render() dipanggil
                                                 │
                                                 ▼
                                          ┌─────────────┐
                                          │  Tampilan   │
                                          │  (struk)    │
                                          └─────────────┘
```

Siklus tiap aksi: **ubah array → simpan → render ulang**.

### 3. Menambah Pengeluaran

1. Pengguna mengisi form: keterangan, kategori, nominal.
2. Tombol **Cetak Struk** ditekan → event `submit` ditangkap `addExpense()`.
3. `e.preventDefault()` mencegah halaman reload.
4. `validateForm()` memeriksa:
   - Keterangan tidak boleh kosong.
   - Nominal harus angka > 0.
   - Jika gagal, input diberi border merah + pesan error muncul.
5. Jika valid, objek pengeluaran baru dimasukkan ke depan array:
   ```js
   expenses.unshift({ id, name, amount, category, date });
   ```
6. `saveToStorage()` menyimpan array ke localStorage.
7. `render()` menggambar ulang struk.
8. Form di-reset, toast "berhasil dicetak" muncul.

### 4. Menampilkan & Menghitung Total

Setiap kali `render()` dipanggil:

- Total nominal dihitung:
  ```js
  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  totalAmountEl.textContent = 'Rp ' + formatNumber(total);
  ```
- Jumlah transaksi = panjang array `expenses.length`.
- Setiap item di struk dibuat dari template HTML (`<template id="itemTemplate">`),
  lalu diisi: nomor urut, nama, kategori, waktu, nominal.
- Semua item disatukan dalam `DocumentFragment` agar hanya menempel sekali
  ke DOM (lebih efisien).

### 5. Menghapus Satu Data

Setiap baris item di struk memiliki tombol **×**. Klik tombol ini ditangkap
oleh **event delegation** di parent `<ul id="list">`:

```js
listEl.addEventListener('click', (e) => {
  const del = e.target.closest('.r-item__del');
  if (!del) return;
  deleteExpense(del.closest('.r-item').dataset.id);
});
```

`deleteExpense(id)` akan:
1. Mencari index item di array berdasarkan `id`.
2. Menghapusnya dengan `splice()`.
3. Menyimpan ulang ke localStorage.
4. Render ulang.

> **Kenapa pakai event delegation?** Karena item di-generate ulang setiap
> `render()`. Kalau listener dipasang per tombol, listener-nya akan hilang
> saat render ulang. Satu listener di parent lebih andal.

### 6. Menghapus Semua Data

Tombol **Hapus Semua** memicu `clearAllExpenses()`:
- Jika data kosong → toast "tidak ada data".
- Jika ada → `<dialog id="confirmDialog">` dibuka (`showModal()`).

Dialog menawarkan dua pilihan:
- **Batal** → dialog ditutup, tidak ada yang dihapus.
- **Ya, Hapus Semua** → array dikosongkan, disimpan, dirender ulang.

Dialog `showModal()` memberi backdrop otomatis dan menahan fokus keyboard
(focus trap), jadi UX-nya seperti modal asli tanpa library tambahan.

### 7. Pencarian Data

Input pencarian memicu event `input`:

```js
searchInput.addEventListener('input', (e) => {
  filterQuery = e.target.value.trim();
  render();
});
```

`render()` memanggil `getFiltered()` yang memfilter array berdasarkan
nama atau kategori:

```js
expenses.filter(it =>
  it.name.toLowerCase().includes(q) ||
  it.category.toLowerCase().includes(q)
);
```

**Catatan:** total nominal & jumlah transaksi tetap dihitung dari
**seluruh data**, bukan dari hasil filter. Ini supaya angka total
tidak berubah saat user hanya sedang mencari.

### 8. Penyimpanan (localStorage)

Data disimpan sebagai string JSON:

```js
// Simpan
localStorage.setItem('duit_expenses_v1', JSON.stringify(expenses));

// Muat saat halaman dibuka
const raw = localStorage.getItem('duit_expenses_v1');
expenses = JSON.parse(raw) || [];
```

**Kelebihan:**
- Data tetap ada saat halaman di-refresh atau browser ditutup.
- Tidak butuh server, login, atau database.

**Keterbatasan:**
- Data hanya tersimpan di browser yang dipakai (tidak sinkron antar device).
- Akan hilang jika user membersihkan cache / data browser.
- Kapasitas sekitar 5 MB (cukup untuk ribuan transaksi).

---

## Tema Visual

Tampilan dibuat menyerupai **struk belanja** agar relevan dengan konteks
pencatatan pengeluaran:

| Elemen | Teknik |
|---|---|
| Kertas struk | Warna off-white `#fdfcf7` dengan bayangan `drop-shadow` |
| Tepi robek atas & bawah | Pseudo-element `::before` / `::after` berisi SVG zigzag |
| Font struk | `JetBrains Mono` (monospace, mirip printer termal) |
| Garis titik antar kolom | `border-bottom: dotted` + `flex: 1` sebagai leader |
| Barcode | Murni CSS `repeating-linear-gradient`, tanpa gambar |
| Pembatas `= = =` dan `- - -` | Karakter teks di dalam `<div class="receipt__rule">` |
| Nomor struk & kode | Di-generate acak saat halaman dibuka |

---

## Lisensi

Proyek ini dibuat untuk keperluan tugas akademik. Bebas digunakan
dan dimodifikasi untuk pembelajaran.

---