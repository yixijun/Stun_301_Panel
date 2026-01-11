<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useNavStore } from '../stores/navStore';
import { apiClient } from '../api/client';
import type { ShareLinkDisplay } from '../types';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const store = useNavStore();
const shareLinks = ref<ShareLinkDisplay[]>([]);
const isLoading = ref(false);
const showCreateForm = ref(false);
const copiedId = ref<string | null>(null);

// Create form
const selectedAppId = ref('');
const extraParams = ref('');
const paramType = ref<'path' | 'query'>('path');
const expiresIn = ref(0);

const navItemOptions = computed(() => 
  store.navItems.filter(item => !item.type || item.type === 'web')
);

async function loadShareLinks() {
  isLoading.value = true;
  try {
    shareLinks.value = await apiClient.listShareLinks();
  } catch (e) {
    console.error('Failed to load share links:', e);
  } finally {
    isLoading.value = false;
  }
}

async function createShareLink() {
  if (!selectedAppId.value) return;
  
  isLoading.value = true;
  try {
    let params = extraParams.value || undefined;
    if (params && paramType.value === 'path') {
      params = `__path__:${params}`;
    }
    
    await apiClient.createShareLink(
      selectedAppId.value,
      params,
      expiresIn.value || undefined
    );
    await loadShareLinks();
    showCreateForm.value = false;
    selectedAppId.value = '';
    extraParams.value = '';
    paramType.value = 'path';
    expiresIn.value = 0;
  } catch (e) {
    console.error('Failed to create share link:', e);
  } finally {
    isLoading.value = false;
  }
}

async function deleteShareLink(id: string) {
  if (!confirm('确定删除此分享链接？')) return;
  
  isLoading.value = true;
  try {
    await apiClient.deleteShareLink(id);
    await loadShareLinks();
  } catch (e) {
    console.error('Failed to delete share link:', e);
  } finally {
    isLoading.value = false;
  }
}

function getShareUrl(id: string): string {
  return `${window.location.origin}/api/go/${id}`;
}

function copyToClipboard(text: string, id: string) {
  navigator.clipboard.writeText(text);
  copiedId.value = id;
  setTimeout(() => { copiedId.value = null; }, 2000);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN');
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return `${days}天前`;
}

function getNavItemName(appid: string): string {
  const item = store.navItems.find(i => i.appid === appid);
  return item?.name || appid;
}

