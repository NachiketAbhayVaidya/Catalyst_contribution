# Catalyst — Backend

Backend API for **Catalyst**, a gamified learning platform (LMS + XP/gamification + AI Coach +
analytics) for a four-year student development programme. This repo is the API only — it has no
frontend; a separate client consumes these endpoints.

## Tech stack

- **Runtime**: Node.js, Express 5
- **Database**: MongoDB Atlas via Mongoose
- **Auth**: JWT (access + refresh cookies), bcrypt password hashing, role-based access control
- **File storage**: Cloudinary (abstracted behind `src/utils/cloudinary.js`)
- **AI**: Google Gemini via `@google/generative-ai`, behind a provider-agnostic `AIService`
  (`src/services/ai/`) — swapping providers means adding one file, not touching callers
- **Validation**: Zod
- **Tests**: Jest + Supertest + `mongodb-memory-server`

## Architecture

```
Client → Express (routes) → Middleware (auth, validation, errors)
       → Controllers (thin) → Services (business logic) → Mongoose models → MongoDB
```

Business logic lives in `src/services/`, never in controllers or routes:

- `services/gamification/` — XP ledger, levels, streaks, achievements, milestones,
  leaderboard, missions. `gamification.service.js` is the single entry point
  (`onActivityCompleted`) that orchestrates all of these when a student completes something.
- `services/ai/` — `ai.service.js` is the provider-agnostic interface
  (`chatWithCoach`, `reviewSubmission`, `generateQuizQuestions`, `generateNudge`,
  `generateRecommendation`, `generateFeedback`). `context.builder.js` assembles a
  single student's own data only — the AI never sees another student's data. AI-suggested
  scores/reviews are stored separately from official scores and never presented as official
  until an admin approves them.
- `services/notifications/` — in-app notification creation, respecting per-user muted types.

## Folder structure

```
src/
  app.js  index.js  constants.js
  config/        # env.js (validated env access), levels.config.js (XP→level thresholds)
  db/            # mongoose connection
  models/        # all Mongoose schemas + index.js (registers every schema at boot)
  controllers/   # thin request handlers
  routes/        # route wiring
  middlewares/   # auth, validation, error handling, multer
  services/      # gamification/, ai/, notifications/
  utils/         # ApiError, ApiResponse, asyncHandler, cloudinary
  validators/    # Zod schemas
seeds/           # seed.js + demo data
tests/           # Jest test suites
```

## Environment variables

Copy `.env.example` to `.env` and fill in real values. Required: `PORT`, `MONGO_URI`,
`CORS_ORIGIN`, `ACCESS_TOKEN_SECRET`/`_EXPIRY`, `REFRESH_TOKEN_SECRET`/`_EXPIRY`. Optional:
Cloudinary keys (needed once file-upload endpoints land), `AI_PROVIDER`/`GEMINI_API_KEY` (AI
Coach falls back to a clear 503 config error if unset, rather than crashing).

`CORS_ORIGIN` must be an exact origin (not `*`) once a frontend is calling this API with
cookies — browsers reject wildcard origins when `credentials: true` is set.

`.env` must never be committed — it's in `.gitignore`. If your local `.env` ever ends up in
git history, rotate every credential in it.

## Development

```bash
npm install
npm run dev        # nodemon, loads .env automatically
npm run seed        # creates demo admin/students/team/course (idempotent)
npm test             # runs the Jest suite (spins up an in-memory MongoDB replica set)
```

## Demo accounts

Created by `npm run seed`, password `Password@123` for all:

- Admin: `admin@catalyst.demo`
- Student: `student@catalyst.demo` (plus two more students in "Team Alpha" for
  leaderboard/team testing)

## API (Phase 1)

```
POST   /api/v1/auth/register            (public — always creates a student account)
POST   /api/v1/auth/register-admin      (admin only — provisions another admin/trainer)
POST   /api/v1/auth/login
POST   /api/v1/auth/logout              (auth required)
POST   /api/v1/auth/refresh-token
GET    /api/v1/auth/me                  (auth required)
POST   /api/v1/auth/change-password     (auth required)

GET    /api/v1/student/dashboard    (student role)
GET    /api/v1/student/xp-history   (student role)

GET    /api/v1/admin/analytics/overview  (admin role)
```

Course/activity/assignment/quiz/submission/team/leaderboard/mission/competition/notification/AI
endpoints land in Phases 2–6 (see development plan).

## Development plan

| Phase | Scope |
|---|---|
| 1 — Foundation | Schema, auth, base middleware, gamification/AI service skeletons *(this state)* |
| 2 — Student experience | Courses/activities/assignments CRUD (read + enroll), submissions, progress |
| 3 — Admin experience | Full admin CRUD, submission review/scoring, student/team management |
| 4 — Gamification | Real achievement/milestone/mission triggers, weekly contests, team scoring |
| 5 — AI | AI Coach chat endpoint, submission review endpoint, AI quiz generation, nudges |
| 6 — Analytics | Admin analytics/insights, reports, escalation detection |
| 7 — Polish | Rate limiting, full seed data volumes, broader test coverage, security pass |

## Security notes

- XP, scores, and achievements are never trusted from the client — all gamification state
  changes go through `GamificationService`/`XPService` on the backend, and every XP change is
  recorded in an immutable `XPTransaction` ledger.
- AI-suggested scores/feedback are stored separately (`AIReview`) from the official score
  (`Submission.officialScore`), which only an admin can set.
- Passwords are bcrypt-hashed; access/refresh tokens are httpOnly cookies.
- Changing a password invalidates the user's refresh token, forcing re-login on other sessions.
- Admin accounts can only be created by an already-authenticated admin (`/auth/register-admin`)
  or the seed script — `/auth/register` always creates a student.
