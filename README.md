# AetherTask 🚀
### *Track tasks, collaborate with teams, and deliver projects faster with AetherTask*

AetherTask is a professional, full-stack team collaboration and task management application. It empowers teams to track every task from creation to completion, collaborate in real time, manage projects with role-based access, and ship faster — all from a single, beautifully designed dashboard.


---

## 🎨 Premium UI/UX Design Philosophies
- **Luxury Glassmorphism theme**: Soft, transparent frosted cards, cyber violet/cyan glowing borders, HSL tailormade gradients, and custom obsidian scrolling bars.
- **Micro-Animations**: Hover glowing, slide-in drawers, animated SVG progress meters, and dynamic CSS priority indicator badges.
- **Perfect responsiveness**: Fluid grids supporting viewport sizes starting from mobile up to ultra-widescreen desktop resolutions.

---

## 🚀 Key Architectural Features
1. **Role-Based Access Control (RBAC)**:
   - **System Level**: `ADMIN` (can manage all projects, invite members system-wide, bypass security barriers) or `MEMBER`.
   - **Project Board Level**: `PROJECT_ADMIN` (creator of project, can invite/remove teammates, delete the board) or `MEMBER` (collaborator who can drag-and-drop, create duties, comment).
2. **Interactive Kanban Board**: Built natively using lightweight HTML5 Drag-and-Drop, providing instantaneous, optimistic state transitions, with safe rollbacks on network failures.
3. **Telemetry Metrics Panel**: Real-time SVGs measuring task completion percentages, priority breakdowns, overdue alerts, and live activity streams.
4. **Relational Integrity Database**: Powered by **Prisma ORM** with cascade constraints.

---

## 📂 Codebase Directory Overview

```
/d:/Team Task Manager
├── setup.bat              # One-click local dependencies installer
├── run-dev.bat           # One-click dev servers concurrency launcher
├── server/               # Express API Backend (TypeScript)
│   ├── prisma/
│   │   ├── schema.prisma # Prisma Schema configuration (SQLite / PostgreSQL)
│   │   └── dev.db        # SQLite Local Database file (created on setup)
│   ├── src/
│   │   ├── index.ts      # Server bootstrap & routers mounting
│   │   ├── config/       # Database & Prisma Client instances
│   │   ├── middleware/   # JWT Auth Verification & RBAC Guards
│   │   └── controllers/  # Auth, Projects, Tasks, Comments, Analytics
├── client/               # Vite React SPA (TypeScript + CSS)
│   ├── index.html        # Outfit & Inter luxury Google typography imports
│   ├── vite.config.ts    # Development server proxies mapping to API
│   ├── src/
│   │   ├── main.tsx      # SPA Mount script
│   │   ├── index.css     # Global core Glassmorphism Design System CSS
│   │   ├── services/     # REST client wrappers for automated API fetching
│   │   ├── context/      # AuthContext maintaining signup, login, session states
│   │   └── components/   # DashboardView, ProjectView, KanbanBoard, Drawer
```

---

## ⚡ Local Setup Automation (Windows)

We have provided automation files to make running this stack out-of-the-box seamless.

