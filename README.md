# Ledger — Personal Finance Tracker

Built with React + Vite + Recharts.

## Getting started

Make sure you have [Node.js](https://nodejs.org/) installed (v18 or newer).

### 1. Install dependencies

```bash
npm install
```

### 2. Start the dev server

```bash
npm run dev
```

Then open http://localhost:5173 in your browser. The app hot-reloads as you edit files.

### 3. Build for production

```bash
npm run build
```

Output goes to the `dist/` folder — ready to deploy to GitHub Pages, Netlify, Vercel etc.

## Project structure

```
ledger/
├── index.html          # HTML entry point
├── vite.config.js      # Vite config
├── package.json
└── src/
    ├── main.jsx        # React root
    └── App.jsx         # Everything — components, state, styles
```

## Tech stack

- **React 18** — UI framework
- **Vite** — dev server & bundler
- **Recharts** — charts (AreaChart, PieChart)
- **Google Fonts** — Syne, DM Sans, DM Mono
- **localStorage** — all data persisted locally in the browser

## Features

- Dashboard with cash flow chart & spending breakdown
- Transaction log with filtering, search & CSV export
- Budget tracking with alerts at 80%+ usage
- Savings goals with progress tracking
- Financial calendar — paydays, bills, subscriptions
- Net worth tracker — assets & liabilities
- AI Insights powered by Claude API
- Bank integration preview (demo mode)
- Dark / light mode toggle
- GBP / AUD currency toggle with live exchange rate

## AI Insights

The AI Insights tab calls the Anthropic API directly from the browser.
This works fine for local/personal use. If you deploy it publicly,
move the API call to a backend so your API key isn't exposed.
