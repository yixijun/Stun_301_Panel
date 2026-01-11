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
const autoRefreshEnabled = ref(true);
const countdown = ref(5);
let refreshTimer: ReturnType<typeof setInterval> | null = null;
let countdownTimer: ReturnType<typeof setInterval> | null = null;

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

async function fetchMcStatus() {
  if (!item.value?.mcServer) return;
  mcLoading.value = true;
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
    countdown.value = 5;
  }
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
      fetchMcStatus();
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

    <div v-if="isLoading" class="loading-state">
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

        <div class="info-section">
          <h2 class="section-title">服务描述</h2>
          <p class="description">{{ item.description || '暂无描述' }}</p>
        </div>

        <div v-if="item.serviceInfo?.description" class="info-section">
          <h2 class="section-title">详细信息</h2>
          <p class="description">{{ item.serviceInfo.description }}</p>
        </div>

        <div v-if="item.serviceInfo?.features?.length" class="info-section">
          <h2 class="section-title">功能特性</h2>
          <div class="features-grid">
            <div v-for="feature in item.serviceInfo.features" :key="feature" class="feature-item">
              <span class="feature-icon">✓</span>
              <span>{{ feature }}</span>
            </div>
          </div>
        </div>

        <div v-if="item.serviceInfo?.contact" class="info-section">
          <h2 class="section-title">联系方式</h2>
          <p class="contact">{{ item.serviceInfo.contact }}</p>
        </div>

        <div v-if="item.link" class="link-section">
          <button class="link-btn" @click="openLink">
            <span>🔗</span> 访问服务
          </button>
        </div>
      </div>

      <!-- MC 类型 -->
      <div v-else-if="item.type === 'mc-java' || item.type === 'mc-pe'" class="detail-card mc-card">
        <div class="card-header">
          <div class="card-icon large">
            <img v-if="isIconUrl(item.icon)" :src="item.icon" :alt="item.name" class="icon-image" />
            <span v-else class="icon-emoji">{{ item.type === 'mc-java' ? '☕' : '📱' }}</span>
          </div>
          <div class="card-title-area">
            <h1 class="page-title">{{ item.name }}</h1>
            <span class="type-badge" :class="item.type">{{ gameVersion }}</span>
          </div>
        </div>

        <p v-if="item.description" class="description">{{ item.description }}</p>

        <div class="server-info">
          <div class="server-address" @click="copyAddress" title="点击复制">
            <span class="label">服务器地址</span>
            <span class="value">{{ serverAddress }}</span>
            <span class="copy-icon">📋</span>
          </div>

          <div v-if="mcLoading" class="status-loading">
            <span class="spinner small"></span> 查询服务器状态...
          </div>

          <template v-else-if="mcStatus">
            <div class="status-row">
              <span class="label">状态</span>
              <span class="status-badge" :class="mcStatus.online ? 'online' : 'offline'">
                {{ mcStatus.online ? '在线' : '离线' }}
              </span>
            </div>

            <template v-if="mcStatus.online">
              <div v-if="mcStatus.version" class="status-row">
                <span class="label">游戏版本</span>
                <span class="value">{{ mcStatus.version }}</span>
              </div>

              <div v-if="mcStatus.players" class="status-row">
                <span class="label">在线人数</span>
                <span class="value players">
                  {{ mcStatus.players.online }} / {{ mcStatus.players.max }}
                </span>
              </div>

              <div v-if="mcStatus.players?.list?.length" class="players-list">
                <span class="label">在线玩家</span>
                <div class="player-tags">
                  <span v-for="player in mcStatus.players.list" :key="player" class="player-tag">
                    {{ player }}
                  </span>
                </div>
              </div>

              <div v-if="mcStatus.motd" class="motd-section">
                <span class="label">服务器公告</span>
                <div class="motd-text">{{ mcStatus.motd }}</div>
              </div>
            </template>
          </template>
        </div>

        <div class="mc-footer">
          <button class="refresh-btn" @click="fetchMcStatus" :disabled="mcLoading">
            🔄 {{ mcLoading ? '刷新中...' : '刷新状态' }}
          </button>
          <button 
            class="auto-refresh-btn" 
            :class="{ active: autoRefreshEnabled }"
            @click="toggleAutoRefresh"
          >
            <span v-if="autoRefreshEnabled">⏱️ {{ countdown }}s</span>
            <span v-else>⏸️ 已暂停</span>
          </button>
        </div>
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
  width: 16px;
  height: 16px;
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
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.card-icon.large {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--primary-light) 0%, rgba(139, 92, 246, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon.large .icon-image {
  width: 52px;
  height: 52px;
  object-fit: contain;
  border-radius: 8px;
}

.card-icon.large .icon-emoji {
  font-size: 2.5rem;
}

.card-title-area {
  flex: 1;
}

.page-title {
  font-size: 1.75rem;
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
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.type-badge.web {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.type-badge.service {
  background: rgba(139, 92, 246, 0.15);
  color: #8b5cf6;
}

.type-badge.mc-java {
  background: rgba(139, 69, 19, 0.15);
  color: #8b4513;
}

.type-badge.mc-pe {
  background: rgba(34, 139, 34, 0.15);
  color: #228b22;
}

.status-badge {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.online {
  background: rgba(34, 197, 94, 0.15);
  color: var(--success-color);
}

.status-badge.offline {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger-color);
}

.status-badge.unknown {
  background: rgba(156, 163, 175, 0.15);
  color: var(--text-secondary);
}

.description {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0 0 1.5rem 0;
}

.info-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.75rem 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--glass-bg);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  color: var(--text-primary);
}

.feature-icon {
  color: var(--success-color);
  font-weight: bold;
}

.contact {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin: 0;
}

.link-section {
  margin-top: 1.5rem;
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

/* MC Card specific */
.server-info {
  background: var(--glass-bg);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.server-address {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  background: var(--bg-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  margin-bottom: 1rem;
  transition: background var(--transition-fast);
}

.server-address:hover {
  background: var(--primary-light);
}

.server-address .label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.server-address .value {
  flex: 1;
  font-family: monospace;
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--primary-color);
}

.server-address .copy-icon {
  opacity: 0.5;
  transition: opacity var(--transition-fast);
}

.server-address:hover .copy-icon {
  opacity: 1;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
}

.status-row:last-child {
  border-bottom: none;
}

.status-row .label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.status-row .value {
  font-weight: 600;
  color: var(--text-primary);
}

.status-row .value.players {
  color: var(--success-color);
  font-size: 1.1rem;
}

.status-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.players-list {
  padding-top: 1rem;
}

.players-list .label {
  display: block;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.player-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.player-tag {
  padding: 0.35rem 0.75rem;
  background: var(--primary-light);
  color: var(--primary-color);
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
}

.motd-section {
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  margin-top: 1rem;
}

.motd-section .label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.motd-text {
  padding: 0.75rem;
  background: var(--bg-color);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  color: var(--text-primary);
  white-space: pre-wrap;
}

.mc-footer {
  display: flex;
  gap: 0.5rem;
}

.refresh-btn {
  flex: 1;
  padding: 0.875rem;
  background: var(--glass-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.refresh-btn:hover:not(:disabled) {
  background: var(--primary-light);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auto-refresh-btn {
  padding: 0.875rem 1.25rem;
  background: var(--glass-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  min-width: 90px;
}

.auto-refresh-btn:hover {
  background: var(--primary-light);
  border-color: var(--primary-color);
}

.auto-refresh-btn.active {
  background: rgba(34, 197, 94, 0.1);
  border-color: var(--success-color);
  color: var(--success-color);
}

@media (max-width: 768px) {
  .share-view {
    padding: 1rem;
  }

  .detail-card {
    padding: 1.5rem;
  }

  .card-header {
    flex-direction: column;
    text-align: center;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .badges {
    justify-content: center;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .link-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
