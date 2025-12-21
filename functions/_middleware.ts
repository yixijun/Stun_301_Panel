/**
 * Cloudflare Pages Middleware - Basic Auth
 * 保护整个网站，需要用户名密码才能访问
 */

interface Env {
  // 在 Cloudflare Pages 环境变量中设置
  // AUTH_USERNAME: string;
  // AUTH_PASSWORD: string;
}

// 默认认证信息（建议在 Cloudflare Dashboard 中设置环境变量覆盖）
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'nav123456';

// 不需要认证的路径（API 端点使用自己的 key 认证）
const PUBLIC_PATHS = [
  '/api/link',
  '/api/health',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path));
}

function unauthorized(): Response {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Nav Portal", charset="UTF-8"',
    },
  });
}

function parseBasicAuth(authHeader: string): { username: string; password: string } | null {
  if (!authHeader.startsWith('Basic ')) {
    return null;
  }

  try {
    const base64 = authHeader.slice(6);
    const decoded = atob(base64);
    const [username, password] = decoded.split(':');
    return { username: username || '', password: password || '' };
  } catch {
    return null;
  }
}

export async function onRequest(context: { request: Request; env: Env; next: () => Promise<Response> }): Promise<Response> {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // 公开路径不需要认证
  if (isPublicPath(url.pathname)) {
    return next();
  }

  // 获取认证信息（优先使用环境变量）
  const validUsername = (env as Record<string, string>).AUTH_USERNAME || DEFAULT_USERNAME;
  const validPassword = (env as Record<string, string>).AUTH_PASSWORD || DEFAULT_PASSWORD;

  // 检查 Authorization 头
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return unauthorized();
  }

  const credentials = parseBasicAuth(authHeader);
  if (!credentials) {
    return unauthorized();
  }

  // 验证用户名密码
  if (credentials.username !== validUsername || credentials.password !== validPassword) {
    return unauthorized();
  }

  // 认证通过，继续处理请求
  return next();
}
