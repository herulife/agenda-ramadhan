# RAMADHAN CERIA — Summary & Roadmap

> **Terakhir diperbarui**: 27 Februari 2026, 17:19 WIB
> **Status**: MVP Fungsional, siap iterasi
> **Dokumen ini dibuat agar AI agent (Gemini Pro / Claude) bisa langsung memahami arsitektur, status, dan melanjutkan pengembangan tanpa ambiguitas.**

---

## 1. DESKRIPSI PROYEK

**Ramadhan Ceria** adalah aplikasi web gamifikasi ibadah Ramadhan untuk anak-anak.
Orang tua membuat akun keluarga, menambahkan anak, menentukan misi harian (sholat, mengaji, membantu, dll), dan anak mengumpulkan poin dari setiap misi yang diselesaikan. Poin bisa ditukar dengan hadiah yang ditentukan orang tua.

**Target pengguna**: Keluarga Indonesia Muslim dengan anak usia TK–SD.

---

## 2. TECH STACK

### Frontend
- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS + inline styles
- **State**: React hooks (`useState`, `useEffect`, `useCallback`)
- **Data fetching**: Axios (`@/lib/api.ts`) — base URL `http://localhost:3005/api`
- **Toast**: `sonner`
- **Icons**: Font Awesome 6 (loaded via CDN in `layout.tsx`)
- **Port**: `localhost:3000`

### Backend
- **Language**: Go (Golang)
- **Framework**: Fiber v2
- **ORM**: GORM v2
- **Database**: PostgreSQL
- **Auth**: JWT (access token disimpan di localStorage + cookie `auth_token`)
- **Password**: bcrypt hash
- **Port**: `localhost:3005`

### Database Credentials (Development)
```
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=000000
DB_NAME=postgres
DB_PORT=5432
```

---

## 3. STRUKTUR DIREKTORI

### Frontend (`frontend/`)
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          ← Halaman login orang tua
│   │   └── register/page.tsx       ← Halaman registrasi (2-step flow)
│   ├── (marketing)/
│   │   └── page.tsx                ← Landing page / halaman utama publik
│   ├── (parent)/
│   │   ├── dashboard/
│   │   │   ├── page.tsx            ← Dashboard utama parent
│   │   │   ├── children/page.tsx   ← CRUD anak (nama, avatar, PIN)
│   │   │   ├── tasks/page.tsx      ← CRUD tugas/misi + MaxPerDay
│   │   │   ├── rewards/page.tsx    ← CRUD hadiah
│   │   │   └── settings/page.tsx   ← Profil, info keluarga, paket
│   │   ├── kiosk/page.tsx          ← "Dashboard Anak" — semua anak + tugas di 1 layar
│   │   ├── leaderboard/page.tsx    ← Klasemen/leaderboard mingguan
│   │   └── super-admin/page.tsx    ← Panel super admin (manage families)
│   ├── (child-gate)/
│   │   └── pilih-jagoan/page.tsx   ← Pilih profil anak + PIN (standalone, bisa diakses via /pilih-jagoan)
│   ├── panel/page.tsx              ← Panel anak 3-fase: pilih anak → PIN → kiosk tugas
│   └── unauthorized/page.tsx       ← Halaman 403
├── context/
│   └── AuthContext.tsx             ← Auth provider (login, logout, user state)
├── hooks/
│   ├── useRoleGuard.ts             ← Role-based route protection (client-side)
│   └── usePlanLimits.ts            ← Hook untuk cek limit paket FREE/PREMIUM
├── lib/
│   └── api.ts                      ← Axios instance dengan interceptor token
└── proxy.ts                        ← Next.js middleware untuk route protection (server-side)
```

### Backend (`backend/`)
```
cmd/api/main.go                     ← Entry point, semua route definitions
internal/
├── database/database.go            ← Koneksi DB + AutoMigrate + migration fixes
├── models/models.go                ← Semua GORM models
├── middleware/
│   ├── auth.go                     ← JWT verification middleware
│   ├── parent_guard.go             ← Cek role = parent
│   ├── child_guard.go              ← Cek role = child
│   └── super_admin.go              ← Cek role = super_admin
├── handlers/
│   ├── auth_handler.go             ← Register, Login, Child Login, Family Children
│   ├── child_handler.go            ← CRUD children
│   ├── task_handler.go             ← CRUD tasks (+ MaxPerDay)
│   ├── reward_handler.go           ← CRUD rewards
│   ├── log_handler.go              ← Get/Save daily logs
│   ├── point_handler.go            ← Get balance
│   ├── redemption_handler.go       ← Redemptions CRUD + approve/reject
│   ├── family_handler.go           ← Family settings
│   ├── analytics_handler.go        ← Analytics (PREMIUM only)
│   ├── leaderboard_handler.go      ← Weekly leaderboard
│   ├── admin_handler.go            ← Super admin: families CRUD, stats, announcements
│   ├── magic_template_handler.go   ← Auto-generate task presets (TK/SD)
│   └── magic_template_reward_handler.go ← Auto-generate reward presets
├── services/
│   ├── auth_service.go             ← Auth business logic
│   ├── task_service.go             ← CompleteTask (+ MaxPerDay check), MagicTemplate
│   └── log_service.go              ← UndoTask logic
├── controllers/
│   ├── auth_controller.go          ← LoginChild controller
│   ├── task_controller.go          ← CompleteTask, KioskComplete, MagicTemplate
│   └── log_controller.go           ← UndoTask controller
└── utils/
    ├── hash.go                     ← bcrypt hash/verify
    ├── jwt.go                      ← Generate/parse JWT
    └── plan_limits.go              ← Check FREE plan limits
