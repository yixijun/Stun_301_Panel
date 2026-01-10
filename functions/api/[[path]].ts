/**
 * Cloudflare Pages Functions - Dynamic API Route Handler
 * Handles all /api/* requests for Cloudflare Pages deployment
 * Requirements: 7.3
 */

// Types (inline to avoid import issues in Cloudflare environment)
interface Category {
  id: string;
  name: string;
  order: number;
}

interface NavItem {
  appid: string;
  name: string;
  description: string;
  link: string;
  icon?: string;
  categoryId: string;
  order: number;
}

interface ShareLink {
  id: string;
  appid: string;
  params?: string;      // 额外携带的参数
  expiresAt?: number;   // 过期时间戳，undefined 表示永久
  createdAt: number;
}

interface AccessLog {
  id: string;
  shareId: string;
  appid: string;
  ip?: string;
  country?: string;
  city?: string;
  userAgent?: string;
  timestamp: number;
}

interface AppSettings {
  apiKey: string;
  authUsername?: string;
  authPassword?: string;
}

interface AppData {
  categories: Category[];
  navItems: NavItem[];
  settings: AppSettings;
  shareLinks?: ShareLink[];
  accessLogs?: AccessLog[];
}

const DEFAULT_APP_DATA: AppData = {
  categories: [{ id: 'all', name: '全部', order: 0 }],
  navItems: [],
  settings: { apiKey: '', authUsername: 'admin', authPassword: 'admin123' },
  shareLinks: [],
  accessLogs: [],
};

// Cloudflare KV namespace interface
interface KVNamespace {
  get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

// KV Storage Adapter (inline implementation)
const KV_DATA_KEY = 'app-data';

class KVAdapter {
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
    } catch {
      return { ...DEFAULT_APP_DATA };
    }
  }

  async saveData(data: AppData): Promise<void> {
    await this.kv.put(KV_DATA_KEY, JSON.stringify(data));
  }

  async getNavItem(appid: string): Promise<NavItem | null> {
    const data = await this.getData();
    return data.navItems.find((item) => item.appid === appid) || null;
  }

  async updateNavItemLink(appid: string, link: string): Promise<boolean> {
    const data = await this.getData();
    const item = data.navItems.find((item) => item.appid === appid);
    if (!item) {
      return false;
    }
    item.link = link;
    await this.saveData(data);
    return true;
  }
}

interface Env {
  NAV_PORTAL_DATA: KVNamespace;
}

interface CFContext {
  request: Request;
  env: Env;
  params: { path?: string[] };
}

// Helper to create JSON response
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Helper to create error response
function errorResponse(error: string, code: number): Response {
  return jsonResponse({ success: false, error, code }, code);
}

// Validate API key
async function validateApiKey(storage: KVAdapter, key: string | null): Promise<Response | null> {
  if (!key) {
    return errorResponse('Missing required parameter: key', 400);
  }

  const data = await storage.getData();
  const validApiKey = data.settings?.apiKey;

  // If no API key is configured, reject all requests
  if (!validApiKey) {
    return errorResponse('API key not configured', 401);
  }

  if (key !== validApiKey) {
    return errorResponse('Invalid API key', 401);
  }

  return null;
}

// Handle GET /api/data
async function handleGetData(storage: KVAdapter): Promise<Response> {
  try {
    const data = await storage.getData();
    return jsonResponse({ success: true, data });
  } catch {
    return errorResponse('Internal server error', 500);
  }
}

// Handle POST /api/data
async function handleSaveData(storage: KVAdapter, request: Request): Promise<Response> {
  try {
    const data: AppData = await request.json();

    if (!data || !data.categories || !data.navItems) {
      return errorResponse(
        'Missing required parameter: data must include categories and navItems',
        400
      );
    }

    // Ensure settings exists with default values if not provided
    if (!data.settings) {
      data.settings = { apiKey: '' };
    }

    await storage.saveData(data);
    return jsonResponse({ success: true, message: 'Data saved successfully' });
  } catch {
    return errorResponse('Internal server error', 500);
  }
}

// Handle GET /api/link
async function handleGetLink(storage: KVAdapter, url: URL): Promise<Response> {
  try {
    const key = url.searchParams.get('key');
    const authError = await validateApiKey(storage, key);
    if (authError) return authError;

    const appid = url.searchParams.get('appid');
    if (!appid) {
      return errorResponse('Missing required parameter: appid', 400);
    }

    const navItem = await storage.getNavItem(appid);
    if (!navItem) {
      return errorResponse('AppID not found', 404);
    }

    return jsonResponse({ success: true, link: navItem.link });
  } catch {
    return errorResponse('Internal server error', 500);
  }
}

