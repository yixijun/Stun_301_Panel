/**
 * Local File Storage Adapter
 * Implements StorageAdapter using local JSON file
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname } from 'path';
import { StorageAdapter } from './adapter.js';
import { AppData, NavItem, DEFAULT_APP_DATA } from '../types.js';

export class LocalFileAdapter implements StorageAdapter {
  private filePath: string;

  constructor(filePath: string = './data/nav-data.json') {
    this.filePath = filePath;
  }

  async getData(): Promise<AppData> {
    try {
      if (!existsSync(this.filePath)) {
        // Return default data if file doesn't exist
        return { ...DEFAULT_APP_DATA };
      }
      const content = await readFile(this.filePath, 'utf-8');
      return JSON.parse(content) as AppData;
    } catch (error) {
      // Return default data on any read error
      return { ...DEFAULT_APP_DATA };
    }
  }

  async saveData(data: AppData): Promise<void> {
    // Ensure directory exists
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    await writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
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
