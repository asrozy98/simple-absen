# AGENTS.md - Simple Absen (Absensi Guru)

## Project Overview
Website absensi guru sekolah menggunakan Next.js 16 + Google Sheets sebagai database.
Fitur: login (admin/user), absen masuk/pulang, dashboard admin dengan chart (kelola guru + lihat absensi), dashboard user (absen + riwayat), ganti password.

## Tech Stack
- **Framework**: Next.js 16 (App Router, TypeScript, Turbopack)
- **UI**: shadcn/ui + Tailwind CSS v4
- **Auth**: NextAuth.js v5 (Credentials Provider + JWT)
- **Database**: Google Sheets (via googleapis)
- **Password Hashing**: bcryptjs
- **Charts**: recharts
- **Icons**: lucide-react
- **Notifications**: sonner
- **Theme**: Education teal/green (oklch hue 170)

## Commands
```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # ESLint

# Scripts (need --env-file=.env.local)
node scripts/seed-admin.js <username> <password> <name>   # Seed admin user
node scripts/hash-password.js <password>                   # Hash password with bcryptjs
```

## Project Structure
```
src/
├── app/
│   ├── layout.tsx                    # Root layout (Providers, Toaster, Geist font)
│   ├── page.tsx                      # Root → redirect /login
│   ├── globals.css                   # Tailwind + shadcn theme + animations
│   ├── (auth)/                       # Route group: authenticated pages (with sidebar)
│   │   ├── layout.tsx                # Dashboard layout (Sidebar + wrapper)
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Dashboard recap: stat cards + charts
│   │   ├── teachers/
│   │   │   └── page.tsx              # List guru + register guru baru
│   │   ├── attendance/
│   │   │   └── page.tsx              # Semua absensi guru
│   │   ├── user/
│   │   │   ├── clockin/
│   │   │   │   └── page.tsx          # Absen masuk/pulang (live clock)
│   │   │   └── history/
│   │   │       └── page.tsx          # Riwayat absen sendiri
│   │   └── profile/
│   │       └── change-password/
│   │           └── page.tsx          # Ganti password
│   ├── (guest)/                      # Route group: unauthenticated pages
│   │   └── login/
│   │       └── page.tsx              # Login page (split panel)
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts          # NextAuth handler
│       ├── teachers/
│       │   └── route.ts              # GET all, POST register
│       ├── attendance/
│       │   └── route.ts              # GET, POST clock-in/out
│       ├── dashboard/
│       │   └── route.ts              # GET recap data (stats, charts, recent)
│       └── profile/
│           └── change-password/
│               └── route.ts          # POST change password
├── components/
│   ├── ui/                           # shadcn/ui components
│   ├── sidebar.tsx                   # Sidebar navigation (desktop + mobile drawer)
│   └── providers.tsx                 # SessionProvider wrapper
├── lib/
│   ├── auth.ts                       # NextAuth config + auth options
│   ├── google-sheets.ts              # Google Sheets API client
│   └── utils.ts                      # cn() helper (shadcn)
└── types/
    └── next-auth.d.ts                # TypeScript declarations for session.user (id, role, username)
```

**Note**: `src/components/navbar.tsx` exists but is unused (legacy). `scripts/` directory contains utility scripts.

## Route Groups
- **`(auth)`** — All authenticated pages share the dashboard layout with sidebar. URL paths: `/dashboard`, `/teachers`, `/attendance`, `/user/clockin`, `/user/history`, `/profile/change-password`
- **`(guest)`** — Login page only, no sidebar. URL path: `/login`

Role-based access (admin vs user) is handled in page components via `session.user.role`, not via folder nesting.

## Google Sheets Structure

### Tab "Users"
| Column | Type | Description |
|--------|------|-------------|
| A: id | string | UUID unique identifier |
| B: username | string | Login username (unique) |
| C: password | string | bcrypt hashed password |
| D: name | string | Full name |
| E: role | string | "admin" or "user" |
| F: createdAt | string | ISO date string |

### Tab "Attendance"
| Column | Type | Description |
|--------|------|-------------|
| A: id | string | UUID unique identifier |
| B: userId | string | References Users.id |
| C: date | string | YYYY-MM-DD format |
| D: timeIn | string | HH:mm:ss format (null if not yet clocked in) |
| E: timeOut | string | HH:mm:ss format (null if not yet clocked out) |
| F: duration | string | Calculated duration (null if not clocked out yet) |

