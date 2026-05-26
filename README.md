# 🐮 Generator Kupon Kurban

Aplikasi web untuk **membuat, mencetak, dan memverifikasi kupon pengambilan daging kurban** dengan **barcode unik anti-pemalsuan**. Menggantikan proses manual pembuatan kupon di masjid / panitia kurban.

- ✅ Autentikasi panitia (Supabase Auth)
- ✅ Manajemen penerima (tambah satuan / bulk paste ratusan nama)
- ✅ Generate PDF — **8 kupon per halaman A4**, nama & barcode otomatis
- ✅ Scanner barcode via kamera HP untuk konfirmasi pengambilan
- ✅ Anti-pemalsuan: kode random unik + validasi server + one-time use + audit trail
- ✅ Riwayat pengambilan + export CSV

---

## 🧱 Tech Stack

| Bagian | Teknologi |
| --- | --- |
| Framework | Next.js 14 (App Router, TypeScript) |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | Supabase Auth (`@supabase/ssr`, cookie httpOnly) |
| UI | Tailwind CSS + komponen ala shadcn/ui |
| PDF | `@react-pdf/renderer` |
| Barcode | `bwip-js` (CODE128) |
| Scanner | `html5-qrcode` (kamera WebRTC) |
| Form & Validasi | React Hook Form + Zod |

---

## 🚀 Cara Setup (Langkah demi Langkah)