```

---

## 4. DATABASE MODELS

### Family
| Field | Type | Keterangan |
|-------|------|------------|
| ID | UUID (PK) | Auto-generated |
| Name | varchar(100) | Nama keluarga |
| Plan | varchar(20) | `FREE` / `PREMIUM` |
| PlanExpiresAt | timestamp | Null = lifetime |
| EnableLeaderboard | bool | Default true |
| Timezone | varchar(50) | Default `Asia/Jakarta` |

### User
| Field | Type | Keterangan |
|-------|------|------------|
| ID | UUID (PK) | |
| FamilyID | UUID (FK → Family) | |
| Role | varchar(20) | `parent` / `child` / `super_admin` |
| Name | string | |
| AvatarIcon | string | Emoji, default `👦` |
| Email | *string (unique) | Null untuk anak |
| Whatsapp | *string | Opsional |
| PasswordHash | *string | bcrypt, null untuk anak |
| PINHash | *string | 4 digit PIN untuk anak |
| PointsBalance | int | Saldo poin, >= 0 |

### Task
| Field | Type | Keterangan |
|-------|------|------------|
| ID | UUID (PK) | |
| FamilyID | UUID (FK) | |
| Name | string | |
| Icon | string | Emoji |
| PointReward | int | Poin per penyelesaian |
| **MaxPerDay** | ***int** | `nil`=1, `0`=unlimited, `N`=maks N kali/hari |
| TaskType | varchar(20) | Default `daily` |
| IsActive | bool | Default true |

### DailyLog
| Field | Type | Keterangan |
|-------|------|------------|
| ID | UUID (PK) | |
| ChildID | UUID (FK → User) | |
| TaskID | UUID (FK → Task) | |
| CompletedDate | date | Tanggal penyelesaian |
| Status | varchar(20) | `verified` |
| EarnedPoints | int | Poin yang didapat |

**NOTE**: Index `idx_child_task_date` BUKAN unique — memungkinkan multiple completions per hari.

### Reward
| Field | Type | Keterangan |
|-------|------|------------|
| ID | UUID (PK) | |
| FamilyID | UUID (FK) | |
| Name | string | |
| Icon | string | Emoji |
| PointsRequired | int | Harga dalam poin |
| IsActive | bool | |

### Redemption
| Field | Type | Keterangan |
|-------|------|------------|
| ID | UUID (PK) | |
| ChildID | UUID (FK) | |
| RewardID | UUID (FK) | |
| PointsSpent | int | |
| Status | varchar(20) | `pending` / `approved` / `rejected` |

### Announcement
| Field | Type | Keterangan |
|-------|------|------------|
| ID | UUID (PK) | |
| Title | string | |
| Message | text | |
| Type | varchar(20) | `info` / `warning` / `promo` |
| IsActive | bool | |

---

## 5. API ROUTES

### Public (Tanpa Auth)
```
POST /api/auth/register            ← { email, password, name, familyName }
POST /api/auth/login               ← { email, password } → { token, user }
POST /api/auth/child/login         ← { childId, pin } → { token }
GET  /api/auth/family/:slug/children ← Daftar anak untuk child-gate
```

### Protected (Butuh JWT di header `Authorization: Bearer <token>`)
```
# Family
GET  /api/family/settings
PUT  /api/family/settings          ← { title }

