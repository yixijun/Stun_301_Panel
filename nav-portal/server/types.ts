/**
 * Shared types for the server
 * These mirror the frontend types for consistency
 */

export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface NavItem {
  appid: string;
  name: string;
  description: string;
  link: string;
  icon?: string;
  categoryId: string;
  order: number;
}

export interface AppSettings {
  apiKey: string;
}

export interface AppData {
  categories: Category[];
  navItems: NavItem[];
  settings: AppSettings;
}

export interface StorageAdapter {
  getData(): Promise<AppData>;
  saveData(data: AppData): Promise<void>;
  getNavItem(appid: string): Promise<NavItem | null>;
  updateNavItemLink(appid: string, link: string): Promise<boolean>;
}

export interface ApiError {
  success: false;
  error: string;
  code: number;
}

export interface ApiLinkResponse {
  success: true;
  link: string;
}

export interface ApiUpdateResponse {
  success: true;
  message: string;
}

export const DEFAULT_APP_DATA: AppData = {
  categories: [
    { id: 'all', name: '全部', order: 0 }
  ],
  navItems: [],
  settings: {
    apiKey: ''
  }
};
