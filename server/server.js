require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const axios   = require('axios');

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));

// ─── Config ────────────────────────────────────────────────────────────────
const {
  TRUELAYER_CLIENT_ID:     CLIENT_ID,
  TRUELAYER_CLIENT_SECRET: CLIENT_SECRET,
  REDIRECT_URI,
  TRUELAYER_ENV = 'sandbox',
  PORT          = 3001,
  FRONTEND_URL  = 'http://localhost:5173',
} = process.env;

const IS_SANDBOX = TRUELAYER_ENV === 'sandbox';
const AUTH_BASE  = IS_SANDBOX
  ? 'https://auth.truelayer-sandbox.com'
  : 'https://auth.truelayer.com';
const API_BASE   = IS_SANDBOX
  ? 'https://api.truelayer-sandbox.com'
  : 'https://api.truelayer.com';

// ─── Token store (in-memory — fine for personal use) ──────────────────────
let tokenStore = {
  accessToken:  null,
  refreshToken: null,
  expiresAt:    null,
};

// ─── Helpers ───────────────────────────────────────────────────────────────
function isConnected() {
  return !!tokenStore.accessToken;
}

function isExpired() {
  return tokenStore.expiresAt && Date.now() > tokenStore.expiresAt - 30_000;
}

async function refreshAccessToken() {
  if (!tokenStore.refreshToken) throw new Error('No refresh token');
  const res = await axios.post(`${AUTH_BASE}/connect/token`, new URLSearchParams({
    grant_type:    'refresh_token',
    refresh_token: tokenStore.refreshToken,
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
  }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

  tokenStore = {
    accessToken:  res.data.access_token,
    refreshToken: res.data.refresh_token || tokenStore.refreshToken,
    expiresAt:    Date.now() + (res.data.expires_in * 1000),
  };
  console.log('🔄 Access token refreshed');
}

async function getToken() {
  if (!isConnected()) throw new Error('Not connected — please link your bank first');
  if (isExpired()) await refreshAccessToken();
  return tokenStore.accessToken;
}

async function tlGet(path) {
  const token = await getToken();
  const res = await axios.get(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// ─── Routes ────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (_, res) => {
  res.json({ ok: true, env: TRUELAYER_ENV });
});

// Connection status
app.get('/api/status', (_, res) => {
  res.json({
    connected:  isConnected(),
    env:        TRUELAYER_ENV,
    expiresAt:  tokenStore.expiresAt,
  });
});

// Step 1 — return the URL to redirect the user to for bank login
app.get('/api/auth-url', (_, res) => {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({ error: 'Missing TRUELAYER_CLIENT_ID or TRUELAYER_CLIENT_SECRET in .env' });
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     CLIENT_ID,
    scope:         'info accounts balance transactions cards offline_access',
    redirect_uri:  REDIRECT_URI,
    providers:     IS_SANDBOX ? 'mock' : 'uk-ob-all uk-oauth-all',
  });

  res.json({ url: `${AUTH_BASE}/?${params}` });
});

// Step 2 — TrueLayer redirects here after the user logs in
app.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    console.error('OAuth error:', error);
    return res.redirect(`${FRONTEND_URL}/bank?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect(`${FRONTEND_URL}/bank?error=no_code`);
  }

  try {
    const tokenRes = await axios.post(`${AUTH_BASE}/connect/token`, new URLSearchParams({
      grant_type:    'authorization_code',
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri:  REDIRECT_URI,
      code,
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    tokenStore = {
      accessToken:  tokenRes.data.access_token,
      refreshToken: tokenRes.data.refresh_token,
      expiresAt:    Date.now() + (tokenRes.data.expires_in * 1000),
    };

    console.log('✅ Bank connected successfully');
    res.redirect(`${FRONTEND_URL}?bank=connected`);
  } catch (err) {
    console.error('Token exchange failed:', err.response?.data || err.message);
    res.redirect(`${FRONTEND_URL}?bank=error`);
  }
});

// Disconnect
app.post('/api/disconnect', (_, res) => {
  tokenStore = { accessToken: null, refreshToken: null, expiresAt: null };
  console.log('🔌 Bank disconnected');
  res.json({ ok: true });
});

// Get all accounts
app.get('/api/accounts', async (_, res) => {
  try {
    const data = await tlGet('/data/v1/accounts');
    res.json(data);
  } catch (err) {
    res.status(err.message.includes('Not connected') ? 401 : 500)
       .json({ error: err.response?.data?.error_description || err.message });
  }
});

// Get balance for a specific account
app.get('/api/accounts/:id/balance', async (req, res) => {
  try {
    const data = await tlGet(`/data/v1/accounts/${req.params.id}/balance`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data?.error_description || err.message });
  }
});

// Get transactions for a specific account (defaults to last 90 days)
app.get('/api/accounts/:id/transactions', async (req, res) => {
  try {
    const from  = req.query.from || new Date(Date.now() - 90*24*60*60*1000).toISOString().split('T')[0];
    const to    = req.query.to   || new Date().toISOString().split('T')[0];
    const data  = await tlGet(`/data/v1/accounts/${req.params.id}/transactions?from=${from}&to=${to}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data?.error_description || err.message });
  }
});

// Get all accounts + their balances in one call (convenience endpoint)
app.get('/api/summary', async (_, res) => {
  try {
    const accountsData = await tlGet('/data/v1/accounts');
    const accounts     = accountsData.results || [];

    const withBalances = await Promise.all(accounts.map(async (acc) => {
      try {
        const balData = await tlGet(`/data/v1/accounts/${acc.account_id}/balance`);
        return { ...acc, balance: balData.results?.[0] };
      } catch {
        return { ...acc, balance: null };
      }
    }));

    res.json({ results: withBalances });
  } catch (err) {
    res.status(err.message.includes('Not connected') ? 401 : 500)
       .json({ error: err.response?.data?.error_description || err.message });
  }
});

// Get transactions for ALL accounts in one call
app.get('/api/all-transactions', async (req, res) => {
  try {
    const from         = req.query.from || new Date(Date.now() - 90*24*60*60*1000).toISOString().split('T')[0];
    const to           = req.query.to   || new Date().toISOString().split('T')[0];
    const accountsData = await tlGet('/data/v1/accounts');
    const accounts     = accountsData.results || [];

    const allTx = await Promise.all(accounts.map(async (acc) => {
      try {
        const txData = await tlGet(`/data/v1/accounts/${acc.account_id}/transactions?from=${from}&to=${to}`);
        return (txData.results || []).map(tx => ({
          ...tx,
          account_id:   acc.account_id,
          account_name: acc.display_name || acc.account_type,
          bank_name:    acc.provider?.display_name || 'Bank',
        }));
      } catch {
        return [];
      }
    }));

    res.json({ results: allTx.flat().sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)) });
  } catch (err) {
    res.status(err.message.includes('Not connected') ? 401 : 500)
       .json({ error: err.response?.data?.error_description || err.message });
  }
});

// ─── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Finance Tracker server running on http://localhost:${PORT}`);
  console.log(`   Environment : ${TRUELAYER_ENV.toUpperCase()}`);
  console.log(`   Frontend    : ${FRONTEND_URL}`);
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.warn('\n⚠️  WARNING: TRUELAYER_CLIENT_ID / TRUELAYER_CLIENT_SECRET not set in .env');
    console.warn('   Copy server/.env.example to server/.env and fill in your credentials.\n');
  } else {
    console.log(`   TrueLayer   : credentials loaded ✓\n`);
  }
});
