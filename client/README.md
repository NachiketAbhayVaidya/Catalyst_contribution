# Katalyst — Client

React + Vite + Tailwind v4 + shadcn/ui (`base-nova`, JSX) frontend for the Katalyst gamified learning platform, built against the `Frontend ↔ Backend API Contract v1.0`.

## Getting started

```bash
npm install
npm run dev
```

Demo accounts (mock mode): `rahul@example.com` / student, `admin@example.com` / admin — password `Password123!` for both.

## Mock data vs. the real API

Every screen is built against `src/api/*.js`, a thin service layer matching the contract's `{ success, data }` / `{ success, data, pagination }` response shapes exactly. By default (`VITE_USE_MOCK` unset or `true`) each function resolves against in-memory fixtures in `src/api/mockData.js` instead of hitting a server, so the whole app runs standalone.

To point at the real backend, create `.env.local`:

```
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_USE_MOCK=false
```

No page or component changes are needed — the mock/real branch lives entirely inside `src/api/*.js`.

## Structure

- `src/api/` — one file per contract resource (`auth`, `student`, `courses`, `assignments`, `quizzes`, `sessions`, `gamification`, `leaderboard`, `notifications`, `ai`, `admin`, `files`), plus `client.js` (fetch wrapper, token refresh, error normalization) and `mockData.js`.
- `src/context/AuthContext.jsx` — session state, login/register/logout.
- `src/components/layout/` — top nav, protected route, app shell.
- `src/components/shared/` — cross-page primitives (stat card, list row, status dot, empty/error states).
- `src/components/ui/` — shadcn/ui primitives, themed to the design spec (Pine accent, cream surfaces, hairline borders, no shadows outside floating layers).
- `src/pages/student/`, `src/pages/admin/` — route-level screens.
