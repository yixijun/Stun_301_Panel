/**
 * Category - 导航分类
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
  host?: string;        // 服务器地址
  port?: number;        // 服务器端口
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

/**
 * NavItem - 导航项
 */
export interface NavItem {
  appid: string;        // 唯一标识
  name: string;         // 显示名称
  description: string;  // 描述
  link: string;         // 跳转链接
  icon?: string;        // 图标 URL 或 emoji
  categoryId: string;   // 所属分类 ID
  order: number;        // 排序
  type?: NavItemType;   // 导航项类型，默认 web
  serviceInfo?: ServiceInfo;  // 服务信息（type=service 时使用）
  mcServer?: McServerInfo;    // MC 服务器信息（type=mc-java/mc-pe 时使用）
}

/**
 * AppSettings - 应用设置
 */
export interface AppSettings {
  apiKey: string;       // Webhook API 密钥
  authUsername?: string; // 登录用户名
  authPassword?: string; // 登录密码
}

/**
 * ShareLink - 分享链接
 */
export interface ShareLink {
  id: string;
  appid: string;
  params?: string;      // 额外携带的参数
  expiresAt?: number;   // 过期时间戳，undefined 表示永久
  createdAt: number;
  requireAuth?: boolean; // 是否需要登录才能访问
}

/**
 * ShareLinkDisplay - 分享链接显示格式
 */
export interface ShareLinkDisplay {
  id: string;
  appid: string;
  params?: string;
  expiresAt?: number;
  permanent: boolean;
  expired: boolean;
  createdAt: number;
  requireAuth?: boolean;
}

/**
 * AccessLog - 访问日志
 */
export interface AccessLog {
  id: string;
  shareId: string;
  appid: string;
  ip?: string;
  country?: string;
  city?: string;
  userAgent?: string;
  timestamp: number;
}

/**
 * AppData - 应用数据
 */
export interface AppData {
  categories: Category[];
  navItems: NavItem[];
  settings: AppSettings;
  shareLinks?: ShareLink[];
}

/**
 * StorageAdapter - 存储适配器接口
 */
export interface StorageAdapter {
  getData(): Promise<AppData>;
  saveData(data: AppData): Promise<void>;
  getNavItem(appid: string): Promise<NavItem | null>;
  updateNavItemLink(appid: string, link: string): Promise<boolean>;
}

/**
 * API Error Response
 */
export interface ApiError {
  success: false;
  error: string;
  code: number;
}

/**
 * API Success Response for link operations
 */
export interface ApiLinkResponse {
  success: true;
  link: string;
}

/**
 * API Success Response for update operations
 */
export interface ApiUpdateResponse {
  success: true;
  message: string;
}

/**
 * Default app data
 */
export const DEFAULT_APP_DATA: AppData = {
  categories: [
    { id: 'all', name: '全部', order: 0 }
  ],
  navItems: [],
  settings: {
    apiKey: '',
    authUsername: 'admin',
    authPassword: 'admin123'
  }
};
