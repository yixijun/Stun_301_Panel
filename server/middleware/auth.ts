/**
 * API Key Authentication Middleware
 * Validates API key for webhook endpoints
 * Requirements: 5.5, 5.7
 */

import { Request, Response, NextFunction } from 'express';
import { StorageAdapter } from '../storage/adapter.js';

export function createAuthMiddleware(storage: StorageAdapter) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = req.query.key as string;

    if (!key) {
      res.status(400).json({
        success: false,
        error: 'Missing required parameter: key',
        code: 400
      });
      return;
    }

    try {
      const data = await storage.getData();
      const validApiKey = data.settings.apiKey;

      // If no API key is configured, reject all requests
      if (!validApiKey) {
        res.status(401).json({
          success: false,
          error: 'Invalid API key',
          code: 401
        });
        return;
      }

      if (key !== validApiKey) {
        res.status(401).json({
          success: false,
          error: 'Invalid API key',
          code: 401
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 500
      });
    }
  };
}