### 1. Prasyarat
- Node.js 18+ (disarankan 20+)
- pnpm (`npm i -g pnpm`) — atau gunakan npm
- Akun [Supabase](https://supabase.com) (gratis)

### 2. Install dependency

```bash
pnpm install
```

### 3. Buat project Supabase & ambil kredensial

1. Buka [app.supabase.com](https://app.supabase.com) → **New Project**.
2. Isi nama project & **Database Password** (catat password ini!).
3. Setelah project siap, buka **Project Settings**:
   - **API** → salin:
     - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
     - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Database** → **Connection string** → tab **ORMs / Prisma** (atau "Connection pooling"):
     - **Transaction** (port `6543`) → `DATABASE_URL` (tambahkan `?pgbouncer=true`)
     - **Session / Direct** (port `5432`) → `DIRECT_URL`

### 4. Buat file `.env.local`

Salin `.env.example` menjadi `.env.local` lalu isi nilainya:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-xxx.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-xxx.pooler.supabase.com:5432/postgres"
```

> Ganti `[PASSWORD]` dengan database password dari langkah 3.

### 5. Siapkan tabel database (Prisma)

```bash
pnpm prisma generate     # generate Prisma Client
pnpm prisma db push      # buat tabel "penerima" & "redemption" di Supabase
```

> Tabel user dikelola otomatis oleh Supabase Auth (`auth.users`). Prisma hanya menyimpan `userId` sebagai string.

### 6. (Opsional) Matikan konfirmasi email saat development

Agar register langsung bisa login tanpa verifikasi email:
**Supabase Dashboard → Authentication → Providers → Email → matikan "Confirm email".**
Untuk produksi, sebaiknya aktifkan kembali.

### 7. Jalankan dev server

```bash
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000) → **Daftar** akun panitia → mulai pakai.

---

## 📖 Alur Penggunaan

1. **Daftar / Masuk** sebagai panitia.
2. **Dashboard** → **Tambah Penerima** (satuan) atau **Tambah Banyak** (paste daftar nama, satu nama per baris). Setiap penerima otomatis dapat **kode kupon unik 8 karakter**.
3. Centang penerima yang mau dicetak → **Generate PDF Kupon** (atau **Generate PDF Semua**).
4. PDF berisi **8 kupon per halaman A4** — nama penerima & barcode terisi otomatis. Cetak & potong.
5. **Hari H**: buka **/scan** di HP, arahkan kamera ke barcode kupon.
   - ✅ Hijau → valid, tampil nama penerima (beri daging).
   - ⚠️ Kuning → kupon sudah pernah ditukar (kapan).
   - ❌ Merah → kupon palsu / bukan milik panitia ini.
6. **/riwayat** mencatat semua pengambilan (audit) → bisa **Export CSV**.

---

## 🔒 Cara Kerja Anti-Pemalsuan

1. **Kode random unik** — 8 karakter dari alfabet 32 (tanpa karakter ambigu 0/O, 1/I/L) → ~10¹² kombinasi, praktis mustahil ditebak. Kolom `kodeKupon` `UNIQUE` di DB.
2. **Validasi server-side** — scanner mengirim kode ke `/api/redeem`; server cek: kode valid? milik panitia yang login? belum dipakai?
3. **One-time use** — sekali ditukar, status jadi `REDEEMED` dan tidak bisa di-scan ulang. Update bersifat **atomik** (`updateMany where status=AVAILABLE`) sehingga aman dari race-condition dua scanner bersamaan.
4. **Audit trail** — setiap pengambilan dicatat di tabel `redemption` (kapan, oleh siapa, device apa).
5. **Isolasi data** — setiap query difilter `userId` dari session, jadi panitia hanya melihat/menukar kuponnya sendiri.

---

## 🎨 Template Kupon

Aplikasi **sudah punya desain bawaan** (vektor: sapi berkacamata + stub kuning "Ayo, Ambil Daging!"), jadi PDF bisa langsung dibuat **tanpa file gambar apa pun**.

Jika punya artwork sendiri, letakkan di `public/template-kupon.jpg` (atau `.png`). Generator akan otomatis memakainya sebagai background dan hanya overlay nama + barcode. Lihat [public/LETAKKAN-TEMPLATE-DISINI.md](public/LETAKKAN-TEMPLATE-DISINI.md).

> **Fine-tuning posisi:** koordinat nama/barcode ada di [src/components/kupon/KuponPDF.tsx](src/components/kupon/KuponPDF.tsx) (lihat `styles` dan `stylesTpl`). Generate PDF uji dengan nama panjang & pendek, lalu sesuaikan bila perlu.

---

## 📷 Catatan Scanner & HTTPS

Kamera browser hanya bisa diakses lewat **HTTPS** atau **localhost**.

- **Dev di laptop:** `localhost` sudah aman.
- **Dev di HP (uji kamera asli):** jalankan dengan HTTPS lokal atau tunnel:
  ```bash
  pnpm dev --experimental-https      # Next.js HTTPS lokal
  # atau gunakan ngrok / cloudflared menunjuk ke http://localhost:3000
  ```
- **Produksi (Vercel):** otomatis HTTPS.

Jika kamera tidak tersedia/barcode rusak, gunakan tombol **Input Manual** untuk mengetik kode (tercetak di bawah barcode).

---

## ☁️ Deploy ke Vercel

1. Push repo ke GitHub.
2. [vercel.com](https://vercel.com) → **New Project** → import repo.
3. **Environment Variables** → isi keempat variabel dari `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`, `DIRECT_URL`).
4. **Deploy**. Script build sudah otomatis menjalankan `prisma generate`.
5. Tambahkan domain Vercel ke **Supabase → Authentication → URL Configuration → Redirect URLs** bila perlu.

> Jika skema database berubah, jalankan `pnpm prisma db push` dari lokal (memakai `DIRECT_URL`) sebelum deploy.

---

## 👥 Skenario Banyak Panitia

Untuk MVP, beberapa panitia yang men-scan harus **login memakai akun yang sama** (mis. satu akun "Panitia Masjid X"). Semua kupon yang dibuat & di-scan terikat ke `userId` akun tersebut.

---

## ✅ Checklist Uji Coba Sebelum Idul Adha

Lakukan **minimal H-1**:

- [ ] Register & login berhasil.
- [ ] Tambah beberapa nama (satuan + bulk).
- [ ] Generate PDF, cek 8 kupon/halaman, nama & barcode muncul.
- [ ] **Cetak** 1 halaman, potong, pastikan barcode tajam.
- [ ] Scan barcode hasil cetak dengan **HP** (kamera belakang) → muncul hijau + nama.
- [ ] Scan ulang kupon yang sama → muncul kuning (sudah ditukar).
- [ ] Ketik kode acak → muncul merah (tidak valid).
- [ ] Uji **Input Manual**.
- [ ] Cek dashboard: statistik & status ter-update.
- [ ] Cek **/riwayat** & **Export CSV**.

---

## 🗂️ Struktur Singkat

```
src/
├── app/
│   ├── (auth)/login, register
│   ├── (dashboard)/dashboard, generate, scan, riwayat   # terproteksi
│   └── api/penerima, redeem, riwayat, generate-pdf       # route handlers
├── components/ui, kupon, scanner, penerima, navbar
├── lib/ prisma, supabase, barcode, kode-generator, feedback, template
└── middleware.ts   # proteksi route + refresh session
```

## 📜 Perintah Berguna

```bash
pnpm dev            # dev server
pnpm build          # build produksi (prisma generate + next build)
pnpm start          # jalankan hasil build
pnpm db:push        # sinkronkan skema ke DB
pnpm db:studio      # buka Prisma Studio (lihat/edit data)
```
