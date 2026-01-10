/**
 * Shared types for the server
 * These mirror the frontend types for consistency
 */

export interface Category {
  id: string;
  name: string;
  order: number;
}

/**
 * NavItemType - 导航项类型
 */
export type NavItemType = 'web' | 'service' | 'mc-java' | 'mc-pe';

/**
 * ServiceInfo - 服务信息（用于 service 类型）
 */
export interface ServiceInfo {
  status?: 'online' | 'offline' | 'unknown';
  description?: string;
  features?: string[];
  contact?: string;
}

/**
 * McServerInfo - MC 服务器信息
 */
export interface McServerInfo {
  host: string;
  port: number;
}

/**
 * McServerStatus - MC 服务器状态响应
 */
export interface McServerStatus {
  online: boolean;
  version?: string;
  players?: {
    online: number;
    max: number;
    list?: string[];
  };
  motd?: string;
  icon?: string;
}

export interface NavItem {
  appid: string;
  name: string;
  description: string;
  link: string;
  icon?: string;
  categoryId: string;
  order: number;
  type?: NavItemType;
  serviceInfo?: ServiceInfo;
  mcServer?: McServerInfo;
}

export interface AppSettings {
  apiKey: string;
  authUsername?: string;
  authPassword?: string;
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
