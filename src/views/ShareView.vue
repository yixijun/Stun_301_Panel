<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNavStore } from '../stores/navStore';
import type { NavItem, McServerStatus } from '../types';
import { apiClient } from '../api/client';

const route = useRoute();
const router = useRouter();
const store = useNavStore();

const item = ref<NavItem | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const mcStatus = ref<McServerStatus | null>(null);
const mcLoading = ref(false);
const isFirstMcLoad = ref(true);
const autoRefreshEnabled = ref(true);
const countdown = ref(5);
const copied = ref(false);
let refreshTimer: ReturnType<typeof setInterval> | null = null;
let countdownTimer: ReturnType<typeof setInterval> | null = null;
const serviceCopied = ref<string | null>(null);

// 登录相关
const requiresAuth = ref(false);
const isAuthChecking = ref(true);
const showLoginForm = ref(false);
const loginUsername = ref('');
const loginPassword = ref('');
const loginError = ref('');
const loginLoading = ref(false);

// Service address computed
const serviceAddress = computed(() => {
  if (!item.value?.serviceInfo?.host) return '';
  const { host, port } = item.value.serviceInfo;
  return port ? `${host}:${port}` : host;
});

// MC server computed
const serverAddress = computed(() => {
  if (!item.value?.mcServer) return '';
  const { host, port } = item.value.mcServer;
  const defaultPort = item.value.type === 'mc-java' ? 25565 : 19132;
  return port === defaultPort ? host : `${host}:${port}`;
});

const gameVersion = computed(() => {
  return item.value?.type === 'mc-java' ? 'Java版' : '基岩版';
});

// Service computed
const statusClass = computed(() => {
  return item.value?.serviceInfo?.status || 'unknown';
});

const statusText = computed(() => {
  const status = item.value?.serviceInfo?.status;
  if (status === 'online') return '运行中';
  if (status === 'offline') return '已停止';
  return '未知';
});

async function loadItem() {
  isLoading.value = true;
  error.value = null;
  
  try {
    // 检查是否需要登录验证
    const authRequired = route.query.auth === 'required';
    requiresAuth.value = authRequired;
    
    if (authRequired) {
      // 先加载数据以获取认证信息
      if (!store.navItems.length) {
        await store.loadData();
      }
      
      // 检查是否已登录
      const isLoggedIn = store.checkAuth();
      if (!isLoggedIn) {
        showLoginForm.value = true;
        isAuthChecking.value = false;
        isLoading.value = false;
        return;
      }
    }
    
    isAuthChecking.value = false;
    
    if (!store.navItems.length) {
      await store.loadData();
    }
    
    const appid = route.params.appid as string;
    item.value = store.getNavItemByAppId(appid) || null;
    
    if (!item.value) {
      error.value = '未找到该导航项';
      return;
    }
    
    // If MC type, fetch server status and start auto refresh
    if (item.value.type === 'mc-java' || item.value.type === 'mc-pe') {
      await fetchMcStatus();
      startAutoRefresh();
    }
  } catch (e) {
    error.value = '加载失败';
  } finally {
    isLoading.value = false;
  }
}

async function handleLogin() {
  if (!loginUsername.value.trim() || !loginPassword.value.trim()) {
    loginError.value = '请输入用户名和密码';
    return;
  }
  
  loginLoading.value = true;
  loginError.value = '';
  
  try {
    const success = await store.login(loginUsername.value.trim(), loginPassword.value);
    if (success) {
      showLoginForm.value = false;
      // 重新加载内容
      await loadItemContent();
    } else {
      loginError.value = '用户名或密码错误';
    }
  } catch {
    loginError.value = '登录失败，请重试';
  } finally {
    loginLoading.value = false;
  }
}

async function loadItemContent() {
  isLoading.value = true;
  try {
    const appid = route.params.appid as string;
    item.value = store.getNavItemByAppId(appid) || null;
    
    if (!item.value) {
      error.value = '未找到该导航项';
      return;
    }
    
    // If MC type, fetch server status and start auto refresh
    if (item.value.type === 'mc-java' || item.value.type === 'mc-pe') {
      await fetchMcStatus();
      startAutoRefresh();
    }
  } catch {
    error.value = '加载失败';
  } finally {
    isLoading.value = false;
  }
}

