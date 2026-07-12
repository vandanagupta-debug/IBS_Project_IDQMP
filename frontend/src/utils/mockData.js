// Centralized realistic mock data for the Data Quality Platform.
// Swap these out for real API responses once the backend is available.

export const MOCK_USERS = [
  {
    id: 'usr_1001',
    name: 'Ananya Sharma',
    email: 'ananya.sharma@dataforge.io',
    password: 'Passw0rd!',
    role: 'Admin',
    avatar: 'https://i.pravatar.cc/150?img=47',
    lastLogin: '2026-07-04T18:22:00Z',
  },
  {
    id: 'usr_1002',
    name: 'Rohan Mehta',
    email: 'rohan.mehta@dataforge.io',
    password: 'Passw0rd!',
    role: 'Analyst',
    avatar: 'https://i.pravatar.cc/150?img=12',
    lastLogin: '2026-07-05T08:10:00Z',
  },
  {
    id: 'usr_1003',
    name: 'Priya Nair',
    email: 'priya.nair@dataforge.io',
    password: 'Passw0rd!',
    role: 'Viewer',
    avatar: 'https://i.pravatar.cc/150?img=32',
    lastLogin: '2026-07-03T11:40:00Z',
  },
];

// NOTE: All dataset-driven mock data (dashboard stats, quality trends,
// anomaly samples, recommendations, etc.) has been removed as part of the
// Phase 3 refactor. Every analysis module now calls the real FastAPI
// backend and derives its data from whichever dataset the user uploaded.
// MOCK_USERS above remains in place only because this project's
// authentication flow is still client-side simulated (no auth backend was
// provided) and is intentionally out of scope for the dataset-driven
// refactor.