# Children (Parent)
GET  /api/children
POST /api/children                 ← { name, avatarIcon, pin }
PUT  /api/children/:id
DELETE /api/children/:id

# Tasks
GET  /api/tasks
POST /api/tasks                    ← { name, icon, points, max_per_day }
PUT  /api/tasks/:id
DELETE /api/tasks/:id

# Rewards
GET  /api/rewards
POST /api/rewards                  ← { name, icon, points_required }
PUT  /api/rewards/:id
DELETE /api/rewards/:id

# Daily Logs
GET  /api/logs                     ← query: ?child_id=X&date=YYYY-MM-DD
POST /api/logs

# Complete Task
POST /api/child/tasks/complete     ← (child role) { task_id, date }
POST /api/parent/kiosk/complete    ← (parent role) { child_id, task_id, date }
POST /api/parent/logs/:log_id/undo ← (parent role) Undo/hapus log

# Parent Actions
POST /api/parent/verify-pin        ← { child_id, pin }
POST /api/parent/tasks/magic       ← { template_type: "TK" | "SD" }
POST /api/parent/rewards/magic     ← { template_type: "TK" | "SD" }

# Points & Redemptions
GET  /api/points/:childId          ← { balance: number }
GET  /api/redemptions
GET  /api/redemptions/child/:childId
POST /api/redemptions              ← { child_id, reward_id }
PUT  /api/redemptions/:id/status   ← { status: "approved" | "rejected" }

# Analytics (PREMIUM)
GET  /api/analytics

# Leaderboard
GET  /api/leaderboard

