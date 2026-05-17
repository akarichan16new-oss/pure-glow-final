# PureGlow AI - Frontend

React frontend for the PureGlow AI recommendation API.

## Quick start

```bash
# 1. Install dependencies (first time only)
npm install

# 2. Start dev server (runs on http://localhost:5173)
npm run dev

# 3. Build for production
npm run build
```

## Folder structure

```
frontend/
├── index.html              <- HTML entry point
├── package.json            <- dependencies + scripts
├── vite.config.js          <- Vite config + API proxy
├── tailwind.config.js      <- Tailwind theme + custom colours
├── postcss.config.js       <- PostCSS plugin chain
├── src/
│   ├── main.jsx           <- React root mount
│   ├── App.jsx            <- App shell (Step 3 expands this)
│   ├── index.css          <- Tailwind + global styles
│   ├── api/               <- Step 2: HTTP client
│   ├── components/        <- Step 4: shared UI components
│   ├── pages/             <- Steps 5-8: route pages
│   └── hooks/             <- custom React hooks
└── public/
    └── favicon.svg
```

## API connection

In dev, Vite proxies `/api/*` and `/health` to `http://localhost:5000`
(your Flask backend). Make sure the backend is running:

```bash
# Terminal 1 -- Flask backend
cd ..
python run.py

# Terminal 2 -- React frontend
cd frontend
npm run dev
```
