/**
 * Storage Adapter Interface
 * Abstract interface for data persistence
 */

import { AppData, NavItem } from '../types.js';

export interface StorageAdapter {
  /**
   * Get all application data
   */
  getData(): Promise<AppData>;

  /**
   * Save all application data
   */
  saveData(data: AppData): Promise<void>;

  /**
   * Get a specific navigation item by appid
   */
  getNavItem(appid: string): Promise<NavItem | null>;

  /**
   * Update a navigation item's link by appid
   * Returns true if successful, false if appid not found
   */
  updateNavItemLink(appid: string, link: string): Promise<boolean>;
}
