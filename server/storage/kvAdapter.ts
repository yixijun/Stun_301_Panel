/**
 * Cloudflare KV Storage Adapter
 * Implements StorageAdapter using Cloudflare KV
 */

import { StorageAdapter } from './adapter.js';
import { AppData, NavItem, DEFAULT_APP_DATA } from '../types.js';

// Cloudflare KV namespace interface
export interface KVNamespace {
  get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

const KV_DATA_KEY = 'app-data';

export class KVAdapter implements StorageAdapter {
  private kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  async getData(): Promise<AppData> {
    try {
      const data = await this.kv.get(KV_DATA_KEY);
      if (!data) {
        return { ...DEFAULT_APP_DATA };
      }
      return JSON.parse(data) as AppData;
    } catch (error) {
      return { ...DEFAULT_APP_DATA };
    }
  }

  async saveData(data: AppData): Promise<void> {
    await this.kv.put(KV_DATA_KEY, JSON.stringify(data));
  }

  async getNavItem(appid: string): Promise<NavItem | null> {
    const data = await this.getData();
    return data.navItems.find(item => item.appid === appid) || null;
  }

  async updateNavItemLink(appid: string, link: string): Promise<boolean> {
    const data = await this.getData();
    const item = data.navItems.find(item => item.appid === appid);
    if (!item) {
      return false;
    }
    item.link = link;
    await this.saveData(data);
    return true;
  }
}
