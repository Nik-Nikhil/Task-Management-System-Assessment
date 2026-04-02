# Task Management System

A full-stack task management application built with **Node.js + TypeScript** (backend) and **Next.js + TypeScript** (frontend).

---

## Project Structure

```
Assessment/
├── backend/          # Node.js REST API
└── frontend/         # Next.js web application
```

---

## Tech Stack

### Backend
- **Node.js** with **TypeScript**
- **Express.js** — HTTP server and routing
- **Prisma ORM v7** — database access layer
- **SQLite** (via libsql) — lightweight SQL database
- **JWT** — access tokens (15min) + refresh tokens (7 days)
- **bcryptjs** — password hashing
- **Zod** — request validation

### Frontend
- **Next.js 16** (App Router) with **TypeScript**
- **Tailwind CSS** — styling
- **Axios** — HTTP client with auto token refresh interceptor
- **react-hot-toast** — toast notifications

---

## Features Implemented

### Authentication (Track A requirement)
- User registration with hashed passwords
- Login returning JWT access + refresh token pair
- Token rotation on refresh (old refresh token invalidated)
- Logout invalidates refresh token in database
- Auto-refresh interceptor on frontend — seamlessly retries failed requests after refreshing the token

### Task Management (CRUD)
- Create, read, update, delete tasks
- Toggle task status (PENDING → COMPLETED and back)
- Tasks are scoped to the authenticated user — users cannot access each other's tasks
- Task fields: title, description, status (PENDING / IN_PROGRESS / COMPLETED), priority (LOW / MEDIUM / HIGH), due date

### API Features
- Pagination on GET /tasks (page + limit query params)
- Filtering by status
- Search by title (contains match)
- Proper HTTP status codes (400, 401, 404, 409, 500)
- Validation errors return field-level detail

### Frontend Features
- Login and Register pages
- Protected dashboard (redirects to login if not authenticated)
- Task list with search bar and status filter dropdown
- Create / Edit modal form
- Delete with confirmation
- Toggle complete/incomplete with a single click
- Responsive layout (works on mobile and desktop)
- Toast notifications for all operations

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login, returns tokens |
| POST | /auth/refresh | Refresh access token |
| POST | /auth/logout | Invalidate refresh token |

### Tasks (all require Bearer token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /tasks | List tasks (pagination, filter, search) |
| POST | /tasks | Create task |
| GET | /tasks/:id | Get single task |
| PATCH | /tasks/:id | Update task |
| DELETE | /tasks/:id | Delete task |
| PATCH | /tasks/:id/toggle | Toggle completed status |

---

## Database Schema

```prisma
model User {
  id            Int            @id @default(autoincrement())
  email         String         @unique
  name          String
  password      String         // bcrypt hashed
  tasks         Task[]
  refreshTokens RefreshToken[]
}

model Task {
  id          Int        @id @default(autoincrement())
  title       String
  description String?
  status      TaskStatus @default(PENDING)
  priority    Priority   @default(MEDIUM)
  dueDate     DateTime?
  userId      Int        // foreign key — task belongs to user
}

model RefreshToken {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    Int
  expiresAt DateTime
}
```

---

## Security Decisions

- Passwords are hashed with **bcrypt** (salt rounds: 10) — never stored in plain text
- Access tokens are **short-lived (15 minutes)** to limit exposure if stolen
- Refresh tokens are **long-lived (7 days)** but stored in the database so they can be revoked on logout
- Refresh token **rotation** — each refresh issues a new refresh token and invalidates the old one, preventing replay attacks
- All task endpoints verify `userId` matches the authenticated user — no IDOR vulnerabilities
- CORS configured to only allow requests from the frontend origin

---

## Running the Project

### Prerequisites
- Node.js 18+
- npm

### Backend

```bash
cd backend
npm install
npm run db:generate   # generate Prisma client
npm run dev           # starts on http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev           # starts on http://localhost:3000
```

### Environment Variables (backend/.env)

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_ACCESS_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=4000
FRONTEND_URL="http://localhost:3000"
```

---

## Key Technical Decisions

**Why SQLite?**
Lightweight, zero-config, perfect for a self-contained assessment. Prisma makes it trivial to swap to PostgreSQL or MySQL in production by changing one line in the schema.

**Why Prisma v7 with libsql adapter?**
Prisma v7 moved to a driver adapter model. The libsql adapter provides the SQLite connection while keeping the full Prisma query API.

**Why token rotation?**
A stolen refresh token can only be used once. The moment it's used to get a new access token, the old one is invalidated. If an attacker tries to reuse it, the request fails.

**Why Zod for validation?**
Zod provides runtime type safety with TypeScript inference. Validation errors are caught before they hit the database, and the middleware returns structured field-level error messages to the client.

**Why inline components in dashboard?**
Next.js App Router with Turbopack had an issue resolving component files from a `components/` directory during the build. Inlining `TaskCard` and `TaskModal` directly into the dashboard page resolved the module resolution issue while keeping the code clean and readable.