onMounted(loadShareLinks);
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="share-modal">
      <div class="modal-header">
        <h2>🔗 分享链接管理</h2>
        <button class="close-btn" @click="emit('close')">
          <span>✕</span>
        </button>
      </div>

      <div class="modal-body">
        <!-- Share links content -->
        <div class="tab-content">
          <!-- Create button -->
          <div class="create-section">
            <button 
              v-if="!showCreateForm" 
              class="create-btn"
              @click="showCreateForm = true"
            >
              <span>✨</span> 创建分享链接
            </button>

            <!-- Create form -->
            <div v-else class="create-form">
              <div class="form-header">
                <h3>创建新链接</h3>
                <button class="icon-btn" @click="showCreateForm = false">✕</button>
              </div>
              
              <div class="form-group">
                <label>选择导航项</label>
                <select v-model="selectedAppId" class="select-input">
                  <option value="">请选择...</option>
                  <option 
                    v-for="item in navItemOptions" 
                    :key="item.appid" 
                    :value="item.appid"
                  >
                    {{ item.name }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>额外参数 <span class="optional">(可选)</span></label>
                <input 
                  v-model="extraParams" 
                  type="text" 
                  placeholder="例如: share/abc123"
                  class="text-input"
                />
                <div class="param-type-selector">
                  <label class="radio-label">
                    <input type="radio" v-model="paramType" value="path" />
                    <span class="radio-text">追加到路径</span>
                  </label>
                  <label class="radio-label">
                    <input type="radio" v-model="paramType" value="query" />
                    <span class="radio-text">查询参数</span>
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label>有效期</label>
                <select v-model="expiresIn" class="select-input">
                  <option :value="0">♾️ 永久有效</option>
                  <option :value="30">⏱️ 30 分钟</option>
                  <option :value="60">⏱️ 1 小时</option>
                  <option :value="1440">📅 1 天</option>
                  <option :value="10080">📅 7 天</option>
                  <option :value="43200">📅 30 天</option>
                </select>
              </div>

              <div class="form-actions">
                <button class="btn-secondary" @click="showCreateForm = false">取消</button>
                <button 
                  class="btn-primary" 
                  @click="createShareLink"
                  :disabled="!selectedAppId || isLoading"
                >
                  {{ isLoading ? '创建中...' : '创建链接' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Share links list -->
          <div class="share-list">
            <div v-if="isLoading && shareLinks.length === 0" class="loading-state">
              <div class="spinner"></div>
              <span>加载中...</span>
            </div>
            <div v-else-if="shareLinks.length === 0" class="empty-state">
              <span class="empty-icon">📭</span>
              <p>暂无分享链接</p>
              <p class="empty-hint">点击上方按钮创建第一个分享链接</p>
            </div>
            <div 
              v-else 
              v-for="link in shareLinks" 
              :key="link.id" 
              class="share-card"
              :class="{ expired: link.expired }"
            >
              <div class="card-header">
                <div class="card-title">
                  <span class="nav-icon">🔗</span>
                  {{ getNavItemName(link.appid) }}
                </div>
                <div class="card-badges">
                  <span v-if="link.permanent" class="badge badge-success">永久</span>
                  <span v-else-if="link.expired" class="badge badge-danger">已过期</span>
                  <span v-else class="badge badge-warning">限时</span>
                </div>
              </div>
              
              <div class="card-url">
                <code>{{ getShareUrl(link.id) }}</code>
                <button 
                  class="copy-btn" 
                  :class="{ copied: copiedId === link.id }"
                  @click="copyToClipboard(getShareUrl(link.id), link.id)"
                >
                  {{ copiedId === link.id ? '✓ 已复制' : '复制' }}
                </button>
              </div>
              
              <div class="card-meta">
                <span v-if="link.params" class="meta-item">
                  <span class="meta-icon">📎</span>
                  {{ link.params.startsWith('__path__:') ? link.params.substring(9) : link.params }}
                </span>
                <span class="meta-item">
                  <span class="meta-icon">📅</span>
                  {{ formatRelativeTime(link.createdAt) }}创建
                </span>
                <span v-if="!link.permanent && !link.expired" class="meta-item">
                  <span class="meta-icon">⏰</span>
                  {{ formatDate(link.expiresAt!) }}过期
                </span>
              </div>
              
              <button class="delete-btn" @click="deleteShareLink(link.id)">
                <span>🗑️</span> 删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.share-modal {
  background: var(--modal-bg);
  backdrop-filter: blur(20px);
  border-radius: var(--radius-xl);
  width: 95%;
  max-width: 680px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), var(--shadow-glow);
  border: 1px solid var(--border-color);
  animation: modalSlideUp 0.3s ease;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.75rem;
  background: linear-gradient(135deg, var(--primary-light) 0%, rgba(139, 92, 246, 0.05) 100%);
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: transparent;
  border: none;
  font-size: 1.25rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: var(--primary-light);
  color: var(--primary-color);
  transform: rotate(90deg);
}

/* Tabs */
.tabs {
  display: flex;
  padding: 0 1.75rem;
  gap: 0.5rem;
  background: rgba(248, 250, 252, 0.5);
  border-bottom: 1px solid var(--border-color);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  background: transparent;
  border: none;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  position: relative;
  transition: all var(--transition-fast);
}

.tab-btn::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
  border-radius: 3px 3px 0 0;
  transform: scaleX(0);
  transition: transform var(--transition-normal);
}

.tab-btn:hover {
  color: var(--primary-color);
}

.tab-btn.active {
  color: var(--primary-color);
}

.tab-btn.active::after {
  transform: scaleX(1);
}

.tab-icon {
  font-size: 1.1rem;
}

.modal-body {
  padding: 1.5rem 1.75rem;
  overflow-y: auto;
  flex: 1;
}

.tab-content {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Create Section */
.create-section {
  margin-bottom: 1.5rem;
}

.create-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all var(--transition-normal);
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -10px rgba(99, 102, 241, 0.5);
}

.create-form {
  background: linear-gradient(135deg, var(--primary-light) 0%, rgba(139, 92, 246, 0.03) 100%);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.form-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.optional {
  font-weight: 400;
  color: var(--text-secondary);
}

.select-input, .text-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  background: var(--input-bg);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.select-input:focus, .text-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px var(--primary-light);
  background: var(--input-focus-bg);
}

.param-type-selector {
  margin-top: 0.75rem;
  display: flex;
  gap: 1.5rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.radio-label input[type="radio"] {
  width: 18px;
  height: 18px;
  accent-color: var(--primary-color);
}

.radio-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-color);
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--glass-bg);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}