### Prerequisite
Ensure [Node.js](https://nodejs.org/) (version 18+ recommended) is installed on your local operating system.

### Step 1: Automatic Installation & Database Schema Sync
Double click **`setup.bat`** in the root directory. This automated script will:
- Download dependencies for the backend.
- Create your local database (`dev.db`) and push the database schema using Prisma.
- Download dependencies for the frontend client.

### Step 2: Spin Up Development Servers
Double click **`run-dev.bat`** in the root directory. This launches two isolated console tabs concurrently:
- **Tab 1**: Backend API Server booting on [http://localhost:5000](http://localhost:5000)
- **Tab 2**: Frontend Vite React App booting on [http://localhost:3000](http://localhost:3000)

Open [http://localhost:3000](http://localhost:3000) to access the application!
*Note: The first user registered on the login page will be automatically promoted to `ADMIN` (System Administrator).*

---

## 📡 Core API Blueprint Reference

### **Authentication**
- `POST /api/auth/signup` - Register a user. Body: `{ name, email, password, role }`
- `POST /api/auth/login` - Authenticates user. Body: `{ email, password }`
- `GET /api/auth/me` - Resolves active session token details. *(Auth Header Required)*

### **Projects & Members**
- `POST /api/projects` - Instantiates a project board. *(Auth Header Required)*
- `GET /api/projects` - Retrieves list of active projects user belongs to. *(Auth Header Required)*
- `GET /api/projects/:id` - Fetch project board details including members list and tasks list. *(Auth Header Required)*
- `DELETE /api/projects/:id` - Permadelete project board. *(Requires Project Admin)*
- `POST /api/projects/:id/members` - Invites member to board. Body: `{ email, role }`. *(Requires Project Admin)*
- `DELETE /api/projects/:id/members/:userId` - Removes teammate from board. *(Requires Project Admin)*

### **Task Management**
- `POST /api/projects/:projectId/tasks` - Creates task. Body: `{ title, description, priority, status, dueDate, assigneeId }`. *(Auth Header Required)*
- `PUT /api/tasks/:id` - Updates task properties, reassigns duties, or moves status. *(Auth Header Required)*
- `DELETE /api/tasks/:id` - Deletes task. *(Requires Project Admin or Task Creator)*

### **Comments & Threads**
- `GET /api/tasks/:taskId/comments` - Fetches discussion thread. *(Auth Header Required)*
- `POST /api/tasks/:taskId/comments` - Post comment to thread. Body: `{ content }`. *(Auth Header Required)*

### **Analytics**
- `GET /api/dashboard/stats` - Pulls overall numbers, priority distributions, and recent feeds. *(Auth Header Required)*

---

## 🌐 Railway Live Deployment Guidelines (Mandatory)

Deploying **AetherTask** on Railway is incredibly simple! Since we have packaged the frontend and backend into a single unified service, you only need to deploy **one service** on Railway, and the database will automatically be provisioned using high-performance **PostgreSQL**.

### Step 1: Push the Code to GitHub
Ensure you have committed and pushed all the latest code changes (including our automated build files) to your GitHub repository:
```bash
git add .
git commit -m "feat: configure unified monorepo build and start scripts for Railway"
git push origin main
```

### Step 2: Spin Up PostgreSQL on Railway
1. Log into your [Railway Console](https://railway.app/).
2. Click **New Project** -> **Provision PostgreSQL**.
3. Railway will immediately spin up an active database instance and create a `DATABASE_URL` environment variable.

### Step 3: Deploy the Unified Service
1. Click **New** -> **GitHub Repo** -> select your `team-task-manager` repository.
2. Do **NOT** specify a root directory (keep it as `/` root) so Railway runs the orchestrator in the project root.
3. In the service settings, click on **Variables** -> **New Variable** and add:
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}` (Select reference to the PostgreSQL service variable)
   - `JWT_SECRET`: `your_custom_secure_jwt_secret_string` (Any random string to sign auth tokens)
4. Under **Settings** -> **Networking**, click **Generate Domain** to get your public live URL.

### How it Works Under the Hood ⚙️
1. **Root Orchestrator**: Railway reads our root `package.json` and runs `npm install`, which automatically installs dependencies for both `client` and `server`.
2. **Build Phase**: It triggers the `build` scripts. This compiles Vite's frontend assets into static HTML/CSS/JS in `client/dist`, compiles TypeScript backend code into `server/dist`, and runs `server/scripts/prepare-db.js` which dynamically converts our Prisma schema to use PostgreSQL in production.
3. **Start Phase**: On start, Railway runs `npm start` which triggers `prisma db push` to synchronize your database tables with PostgreSQL on Railway, and then runs the Express server on `$PORT`.
4. **Unified Serving**: The Express server handles API requests under `/api/...` and serves all other requests statically using the compiled React files from `client/dist`.

Your full-stack application is now fully live, persistent, and secure on Railway! 🎉
