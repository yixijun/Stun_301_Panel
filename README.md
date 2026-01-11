# Nav Portal

一个可部署在本地或 Cloudflare Pages 上的导航页应用。

## 功能特性

- 分类管理：支持添加、编辑、删除导航分类
- 导航项管理：支持添加、编辑、删除导航链接
- 多类型导航项：
  - **Web 链接**：普通网页链接，点击直接跳转
  - **服务面板**：以卡片形式展示服务信息（状态、功能特性、联系方式等）
  - **Minecraft Java版**：显示服务器地址、版本、在线人数和玩家列表
  - **Minecraft 基岩版**：同上，支持基岩版服务器
- 分享链接：为 Web 类型导航项创建分享链接，支持设置有效期
- Webhook API：通过 API 动态更新导航链接
- 数据导入导出：支持 JSON 格式的数据备份和恢复
- 多环境部署：支持本地 Node.js 和 Cloudflare Pages 部署

## 本地开发

### 前端开发

```bash
npm install
npm run dev
```

### 后端开发

```bash
cd server
npm install
npm run dev
```

### 运行测试

```bash
npm test
cd server && npm test
```

## 部署方式

### 方式一：本地 Node.js 部署

1. 构建前端：
```bash
npm run build
```

2. 启动服务器：
```bash
cd server
npm start
```

服务器将在 `http://localhost:3000` 启动。

### 方式二：Cloudflare Pages 部署

1. 安装依赖：
```bash
npm install
```

2. 在 Cloudflare Dashboard 创建 KV 命名空间：
   - 进入 Workers & Pages > KV
   - 创建名为 `NAV_PORTAL_DATA` 的命名空间
   - 复制命名空间 ID

3. 更新 `wrangler.toml` 中的 KV 命名空间 ID：
```toml
[[kv_namespaces]]
binding = "NAV_PORTAL_DATA"
id = "YOUR_KV_NAMESPACE_ID"
```

4. 本地测试 Cloudflare 环境：
```bash
npm run pages:dev
```

5. 部署到 Cloudflare Pages：
```bash
npm run pages:deploy
```

或者通过 Cloudflare Dashboard 连接 Git 仓库自动部署。

## API 文档

### GET /api/data
获取所有应用数据（分类、导航项、设置）

### POST /api/data
保存所有应用数据

### GET /api/link
获取导航项链接

参数：
- `key`: API 密钥
- `appid`: 导航项 ID

### POST /api/link
更新导航项链接

参数：
- `key`: API 密钥
- `appid`: 导航项 ID
- `link`: 新链接

### GET /api/mc-status
查询 Minecraft 服务器状态

参数：
- `host`: 服务器地址
- `port`: 服务器端口
- `type`: 服务器类型（`java` 或 `bedrock`）

返回：
- `online`: 是否在线
- `version`: 游戏版本
- `players`: 在线人数信息
- `motd`: 服务器公告

### POST /api/webhook/mc
更新 MC 服务器地址（需要 API 密钥）

参数：
- `key`: API 密钥
- `appid`: 导航项 ID
- `host`: 新的服务器地址
- `port`: 新的端口（可选）

示例：
```bash
# 更新 MC 服务器地址
curl -X POST "https://your-domain.com/api/webhook/mc?key=YOUR_API_KEY&appid=my-mc-server&host=mc.example.com&port=25565"
```

### GET /api/webhook/mc
获取 MC 服务器配置信息（需要 API 密钥）

参数：
- `key`: API 密钥
- `appid`: 导航项 ID

### POST /api/webhook/service
更新服务状态信息（需要 API 密钥）

参数：
- `key`: API 密钥
- `appid`: 导航项 ID
- `status`: 服务状态（`online`/`offline`/`unknown`）
- `description`: 详细描述（可选）
- `contact`: 联系方式（可选）
- `link`: 服务链接（可选）

示例：
```bash
# 更新服务状态
curl -X POST "https://your-domain.com/api/webhook/service?key=YOUR_API_KEY&appid=my-service&status=online"
```

### GET /api/health
健康检查端点

## 技术栈

- 前端：Vue 3 + TypeScript + Pinia + Vite
- 后端：Node.js + Express（本地）/ Cloudflare Pages Functions（云端）
- 存储：JSON 文件（本地）/ Cloudflare KV（云端）

## Webhook 使用示例

### MC 服务器地址自动更新

适用于使用 DDNS、frp 等内网穿透工具的场景，当服务器地址变化时自动更新导航页。

**使用 curl：**
```bash
curl -X POST "https://your-domain.com/api/webhook/mc?key=YOUR_API_KEY&appid=my-mc-server&host=新地址&port=端口"
```

**使用 Python：**
```python
import requests

def update_mc_server(api_key, appid, host, port=None):
    url = "https://your-domain.com/api/webhook/mc"
    params = {
        "key": api_key,
        "appid": appid,
        "host": host
    }
    if port:
        params["port"] = port
    response = requests.post(url, params=params)
    return response.json()

# 示例调用
update_mc_server("your-api-key", "my-mc-server", "mc.example.com", 25565)
```

**配合 frp 使用：**

在 frp 客户端配置中添加启动后脚本，自动更新导航页：
```ini
[mc-server]
type = tcp
local_ip = 127.0.0.1
local_port = 25565
remote_port = 25565

# 启动后执行更新脚本
plugin_after_start = curl -X POST "https://your-domain.com/api/webhook/mc?key=API_KEY&appid=my-mc&host=frp.example.com&port=25565"
```

### 服务状态监控

可以配合监控脚本自动更新服务状态：

```bash
#!/bin/bash
# 检查服务是否运行
if systemctl is-active --quiet my-service; then
    STATUS="online"
else
    STATUS="offline"
fi

# 更新导航页状态
curl -X POST "https://your-domain.com/api/webhook/service?key=API_KEY&appid=my-service&status=$STATUS"
```

## 导航项类型说明

| 类型 | 说明 | 点击行为 |
|------|------|----------|
| web | 普通网页链接 | 新窗口打开链接 |
| service | 服务面板 | 跳转到详情页 |
| mc-java | Minecraft Java版服务器 | 显示服务器信息卡片 |
| mc-pe | Minecraft 基岩版服务器 | 显示服务器信息卡片 |

### MC 服务器卡片功能

- 显示服务器地址（点击复制）
- 实时查询服务器状态
- 显示游戏版本
- 显示在线人数和最大人数
- 显示在线玩家列表
- 支持手动刷新状态
