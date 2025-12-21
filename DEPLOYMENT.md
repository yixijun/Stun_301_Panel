# Nav Portal 部署指南

## 目录

- [本地部署](#本地部署)
- [Cloudflare Pages 部署](#cloudflare-pages-部署)
- [Webhook API 使用](#webhook-api-使用)

---

## 本地部署

### 前置要求

- Node.js 18+
- npm 或 yarn

### 步骤

1. **安装依赖**

```bash
cd nav-portal
npm install
cd server && npm install && cd ..
```

2. **构建前端**

```bash
npm run build
```

3. **启动服务器**

```bash
cd server
npm run dev
```

服务器默认运行在 `http://localhost:3000`

### 数据存储

本地部署使用 JSON 文件存储数据，位置：`server/data/nav-data.json`

---

## Cloudflare Pages 部署

### 前置要求

- Cloudflare 账号
- Wrangler CLI (`npm install -g wrangler`)

### 步骤

#### 1. 登录 Cloudflare

```bash
wrangler login
```

#### 2. 创建 KV Namespace

在 Cloudflare Dashboard 中：

1. 进入 **Workers & Pages** > **KV**
2. 点击 **Create a namespace**
3. 命名为 `NAV_PORTAL_DATA`
4. 复制生成的 **Namespace ID**

#### 3. 配置 wrangler.toml

编辑 `wrangler.toml`，替换 KV namespace ID：

```toml
[[kv_namespaces]]
binding = "NAV_PORTAL_DATA"
id = "你的_KV_NAMESPACE_ID"
```

#### 4. 部署

```bash
# 构建项目
npm run pages:build

# 部署到 Cloudflare Pages
npm run pages:deploy
```

#### 5. 绑定 KV（首次部署后）

在 Cloudflare Dashboard 中：

1. 进入 **Workers & Pages** > 选择你的项目
2. 点击 **Settings** > **Functions** > **KV namespace bindings**
3. 添加绑定：
   - Variable name: `NAV_PORTAL_DATA`
   - KV namespace: 选择之前创建的 namespace

### 本地预览 Cloudflare 环境

```bash
npm run pages:dev
```

这会在本地模拟 Cloudflare Pages 环境，包括 KV 存储。

---

## Webhook API 使用

### 配置 API Key

1. 打开导航页
2. 点击左下角 **设置** 按钮
3. 在 **API Key** 输入框中设置密钥
4. 点击保存

### API 端点

#### 获取链接

```
GET /api/link?key={API_KEY}&appid={APP_ID}
```

**响应示例：**
```json
{
  "success": true,
  "link": "https://example.com"
}
```

#### 更新链接

```
POST /api/link?key={API_KEY}&appid={APP_ID}&link={NEW_LINK}
```

**响应示例：**
```json
{
  "success": true,
  "message": "Link updated"
}
```

### 错误响应

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | Missing required parameter | 缺少必要参数 |
| 401 | Invalid API key | API Key 无效 |
| 404 | AppID not found | 找不到指定的导航项 |

### 使用示例

```bash
# 获取链接
curl "https://your-domain.pages.dev/api/link?key=your-api-key&appid=my-app"

# 更新链接
curl -X POST "https://your-domain.pages.dev/api/link?key=your-api-key&appid=my-app&link=https://new-url.com"
```

---

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| PORT | 本地服务器端口 | 3000 |

## 常见问题

### Q: 数据如何备份？

在设置页面可以导出所有数据为 JSON 文件，也可以从 JSON 文件导入数据。

### Q: 如何迁移数据到 Cloudflare？

1. 在本地部署中导出数据
2. 部署到 Cloudflare 后导入数据

### Q: KV 存储有限制吗？

Cloudflare KV 免费版每天有 100,000 次读取和 1,000 次写入限制，对于个人导航页完全够用。
