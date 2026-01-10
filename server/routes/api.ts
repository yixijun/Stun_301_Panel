/**
 * API Routes
 * Defines all API endpoints for the Nav Portal
 */

import { Router } from 'express';
import { NavController } from '../controllers/navController.js';
import { McController } from '../controllers/mcController.js';
import { StorageAdapter } from '../storage/adapter.js';
import { createAuthMiddleware } from '../middleware/auth.js';

export function createApiRouter(storage: StorageAdapter): Router {
  const router = Router();
  const controller = new NavController(storage);
  const mcController = new McController();
  const authMiddleware = createAuthMiddleware(storage);

  // Data API endpoints (Requirements: 4.2, 4.3)
  router.get('/data', (req, res) => controller.getData(req, res));
  router.post('/data', (req, res) => controller.saveData(req, res));

  // Webhook API endpoints (Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6)
  // Web type - update link
  router.get('/link', authMiddleware, (req, res) => controller.getLink(req, res));
  router.post('/link', authMiddleware, (req, res) => controller.updateLink(req, res));

  // Service type - update service info
  router.get('/webhook/service', authMiddleware, (req, res) => controller.getItem(req, res));
  router.post('/webhook/service', authMiddleware, (req, res) => controller.updateService(req, res));

  // MC type - update server info
  router.get('/webhook/mc', authMiddleware, (req, res) => controller.getItem(req, res));
  router.post('/webhook/mc', authMiddleware, (req, res) => controller.updateMcServer(req, res));

  // Generic item endpoint
  router.get('/webhook/item', authMiddleware, (req, res) => controller.getItem(req, res));

  // MC Server Status API
  router.get('/mc-status', (req, res) => mcController.getStatus(req, res));

  return router;
}
