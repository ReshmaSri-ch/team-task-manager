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

Deploying **Aether Task** on Railway takes minutes and switches the database automatically to a high-performance production **PostgreSQL** instance!

### Step 1: Initialize Git and Push to GitHub
Run the following standard Git commands in your terminal to initialize and push the repository:
```bash
git init
git add .
git commit -m "feat: initial commit of aether task"
# Create a repository on GitHub, then link and push:
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main
```

### Step 2: Switch Database Engine to PostgreSQL in Production
To support database persistence, Railway requires a durable SQL database. To switch Prisma ORM to use PostgreSQL on Railway:

1. Open `server/prisma/schema.prisma`
2. Change the `datasource db` block:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Run locally or let Railway handle it automatically: `npx prisma generate`

### Step 3: Spin Up PostgreSQL on Railway
1. Log into your [Railway Console](https://railway.app/).
2. Click **New Project** -> **Provision PostgreSQL**.
3. Railway will immediately spin up an active database instance and generate a connection string in the environment variables under `DATABASE_URL`.

### Step 4: Deploy the Backend API Service
1. Click **New** -> **GitHub Repo** -> select your uploaded repository.
2. Select the `/server` folder or specify the **Root Directory** as `server` in the service settings.
3. Add the following **Environment Variables** in the Railway service settings:
   - `DATABASE_URL`: `${{ Postgres.DATABASE_URL }}` (Click "Reference Variable" -> select PostgreSQL `DATABASE_URL`)
   - `JWT_SECRET`: `SelectAnySecureCustomStringToken`
   - `PORT`: `5000`
4. Railway will automatically deploy the Express server, execute `npm run build` and `npm start` (which triggers migrations via the `postinstall` script in `package.json` seamlessly!).
5. Copy your live backend service URL (e.g. `https://aether-task-backend.up.railway.app`).

### Step 5: Deploy the Frontend Client SPA
1. Click **New** -> **GitHub Repo** -> select the same repository.
2. In the service settings, specify the **Root Directory** as `client`.
3. In `client/vite.config.ts`, you can update the proxy target to point to your live backend service URL, or simply set Vite to run builds. (Vite compiles down to pure static HTML/CSS/JS, which can be served by static hosts or via standard static servers).
4. Add a domain in Railway under the Client Service. 

Your application is now fully live, persistent, and secure on Railway! 🎉