# Announcements
GET  /api/announcements            ← Active announcements untuk semua user
```

### Super Admin (Butuh role `super_admin`)
```
GET    /api/admin/families
POST   /api/admin/families         ← { familyName, parentName, email, password, plan }
DELETE /api/admin/family/:id
PUT    /api/admin/family/:id/plan  ← { plan: "FREE" | "PREMIUM" }
GET    /api/admin/stats
GET    /api/admin/announcements
POST   /api/admin/announcements    ← { title, message, type }
DELETE /api/admin/announcements/:id
```

---

## 6. FITUR YANG SUDAH JADI ✅

### Auth & Akun
- [x] Registrasi orang tua (2-step: nama → email+password)
- [x] Login orang tua (email + password)
- [x] JWT authentication + auto-attach token
- [x] Logout
- [x] Role-based access control (parent, child, super_admin)
- [x] Server-side middleware protection (`proxy.ts`)
- [x] Client-side role guard hooks

### Dashboard Orang Tua (`/dashboard`)
- [x] Ringkasan: jumlah anak, tugas, hadiah
- [x] Daftar anak dengan avatar & poin
- [x] Quick-access ke Panel Anak & Dashboard Anak
- [x] Daftar redemption pending → approve/reject

### Manajemen Anak (`/dashboard/children`)
- [x] CRUD anak (nama, avatar emoji, PIN 4 digit)
- [x] Avatar picker dengan preset emoji
- [x] PIN opsional (untuk akses panel anak)

### Manajemen Tugas (`/dashboard/tasks`)
- [x] CRUD tugas (nama, icon, poin, MaxPerDay)
- [x] Icon picker dengan 26 preset + custom
- [x] Auto-suggest nama misi berdasarkan icon
- [x] Dropdown MaxPerDay: 1x, 2x, 3x, 5x, ∞ unlimited
- [x] Tampilkan info MaxPerDay di list tugas
- [x] Magic Template preset TK & SD (auto-generate 10 tugas)

### Manajemen Hadiah (`/dashboard/rewards`)
- [x] CRUD hadiah (nama, icon, harga poin)
- [x] Magic Template hadiah

### Settings (`/dashboard/settings`)
- [x] Profil hero card (inisial, nama, email)
- [x] Edit nama keluarga
- [x] Salin ID keluarga
- [x] Info paket (FREE/PREMIUM) + fitur yang tersedia
- [x] Tombol upgrade via WhatsApp (untuk paket FREE)
- [x] Tombol logout kecil di atas

### Panel Anak (`/panel`) — 3 Fase
- [x] **Fase 1**: Pilih anak (Netflix-style grid avatar)
- [x] **Fase 2**: Verifikasi PIN (numpad 4 digit)
- [x] **Fase 3**: Kiosk tugas per anak
  - [x] Tombol +/− untuk centang/undo tugas
  - [x] Optimistic UI update
  - [x] Navigasi tanggal (hari sebelum/sesudah)
  - [x] Badge poin & info MaxPerDay (0/1, 2/3, ∞)
  - [x] Tombol + disabled + ✓ hijau saat limit tercapai
  - [x] Tukar poin → pilih hadiah → muncul di dashboard parent
  - [x] Tombol "Ganti Profil" kembali ke Fase 1

### Dashboard Anak / Kiosk (`/kiosk`)
- [x] Semua anak tampil di 1 layar
- [x] Switch anak via tab
- [x] Tombol +/− tugas + MaxPerDay logic
- [x] Navigasi tanggal

### Leaderboard (`/leaderboard`)
- [x] Podium 3 besar (emas, perak, perunggu)
- [x] Animasi rise-up
- [x] List anak lainnya

### Super Admin (`/super-admin`)
- [x] Dashboard statistik global
- [x] Manage families (list, create, delete)
- [x] Toggle paket FREE/PREMIUM
- [x] Manage announcements

### Landing Page (`/`)
- [x] Hero section
- [x] Fitur highlights
- [x] Testimoni
- [x] FAQ
- [x] CTA daftar

### Sistem Poin
- [x] Tambah poin saat complete task
- [x] Kurangi poin saat undo task
- [x] Kurangi poin saat redeem reward (otomatis)
- [x] Kembalikan poin saat redemption rejected

### MaxPerDay (Tugas Berulang)
- [x] Field `MaxPerDay *int` di model Task
- [x] Backend: cek `COUNT(*) >= MaxPerDay` sebelum insert
- [x] Frontend: disable + button saat limit tercapai
- [x] Magic template: set MaxPerDay realistis per tugas

---

## 7. FITUR YANG BELUM JADI ❌ (ROADMAP)

### 7.1 🔐 Google OAuth (Prioritas: TINGGI)
**Status**: Tombol UI sudah ada di `/register`, tapi belum fungsional.

**Yang perlu dibuat**:
- Backend:
  - Install dependency: `golang.org/x/oauth2` + `google.golang.org/api`
  - Buat endpoint `GET /api/auth/google` → redirect ke Google consent
  - Buat endpoint `GET /api/auth/google/callback` → terima code, tukar token, buat/temukan user, generate JWT
  - Buat Google Cloud Project, aktifkan OAuth 2.0, set redirect URI
  - Environment variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URL`
- Frontend:
  - Tombol "Daftar dengan Google" di `/register` → redirect ke `/api/auth/google`
  - Tombol "Masuk dengan Google" di `/login` (belum ada, perlu ditambahkan)
  - Callback handler page atau redirect logic setelah OAuth berhasil

### 7.2 💳 Payment Gateway — Midtrans (Prioritas: TINGGI)
**Status**: Belum ada. Upgrade hanya via link WhatsApp manual.

**Yang perlu dibuat**:
- Backend:
  - Install dependency: `github.com/midtrans/midtrans-go`
  - Buat model `Payment { ID, FamilyID, Amount, Status, MidtransOrderID, MidtransTransactionID, ... }`
  - Endpoint `POST /api/payments/create` → buat Snap token Midtrans
  - Endpoint `POST /api/payments/notification` → webhook Midtrans (publik, tanpa JWT)
  - Logic: setelah payment sukses → update `Family.Plan = "PREMIUM"` + set `PlanExpiresAt`
  - Environment variables: `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION`
- Frontend:
  - Buat halaman `/dashboard/upgrade` dengan pricing card
  - Integrasi Midtrans Snap.js (`<script>`) untuk payment popup
  - Tombol "Upgrade Sekarang" → call API → buka Snap popup
  - Redirect/update UI setelah pembayaran berhasil