// Handle POST /api/link
async function handleUpdateLink(storage: KVAdapter, url: URL): Promise<Response> {
  try {
    const key = url.searchParams.get('key');
    const authError = await validateApiKey(storage, key);
    if (authError) return authError;

    const appid = url.searchParams.get('appid');
    if (!appid) {
      return errorResponse('Missing required parameter: appid', 400);
    }

    const link = url.searchParams.get('link');
    if (!link) {
      return errorResponse('Missing required parameter: link', 400);
    }

    const success = await storage.updateNavItemLink(appid, link);
    if (!success) {
      return errorResponse('AppID not found', 404);
    }

    return jsonResponse({ success: true, message: 'Link updated' });
  } catch {
    return errorResponse('Internal server error', 500);
  }
}

// Handle GET /api/health
function handleHealth(): Response {
  return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
}

// Handle GET /api/go/:id - Redirect to target link
async function handleGo(storage: KVAdapter, shareId: string, request: Request): Promise<Response> {
  try {
    const data = await storage.getData();
    const shareLinks = data.shareLinks || [];
    
    // Find share link
    const shareLink = shareLinks.find(s => s.id === shareId);
    if (!shareLink) {
      return new Response('Link not found', { status: 404 });
    }
    
    // Check expiration
    if (shareLink.expiresAt && Date.now() > shareLink.expiresAt) {
      return new Response('Link expired', { status: 410 });
    }
    
    // Find nav item
    const navItem = data.navItems.find(item => item.appid === shareLink.appid);
    if (!navItem) {
      return new Response('Target not found', { status: 404 });
    }
    
    // Record access log
    const accessLog: AccessLog = {
      id: generateShareId() + Date.now().toString(36),
      shareId: shareId,
      appid: shareLink.appid,
      ip: request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || undefined,
      country: request.headers.get('cf-ipcountry') || undefined,
      city: request.headers.get('cf-ipcity') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      timestamp: Date.now(),
    };
    
    if (!data.accessLogs) {
      data.accessLogs = [];
    }
    // Keep only last 100 logs
    data.accessLogs.unshift(accessLog);
    if (data.accessLogs.length > 100) {
      data.accessLogs = data.accessLogs.slice(0, 100);
    }
    await storage.saveData(data);
    
    // Build redirect URL with params
    let targetUrl = navItem.link;
    if (shareLink.params) {
      // Check if it's a path-type param (prefixed with __path__:)
      if (shareLink.params.startsWith('__path__:')) {
        const pathParam = shareLink.params.substring(9); // Remove __path__: prefix
        // Ensure URL ends without slash, then add path
        targetUrl = targetUrl.replace(/\/+$/, '') + '/' + pathParam.replace(/^\/+/, '');
      } else {
        // Query parameter style
        const separator = targetUrl.includes('?') ? '&' : '?';
        targetUrl = targetUrl + separator + shareLink.params;
      }
    }
    
    return Response.redirect(targetUrl, 302);
  } catch {
    return new Response('Internal server error', { status: 500 });
  }
}

// Handle GET /api/logs - Get access logs
async function handleGetLogs(storage: KVAdapter): Promise<Response> {
  try {
    const data = await storage.getData();
    const accessLogs = data.accessLogs || [];
    return jsonResponse({ success: true, accessLogs });
  } catch {
    return errorResponse('Internal server error', 500);
  }
}

// Handle DELETE /api/logs - Clear access logs
async function handleClearLogs(storage: KVAdapter): Promise<Response> {
  try {
    const data = await storage.getData();
    data.accessLogs = [];
    await storage.saveData(data);
    return jsonResponse({ success: true, message: 'Access logs cleared' });
  } catch {
    return errorResponse('Internal server error', 500);
  }
}

// Handle POST /api/share - Create share link
async function handleCreateShare(storage: KVAdapter, request: Request): Promise<Response> {
  try {
    const body = await request.json() as {
      appid: string;
      params?: string;
      expiresIn?: number; // minutes, 0 or undefined = permanent
    };
    
    if (!body.appid) {
      return errorResponse('Missing required parameter: appid', 400);
    }
    
    const data = await storage.getData();
    
    // Verify appid exists
    const navItem = data.navItems.find(item => item.appid === body.appid);
    if (!navItem) {
      return errorResponse('AppID not found', 404);
    }
    
    // Generate share link
    const shareLink: ShareLink = {
      id: generateShareId(),
      appid: body.appid,
      params: body.params,
      expiresAt: body.expiresIn ? Date.now() + body.expiresIn * 60 * 1000 : undefined,
      createdAt: Date.now(),
    };
    
    // Save share link
    if (!data.shareLinks) {
      data.shareLinks = [];
    }
    data.shareLinks.push(shareLink);
    await storage.saveData(data);
    
    return jsonResponse({
      success: true,
      shareLink: {
        id: shareLink.id,
        url: `/api/go/${shareLink.id}`,
        expiresAt: shareLink.expiresAt,
        permanent: !shareLink.expiresAt,
      }
    });
  } catch {
    return errorResponse('Internal server error', 500);
  }
}