## Environment Variables (.env.local)
```
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
NEXTAUTH_SECRET=your_random_secret
NEXTAUTH_URL=http://localhost:3000
```

## Auth Flow
1. User enters username + password on login page
2. NextAuth Credentials Provider queries Google Sheets "Users" tab
3. Password compared with bcryptjs
4. On success: JWT created with { id, username, name, role }
5. Session provides user data to client via useSession()
6. `(auth)/layout.tsx` wraps all authenticated pages with Sidebar

## Attendance Flow
1. User clicks "Absen Masuk" → POST /api/attendance with { type: "clockin" }
2. System checks if attendance record exists for today → if yes, cannot clock in again
3. User clicks "Absen Pulang" → POST /api/attendance with { type: "clockout" }
4. System checks if clock-in exists for today → if no, cannot clock out
5. Duration calculated as timeOut - timeIn

## Dashboard API (`/api/dashboard`)
Returns recap data for admin dashboard:
- `totalTeachers`, `totalAdmin` — user counts
- `todayStats` — hadir, belum absen, sudah pulang + nama yang belum absen
- `last7Days` — attendance per day (for bar chart)
- `monthlyStats` — attendance per month (for area chart)
- `hourlyDistribution` — clock-in distribution per hour
- `recentAttendance` — 10 latest attendance records

## Animation Utilities (globals.css)
```css
/* Entry animations */
.animate-fade-in          /* opacity 0→1 */
.animate-fade-in-up       /* fade + slide from bottom */
.animate-fade-in-up-delay-1/2/3  /* staggered delays */
.animate-slide-in-left    /* slide from left */
.animate-scale-in         /* scale 0.95→1 */

/* Hover animations */
.hover-lift               /* translateY(-2px) + shadow increase */
.hover-scale              /* scale(1.02) */
.hover-glow               /* translateY(-1px) + brightness */
```

## Code Conventions
- Server components by default, add "use client" only when needed (interactivity)
- All API responses use NextResponse.json()
- IDs generated using crypto.randomUUID()
- Date/time formatted using Intl.DateTimeFormat for display, ISO for storage
- Password always hashed with bcryptjs before storage
- Google Sheets operations are async, handle errors gracefully
- Use shadcn/ui components consistently (Button, Card, Table, Input, etc.)
- Indonesian language for UI labels and messages
- Route groups `(auth)` and `(guest)` for layout separation (no URL prefix)
- Use `suppressHydrationWarning` on elements rendering dynamic time/date
- `useEffect` with `cancelled` flag pattern for async state updates (React Compiler)
- Sidebar uses `render={<Button />}` pattern instead of `asChild` (base-ui)

## Push Notification (Reminder Absen)
- **Chanel**: Web Push API via `web-push` (tanpa Firebase). Service worker di `public/sw.js`.
- **Env**: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NOTIFY_CONTACT_EMAIL`, `CRON_SECRET`. Generate keys: `npx web-push generate-vapid-keys`.
- **Storage**: Google Sheets tab "Devices" (`id | userId | token | updatedAt | browser | deviceType | os`), 1 baris per token/browser.
- **Alur**: `(auth)/layout.tsx` → `notification-wire.tsx` meminta izin & subscribe → POST `/api/subscribe` (simpan token). Cron GitHub Actions memanggil `/api/remind?type=in|out` dengan header `Authorization: Bearer CRON_SECRET` → cek absensi hari ini (tz Asia/Jakarta) → kirim push ke semua token user → prune token 404/410.
- **Scheduler**: `.github/workflows/remind-masuk.yml` (07:07 & 07:45 WIB = `cron: "7 7 * * *"` + `cron: "45 7 * * *"` + `timezone: "Asia/Jakarta"`) & `remind-pulang.yml` (15:07 & 14:10 WIB = `cron: "7 15 * * *"` + `cron: "10 14 * * *"` + `timezone: "Asia/Jakarta"`). Butuh 2 repo secrets di GitHub: `APP_URL` dan `CRON_SECRET`. Ubah jam = edit `cron:` + push. **Catatan**: GitHub Actions menjalankan scheduled workflow dengan delay acak (bisa 30 menit–jam saat top-of-hour); `timezone:` + menit :07 menghindari bottleneck UTC.
- **Batasan**: push hanya sampai jika user pernah buka situs & beri izin di browser itu (perlu token).