### 7.3 📊 Analitik & Statistik (Prioritas: SEDANG)
**Status**: Backend endpoint `GET /api/analytics` ada tapi sangat basic (hanya count). Frontend belum ada halaman.

**Yang perlu dibuat**:
- Backend:
  - Tambahkan query: streak harian per anak, total poin per minggu, persentase misi selesai
  - Endpoint: `GET /api/analytics/child/:childId` — detail per anak
  - Endpoint: `GET /api/analytics/weekly` — ringkasan mingguan
- Frontend:
  - Buat halaman `/dashboard/analytics`
  - Grafik bar/line (gunakan `recharts` atau `chart.js`)
  - Kartu streak: "🔥 5 hari berturut-turut!"
  - Progress ring per tugas
  - Filter per anak & per periode

### 7.4 🔔 Notifikasi / Reminder (Prioritas: RENDAH)
**Status**: Belum ada.

**Yang perlu dibuat**:
- Push notification via Web Push API (service worker)
- Atau: integrasi WhatsApp Business API untuk kirim reminder
- Backend: scheduler via cron job atau goroutine ticker
- Kirim pengingat: "Sudah sholat subuh? 🕋" jam 5 pagi

### 7.5 🔑 Lupa Password (Prioritas: SEDANG)
**Status**: Tombol "Lupa Sandi?" ada di login tapi `href="#"` (tidak fungsional).

**Yang perlu dibuat**:
- Backend:
  - Endpoint `POST /api/auth/forgot-password` → kirim email reset link
  - Endpoint `POST /api/auth/reset-password` → verify token + update password
  - Integrasi email: Resend, SendGrid, atau Nodemailer
  - Generate & simpan reset token (table `password_resets` atau embed di JWT)
- Frontend:
  - Halaman `/forgot-password` — input email
  - Halaman `/reset-password?token=xxx` — input password baru

### 7.6 🚀 Deployment (Prioritas: TINGGI)
**Status**: Hanya berjalan di localhost.

**Opsi deployment**:
- **Frontend**: Vercel (gratis, optimal untuk Next.js)
  - `vercel deploy` atau connect GitHub repo
  - Set environment variable: `NEXT_PUBLIC_API_URL=https://api.ramadhanceria.com`
- **Backend**: Railway / Render / VPS (DigitalOcean/Contabo)
  - Dockerfile sudah (atau buat baru)
  - Set semua env vars (DB, JWT_SECRET, MIDTRANS, GOOGLE)
- **Database**: Supabase (PostgreSQL gratis) atau Railway PostgreSQL
- **Domain**: Beli domain (contoh: ramadhanceria.com)
- **SSL**: Auto via Vercel/Railway

### 7.7 🎨 Polish UI/UX (Prioritas: RENDAH)
- [ ] Animasi transisi antar halaman
- [ ] Skeleton loading di semua page
- [ ] Empty state illustrations
- [ ] Dark mode (opsional)
- [ ] PWA support (install di home screen HP)
- [ ] Responsive testing menyeluruh

---

## 8. BUGS YANG SUDAH DIPERBAIKI ✅

1. **403 Forbidden di `/panel`** — proxy.ts mewajibkan role=child, padahal parent juga perlu akses. Fixed: izinkan `parent OR child`.
2. **React duplicate key di numpad** — digit '9' dan empty spacer punya key sama. Fixed: prefix `btn-` dan `empty-`.
3. **Task tidak bisa dikerjakan >1x/hari** — unique index di DailyLog. Fixed: ganti ke non-unique index + tambah MaxPerDay.
4. **MaxPerDay=0 tidak tersimpan** — GORM skip zero-value int. Fixed: ganti ke `*int` pointer.
5. **Existing tasks masih MaxPerDay=1** — migrasi tidak update existing rows. Fixed: SQL UPDATE di database.go startup.

---

## 9. DESAIN SISTEM

### Color Palette (Brand)
```css
--color-brand-bg: #FFF5E1        /* Background krem */
--color-brand-text: #5F370E       /* Teks utama cokelat tua */
--color-brand-heading: #4A2C0A    /* Heading */
--color-brand-btn: #F9A826        /* Tombol utama amber */
--color-brand-shadow: #B45F06     /* Shadow 3D */
--color-brand-border: #F1DFC0     /* Border lembut */
```

