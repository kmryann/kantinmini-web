# 📄 Product Requirement Document (PRD) & Technical Specification

## System Name: **Kantin Mini — Integrated Web Ordering & POS System**
**Version:** 2.0 (Refined Architecture & Design Alignment)  
**Status:** Approved & Ready for Development  

---

## 1. Executive Summary & System Overview

### 1.1 Product Vision
Mengembangkan sistem aplikasi web terintegrasi (*all-in-one web-based ordering & POS system*) untuk **Kantin Mini** yang menghubungkan langsung pelanggan di meja makan, kasir operasional, supervisor/manager, dan pemilik usaha (*admin/owner*).

### 1.2 Business Profile & Operational Baseline
* **Nama Usaha:** Kantin Mini
* **Kapasitas Fisik:** 7 Meja (masing-masing 4 kursi).
* **Model Pemesanan:** *Pay First* (Pembayaran lunas terlebih dahulu sebelum makanan dimasak dan disajikan).
* **Setup Hardware:** 1 Tablet/PC Utama di Meja Kasir (tanpa layar Kitchen Display System / KDS terpisah di dapur).
* **Metode Pembayaran Supported:**
  1. **QRIS Dinamis:** Otomatis melalui Midtrans Core API (didukung Mock Simulator untuk testing/demo).
  2. **Tunai / Cash:** Manual di meja kasir dengan penerbitan Kode Pesanan unik (`#KM-XXX`).
* **Hardware Printer:** Printer Thermal 58mm / 80mm via Web Bluetooth / Web USB (ESC/POS direct printing) dan fallback browser print.

---

## 2. Core Architecture & Tech Stack

Sistem dibangun menggunakan arsitektur monolitik modern yang ringkas, berkinerja tinggi, dan hemat biaya operasional:

* **Framework:** **Next.js (App Router) Fullstack** dengan TypeScript (Satu repository terintegrasi untuk Customer Web App, POS Tablet Kasir, dan Dashboard Admin/Manager).
* **Database:** **PostgreSQL**.
* **ORM:** **Prisma ORM** (Skema deklaratif, migrasi otomatis, TypeScript type-safety penuh, dan Prisma Studio GUI).
* **Real-time Synchronizer:** **Server-Sent Events (SSE) Native** via Next.js Route Handlers (Sangat ringan, hemat bandwidth, tanpa ketergantungan library eksternal, otomatis push status ke HP pelanggan dan tablet kasir).
* **Styling & Motion (Skill Aligned):** **Tailwind CSS** + **Motion / Framer Motion** (Mengadopsi prinsip `apple-design` untuk gestur pegas interaktif dan `frontend-design` untuk estetika visual berkarakter).
* **Thermal Printing Engine:** **Direct Web ESC/POS** via Web Bluetooth / Web USB API (mencetak otomatis tanpa modal print OS) dengan fallback `window.print()`.
* **Payment Gateway:** **Midtrans Core API** (Dynamic QRIS generation & webhook listener) + **Internal Mock Payment Simulator** (untuk pengujian instan tanpa biaya transaksi).
* **Media & Image Storage:** **Hybrid Local Storage** (`/public/uploads`) dengan arsitektur adapter yang siap switch ke Cloud Storage (S3 / Cloudinary) via konfigurasi `.env`.

---

## 3. UI/UX Design System & Aesthetics

Mengacu pada instruksi desain `frontend-design` dan `apple-design`:

### 3.1 Visual Direction: "Modern Warm Eatery"
* **Karakter Visual:** Hangat, bersih, modern, dan membangkitkan selera makan (*Japanese Cafe clean meets modern bistro*). Menghindari tampilan dashboard SaaS generik (tanpa aksen ungu/slate korporat klise).
* **Palet Warna:**
  * *Surface/Background:* Warm Stone / Soft Ivory (`#FBF9F5` & `#F4F0E8`).
  * *Primary Culinary Accent:* Toasted Terracotta / Warm Vermilion (`#D9532F` / `#C8421E`).
  * *Secondary Neutral:* Deep Charcoal / Warm Black (`#1F1D1A`) untuk teks kontras tinggi.
  * *Status Colors:* Muted Olive/Basil Green (Available/Selesai), Warm Amber (Pending Cash/Proses), Muted Brick Red (Sold Out/Void).
