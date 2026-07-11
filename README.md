# ⚡ Voldebug AI Education Portal

Welcome to the **Voldebug AI Education Portal**, a state-of-the-art, gamified learning platform designed to bridge the gap between students (ages 12–18) and modern AI tools. Through teacher-guided assignments, interactive quizzes, daily challenges, and curated explorations, Voldebug turns AI education into a thrilling, game-like adventure.

---

## 🚀 Key Platform Features

### 👤 Student Workspace

- **Gamified Dashboard**: Track your Level, XP progress, daily streaks, and unlock achievements.
- **Curated Worlds of AI**: Explore AI tools organized into distinct theme-based "worlds" (e.g., Story Forest for Chat, Robot Factory for Coding, Creative Studio for Designing).
- **Missions & Quests**: Complete direct assignments given by your teachers with tool recommendations and due dates.
- **Skill Roadmaps**: Follow interactive pathways to level up your AI literacy.
- **Proficiency Quizzes**: Prove your understanding of AI tools by passing quizzes to earn XP rewards.
- **Classroom & Leaderboards**: See how you rank against classmates in real-time as assignments are submitted and graded.

### 👩‍🏫 Teacher Portal

- **Class Management**: Instantly create classrooms and generate unique join codes for students.
- **Interactive Assignment Builder**: Design quests specifying required AI tools, maximum score, due dates, and accepted submission formats (PDF, images, etc.).
- **Grading Dashboard**: Grade submissions with ease, provide qualitative feedback, and trigger XP adjustments.
- **Parental Reports**: Keep parents in the loop by enabling automated summaries sent directly to their inbox detailing their child's learning progress.
- **Class Analytics**: View class average XP, submission rates, and overall engagement metrics.

### 🛡️ Safety & Safety Auditing

- **Student Activity Log**: Real-time logging of prompts and generated AI responses inside monitored interfaces.
- **Automated Flagging System**: Automatic moderation that logs and flags unsafe or inappropriate prompts for review.

---

## 🛠️ Technology Stack

Voldebug is structured as a **Turborepo** monorepo using **pnpm workspaces** for package management.