async function fetchMcStatus(silent = false) {
  if (!item.value?.mcServer) return;
  if (!silent) {
    mcLoading.value = true;
  }
  try {
    const type = item.value.type === 'mc-java' ? 'java' : 'bedrock';
    mcStatus.value = await apiClient.getMcServerStatus(
      item.value.mcServer.host,
      item.value.mcServer.port,
      type
    );
  } catch {
    mcStatus.value = { online: false };
  } finally {
    mcLoading.value = false;
    isFirstMcLoad.value = false;
    countdown.value = 5;
  }
}

function handleManualRefresh() {
  fetchMcStatus(false);
}

function startAutoRefresh() {
  stopAutoRefresh();
  if (!autoRefreshEnabled.value) return;
  
  countdown.value = 5;
  countdownTimer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--;
    }
  }, 1000);
  
  refreshTimer = setInterval(() => {
    if (autoRefreshEnabled.value && !mcLoading.value) {
      fetchMcStatus(true);
    }
  }, 5000);
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

function toggleAutoRefresh() {
  autoRefreshEnabled.value = !autoRefreshEnabled.value;
  if (autoRefreshEnabled.value) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
}

function copyAddress() {
  navigator.clipboard.writeText(serverAddress.value);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
}

function copyServiceField(text: string, field: string) {
  navigator.clipboard.writeText(text);
  serviceCopied.value = field;
  setTimeout(() => { serviceCopied.value = null; }, 1500);
}

function goHome() {
  router.push('/');
}

function openLink() {
  if (item.value?.link) {
    window.open(item.value.link, '_blank', 'noopener,noreferrer');
  }
}

function getIconDisplay(icon?: string): string {
  if (!icon) return '🔗';
  if (icon.length <= 2) return icon;
  return icon;
}

function isIconUrl(icon?: string): boolean {
  if (!icon) return false;
  return /^(https?:\/\/|\/)/.test(icon);
}