* **Tipografi:** System typography berstandar tinggi dengan optical sizing, leading proporsional, dan *negative tracking* pada display heading untuk ketajaman visual.

### 3.2 Motion & Gesture Fluidity (Apple-Style)
* **Zero Latency Feedback:** Efek tekan instant pada `:active` (skala 0.97 dengan `ease-out`) pada semua tombol dan kartu menu.
* **Spring-Physics Bottom Sheets:** Pemilihan varian/saus menu dan keranjang belanja menggunakan *drawer bottom-sheet* berbasis pegas (*critically damped spring*, `damping: 1.0`, `response: 0.35s`).
* **Interruptible Gestures:** Pelanggan dapat menggeser/menutup kembali bottom sheet kapan saja saat animasi berjalan tanpa freeze.
* **Translucent Chrome:** Sticky navbar dan bottom checkout bar menggunakan material *frosted glass* (`backdrop-filter: blur(16px)`) sehingga daftar menu terlihat mengalir di bawahnya.

---

## 4. Role-Based Access Control (RBAC) & Authentication

| Role | Interface Access | Authentication Method | Key Responsibilities |
| --- | --- | --- | --- |
| **1. User (Pelanggan)** | Web Publik via Scan QR Meja | *Guest Session* (Parameter URL meja + Nama Pelanggan) | Memilih menu & varian saus, checkout *Pay First*, bayar (QRIS/Cash), tracking status pesanan. |
| **2. Cashier (Kasir)** | Tablet / PC POS Web App | **PIN Cepat 4–6 Digit** (Khusus tablet bersama) | Monitor antrean meja, verifikasi Cash, auto-print struk & KOT dapur, update status hidangan. |
| **3. Manager (Supervisor)** | Operational Dashboard & POS Overlay | **Email/Password** + **Supervisor PIN** | Toggle *Available/Sold Out*, otorisasi diskon (PIN popup di POS kasir), otorisasi *Void Order*, rekap harian. |
| **4. Admin (Owner)** | Back-Office Full CMS & Analytics | **Email/Password** | Kelola akun staf, CMS Master Menu (wajib foto), generator QR cetak Meja 1–7, laporan & ekspor Excel/CSV. |

---

## 5. Comprehensive Functional Requirements

---

### 📱 MODUL 1: User / Pelanggan (Customer-Facing Mobile Web App)

#### 1.1 Dynamic Table Entry & Session
* **Table ID Binding:** QR Code meja membuka URL dinamis (contoh: `/order?table=3`). Meja terkunci otomatis pada sesi pemesanan.
* **Guest Onboarding:** Tanpa proses registrasi/login. Pelanggan cukup memasukkan **Nama Pelanggan** untuk identifikasi di struk dan tiket dapur.
* **Re-order Handling:** Pelanggan yang memesan ulang di meja yang sama akan diperlakukan sebagai **transaksi baru (tiket KOT terpisah)** tanpa menghapus status pesanan yang sedang berjalan.

#### 1.2 Katalog Menu & Filter
* **Kategori Tab:**
  1. *Ayam & Katsu*
  2. *Pempek*
  3. *Mie, Kwetiau & Nasi Goreng*
  4. *Minuman*
* **Pencarian Cepat:** Search bar instan untuk menemukan menu.
* **Badge & Status:** Label *Best Seller* dan indikator *Sold Out* (tombol tambah otomatis terkunci).

#### 1.3 Modifier & Customization (Interactive Spring Sheet)
* **Pilihan Saus (Single Choice):** Khusus menu Katsu (pilihan 1 dari maksimal 4 varian saus).
* **Special Notes:** Input catatan khusus per item (contoh: *"Bawang goreng dipisah"*, *"Es sedikit"*).

#### 1.4 Cart & Checkout
* **Tipe Pesanan (Wajib):** `[ Makan di Tempat / Dine-in ]` atau `[ Dibungkus / Takeaway ]`.
* **Skema Harga:** **Nett Price** (Sudah termasuk seluruh biaya, tanpa biaya layanan/pajak tersembunyi). Tanpa minimum pembelian.

