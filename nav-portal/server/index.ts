import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApiRouter } from './routes/api.js';
import { LocalFileAdapter } from './storage/localAdapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize storage adapter
const storage = new LocalFileAdapter(path.join(__dirname, 'data/nav-data.json'));

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the Vue build
app.use(express.static(path.join(__dirname, '../dist')));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', createApiRouter(storage));

// Fallback to index.html for SPA routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Nav Portal server running on http://localhost:${PORT}`);
});

export default app;