// Handle GET /api/shares - List share links
async function handleListShares(storage: KVAdapter): Promise<Response> {
  try {
    const data = await storage.getData();
    const shareLinks = (data.shareLinks || []).map(s => ({
      id: s.id,
      appid: s.appid,
      params: s.params,
      expiresAt: s.expiresAt,
      permanent: !s.expiresAt,
      expired: s.expiresAt ? Date.now() > s.expiresAt : false,
      createdAt: s.createdAt,
    }));
    
    return jsonResponse({ success: true, shareLinks });
  } catch {
    return errorResponse('Internal server error', 500);
  }
}

// Handle DELETE /api/share/:id - Delete share link
async function handleDeleteShare(storage: KVAdapter, shareId: string): Promise<Response> {
  try {
    const data = await storage.getData();
    if (!data.shareLinks) {
      return errorResponse('Share link not found', 404);
    }
    
    const index = data.shareLinks.findIndex(s => s.id === shareId);
    if (index === -1) {
      return errorResponse('Share link not found', 404);
    }
    
    data.shareLinks.splice(index, 1);
    await storage.saveData(data);
    
    return jsonResponse({ success: true, message: 'Share link deleted' });
  } catch {
    return errorResponse('Internal server error', 500);
  }
}

function generateShareId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Handle GET /api/debug - Debug endpoint to check stored data
async function handleDebug(storage: KVAdapter, url: URL): Promise<Response> {
  try {
    const data = await storage.getData();
    const inputKey = url.searchParams.get('key') || '';
    const storedKey = data.settings?.apiKey || '';
    
    return jsonResponse({
      success: true,
      hasCategories: data.categories?.length || 0,
      hasNavItems: data.navItems?.length || 0,
      navItemAppIds: data.navItems?.map(item => item.appid) || [],
      hasSettings: !!data.settings,
      apiKeyConfigured: !!storedKey,
      apiKeyLength: storedKey.length,
      // Debug comparison (only show if key provided)
      ...(inputKey ? {
        inputKeyLength: inputKey.length,
        keysMatch: inputKey === storedKey,
        storedKeyPreview: storedKey.substring(0, 2) + '***'
      } : {})
    });
  } catch (e) {
    return jsonResponse({
      success: false,
      error: String(e)
    });
  }
}

// Handle CORS preflight
function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Main request handler
export async function onRequest(context: CFContext): Promise<Response> {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const method = request.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return handleOptions();
  }

  // Get the API path from params
  const pathSegments = params.path || [];
  const apiPath = pathSegments.join('/');

  // Initialize KV storage adapter
  const storage = new KVAdapter(env.NAV_PORTAL_DATA);

  // Route handling
  switch (apiPath) {
    case 'health':
      if (method === 'GET') {
        return handleHealth();
      }
      break;

    case 'debug':
      if (method === 'GET') {
        return handleDebug(storage, url);
      }
      break;

    case 'data':
      if (method === 'GET') {
        return handleGetData(storage);
      }
      if (method === 'POST') {
        return handleSaveData(storage, request);
      }
      break;

    case 'link':
      if (method === 'GET') {
        return handleGetLink(storage, url);
      }
      if (method === 'POST') {
        return handleUpdateLink(storage, url);
      }
      break;

    case 'share':
      if (method === 'POST') {
        return handleCreateShare(storage, request);
      }
      break;

    case 'shares':
      if (method === 'GET') {
        return handleListShares(storage);
      }
      break;

    case 'logs':
      if (method === 'GET') {
        return handleGetLogs(storage);
      }
      if (method === 'DELETE') {
        return handleClearLogs(storage);
      }
      break;
  }

  // Handle dynamic routes: go/:id, share/:id
  if (apiPath.startsWith('go/')) {
    const shareId = apiPath.substring(3);
    if (method === 'GET') {
      return handleGo(storage, shareId);
    }
  }

  if (apiPath.startsWith('share/')) {
    const shareId = apiPath.substring(6);
    if (method === 'DELETE') {
      return handleDeleteShare(storage, shareId);
    }
  }

  // 404 for unmatched routes
  return errorResponse('Not found', 404);
}