### Frontend (`apps/web`)

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router & React Server Components)
- **Authentication**: [NextAuth.js v5](https://authjs.dev/) (Credentials, Email OTP, and Google/Microsoft OAuth)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (Client state) & [TanStack React Query v5](https://tanstack.com/query/latest) (Server state)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with `clsx`, `tailwind-merge`, and custom animation plugins
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for fluid transitions and micro-animations
- **Icons & UI**: [Lucide React](https://lucide.dev/) and custom UI components (CVA, background mesh grids)
- **Realtime Connection**: [Socket.io Client](https://socket.io/)

### Backend (`apps/api`)

- **Runtime**: [Node.js](https://nodejs.org/) with [Express.js](https://expressjs.com/) and [TypeScript](https://www.typescriptlang.org/)
- **ORM**: [Prisma](https://www.prisma.io/) (PostgreSQL client)
- **AI Capabilities**: [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) (Google Gemini SDK)
- **Realtime Events**: [Socket.io Server](https://socket.io/) with a Redis adapter for scale
- **Email Dispatcher**: [Resend API](https://resend.com/) for OTP codes and weekly report delivery
- **File Processing & PDF**: [PDFKit](https://pdfkit.org/) for generating PDF summaries
- **Caching & Queue**: [Upstash Redis](https://upstash.com/) (using `ioredis`)

### Shared Packages (`packages/`)

- [**`@voldebug/config`**](file:///c:/Users/KIIT0001/VoldeBug.AI-main/VoldeBug.AI-main/packages/config): Centralized ESLint rules, Prettier configuration, and TypeScript compiler settings.
- [**`@voldebug/types`**](file:///c:/Users/KIIT0001/VoldeBug.AI-main/VoldeBug.AI-main/packages/types): Shared Zod validation schemas and TypeScript definitions used across both apps.

---

## 📂 Project Architecture

```
voldebug/
├── apps/
│   ├── web/                  # Next.js 14 frontend website
│   │   ├── src/
│   │   │   ├── app/          # App Router paths (Auth, Student, Teacher, Tools)
│   │   │   ├── components/   # Shared & UI primitives (Cards, Modals, Uploads)
│   │   │   ├── context/      # Theme and internationalization contexts
│   │   │   └── hooks/        # Custom react-query wrappers
│   └── api/                  # Express.js REST & WebSockets server
│       ├── prisma/           # Database migration files, seed, & Prisma schema
│       └── src/
│           ├── middleware/   # Rate limiters, request loggers, error handlers
│           └── modules/      # Modular backend domains (assignments, auth, tools)
├── packages/
│   ├── config/               # ESLint, Prettier & TS configs
│   └── types/                # Shared TypeScript types & Zod schemas
├── package.json              # Monorepo configuration
├── turbo.json                # Turborepo task settings
└── pnpm-workspace.yaml       # pnpm workspace layout
```

---

## 🗄️ Database Models (`schema.prisma`)

Voldebug uses a PostgreSQL database structured around these core domains:

- **Schools & Users**: Relates schools to members. Users hold credentials, level thresholds, and onboarding/role selections (`STUDENT`, `TEACHER`, or `ADMIN`).
- **Classes & Members**: Organizes classroom rosters mapping multiple students to teachers.
- **AI Tools Directory**: Holds metadata for integrated AI engines, categorizing them and tracking total student usage count.
- **Assignments & Submissions**: Teachers set due dates and XP values. Submissions record student notes, uploaded file links, grading status, and scores.
- **Gamification Engines**:
  - `Streak`: Logs sequential active logins.
  - `DailyChallenge`: Daily tasks for students.
  - `XPTransaction`: Tracks point allocations per action type.
  - `Badge`: Unlockable achievements with visual tags.
- **Quizzes**: Associated with specific AI Tools to verify proficiency.
- **AuditLog & ParentReports**: Tracks student interaction safety and records historical progress logs emailed to parents.

---

## ⚙️ Configuration & Environment Variables

Create a `.env` file at the root of the workspace. A template format is provided below:

```bash
# ── DATABASE CONFIGURATION (PostgreSQL) ──
DATABASE_URL="postgresql://username:password@host:port/database"
DIRECT_URL="postgresql://username:password@host:port/database" # Needed for migrations

# ── AUTHENTICATION ──
AUTH_SECRET="some-long-random-string-for-auth"
JWT_SECRET="some-random-jwt-secret-key-for-testing"
AUTH_URL="http://localhost:3000"

# ── GOOGLE & MICROSOFT OAUTH ──
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"

# ── CACHING & WEBSOCKETS (Redis) ──
UPSTASH_REDIS_REST_URL="your-upstash-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-redis-token"

# ── FILE STORAGE (Cloudflare R2 or AWS S3) ──
CLOUDFLARE_R2_ACCOUNT_ID="your-r2-account-id"
CLOUDFLARE_R2_ACCESS_KEY_ID="your-r2-access-key-id"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
CLOUDFLARE_R2_BUCKET_NAME="voldebug-uploads"
CLOUDFLARE_R2_PUBLIC_URL="https://your-public-url.com"

# ── EMAIL DISPATCH (Resend) ──
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="onboarding@yourdomain.com"

# ── GOOGLE GEMINI AI ──
GEMINI_API_KEY="your-gemini-api-key"

# ── APPLICATION PATHS ──
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:4000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🏃 Getting Started Locally

### 1. Prerequisites

Ensure you have the following installed on your machine:

- **Node.js** (v18 or higher recommended)
- **pnpm** (v9+ or v10+; check package.json `packageManager`)

### 2. Installation

Clone the repository and run:

```bash
pnpm install
```

### 3. Database Initialization

Once database variables are set in `.env`, build client interfaces and populate the database with seed data:

```bash
# Generate the Prisma client
pnpm --filter @voldebug/api db:generate

# Push schema structure to PostgreSQL database
pnpm --filter @voldebug/api db:push

# Seed the database with AI tools, mock users, and classes
pnpm --filter @voldebug/api db:seed
```

### 4. Running the Project

To run all applications in development mode simultaneously:

```bash
pnpm dev
```

By default:

- The Next.js web application starts at [http://localhost:3000](http://localhost:3000)
- The backend API server starts at [http://localhost:4000](http://localhost:4000)

---

## 🎛️ Monorepo CLI Reference

Command scripts are executable from the root of the workspace using `pnpm`:

| Command          | Description                                           |
| :--------------- | :---------------------------------------------------- |
| `pnpm dev`       | Starts Next.js and Express in development watch mode. |
| `pnpm build`     | Builds all packages and applications for production.  |
| `pnpm lint`      | Runs ESLint analysis across the workspaces.           |
| `pnpm typecheck` | Compiles type checking for TypeScript.                |
| `pnpm format`    | Formats codebase matching Prettier parameters.        |
| `pnpm clean`     | Wipes build targets and node_modules folders.         |

---

## 📄 License & Terms

Consult individual guidelines for local contribution. Refer to `/terms` and `/privacy` within the portal app interface for deployment terms of service.
