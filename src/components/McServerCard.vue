<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import type { NavItem, McServerStatus } from '../types';
import { useNavStore } from '../stores/navStore';
import { apiClient } from '../api/client';

const props = defineProps<{
  item: NavItem;
}>();

const emit = defineEmits<{
  (e: 'edit', appid: string): void;
  (e: 'delete', appid: string): void;
}>();

const store = useNavStore();
const serverStatus = ref<McServerStatus | null>(null);
const isLoading = ref(true);
const isFirstLoad = ref(true);
const autoRefreshEnabled = ref(true);
const countdown = ref(5);
let refreshTimer: ReturnType<typeof setInterval> | null = null;
let countdownTimer: ReturnType<typeof setInterval> | null = null;

const serverAddress = computed(() => {
  if (!props.item.mcServer) return '';
  const { host, port } = props.item.mcServer;
  const defaultPort = props.item.type === 'mc-java' ? 25565 : 19132;
  return port === defaultPort ? host : `${host}:${port}`;
});

const gameVersion = computed(() => {
  return props.item.type === 'mc-java' ? 'Java版' : '基岩版';
});

async function fetchServerStatus(silent = false) {
  if (!props.item.mcServer) return;
  if (!silent) {
    isLoading.value = true;
  }
  try {
    const type = props.item.type === 'mc-java' ? 'java' : 'bedrock';
    serverStatus.value = await apiClient.getMcServerStatus(
      props.item.mcServer.host,
      props.item.mcServer.port,
      type
    );
  } catch (error) {
    serverStatus.value = { online: false };
  } finally {
    isLoading.value = false;
    isFirstLoad.value = false;
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
    if (autoRefreshEnabled.value && !isLoading.value) {
      fetchServerStatus(true); // silent refresh
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

function handleEdit(event: Event) {
  event.stopPropagation();
  emit('edit', props.item.appid);
}

function handleDelete(event: Event) {
  event.stopPropagation();
  emit('delete', props.item.appid);
}

function copyAddress() {
  navigator.clipboard.writeText(serverAddress.value);
}

onMounted(() => {
  fetchServerStatus();
  startAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<template>
  <div class="mc-card" :class="{ 'edit-mode': store.isEditMode }">
    <div class="card-header">
      <div class="card-icon">
        <img 
          v-if="item.icon && /^(https?:\/\/|\/)/.test(item.icon)" 
          :src="item.icon" 
          :alt="item.name"
          class="icon-image"
        />
        <span v-else class="icon-emoji">{{ item.type === 'mc-java' ? '☕' : '📱' }}</span>
      </div>
      <div class="card-title-area">
        <h3 class="card-title">{{ item.name }}</h3>
        <span class="game-version" :class="item.type">{{ gameVersion }}</span>
      </div>
      <div v-if="store.isEditMode" class="card-actions">
        <button class="action-btn" @click="handleEdit" aria-label="编辑">✏️</button>
        <button class="action-btn danger" @click="handleDelete" aria-label="删除">🗑️</button>
      </div>
    </div>

    <p v-if="item.description" class="card-description">{{ item.description }}</p>

    <div class="server-info">
      <div class="server-address" @click="copyAddress" title="点击复制">
        <span class="label">服务器地址</span>
        <span class="value">{{ serverAddress }}</span>
        <span class="copy-icon">📋</span>
      </div>

      <div v-if="isLoading && isFirstLoad" class="status-loading">
        <span class="spinner"></span> 查询中...
      </div>

      <template v-if="serverStatus">
        <div class="status-row">
          <span class="label">状态</span>
          <span class="status-badge" :class="serverStatus.online ? 'online' : 'offline'">
            {{ serverStatus.online ? '在线' : '离线' }}
          </span>
        </div>

        <template v-if="serverStatus.online">
          <div v-if="serverStatus.version" class="status-row">
            <span class="label">版本</span>
            <span class="value">{{ serverStatus.version }}</span>
          </div>

          <div v-if="serverStatus.players" class="status-row">
            <span class="label">在线人数</span>
            <span class="value players">
              {{ serverStatus.players.online }} / {{ serverStatus.players.max }}
            </span>
          </div>

          <div v-if="serverStatus.players?.list?.length" class="players-list">
            <span class="label">在线玩家</span>
            <div class="player-tags">
              <span v-for="player in serverStatus.players.list" :key="player" class="player-tag">
                {{ player }}
              </span>
            </div>
          </div>
        </template>
      </template>
    </div>

    <div class="card-footer">
      <button class="refresh-btn" @click="fetchServerStatus" :disabled="isLoading">
        🔄 {{ isLoading ? '刷新中...' : '刷新状态' }}
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
</template>

<style scoped>
.mc-card {
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  transition: all var(--transition-normal);
}

.mc-card:hover {
  box-shadow: var(--shadow-hover);
  border-color: rgba(99, 102, 241, 0.2);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--primary-light) 0%, rgba(139, 92, 246, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-image {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 6px;
}

.icon-emoji {
  font-size: 1.5rem;
}

.card-title-area {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.game-version {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
}

.game-version.mc-java {
  background: rgba(139, 69, 19, 0.15);
  color: #8b4513;
}

.game-version.mc-pe {
  background: rgba(34, 139, 34, 0.15);
  color: #228b22;
}

.card-actions {
  display: flex;
  gap: 0.35rem;
}

.action-btn {
  font-size: 0.9rem;
  padding: 0.4rem;
  background: var(--glass-bg);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  transform: scale(1.1);
  background: var(--card-bg);
}

.action-btn.danger:hover {
  color: var(--danger-color);
}

.card-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.server-info {
  background: var(--glass-bg);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin-bottom: 1rem;
}

.server-address {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--bg-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  margin-bottom: 0.75rem;
  transition: background var(--transition-fast);
}

.server-address:hover {
  background: var(--primary-light);
}

.server-address .value {
  flex: 1;
  font-family: monospace;
  font-weight: 600;
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
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
}

.status-row:last-child {
  border-bottom: none;
}

.label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.value {
  font-weight: 600;
  color: var(--text-primary);
}

.value.players {
  color: var(--success-color);
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
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

.status-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.players-list {
  padding-top: 0.75rem;
}

.players-list .label {
  display: block;
  margin-bottom: 0.5rem;
}

.player-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.player-tag {
  padding: 0.25rem 0.5rem;
  background: var(--primary-light);
  color: var(--primary-color);
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.card-footer {
  display: flex;
  gap: 0.5rem;
}

.refresh-btn {
  flex: 1;
  padding: 0.75rem;
  background: var(--glass-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.9rem;
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
  padding: 0.75rem 1rem;
  background: var(--glass-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  min-width: 80px;
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
</style>
