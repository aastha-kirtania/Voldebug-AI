# ⚡ Voldebug AI Education Portal: Project Handover Walkthrough

Welcome to the **Voldebug AI Education Portal** project documentation. This guide is compiled to provide engineers, product owners, and school administrators with a comprehensive overview of the portal's features, tech stack, codebase structure, database models, core business logic, and local deployment details.

---

## 📖 Table of Contents
1. [Overview & Purpose](#-overview--purpose)
2. [Tech Stack](#%EF%B8%8F-tech-stack)
3. [Repository Architecture](#-repository-architecture)
4. [Role-Based Features](#-role-based-features)
   - [Student Workspace (Standard & Kids Mode)](#1-student-workspace-standard--kids-mode)
   - [Teacher Portal](#2-teacher-portal)
   - [Administrator & Principal Portal](#3-administrator--principal-portal)
5. [Database Schema (Prisma)](#-database-schema-prisma)
6. [Core Technical Pipelines](#-core-technical-pipelines)
   - [Gamification Engine (XP & Streaks)](#1-gamification-engine-xp--streaks)
   - [AI Prompt Moderation & Auditing Pipeline](#2-ai-prompt-moderation--auditing-pipeline)
   - [Real-Time WebSocket Updates](#3-real-time-websocket-updates)
7. [Environment Configuration](#%EF%B8%8F-environment-configuration)
8. [Local Development & Setup Guide](#-local-development--setup-guide)

---

## 🌟 Overview & Purpose

The **Voldebug AI Education Portal** is a gamified learning platform tailored for students aged 12–18. It bridges the gap between classrooms and modern generative AI tools. Through teacher-guided quests, interactive playgrounds categorized into theme-based "worlds," daily challenges, and classroom leaderboards, it turns AI literacy into a gamified adventure while enforcing safety guardrails.

---

## 🛠️ Tech Stack

The portal is designed as a **Turborepo monorepo** with **pnpm workspaces** for speed and full type-sharing between the frontend and backend.

*   **Frontend (`apps/web`)**: 
    *   **Framework**: [Next.js 14](https://nextjs.org/) (App Router & React Server Components)
    *   **Authentication**: [NextAuth.js v5](https://authjs.dev/) (Credentials, Email OTP, and Google/Microsoft OAuth)
    *   **State Management**: [Zustand](https://github.com/pmndrs/zustand) (Client state) & [TanStack React Query v5](https://tanstack.com/query/latest) (Server state)
    *   **Styling**: [Tailwind CSS](https://tailwindcss.com/) with `clsx` and `tailwind-merge`
    *   **Animations**: [Framer Motion](https://www.framer.com/motion/) for fluid transitions and micro-animations
    *   **Real-time Synced Data**: [Socket.io Client](https://socket.io/)
*   **Backend (`apps/api`)**:
    *   **Runtime**: [Node.js](https://nodejs.org/) with [Express.js](https://expressjs.com/) and [TypeScript](https://www.typescriptlang.org/)
    *   **ORM**: [Prisma ORM](https://www.prisma.io/) (PostgreSQL client)
    *   **Real-time Gateway**: [Socket.io Server](https://socket.io/) with Redis adapters
    *   **AI Integration**: [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) (Google Gemini SDK)
    *   **Email Engine**: [Resend API](https://resend.com/) for OTP codes and PDF report dispatches
    *   **Caching & Queue**: [Upstash Redis](https://upstash.com/) (managed via `ioredis`)
    *   **File Export**: [PDFKit](https://pdfkit.org/) for generating parent reports
*   **Shared Packages (`packages/`)**:
    *   `@voldebug/config`: ESLint, Prettier, and compiler (TSConfig) setups.
    *   `@voldebug/types`: Shared validation schemas (Zod) and TypeScript interfaces.

---

## 📂 Repository Architecture

```
voldebug/
├── apps/
│   ├── web/                  # Next.js 14 frontend website
│   │   ├── src/
│   │   │   ├── app/          # App Router paths (Auth, Student, Teacher, Tools)
│   │   │   ├── components/   # UI elements, dashboards, theme toggle
│   │   │   ├── context/      # Theme, locale, and translation providers
│   │   │   └── hooks/        # Custom react-query API integrations
│   └── api/                  # Express.js REST & WebSockets backend
│       ├── prisma/           # Database migration files, seed scripts, & Prisma schema
│       └── src/
│           ├── middleware/   # Express rate limiters, auth hooks, & error handlers
│           └── modules/      # Domain modules (assignments, safety audits, tools)
├── packages/
│   ├── config/               # Linting, formatting & TypeScript shares
│   └── types/                # Shares API types & validation schemas
├── package.json              # Monorepo configuration
├── turbo.json                # Turborepo task settings
└── pnpm-workspace.yaml       # Workspace dependencies
```

---

## 🔐 Authentication, Registration & Onboarding

*   **Admin Account Creation**: Administrator roles cannot self-register. Admin accounts must be created manually (e.g., through database seed scripts or direct SQL database insertions) to ensure school boundaries and platform access are strictly secured.
*   **User Onboarding & School Dropdown**: When Students or Teachers register, they complete a post-signup onboarding step where they associate themselves with an institution. The system fetches the list of registered school entities and presents them inside a dropdown selector, ensuring students and teachers are mapped to the correct workspace tenant.

---

## 👥 Role-Based Features

### 1. Student Workspace (Standard & Kids Mode)
Students log in to access a highly gamified, interactive environment containing:
*   **Gamified Dashboard**: Tracks active levels, current XP progress, and streaks. Level adjustments use the formula: `Level = floor(sqrt(XP / 100)) + 1`.
*   **Worlds of AI (Playground)**: Filtered thematic AI playgrounds where students interact with safety-monitored versions of LLMs:
    *   *Story Forest (Chat AI)*: Conversational chat tools (e.g., ChatGPT, Gemini).
    *   *Robot Factory (Code AI)*: Coding assistants (e.g., GitHub Copilot, Replit AI).
    *   *Creative Studio (Design)*: Text-to-image generators (e.g., DALL-E, Midjourney).
    *   *Writer's Sanctuary (Writing)*: Editing and formatting tools (e.g., Grammarly).
    *   *Space Explorer (Research)*: Fact-checking search engines (e.g., Perplexity AI).
*   **Missions & Quests (Classroom)**: A page displaying direct homework assignments given by class teachers. Includes recommended tools, submission formats, and due dates.
*   **Hall of Fame (Scoreboard)**: A real-time leaderboard updating instantly when teachers grade assignments or grant bonuses.
*   **Kids Mode (Kingdom Mode)**: A friendly theme switchable from the theme toggle. Designed for younger learners, it adapts navigation terms to RPG titles:
    *   *My Kingdom* (`🏰`) -> Student Home Dashboard
    *   *My Quests* (`🌲`) -> Classroom Assignments
    *   *Magic Workshop* (`🤖`) -> AI Tools
    *   *Hall of Fame* (`🏆`) -> Scoreboard
    *   *Adventure Map* (`🗺️`) -> Skill Roadmap
    *   *Myself* (`👤`) -> Profile Page

### 2. Teacher Portal
Teachers monitor classroom analytics and assignments from their dashboard:
*   **Class Management**: Create custom classrooms and generate alphanumeric Join Codes for easy student self-registration.
*   **Assignment Builder**: Deploy quests specifying required AI tools, accepted submission extensions (e.g., `.pdf`, `.png`), due dates, and target XP values.
*   **Grading Console**: Grade submissions, leave qualitative critiques, and trigger database XP transactions.
*   **Analytics Dashboard**: Review class average scores, submission trends, student streaks, and safety flag percentages.
*   **Parent Transparency Reports**: Automated summary generation. Automatically compiles a PDF summary of the student's level, assignments completed, and safety compliance, and forwards it to the registered parent email via Resend.

### 3. Administrator & Principal Portal
School board heads or administrators monitor system health:
*   **System Overview**: Review school-wide statistics (active student and teacher counts, total classes, submission rates, and average grades).
*   **School Center**: Direct list of all enrolled accounts and classes within the organization.
*   **Safety Audits (Audit Logs)**: Comprehensive overview of prompt activity. Tracks student prompts, AI-generated outputs, the tools utilized, and content safety verdicts.
*   **Prompt Safety Override**: Overrides false-positive prompt safety flags returned by the automated evaluation engine.

---

## 🗄️ Database Schema (Prisma)

The PostgreSQL database schema consists of these core entities:

*   **User**: Encompasses students, teachers, and school administrators (defined by the `UserRole` enum). Maintains XP tallies, user authentication metadata, parent notification preferences, and association keys mapping profiles to a local school.
*   **School**: Models the parent educational institute. Binds system admins to member accounts and academic classrooms.
*   **Class & ClassMember**: Models classroom lists. A class points to a unique teacher and maps student users into class lists.
*   **Tool**: Tracks the directory of external generative AI models available in the playgrounds, recording usage frequency and level prerequisites.
*   **Assignment & Submission**: Represents assignments and grading actions. Assignments outline instructions, tool limitations, and reward points. Submissions log final notes, file asset pointers stored on Cloudflare R2, status (`SUBMITTED`, `GRADED`), score, and feedback.
*   **XPTransaction & Streak**: Tracks gamification records. XP transactions detail every event where points were gained (e.g., daily check-ins, submissions). Streaks monitor active daily logins.
*   **AuditLog**: Maintains prompt histories, tracking prompt content, LLM outputs, tools, and automated safety verdicts.

---

## 🔄 Core Technical Pipelines

### 1. Gamification Engine (XP & Streaks)
*   **XP Adjustments**: Managed via transactional operations (`prisma.$transaction`) to prevent write conflicts. Level is recalculated instantly using:
    ```typescript
    const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;
    ```
*   **Streak Tracking**: Triggered on user authentication and API operations. It increments the streak if the last active date was exactly 1 day ago. If the difference is >1 day, it resets the streak to 1. Same-day actions do not alter the streak value.

### 2. AI Prompt Moderation & Auditing Pipeline
Before a prompt reaches Google Gemini Pro, it passes through a two-tiered check:
1.  **Local Keywords Check**: Screens strings for forbidden educational keywords (e.g., `bypass firewall`, `plagiarism`, `hack system`).
2.  **AI Moderation Sandbox Check**: Dispatches the prompt to a secondary utility LLM prompt that evaluates safety parameters and returns a JSON payload:
    ```json
    {
      "isFlagged": true,
      "reason": "Request contains unauthorized exam solution bypass."
    }
    ```
*   *Action on Violation*: If flagged, the API blocks the request, saves the interaction database entry with `isFlagged = true`, and emits a real-time warning over WebSockets to the student's dashboard and the teacher's audit console.

### 3. Real-Time WebSocket Updates
Using Socket.io, connection channels broadcast the following:
*   `ASSIGNMENT_GRADED`: Emitted when a teacher grades a submission, recalculating scores on the student's screen and updating the global scoreboard.
*   `PROMPT_FLAGGED`: Fires whenever a student triggers a safety flag, updating the classroom alerts in the teacher's viewport.

---

## ⚙️ Environment Configuration

Ensure a `.env` file is generated at the workspace root before starting:

```bash
# PostgreSQL Database URL & Migrations
DATABASE_URL="postgresql://username:password@host:port/database"
DIRECT_URL="postgresql://username:password@host:port/database"

# NextAuth credentials
AUTH_SECRET="some-long-random-string-for-auth"
JWT_SECRET="some-random-jwt-secret-key-for-testing"
AUTH_URL="http://localhost:3000"

# Google & Microsoft SSO OAuth credentials
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"

# Upstash Redis Configuration (Caching & Websocket Adapters)
UPSTASH_REDIS_REST_URL="your-upstash-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-redis-token"

# File Storage Bucket (Cloudflare R2 or Amazon S3)
CLOUDFLARE_R2_ACCOUNT_ID="your-r2-account-id"
CLOUDFLARE_R2_ACCESS_KEY_ID="your-r2-access-key-id"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
CLOUDFLARE_R2_BUCKET_NAME="voldebug-uploads"
CLOUDFLARE_R2_PUBLIC_URL="https://your-public-url.com"

# Email Engine Client API
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="onboarding@yourdomain.com"

# Google Gemini API Key
GEMINI_API_KEY="your-gemini-api-key"

# App Server Bind URLs
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:4000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🏃 Local Development & Setup Guide

### 1. Prerequisites
Ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v18.0.0 or higher)
*   [pnpm](https://pnpm.io/) package manager (v9.0.0+)

### 2. Setup
Install project dependencies inside the monorepo root:
```bash
pnpm install
```

### 3. Database Initialization
Once Postgres configuration in `.env` is completed, initialize database schema tables and seed data:
```bash
# Generate the Prisma client SDK
pnpm --filter @voldebug/api db:generate

# Sync schema state definitions to PostgreSQL
pnpm --filter @voldebug/api db:push

# Run database seeder to populate mock tools, users, and class courses
pnpm --filter @voldebug/api db:seed
```

### 4. Running the Development Servers
Launch both the Next.js client app and the Express server concurrently:
```bash
pnpm dev
```
*   **Web Client (Next.js)**: [http://localhost:3000](http://localhost:3000)
*   **API Gateway (Express)**: [http://localhost:4000](http://localhost:4000)
