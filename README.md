# 🌐 AutoBrowser — Browser Automation Platform

AdsPower-inspired QA automation platform with isolated browser profiles, synthetic test-user generation, and Playwright-powered automation engine.

---

## 📋 Features

- **Browser Profile Management** — Create, start, stop, duplicate isolated browser profiles
- **Synthetic Test Users** — Generate fake users via Faker API and assign to profiles
- **Test Scenario Builder** — Define reusable automation workflows with step-by-step actions
- **Task Manager** — Queue and run automation tasks with BullMQ
- **Playwright Automation** — Full browser automation: navigate, fill, click, assert, screenshot
- **Real-time Logs** — Browser, console, network, and execution logs per run
- **Screenshot Capture** — Auto screenshots on success/failure + manual
- **Error Detection** — HTTP errors, JS errors, console errors, network failures
- **Test Reports** — Detailed report per test run with full audit trail
- **Modern Dashboard** — Live stats overview with recent tasks and errors

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, Tailwind CSS, TanStack Query, Zustand |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Queue | Redis + BullMQ |
| Automation | Playwright (Chromium) |
| Auth | JWT |
| Logging | Winston |

---

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+
- Docker & Docker Compose

### 2. Start the database and Redis

```bash
cd browser-automation
docker-compose up -d
```

This starts:
- PostgreSQL on port `5432`
- Redis on port `6379`

### 3. Install dependencies

```bash
# Root monorepo packages
npm install

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 4. Setup backend

```bash
cd backend

# Copy env (already done — edit if needed)
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed demo data (admin user + demo profile + scenario)
npx ts-node prisma/seed.ts
```

### 5. Run the application

**Terminal 1 — Backend API + Worker:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Or run everything from root:
```bash
npm run dev
```

---

## 🌍 Access

| Service | URL |
|---|---|
| Frontend (Dashboard) | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| Bull Board (Queue UI) | http://localhost:4000/admin/queues |
| Prisma Studio | `npx prisma studio` (inside backend/) |

---

## 🔑 Default Login

```
Email:    admin@browserauto.local
Password: admin123
```

---

## 📂 Project Structure

```
browser-automation/
├── docker-compose.yml          # PostgreSQL + Redis
├── package.json                # Monorepo root
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.ts             # Demo data
│   └── src/
│       ├── index.ts            # Server entry
│       ├── worker.ts           # Worker entry
│       ├── app.ts              # Express setup
│       ├── controllers/        # Request handlers
│       ├── routes/             # API routes
│       ├── middleware/         # Auth + error handler
│       ├── utils/              # Prisma, Redis, BullMQ, Logger
│       └── workers/
│           └── automationWorker.ts  # Playwright worker
│
└── frontend/
    └── src/
        ├── app/
        │   ├── dashboard/      # Dashboard overview
        │   ├── profiles/       # Browser profile management
        │   ├── test-users/     # Synthetic test users
        │   ├── scenarios/      # Test scenario builder
        │   ├── tasks/          # Task manager + detail
        │   ├── reports/        # Reports list + detail
        │   └── login/          # Authentication
        ├── components/
        │   ├── layout/Sidebar.tsx
        │   └── shared/         # StatusBadge, StatCard, Loader
        └── lib/
            ├── api.ts          # Axios API client
            ├── authStore.ts    # Zustand auth state
            └── utils.ts        # Helpers
```

---

## 🔌 API Reference

| Method | Route | Description |
|---|---|---|
| POST | /api/auth/login | Login |
| GET | /api/dashboard/stats | Dashboard stats |
| GET/POST | /api/profiles | List / Create profiles |
| POST | /api/profiles/:id/start | Start profile |
| POST | /api/profiles/:id/stop | Stop profile |
| GET/POST | /api/test-users | List / Get users |
| POST | /api/test-users/generate | Generate 1 user |
| POST | /api/test-users/generate-multiple | Bulk generate |
| POST | /api/test-users/:id/assign | Assign to profile |
| GET/POST | /api/scenarios | List / Create scenarios |
| GET/POST | /api/tasks | List / Create tasks |
| POST | /api/tasks/:id/start | Queue task for automation |
| POST | /api/tasks/:id/stop | Stop task |
| GET | /api/reports | All test run reports |
| GET | /api/reports/:runId | Single report detail |
| GET | /api/reports/:runId/logs | Execution logs |
| GET | /api/reports/:runId/network | Network logs |
| GET | /api/reports/:runId/screenshots | Screenshots |

---

## 🎭 Automation Step Actions

| Action | Description |
|---|---|
| `NAVIGATE` | Go to URL |
| `CLICK` | Click an element |
| `FILL` | Fill an input field |
| `SELECT` | Select dropdown option |
| `WAIT_FOR_ELEMENT` | Wait for element to appear |
| `WAIT_FOR_URL` | Wait for URL to match |
| `ASSERT_TEXT` | Assert element text content |
| `ASSERT_VISIBLE` | Assert element is visible |
| `ASSERT_URL` | Assert current URL |
| `SCREENSHOT` | Take a screenshot |
| `SCROLL` | Scroll to element |
| `HOVER` | Hover over element |
| `PRESS_KEY` | Press keyboard key |
| `EVALUATE` | Run JavaScript in browser |

### Template Variables in Steps

Use `{{user.xxx}}` placeholders in step values:

```
{{user.firstName}}
{{user.lastName}}
{{user.email}}
{{user.username}}
{{user.password}}
```

---

## 🐳 Production Deployment

```bash
# Build backend
cd backend && npm run build

# Build frontend
cd ../frontend && npm run build

# Start API
cd backend && npm start

# Start Worker
cd backend && npm run start:worker

# Start Frontend
cd frontend && npm start
```

Use PM2 for process management:
```bash
npm install -g pm2
pm2 start dist/index.js --name "bap-api"
pm2 start dist/worker.js --name "bap-worker"
```

---

## ⚠️ Legal & Ethical Use

This platform is designed exclusively for:
- Authorized QA testing environments
- Staging / sandbox / localhost setups
- Test automation on systems you own or have permission to test

**Do NOT use to:**
- Test production systems without authorization
- Create fraudulent accounts
- Bypass CAPTCHA or anti-bot protections
- Spam third-party platforms

---

## 📄 License

MIT
