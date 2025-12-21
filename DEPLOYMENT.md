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

Webhook API 允许你通过 HTTP 请求自动更新导航项的链接，适用于动态 IP 更新、DDNS 场景等。

### 配置 API Key

1. 打开导航页
2. 点击左下角 **设置** 按钮
3. 在 **API Key** 输入框中设置密钥（建议使用随机字符串）
4. 点击保存

### API 端点

#### 获取链接

```
GET /api/link?key={API_KEY}&appid={APP_ID}
```

**参数说明：**
| 参数 | 必填 | 说明 |
|------|------|------|
| key | 是 | 在设置中配置的 API Key |
| appid | 是 | 导航项的唯一标识符 |

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

**参数说明：**
| 参数 | 必填 | 说明 |
|------|------|------|
| key | 是 | 在设置中配置的 API Key |
| appid | 是 | 导航项的唯一标识符 |
| link | 是 | 新的链接地址（需要 URL 编码） |

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
| 500 | Internal server error | 服务器内部错误 |

### 使用示例

#### cURL 命令

```bash
# 获取链接
curl "https://your-domain.pages.dev/api/link?key=your-api-key&appid=my-app"

# 更新链接
curl -X POST "https://your-domain.pages.dev/api/link?key=your-api-key&appid=my-app&link=https://new-url.com"

# 更新链接（带端口）
curl -X POST "https://your-domain.pages.dev/api/link?key=your-api-key&appid=my-app&link=https%3A%2F%2F192.168.1.1%3A8080"
```

#### Python 脚本

```python
import requests
from urllib.parse import quote

BASE_URL = "https://your-domain.pages.dev"
API_KEY = "your-api-key"
APP_ID = "my-app"

# 获取当前链接
response = requests.get(f"{BASE_URL}/api/link", params={
    "key": API_KEY,
    "appid": APP_ID
})
print(response.json())

# 更新链接
new_link = "https://192.168.1.1:8080"
response = requests.post(f"{BASE_URL}/api/link", params={
    "key": API_KEY,
    "appid": APP_ID,
    "link": new_link
})
print(response.json())
```

#### Shell 脚本（自动更新 IP）

```bash
#!/bin/bash
# 自动获取公网 IP 并更新导航链接

BASE_URL="https://your-domain.pages.dev"
API_KEY="your-api-key"
APP_ID="my-server"
PORT="8080"

# 获取公网 IP
PUBLIC_IP=$(curl -s https://api.ipify.org)

# 构建新链接
NEW_LINK="http://${PUBLIC_IP}:${PORT}"

# 更新导航链接
curl -X POST "${BASE_URL}/api/link?key=${API_KEY}&appid=${APP_ID}&link=$(echo $NEW_LINK | sed 's/:/%3A/g; s/\//%2F/g')"

echo "Updated ${APP_ID} to ${NEW_LINK}"
```

#### 定时任务（Linux Cron）

```bash
# 每 5 分钟更新一次 IP
*/5 * * * * /path/to/update-ip.sh >> /var/log/nav-update.log 2>&1
```

#### Windows 计划任务（PowerShell）

```powershell
# update-nav.ps1
$baseUrl = "https://your-domain.pages.dev"
$apiKey = "your-api-key"
$appId = "my-server"
$port = "8080"

# 获取公网 IP
$publicIp = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content

# 构建新链接
$newLink = "http://${publicIp}:${port}"
$encodedLink = [System.Web.HttpUtility]::UrlEncode($newLink)

# 更新导航链接
$response = Invoke-WebRequest -Uri "${baseUrl}/api/link?key=${apiKey}&appid=${appId}&link=${encodedLink}" -Method POST
Write-Host "Updated ${appId} to ${newLink}"
Write-Host $response.Content
```

### 典型应用场景

#### 1. DDNS 动态域名更新

当你的服务器使用动态 IP 时，可以配合脚本定期更新导航链接：

```bash
# 检测 IP 变化并更新
#!/bin/bash
CURRENT_IP=$(curl -s https://api.ipify.org)
LAST_IP_FILE="/tmp/last_ip.txt"

if [ -f "$LAST_IP_FILE" ]; then
    LAST_IP=$(cat $LAST_IP_FILE)
else
    LAST_IP=""
fi

if [ "$CURRENT_IP" != "$LAST_IP" ]; then
    echo "IP changed from $LAST_IP to $CURRENT_IP"
    # 更新所有需要更新的导航项
    curl -X POST "https://your-domain.pages.dev/api/link?key=your-api-key&appid=home-server&link=http://${CURRENT_IP}:8080"
    curl -X POST "https://your-domain.pages.dev/api/link?key=your-api-key&appid=nas&link=http://${CURRENT_IP}:5000"
    echo $CURRENT_IP > $LAST_IP_FILE
fi
```

#### 2. 服务健康检查后更新

```python
import requests

def check_and_update(appid, primary_url, backup_url, api_key, base_url):
    """检查主服务是否可用，不可用则切换到备用"""
    try:
        response = requests.get(primary_url, timeout=5)
        if response.status_code == 200:
            target_url = primary_url
        else:
            target_url = backup_url
    except:
        target_url = backup_url
    
    # 更新导航链接
    requests.post(f"{base_url}/api/link", params={
        "key": api_key,
        "appid": appid,
        "link": target_url
    })

# 使用示例
check_and_update(
    appid="my-service",
    primary_url="https://primary.example.com",
    backup_url="https://backup.example.com",
    api_key="your-api-key",
    base_url="https://your-domain.pages.dev"
)
```

#### 3. Docker 容器启动时更新

```dockerfile
# Dockerfile
FROM your-image
# ... 其他配置 ...
CMD sh -c 'curl -X POST "https://your-domain.pages.dev/api/link?key=${API_KEY}&appid=${APP_ID}&link=http://$(hostname -i):${PORT}" && exec your-app'
```

### 安全建议

1. **使用强密码作为 API Key**：建议使用 32 位以上的随机字符串
2. **使用 HTTPS**：确保 API 调用通过 HTTPS 进行
3. **限制 API Key 暴露**：不要在公开代码中硬编码 API Key
4. **定期更换 API Key**：建议定期更换以提高安全性

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