onMounted(loadItem);

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<template>
  <div class="share-view">
    <header class="page-header">
      <button class="back-btn" @click="goHome">
        ← 返回首页
      </button>
    </header>

    <!-- 登录表单 -->
    <div v-if="showLoginForm" class="login-section">
      <div class="login-card">
        <div class="login-header">
          <span class="login-icon">🔒</span>
          <h2>需要登录</h2>
          <p>此分享链接需要登录后才能查看</p>
        </div>
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="username">用户名</label>
            <input 
              id="username"
              v-model="loginUsername" 
              type="text" 
              placeholder="请输入用户名"
              autocomplete="username"
            />
          </div>
          <div class="form-group">
            <label for="password">密码</label>
            <input 
              id="password"
              v-model="loginPassword" 
              type="password" 
              placeholder="请输入密码"
              autocomplete="current-password"
            />
          </div>
          <p v-if="loginError" class="login-error">{{ loginError }}</p>
          <button type="submit" class="login-btn" :disabled="loginLoading">
            {{ loginLoading ? '登录中...' : '登录' }}
          </button>
        </form>
      </div>
    </div>

    <div v-else-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">😕</div>
      <p>{{ error }}</p>
      <button class="btn-primary" @click="goHome">返回首页</button>
    </div>

    <div v-else-if="item" class="content">
      <!-- Web 类型 -->
      <div v-if="!item.type || item.type === 'web'" class="detail-card web-card">
        <div class="card-header">
          <div class="card-icon large">
            <img v-if="isIconUrl(item.icon)" :src="item.icon" :alt="item.name" class="icon-image" />
            <span v-else class="icon-emoji">{{ getIconDisplay(item.icon) }}</span>
          </div>
          <div class="card-title-area">
            <h1 class="page-title">{{ item.name }}</h1>
            <span class="type-badge web">🌐 网页链接</span>
          </div>
        </div>
        <p v-if="item.description" class="description">{{ item.description }}</p>
        <div class="link-section">
          <a :href="item.link" target="_blank" rel="noopener noreferrer" class="link-btn">
            <span>🔗</span> 访问链接
          </a>
        </div>
      </div>

      <!-- Service 类型 -->
      <div v-else-if="item.type === 'service'" class="detail-card service-card">
        <div class="card-header">
          <div class="card-icon large">
            <img v-if="isIconUrl(item.icon)" :src="item.icon" :alt="item.name" class="icon-image" />
            <span v-else class="icon-emoji">{{ getIconDisplay(item.icon) || '🖥️' }}</span>
          </div>
          <div class="card-title-area">
            <h1 class="page-title">{{ item.name }}</h1>
            <div class="badges">
              <span class="type-badge service">🖥️ 服务</span>
              <span class="status-badge" :class="statusClass">{{ statusText }}</span>
            </div>
          </div>
        </div>
        <p v-if="item.description" class="description">{{ item.description }}</p>
        
        <!-- 服务器地址 (IP + 端口) -->
        <div v-if="item.serviceInfo?.host" class="service-address-box">
          <div class="address-row">
            <span 
              class="address-item clickable"
              :class="{ copied: serviceCopied === 'host' }"
              @click="copyServiceField(item.serviceInfo.host!, 'host')"
              title="点击复制 IP"
            >
              <span class="address-label">IP</span>
              <span class="address-value">{{ item.serviceInfo.host }}</span>
            </span>
            <span 
              v-if="item.serviceInfo.port"
              class="address-item clickable"
              :class="{ copied: serviceCopied === 'port' }"
              @click="copyServiceField(String(item.serviceInfo.port), 'port')"
              title="点击复制端口"
            >
              <span class="address-label">端口</span>
              <span class="address-value">{{ item.serviceInfo.port }}</span>
            </span>
            <button 
              class="copy-all-btn"
              :class="{ copied: serviceCopied === 'all' }"
              @click="copyServiceField(serviceAddress, 'all')"
              title="复制完整地址"
            >
              {{ serviceCopied === 'all' ? '✓' : '📋' }}
            </button>
          </div>
        </div>
        
        <div v-if="item.serviceInfo?.features?.length" class="features-row">
          <span v-for="feature in item.serviceInfo.features" :key="feature" class="feature-tag">
            {{ feature }}
          </span>
        </div>
        <div v-if="item.link" class="link-section">
          <button class="link-btn" @click="openLink">
            <span>🔗</span> 访问服务
          </button>
        </div>
      </div>

      <!-- MC 类型 - 美化横向布局 -->
      <div v-else-if="item.type === 'mc-java' || item.type === 'mc-pe'" class="mc-share-card">
        <!-- 顶部信息区 -->
        <div class="mc-header">
          <div class="mc-icon">
            <img v-if="isIconUrl(item.icon)" :src="item.icon" :alt="item.name" />
            <span v-else>{{ item.type === 'mc-java' ? '☕' : '📱' }}</span>
          </div>
          <div class="mc-title">
            <h1>{{ item.name }}</h1>
            <div class="mc-badges">
              <span class="version-badge" :class="item.type">{{ gameVersion }}</span>
              <span v-if="mcStatus" class="online-badge" :class="mcStatus.online ? 'online' : 'offline'">
                {{ mcStatus.online ? '● 在线' : '○ 离线' }}
              </span>
            </div>
          </div>
          <div class="mc-refresh">
            <button 
              class="refresh-icon-btn" 
              :class="{ spinning: mcLoading && !isFirstMcLoad }"
              @click="handleManualRefresh" 
              :disabled="mcLoading"
              title="刷新状态"
            >
              🔄
            </button>
            <button 
              class="auto-btn"
              :class="{ active: autoRefreshEnabled }"
              @click="toggleAutoRefresh"
              :title="autoRefreshEnabled ? '点击暂停自动刷新' : '点击开启自动刷新'"
            >
              {{ autoRefreshEnabled ? countdown + 's' : '⏸' }}
            </button>
          </div>
        </div>

        <!-- 服务器地址 -->
        <div class="mc-address" @click="copyAddress">
          <div class="address-content">
            <span class="address-label">服务器地址</span>
            <span class="address-value">{{ serverAddress }}</span>
          </div>
          <span class="copy-btn" :class="{ copied }">
            {{ copied ? '✓ 已复制' : '📋 复制' }}
          </span>
        </div>

        <!-- 首次加载提示 -->
        <div v-if="mcLoading && isFirstMcLoad" class="mc-loading">
          <span class="spinner small"></span>
          <span>正在查询服务器状态...</span>
        </div>

        <!-- 状态信息横向展示 -->
        <div v-else-if="mcStatus" class="mc-stats">
          <div v-if="mcStatus.online" class="stats-grid">
            <div v-if="mcStatus.version" class="stat-item">
              <span class="stat-icon">🎮</span>
              <div class="stat-info">
                <span class="stat-label">游戏版本</span>
                <span class="stat-value">{{ mcStatus.version }}</span>
              </div>
            </div>
            <div v-if="mcStatus.players" class="stat-item highlight">
              <span class="stat-icon">👥</span>
              <div class="stat-info">
                <span class="stat-label">在线人数</span>
                <span class="stat-value">{{ mcStatus.players.online }} / {{ mcStatus.players.max }}</span>
              </div>
            </div>
          </div>

          <!-- 在线玩家列表 -->
          <div v-if="mcStatus.online && mcStatus.players?.list?.length" class="players-section">
            <div class="players-header">
              <span>在线玩家</span>
              <span class="player-count">{{ mcStatus.players.list.length }}人</span>
            </div>
            <div class="players-grid">
              <span v-for="player in mcStatus.players.list" :key="player" class="player-item">
                {{ player }}
              </span>
            </div>
          </div>

          <!-- MOTD -->
          <div v-if="mcStatus.online && mcStatus.motd" class="motd-box">
            <span class="motd-label">📢 服务器公告</span>
            <div class="motd-content">{{ mcStatus.motd }}</div>
          </div>
        </div>

        <!-- 描述 -->
        <p v-if="item.description" class="mc-description">{{ item.description }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.share-view {
  min-height: 100vh;
  background: var(--bg-color);
  padding: 2rem;
}

.page-header {
  max-width: 700px;
  margin: 0 auto 2rem;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: var(--glass-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.back-btn:hover {
  background: var(--card-bg);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

/* 登录表单样式 */
.login-section {
  max-width: 400px;
  margin: 2rem auto;
}

.login-card {
  background: var(--card-bg);
  border-radius: var(--radius-xl);
  padding: 2.5rem;
  box-shadow: var(--shadow), 0 0 40px rgba(99, 102, 241, 0.1);
  border: 1px solid var(--border-color);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
}

.login-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.login-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.login-form .form-group {
  margin-bottom: 1.25rem;
}

.login-form label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.login-form input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  background: var(--input-bg);
  color: var(--text-primary);
  transition: all var(--transition-fast);
  box-sizing: border-box;
}

.login-form input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px var(--primary-light);
}

.login-error {
  color: var(--danger-color);
  font-size: 0.85rem;
  margin: 0 0 1rem 0;
  text-align: center;
}

.login-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -10px rgba(99, 102, 241, 0.5);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.content {
  max-width: 700px;
  margin: 0 auto;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.spinner.small {
  width: 18px;
  height: 18px;
  border-width: 2px;
  margin: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-state p {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

/* 通用卡片样式 */
.detail-card {
  background: var(--card-bg);
  border-radius: var(--radius-xl);
  padding: 2rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.card-icon.large {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--primary-light) 0%, rgba(139, 92, 246, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon.large .icon-image {
  width: 48px;
  height: 48px;
  object-fit: contain;
  border-radius: 8px;
}

.card-icon.large .icon-emoji {
  font-size: 2rem;
}

.card-title-area {
  flex: 1;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.type-badge {
  display: inline-block;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.type-badge.web { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
.type-badge.service { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }

.status-badge {
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.online { background: rgba(34, 197, 94, 0.15); color: var(--success-color); }
.status-badge.offline { background: rgba(239, 68, 68, 0.15); color: var(--danger-color); }
.status-badge.unknown { background: rgba(156, 163, 175, 0.15); color: var(--text-secondary); }

.description {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
}

.features-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

/* 服务地址样式 */
.service-address-box {
  margin: 1.25rem 0;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, var(--glass-bg) 0%, rgba(139, 92, 246, 0.05) 100%);
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-md);
}

.address-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.address-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.85rem;
  background: var(--card-bg);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  transition: all var(--transition-fast);
  border: 1px solid var(--border-color);
}

.address-item.clickable {
  cursor: pointer;
}

.address-item.clickable:hover {
  background: var(--primary-light);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.address-item.copied {
  background: rgba(34, 197, 94, 0.15);
  border-color: var(--success-color);
  color: var(--success-color);
}

.address-label {
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 0.8rem;
}

.address-value {
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  font-weight: 700;
  color: var(--text-primary);
}

.address-item.clickable:hover .address-value,
.address-item.copied .address-value {
  color: inherit;
}

.copy-all-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 1rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-left: auto;
}

.copy-all-btn:hover {
  background: var(--accent-color);
  transform: scale(1.1);
}

.copy-all-btn.copied {
  background: var(--success-color);
}

.feature-tag {
  padding: 0.4rem 0.8rem;
  background: var(--glass-bg);
  border-radius: 20px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.link-section {
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.link-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.link-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -10px rgba(99, 102, 241, 0.5);
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
}

/* MC 分享卡片美化 */
.mc-share-card {
  background: var(--card-bg);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow), 0 0 40px rgba(99, 102, 241, 0.1);
  border: 1px solid var(--border-color);
}

.mc-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, var(--primary-light) 0%, rgba(139, 92, 246, 0.08) 100%);
  border-bottom: 1px solid var(--border-color);
}

.mc-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-lg);
  background: var(--card-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  box-shadow: var(--shadow);
}

.mc-icon img {
  width: 44px;
  height: 44px;
  object-fit: contain;
  border-radius: 6px;
}

.mc-title {
  flex: 1;
  min-width: 0;
}

.mc-title h1 {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.4rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mc-badges {
  display: flex;
  gap: 0.5rem;
}

.version-badge {
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}

.version-badge.mc-java { background: rgba(139, 69, 19, 0.15); color: #8b4513; }
.version-badge.mc-pe { background: rgba(34, 139, 34, 0.15); color: #228b22; }

.online-badge {
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.online-badge.online { background: rgba(34, 197, 94, 0.15); color: var(--success-color); }
.online-badge.offline { background: rgba(239, 68, 68, 0.15); color: var(--danger-color); }

.mc-refresh {
  display: flex;
  gap: 0.35rem;
}

.refresh-icon-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  font-size: 1rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.refresh-icon-btn:hover:not(:disabled) {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.refresh-icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon-btn.spinning {
  animation: spin 1s linear infinite;
}

.auto-btn {
  min-width: 40px;
  height: 36px;
  padding: 0 0.6rem;
  border-radius: var(--radius-sm);
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.auto-btn:hover {
  border-color: var(--primary-color);
}

.auto-btn.active {
  background: rgba(34, 197, 94, 0.1);
  border-color: var(--success-color);
  color: var(--success-color);
}

/* 服务器地址 */
.mc-address {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 1.25rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, var(--glass-bg) 0%, rgba(99, 102, 241, 0.05) 100%);
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.mc-address:hover {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.address-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.address-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.address-value {
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--primary-color);
}

.copy-btn {
  padding: 0.5rem 1rem;
  background: var(--primary-color);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.copy-btn.copied {
  background: var(--success-color);
}

/* 加载状态 */
.mc-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: var(--text-secondary);
}

/* 状态信息横向展示 */
.mc-stats {
  padding: 0 1.25rem 1.25rem;
}

.stats-grid {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--glass-bg);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.stat-item.highlight {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%);
  border-color: rgba(34, 197, 94, 0.2);
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-item.highlight .stat-value {
  color: var(--success-color);
}

/* 玩家列表 */
.players-section {
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--glass-bg);
  border-radius: var(--radius-md);
}

.players-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.player-count {
  padding: 0.2rem 0.5rem;
  background: var(--primary-light);
  color: var(--primary-color);
  border-radius: 4px;
  font-weight: 600;
}

.players-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.player-item {
  padding: 0.35rem 0.75rem;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--text-primary);
}

/* MOTD */
.motd-box {
  padding: 1rem;
  background: var(--glass-bg);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--primary-color);
}

.motd-label {
  display: block;
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.motd-content {
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.5;
  white-space: pre-wrap;
}

/* MC 描述 */
.mc-description {
  margin: 0;
  padding: 1rem 1.25rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
  border-top: 1px solid var(--border-color);
  background: var(--glass-bg);
}

/* 响应式 */
@media (max-width: 768px) {
  .share-view {
    padding: 1rem;
  }

  .mc-header {
    flex-wrap: wrap;
  }

  .mc-title h1 {
    font-size: 1.2rem;
  }

  .mc-refresh {
    width: 100%;
    justify-content: flex-end;
    margin-top: 0.5rem;
  }

  .stats-grid {
    flex-direction: column;
  }

  .mc-address {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .copy-btn {
    width: 100%;
    text-align: center;
  }

  .card-header {
    flex-direction: column;
    text-align: center;
  }

  .badges {
    justify-content: center;
  }

  .link-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
