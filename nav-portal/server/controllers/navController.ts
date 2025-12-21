/**
 * Navigation Controller
 * Handles business logic for navigation data and webhook API
 */

import { Request, Response } from 'express';
import { StorageAdapter } from '../storage/adapter.js';
import { AppData } from '../types.js';

export class NavController {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  /**
   * GET /api/data - Get all application data
   * Requirements: 4.2
   */
  async getData(_req: Request, res: Response): Promise<void> {
    try {
      const data = await this.storage.getData();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 500
      });
    }
  }

  /**
   * POST /api/data - Save all application data
   * Requirements: 4.3
   */
  async saveData(req: Request, res: Response): Promise<void> {
    try {
      const data: AppData = req.body;
      
      // Basic validation
      if (!data || !data.categories || !data.navItems || !data.settings) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameter: data must include categories, navItems, and settings',
          code: 400
        });
        return;
      }

      await this.storage.saveData(data);
      res.json({ success: true, message: 'Data saved successfully' });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 500
      });
    }
  }

  /**
   * GET /api/link - Get navigation item link by appid
   * Requirements: 5.1, 5.3
   */
  async getLink(req: Request, res: Response): Promise<void> {
    try {
      const appid = req.query.appid as string;

      if (!appid) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameter: appid',
          code: 400
        });
        return;
      }

      const navItem = await this.storage.getNavItem(appid);

      if (!navItem) {
        res.status(404).json({
          success: false,
          error: 'AppID not found',
          code: 404
        });
        return;
      }

      res.json({ success: true, link: navItem.link });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 500
      });
    }
  }

  /**
   * POST /api/link - Update navigation item link by appid
   * Requirements: 5.2, 5.4
   */
  async updateLink(req: Request, res: Response): Promise<void> {
    try {
      const appid = req.query.appid as string;
      const link = req.query.link as string;

      if (!appid) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameter: appid',
          code: 400
        });
        return;
      }

      if (!link) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameter: link',
          code: 400
        });
        return;
      }

      const success = await this.storage.updateNavItemLink(appid, link);

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'AppID not found',
          code: 404
        });
        return;
      }

      res.json({ success: true, message: 'Link updated' });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 500
      });
    }
  }
}
