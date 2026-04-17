/**
 * Local Express Dev Server
 * Mirrors the Vercel serverless functions for local development
 * Run: node server/index.js
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import tilopayRoutes from './routes/tilopay.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/tilopay', tilopayRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  console.log(`[Server] API endpoints:`);
  console.log(`  POST /api/tilopay/create-payment`);
  console.log(`  POST /api/tilopay/confirm`);
  console.log(`  POST /api/tilopay/webhook`);
});
