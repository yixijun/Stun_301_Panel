/**
 * Minecraft Server Status Controller
 * Handles MC server status queries for Java and Bedrock editions
 */

import { Request, Response } from 'express';
import { McServerStatus } from '../types.js';

// MC Server Status API endpoints
const MC_STATUS_API = {
  java: 'https://api.mcsrvstat.us/3/',
  bedrock: 'https://api.mcsrvstat.us/bedrock/3/'
};

interface McSrvStatResponse {
  online: boolean;
  ip?: string;
  port?: number;
  hostname?: string;
  version?: string;
  players?: {
    online: number;
    max: number;
    list?: Array<{ name: string; uuid: string }>;
  };
  motd?: {
    raw: string[];
    clean: string[];
    html: string[];
  };
  icon?: string;
  software?: string;
  gamemode?: string;
}

export class McController {
  /**
   * GET /api/mc-status - Get Minecraft server status
   * Query params: host, port, type (java|bedrock)
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const host = req.query.host as string;
      const port = req.query.port as string;
      const type = (req.query.type as string) || 'java';

      if (!host) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameter: host',
          code: 400
        });
        return;
      }

      // Build server address
      const serverAddress = port ? `${host}:${port}` : host;
      
      // Select API endpoint based on type
      const apiBase = type === 'bedrock' ? MC_STATUS_API.bedrock : MC_STATUS_API.java;
      const apiUrl = `${apiBase}${encodeURIComponent(serverAddress)}`;

      // Fetch status from external API
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'NavPortal/1.0'
        }
      });

      if (!response.ok) {
        res.json({
          success: true,
          status: { online: false } as McServerStatus
        });
        return;
      }

      const data: McSrvStatResponse = await response.json();

      // Transform to our format
      const status: McServerStatus = {
        online: data.online,
        version: data.version,
        players: data.players ? {
          online: data.players.online,
          max: data.players.max,
          list: data.players.list?.map(p => p.name)
        } : undefined,
        motd: data.motd?.clean?.join('\n'),
        icon: data.icon
      };

      res.json({ success: true, status });
    } catch (error) {
      console.error('MC status query error:', error);
      res.json({
        success: true,
        status: { online: false } as McServerStatus
      });
    }
  }
}