#### 1.5 Pembayaran (*Pay First Model*) & Timeout
* **Opsi A: QRIS Dinamis:**
  * Menampilkan QRIS resmi (Midtrans) atau simulator QRIS.
  * Dilengkapi countdown timer **15 Menit**.
  * Begitu pembayaran terverifikasi, layar otomatis berpindah ke halaman status pesanan via SSE.
* **Opsi B: Tunai / Cash di Kasir:**
  * Menerbitkan **Kode Pesanan Unik** (misal: `#KM-014`).
  * Dilengkapi tombol *"Salin Kode"* dan instruksi bayar di kasir.
  * Countdown timer **15 Menit** untuk konfirmasi kasir sebelum pesanan kedaluwarsa secara otomatis.

#### 1.6 Tracking Status Pesanan (*3-Dot Progress Indicator*)
Tampilan visual status hidangan yang tersinkronisasi instan via Server-Sent Events (SSE):
1. **Dot 1 — Pesan:** Aktif saat QRIS lunas atau kasir mengonfirmasi pembayaran tunai.
2. **Dot 2 — Proses:** Aktif saat dapur/kasir mulai memasak pesanan.
3. **Dot 3 — Dihidangkan:** Aktif saat hidangan siap diantar ke meja pelanggan.

---

### 💵 MODUL 2: Kasir / POS Staff (Tablet & PC Operations)

#### 2.1 Visual Status 7 Meja (*Table Grid View*)
Grid visual 7 Meja dengan status warna dan indikator pesanan:
* 🟢 **Available (Kosong):** Siap digunakan pelanggan baru.
* 🟡 **Cash Pending:** Ada pesanan menunggu verifikasi uang tunai di meja tersebut.
* 🔵 **Proses:** Pesanan sudah lunas dan sedang dalam proses masak di dapur.
* 🟣 **Dihidangkan:** Makanan telah diantar ke meja.
* **Multi-Order Badge:** Jika satu meja melakukan *re-order*, kartu menampilkan badge (contoh: *"Meja 3 — 2 Pesanan Aktif"*). Mengklik meja akan menampilkan detail per transaksi. Meja baru kembali ke *Available* jika seluruh pesanan selesai.

#### 2.2 Order Queue & Payment Confirmation
* **QRIS Lunas:** Otomatis berbunyi/muncul dan langsung masuk status `Proses`.
* **Cash Entry:** Kasir memilih meja pending, memverifikasi uang fisik, lalu menekan **"Konfirmasi Lunas"**.

#### 2.3 Automatic Thermal Printing Engine
Begitu pesanan berstatus LUNAS (QRIS atau Cash), printer thermal otomatis mencetak 2 rangkap:
1. **Nota Pelanggan:** Header Kantin Mini, ID Transaksi, Nomor Meja, Nama, Detail Menu + Harga, Diskon (jika ada), Total Nett, Metode Pembayaran.
2. **Tiket Dapur (KOT):** Cetak tebal Nomor Meja, Nama Pelanggan, Tipe Pesanan (*Dine-in / Takeaway*), Detail Item + Pilihan Saus + Catatan Khusus *(Tanpa nominal harga)*.

#### 2.4 Status Synchronizer
Tombol satu ketukan bagi kasir untuk memperbarui alur:
`[Proses / Masak]` $\rightarrow$ `[Dihidangkan]` $\rightarrow$ `[Selesaikan Pesanan / Reset Meja]`.

---

### 👔 MODUL 3: Manager (Store Operations & Escalation)

#### 3.1 Quick Menu Availability Toggle
Layar cepat untuk mengubah ketersediaan menu (*Available* $\leftrightarrow$ *Sold Out*) secara instan.

#### 3.2 Supervisor Discount Authorization
* Fitur penerapan diskon nominal (misal: $\text{Rp } 5.000$) atau persentase (misal: $10\%$).
* **Security Lock:** Hak akses terkunci untuk kasir. Kasir dapat memanggil dialog diskon di tablet POS, namun wajib memasukkan **PIN Supervisor / Manager** untuk menerapkannya.

