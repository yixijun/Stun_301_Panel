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

  // Webhook API endpoints - Web type (link)
  router.get('/link', authMiddleware, (req, res) => controller.getLink(req, res));
  router.post('/link', authMiddleware, (req, res) => controller.updateLink(req, res));

  // Webhook API endpoints - MC type (mc)
  router.get('/mc', authMiddleware, (req, res) => controller.getMcServer(req, res));
  router.post('/mc', authMiddleware, (req, res) => controller.updateMcServer(req, res));

  // Webhook API endpoints - Service type (service)
  router.get('/service', authMiddleware, (req, res) => controller.getService(req, res));
  router.post('/service', authMiddleware, (req, res) => controller.updateService(req, res));

  // MC Server Status API (public, no auth)
  router.get('/mc-status', (req, res) => mcController.getStatus(req, res));

  return router;
}
