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

interface AppSettings {
  apiKey: string;
}

interface AppData {
  categories: Category[];
  navItems: NavItem[];
  settings: AppSettings;
}

const DEFAULT_APP_DATA: AppData = {
  categories: [{ id: 'all', name: '全部', order: 0 }],
  navItems: [],
  settings: { apiKey: '' },
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
  }

  // 404 for unmatched routes
  return errorResponse('Not found', 404);
}