#### 3.3 Void Order Engine & Audit Log
* Kasir atau Manager dapat membatalkan pesanan.
* **Mandatory Reason Note:** Wajib menginput alasan pembatalan (misal: *"Pelanggan salah meja"*, *"Bahan habis"*).
* Tercatat rapi dalam *Audit Log* (ID Transaksi, Waktu, Staf yang membatalkan, dan Alasan).

#### 3.4 Daily Summary Dashboard
Kartu metrik *real-time*:
* Total Omzet Harian (Nett).
* Breakdown Pembayaran (Nominal & Persentase QRIS vs Cash).
* Total Porsi Menu Terjual.
* Ringkasan Pembatalan (*Void Log*).

---

### ⚙️ MODUL 4: Admin / Owner (Back-Office System)

#### 4.1 Staff User Management (RBAC)
CRUD akun staf (`Manager` & `Cashier`) dengan pengaturan PIN Kasir dan Kredensial Manager/Admin.

#### 4.2 CMS Master Data Menu
* **CRUD Menu Lengkap:** Nama, Deskripsi, Kategori, Harga Dasar, dan Opsi Modifier Saus.
* **Foto Menu WAJIB:** Validasi ketat di sisi klien dan server yang menolak penyimpanan jika foto menu tidak diunggah.
* **Media Handling:** Simpan otomatis ke `/public/uploads/menu/` dengan kompresi gambar optimal.

#### 4.3 QR Code Table Generator
* Fitur generate otomatis QR Code Meja 1 s.d. Meja 7 dengan logo Kantin Mini di tengahnya.
* Tombol **"Download Siap Cetak"** (format kartu meja PDF/PNG beresolusi tinggi).

#### 4.4 Analytics & Data Export
* Grafik tren penjualan harian, mingguan, dan bulanan.
* Analisis *Top Selling Items* (Menu Terlaris) vs *Slow Moving Items*.
* Ekspor seluruh data transaksi ke format `.XLSX` (Excel) dan `.CSV`.

---

## 6. Data Model & Entity Specifications (Prisma ORM)

Entitas utama yang dimodelkan dalam database:
1. `User` (id, name, email, passwordHash, pinHash, role: ADMIN | MANAGER | CASHIER)
2. `Table` (id, tableNumber: 1..7, status: AVAILABLE | OCCUPIED | RESERVED)
3. `Category` (id, name, slug, sortOrder)
4. `MenuItem` (id, categoryId, name, description, price, imageUrl, isAvailable, isBestSeller, hasSauceModifier)
5. `Order` (id, orderNumber, tableId, customerName, orderType: DINE_IN | TAKEAWAY, status: PENDING_PAYMENT | PROSES | DIHIDANGKAN | SELESAI | VOID, paymentMethod: QRIS | CASH, paymentStatus: PENDING | PAID | EXPIRED | CANCELLED, subtotal, discountAmount, totalAmount, qrisPayload, voidReason, createdAt, updatedAt)
6. `OrderItem` (id, orderId, menuItemId, quantity, price, sauceOption, notes)
7. `AuditLog` (id, action, performedByUserId, details, timestamp)

---

## 7. Edge Cases & Operational Resilience

1. **Jaringan Terputus / Koneksi Lemah:**
   * SSE klien dilengkapi mekanisme *auto-reconnect* otomatis dengan backoff eksponensial.
   * State keranjang belanja di HP pelanggan disimpan sementara di `localStorage` agar tidak hilang jika halaman ter-refresh tidak sengaja.
2. **Timeout Pesanan:**
   * Pesanan cash/QRIS yang tidak terbayar dalam 15 menit otomatis diberi flag `EXPIRED` oleh cron/background check, membebaskan antrean meja.
3. **Pemesanan Ganda (Re-order) di Meja yang Sama:**
   * Setiap sesi pemesanan baru membentuk `orderNumber` baru dan tiket dapur baru, sehingga kasir dan dapur mengetahui persis hidangan tambahan apa yang perlu dimasak.
4. **Printer Offline / Kertas Habis:**
   * Jika printer thermal Bluetooth/USB tidak tersambung, sistem POS kasir menampilkan dialog konfirmasi cepat dan menyediakan tombol **"Cetak Ulang (Print Fallback)"** menggunakan dialog print browser.