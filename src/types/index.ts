/**
 * Category - 导航分类
 */
export interface Category {
  id: string;
  name: string;
  order: number;
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
 * AppData - 应用数据
 */
export interface AppData {
  categories: Category[];
  navItems: NavItem[];
  settings: AppSettings;
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
