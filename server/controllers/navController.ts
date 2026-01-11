/**
 * Navigation Controller
 * Handles business logic for navigation data and webhook API
 */

import { Request, Response } from 'express';
import { StorageAdapter } from '../storage/adapter.js';
import { AppData, NavItem } from '../types.js';

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

  /**
   * POST /api/webhook/service - Update service info
   * Webhook for service type navigation items
   */
  async updateService(req: Request, res: Response): Promise<void> {
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

      const data = await this.storage.getData();
      const itemIndex = data.navItems.findIndex(item => item.appid === appid);

      if (itemIndex === -1) {
        res.status(404).json({
          success: false,
          error: 'AppID not found',
          code: 404
        });
        return;
      }

      const item = data.navItems[itemIndex];
      if (item.type !== 'service') {
        res.status(400).json({
          success: false,
          error: 'NavItem is not a service type',
          code: 400
        });
        return;
      }

      // Update service info from query params or body
      const status = (req.query.status || req.body?.status) as 'online' | 'offline' | 'unknown';
      const description = (req.query.description || req.body?.description) as string;
      const features = req.body?.features as string[];
      const contact = (req.query.contact || req.body?.contact) as string;
      const link = (req.query.link || req.body?.link) as string;

      if (!item.serviceInfo) {
        item.serviceInfo = {};
      }

      if (status) item.serviceInfo.status = status;
      if (description) item.serviceInfo.description = description;
      if (features) item.serviceInfo.features = features;
      if (contact) item.serviceInfo.contact = contact;
      if (link) item.link = link;

      await this.storage.saveData(data);
      res.json({ success: true, message: 'Service info updated' });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 500
      });
    }
  }

  /**
   * POST /api/webhook/mc - Update MC server info
   * Webhook for mc-java and mc-pe type navigation items
   */
  async updateMcServer(req: Request, res: Response): Promise<void> {
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

      const data = await this.storage.getData();
      const itemIndex = data.navItems.findIndex(item => item.appid === appid);

      if (itemIndex === -1) {
        res.status(404).json({
          success: false,
          error: 'AppID not found',
          code: 404
        });
        return;
      }

      const item = data.navItems[itemIndex];
      if (item.type !== 'mc-java' && item.type !== 'mc-pe') {
        res.status(400).json({
          success: false,
          error: 'NavItem is not a MC server type',
          code: 400
        });
        return;
      }

      // Update MC server info from query params or body
      const host = (req.query.host || req.body?.host) as string;
      const port = req.query.port || req.body?.port;

      if (!item.mcServer) {
        item.mcServer = { host: '', port: item.type === 'mc-java' ? 25565 : 19132 };
      }

      if (host) item.mcServer.host = host;
      if (port) item.mcServer.port = parseInt(port as string, 10);

      await this.storage.saveData(data);
      res.json({ success: true, message: 'MC server info updated' });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 500
      });
    }
  }

  /**
   * GET /api/webhook/item - Get full navigation item info
   * Returns complete item data including type-specific info
   */
  async getItem(req: Request, res: Response): Promise<void> {
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

      res.json({ success: true, item: navItem });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 500
      });
    }
  }

  /**
   * GET /api/service - Get service info by appid
   * Similar to getLink but returns service-specific info
   */
  async getService(req: Request, res: Response): Promise<void> {
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

      if (navItem.type !== 'service') {
        res.status(400).json({
          success: false,
          error: 'NavItem is not a service type',
          code: 400
        });
        return;
      }

      res.json({ 
        success: true, 
        status: navItem.serviceInfo?.status || 'unknown',
        link: navItem.link,
        description: navItem.serviceInfo?.description,
        features: navItem.serviceInfo?.features,
        contact: navItem.serviceInfo?.contact
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 500
      });
    }
  }

  /**
   * GET /api/mc - Get MC server info by appid
   * Similar to getLink but returns MC server-specific info
   */
  async getMcServer(req: Request, res: Response): Promise<void> {
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

      if (navItem.type !== 'mc-java' && navItem.type !== 'mc-pe') {
        res.status(400).json({
          success: false,
          error: 'NavItem is not a MC server type',
          code: 400
        });
        return;
      }

      res.json({ 
        success: true, 
        host: navItem.mcServer?.host || '',
        port: navItem.mcServer?.port || (navItem.type === 'mc-java' ? 25565 : 19132),
        type: navItem.type
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 500
      });
    }
  }
}
