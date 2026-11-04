# vidhara.id — Website Korporat + Google Auto Sign-In

> Situs produksi: https://www.vidhara.id/ (PT Vidhara Tekno Solusindo)

## Architecture

Proyek ini memiliki dua mode deployment yang menggunakan storage dan auth layer yang sama (`api/_lib/`):

| Mode | Deskripsi |
|---|---|
| **Express (server.js)** | Server standalone untuk development lokal. Menggunakan module bersama dari `api/_lib/` untuk storage & auth. |
| **Vercel Serverless (api/*.js)** | Fungsi serverless untuk deployment Vercel. Menggunakan module yang sama dari `api/_lib/`. |

Kedua mode menggunakan storage layer (`api/_lib/storage.js`) dan auth layer (`api/_lib/auth.js`) yang identik, sehingga perilaku konsisten di semua environment.

## Local Setup

1. Install dependency:
   ```bash
   npm install
   ```
2. Copy env template:
   ```bash
   copy .env.example .env
   ```
3. Isi `.env`:
   - `GOOGLE_CLIENT_ID`
   - `SESSION_SECRET`
   - `ADMIN_API_KEY`
4. Jalankan server lokal:
   ```bash
   npm run dev
   ```

Server lokal berjalan di `http://localhost:3000`.

## API Endpoint

- `GET /api/config` - kirim konfigurasi client id untuk frontend
- `POST /api/auth/google` - verifikasi token Google + set session cookie
- `GET /api/auth/me` - cek user login saat ini
- `POST /api/auth/logout` - logout
- `GET /api/auth/users` - daftar user terkoneksi (butuh `x-admin-key`)
- `GET /api/health` - health check

Contoh cek daftar user:

```bash
curl -H "x-admin-key: YOUR_ADMIN_API_KEY" http://localhost:3000/api/auth/users
```

## PWA (Progressive Web App)

Website ini adalah PWA lengkap:

| Komponen | File | Keterangan |
|---|---|---|
| Manifest | `public/manifest.webmanifest` | Ikon 192/512 + maskable, shortcuts (Konsultasi, Paket, Karir), `display: standalone` |
| Service Worker | `public/sw.js` | Navigasi network-first + fallback offline, aset stale-while-revalidate, `/api/*` selalu network |
| Registrasi & Install | `public/js/pwa.js` | Dipuat di semua halaman; tombol *Install App* muncul saat browser mengirim `beforeinstallprompt` |
| Ikon | `public/icons/`, `public/apple-touch-icon.png` | Digenerate dari logo (sharp) |

Setelah mengubah file yang di-precache (mis. `css/styles.css`), **naikkan `VERSION` di `public/sw.js`** agar cache lama terhapus saat aktivasi, dan bump parameter `?v=` pada referensi asset di HTML.

Catatan deploy Vercel: `sw.js` dan `manifest.webmanifest` otomatis memakai `Cache-Control: no-cache`/`must-revalidate` via `vercel.json`, sehingga update langsung terpickup.

## Vercel Auto Deploy (Git)

1. Push repo ini ke GitHub/GitLab/Bitbucket.
2. Di Vercel: `Add New Project` -> pilih repo ini.
3. Build settings:
   - Framework Preset: `Other`
   - **Root Directory: KOSONGKAN (root repo)** — jangan diarahkan ke `public/`.
     Jika Root Directory diset ke `public/`, `vercel.json` di root repo tidak terbaca:
     rewrite `/privacy-policy` & `/terms-of-service` gagal (404), function `api/*`
     tidak ter-deploy (404), dan security headers tidak terpasang.
   - Build Command: `cp -r public/* .` (atau kosongkan agar mengikuti `vercel.json`)
   - Output Directory: `.` (atau kosongkan agar mengikuti `vercel.json`)
4. Tambahkan Environment Variables di Vercel Project Settings:
   - `GOOGLE_CLIENT_ID` (wajib)
   - `SESSION_SECRET` (wajib, random panjang)
   - `ADMIN_API_KEY` (wajib, untuk endpoint `/api/auth/users`)
   - `SESSION_TTL_HOURS` (opsional, default `24`)
5. Redeploy.

Setelah ini, setiap push ke branch yang terhubung akan auto-deploy.

## Supaya daftar user persisten di Vercel

Tanpa storage eksternal, Vercel serverless bersifat stateless. Artinya daftar user bisa hilang saat instance berganti.

Disarankan pakai Redis integration (Upstash) lalu set env berikut:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Legacy fallback (jika proyek lama masih pakai Vercel KV):
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

Jika Redis/KV aktif, endpoint `/api/auth/users` akan membaca data persisten dari storage tersebut.

## Google Cloud OAuth Checklist

- Tambahkan domain Vercel production (dan preview jika perlu) ke `Authorized JavaScript origins`.
- Jika pakai custom domain, tambahkan juga custom domain.
- Pastikan `GOOGLE_CLIENT_ID` di Vercel sama dengan OAuth Client ID yang didaftarkan.
