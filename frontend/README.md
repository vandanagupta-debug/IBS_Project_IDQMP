# DataForge — AI-Powered Data Quality Validation & Cleaning Platform

Enterprise-grade React frontend for profiling, validating, and cleaning datasets with AI assistance.

## Stack
React 19 · Vite · React Router DOM · Axios · Context API · JWT Auth · Recharts · Framer Motion · React Hook Form

## Getting started

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## Demo login
The login page is pre-filled with a working demo account — just click **Sign In**:
- Email: `ananya.sharma@dataforge.io`
- Password: `Passw0rd!`

Two more mock accounts exist with different roles (Analyst, Viewer) — see `src/utils/mockData.js`.

## Status
All 13 modules are now fully built out:
1. Authentication (Login, Register, Forgot/Reset Password) — JWT, protected/public routes, session persistence, role-based access
2. App shell — collapsible Sidebar, Navbar (search, dark mode, notifications, profile menu), Footer, responsive mobile drawer
3. Dashboard — KPI cards, line/bar/pie/scatter charts, animated gauge, activity feed, AI recommendations, recent uploads/alerts
4. Dataset Upload — drag & drop, progress bars, searchable/paginated dataset table, view/download/delete
5. Data Profiling — row/column/missing/duplicate stats, numeric summary, missing-values chart, column breakdown table
6. Data Validation — check summary, validation details table with status badges, issue-breakdown pie chart
7. AI Anomaly Detection — Isolation Forest / LOF / One-Class SVM cards, scatter plot, flagged-rows table
8. Quality Score — large animated gauge, six weighted dimension bars (Completeness, Validity, Consistency, Accuracy, Freshness, Uniqueness)
9. AI Suggestions — severity + confidence cards with animated Apply flow
10. Data Cleaning — run-pipeline flow, operation summary, before/after comparison, download clean dataset
11. Visualizations — consolidated chart gallery (radial gauge, trend line, bar, pie, scatter, horizontal bar, validation summary)
12. Reports — generate (PDF/Excel/CSV) modal, report history table, alert history
13. Settings — dark mode, language, email/dashboard notification toggles, change password, API key management
14. User Profile — avatar, editable profile info, role badge, last login

## Connecting a real backend
All data currently comes from mock services in `src/api/*Api.js`, which simulate latency and shape responses exactly like a real REST API would. Swap the mock logic inside each function for real `axiosInstance` calls (already wired with JWT header injection and 401 handling) when your backend is ready.
