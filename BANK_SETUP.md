# Bank Integration Setup Guide

## Overview

The bank integration uses TrueLayer's Open Banking API.
TrueLayer is FCA authorised and connects to 40+ UK banks including
Monzo, Barclays, HSBC, Lloyds, NatWest, Starling, Santander and more.

---

## Step 1 — Create a TrueLayer account

1. Go to https://console.truelayer.com
2. Sign up for a free account
3. Create a new application (name it anything, e.g. "Finance Tracker")
4. In the application settings, add this as a **Redirect URI**:
   ```
   http://localhost:3001/callback
   ```
5. Copy your **Client ID** and **Client Secret**

---

## Step 2 — Configure the server

In the `server/` folder:

```bash
# Copy the example env file
cp .env.example .env
```

Then open `server/.env` and fill in:

```
TRUELAYER_CLIENT_ID=your_client_id_from_step_1
TRUELAYER_CLIENT_SECRET=your_client_secret_from_step_1
REDIRECT_URI=http://localhost:3001/callback
TRUELAYER_ENV=sandbox
```

Keep `TRUELAYER_ENV=sandbox` while testing — TrueLayer's sandbox gives you
realistic fake bank data so you can test everything without using real accounts.

Change to `TRUELAYER_ENV=live` when you're ready to connect real accounts.

---

## Step 3 — Start the server

Open a **second terminal** in VS Code (click the + icon in the terminal panel).

```bash
cd server
npm install
npm start
```

You should see:
```
🚀 Finance Tracker server running on http://localhost:3001
   Environment : SANDBOX
   TrueLayer   : credentials loaded ✓
```

---

## Step 4 — Connect your bank

1. Make sure your React app is also running (`npm run dev` in the first terminal)
2. Open http://localhost:5173 in your browser
3. Go to the **Bank Connect** tab
4. Click **Connect My Bank**
5. You'll be redirected to TrueLayer's auth page
6. In sandbox mode, click "Mock" and use test credentials (shown on screen)
7. You'll be redirected back automatically

---

## Step 5 — Import transactions

Once connected:
1. Click **Fetch Transactions** to pull the last 90 days
2. Review the pending transactions — they're auto-categorised
3. Click **Import** on individual ones or **Import All**
4. Imported transactions appear in your Transactions and Income tabs, fully editable

---

## Going live (real bank accounts)

When you're ready to use real accounts:

1. In the TrueLayer console, make sure your app is approved for live access
2. Change `TRUELAYER_ENV=live` in `server/.env`
3. Restart the server (`Ctrl+C` then `npm start`)
4. Reconnect via the Bank Connect tab

---

## Troubleshooting

**"Server not running"** — Make sure you've run `npm start` in the `server/` folder

**"Missing credentials"** — Check your `server/.env` file has the right Client ID and Secret

**Auth redirect fails** — Make sure `http://localhost:3001/callback` is in your TrueLayer redirect URIs

**Transactions not showing** — Try sandbox mode first to confirm the flow works before using live credentials