### Design Language
- **Gemoy/Kawaii Style**: rounded-[40px], border-4, shadow 3D `shadow-[0_8px_0_...]`
- **Glassmorphism**: `bg-white/85 backdrop-blur-md`
- **Warm tones**: amber, orange, cokelat
- **Font**: font-[800] dan font-[900] untuk headings (sistem font)
- **3D buttons**: `shadow-[0_6px_0_#color]` + `active:translate-y-1`
- **Emoji icons**: sebagai pengganti icon pack

### Auth Flow
```
[Landing /] → [Login /login] → JWT token → [Dashboard /dashboard]
                  ↓
           [Register /register] (2-step)
                  ↓
           Redirect → /login → login → /dashboard
```

### Panel Anak Flow
```
Parent di /dashboard → klik "Layar Anak" → /panel
   → Fase 1: Pilih avatar anak
   → Fase 2: Masukkan PIN 4 digit
   → Fase 3: Daftar tugas + +/- buttons + tukar hadiah
```

### Paket Limit (FREE)
```go
MaxChildren: 2
MaxTasks: 10
MaxRewards: 5
Analytics: locked
```

---

## 10. CARA MENJALANKAN (DEVELOPMENT)

### Backend
```powershell
cd d:\AGENDA RAMADHAN\ramadhan\ramadhan-ceria\backend
$env:DB_HOST="localhost"
$env:DB_USER="postgres"
$env:DB_PASSWORD="000000"
$env:DB_NAME="postgres"
$env:DB_PORT="5432"
go run ./cmd/api/main.go
# Berjalan di http://localhost:3005
```

### Frontend
```powershell
cd d:\AGENDA RAMADHAN\ramadhan\ramadhan-ceria\frontend
npm run dev
# Berjalan di http://localhost:3000
```

### Buat Super Admin (Manual via SQL)
```sql
-- Jalankan di psql atau tool DB lainnya:
INSERT INTO users (id, family_id, role, name, email, password_hash, avatar_icon)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM families LIMIT 1),
  'super_admin',
  'Admin',
  'admin@ramadhanceria.com',
  '$2a$10$...',  -- bcrypt hash dari password
  '👑'
);
```

---

## 11. CATATAN PENTING UNTUK AI DEVELOPER

1. **GORM zero-value gotcha**: Gunakan `*int` pointer untuk field yang bisa bernilai 0 dan punya `default:X`. GORM skip zero-value pada `Create()`.

2. **Proxy middleware (`proxy.ts`)**: Ini menentukan halaman mana bisa diakses role apa. Jika menambah halaman baru yang butuh auth tertentu, update file ini.

3. **JSON field naming**: Backend Go menggunakan PascalCase (`PointReward`, `MaxPerDay`). Frontend harus akses dengan case yang sama (`task.PointReward`, bukan `task.points`).

4. **Task completion flow**: `POST /api/parent/kiosk/complete` digunakan di `/panel` DAN `/kiosk`. Butuh `child_id`, `task_id`, `date` (format YYYY-MM-DD).

5. **Optimistic UI**: Panel dan kiosk melakukan optimistic update — UI berubah dulu, lalu revert jika API gagal.

6. **Plan enforcement**: Limit FREE plan dicek di backend (`utils/plan_limits.go`) saat create child/task/reward. Analytics di-lock di handler level.

7. **Existing child-gate page**: User baru membuat ulang `/pilih-jagoan` page. Ini terpisah dari `/panel` — bisa diakses standalone oleh anak yang sudah tahu family slug.

8. **Font Awesome**: Loaded via CDN di `layout.tsx`. Gunakan class `fas fa-xxx` untuk solid, `fab fa-xxx` untuk brands.

9. **Design consistency**: Semua halaman memakai tema "gemoy" — rounded corners besar (32px-40px), shadow 3D, warm amber/orange palette. Jangan pakai desain datar/minimalis yang tidak cocok.

10. **Database startup migration**: `database.go` menjalankan SQL fix setiap startup. Ini idempotent (safe dijalankan berulang). Jika menambah migration, pastikan idempotent juga.
