# AgriSense Client

React single-page app for AgriSense: farm mapping, disease and pest scans, crop health (NDVI), inventory and the AI chatbot.

## Stack

React 19 · Vite · Tailwind CSS 4 · React Router 7 · Leaflet + leaflet-draw · Axios · Google OAuth

## Structure

```
src/
  api/          Axios clients per feature (all calls go to the Express backend)
  components/   Navbar, Hero, ChatbotWidget and other shared UI
  context/      AuthContext / AuthProvider (session restore, login state)
  pages/        Route pages; workspace pages are code-split with React.lazy
```

Routes: `/` landing, `/login`, `/signup`, password reset, and a protected `/workspace` area with dashboard, disease detection, pest detection, crop health, inventory, detection history and profile.

The client talks **only** to the Express backend (`VITE_BACKEND_API_URL`). Authentication uses HttpOnly cookies, and expired access tokens are refreshed transparently by the Axios interceptor in `src/api/axiosConfig.js`.

## Run

```bash
npm install
cp .env.example .env     # set VITE_BACKEND_API_URL and VITE_GOOGLE_CLIENT_ID
npm run dev              # http://localhost:5176
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server on port 5176 |
| `npm run build` | Production build into `dist/` |
| `npm run lint` | ESLint |
| `npm run preview` | Serve the production build locally |