.btn-secondary:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

/* Share List */
.share-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: var(--text-secondary);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.75rem;
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
}

.empty-hint {
  font-size: 0.9rem !important;
  opacity: 0.7;
  margin-top: 0.5rem !important;
}

.share-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.share-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--transition-normal);
}

.share-card:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-hover), var(--shadow-glow);
  transform: translateY(-2px);
}

.share-card:hover::before {
  transform: scaleX(1);
}

.share-card.expired {
  opacity: 0.6;
  background: var(--glass-bg);
}

.share-card.expired::before {
  background: linear-gradient(90deg, var(--danger-color), #f87171);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--text-primary);
  transition: color var(--transition-fast);
}

.share-card:hover .card-title {
  color: var(--primary-color);
}

.nav-icon {
  font-size: 1.25rem;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-light) 0%, rgba(139, 92, 246, 0.1) 100%);
  border-radius: var(--radius-sm);
}

.card-badges {
  display: flex;
  gap: 0.5rem;
}

.badge {
  padding: 0.35rem 0.85rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-success {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%);
  color: #16a34a;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.badge-danger {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.badge-warning {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.card-url {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, var(--glass-bg) 0%, rgba(99, 102, 241, 0.03) 100%);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  transition: all var(--transition-fast);
}

.share-card:hover .card-url {
  border-color: var(--primary-color);
  background: linear-gradient(135deg, var(--primary-light) 0%, rgba(139, 92, 246, 0.05) 100%);
}

.card-url code {
  flex: 1;
  font-size: 0.85rem;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'SF Mono', Monaco, 'Consolas', monospace;
}

.copy-btn {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.copy-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.copy-btn.copied {
  background: linear-gradient(135deg, var(--success-color) 0%, #16a34a 100%);
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
  padding-top: 0.75rem;
  border-top: 1px dashed var(--border-color);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.5rem;
  background: var(--glass-bg);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.meta-item:hover {
  background: var(--primary-light);
  color: var(--primary-color);
}

.meta-icon {
  font-size: 0.9rem;
}

.delete-btn {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  padding: 0.5rem 0.85rem;
  background: var(--glass-bg);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 0.35rem;
  opacity: 0;
  transform: translateX(10px);
}

.share-card:hover .delete-btn {
  opacity: 1;
  transform: translateX(0);
}

.delete-btn:hover {
  background: var(--danger-color);
  color: white;
  border-color: var(--danger-color);
  transform: scale(1.05);
}

/* Logs Tab */
.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.logs-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.clear-btn {
  padding: 0.5rem 1rem;
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger-color);
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  transition: all var(--transition-fast);
}

.clear-btn:hover {
  background: var(--danger-color);
  color: white;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.log-card {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1rem;
  transition: all var(--transition-fast);
}

.log-card:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow);
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.log-target {
  font-weight: 700;
  color: var(--primary-color);
}

.log-time {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.log-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.log-label {
  color: var(--text-secondary);
}

.log-value {
  color: var(--text-primary);
  font-weight: 500;
}

.log-ua {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.85rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-color);
  margin-top: 0.5rem;
}

.ua-text {
  color: var(--text-secondary);
  word-break: break-all;
  line-height: 1.4;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .share-modal {
    width: 100%;
    max-width: none;
    max-height: 100vh;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    margin-top: auto;
  }

  .modal-header {
    padding: 1.25rem;
  }

  .tabs {
    padding: 0 1rem;
  }

  .tab-btn {
    padding: 0.875rem 1rem;
    font-size: 0.9rem;
  }

  .modal-body {
    padding: 1.25rem;
  }

  .create-form {
    padding: 1.25rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions button {
    width: 100%;
  }

  .card-url {
    flex-direction: column;
    align-items: stretch;
  }

  .card-url code {
    padding: 0.5rem 0;
  }

  .copy-btn {
    width: 100%;
    justify-content: center;
    padding: 0.6rem;
  }

  .card-meta {
    flex-direction: column;
    gap: 0.5rem;
  }

  .delete-btn {
    opacity: 1;
    position: static;
    width: 100%;
    justify-content: center;
    margin-top: 0.75rem;
    padding: 0.6rem;
  }

  .log-details {
    grid-template-columns: 1fr;
  }
}
</style>
