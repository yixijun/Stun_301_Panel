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

// Create form
const selectedAppId = ref('');
const extraParams = ref('');
const paramType = ref<'path' | 'query'>('path'); // path = 追加到路径, query = 作为查询参数
const expiresIn = ref(0); // 0 = permanent

const navItemOptions = computed(() => store.navItems);

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
    // 根据参数类型构建参数字符串
    let params = extraParams.value || undefined;
    if (params && paramType.value === 'path') {
      // 标记为路径类型参数
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

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

function getNavItemName(appid: string): string {
  const item = store.navItems.find(i => i.appid === appid);
  return item?.name || appid;
}

onMounted(loadShareLinks);
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content share-modal">
      <div class="modal-header">
        <h2>分享链接管理</h2>
        <button class="close-btn" @click="emit('close')">×</button>
      </div>

      <div class="modal-body">
        <!-- Create button -->
        <div class="create-section">
          <button 
            v-if="!showCreateForm" 
            class="btn btn-primary"
            @click="showCreateForm = true"
          >
            + 创建分享链接
          </button>

          <!-- Create form -->
          <div v-else class="create-form">
            <div class="form-group">
              <label>选择导航项</label>
              <select v-model="selectedAppId">
                <option value="">请选择...</option>
                <option 
                  v-for="item in navItemOptions" 
                  :key="item.appid" 
                  :value="item.appid"
                >
                  {{ item.name }} ({{ item.appid }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>额外参数 (可选)</label>
              <input 
                v-model="extraParams" 
                type="text" 
                placeholder="例如: share/abc123 或 token=xxx"
              />
              <div class="param-type-selector">
                <label>
                  <input type="radio" v-model="paramType" value="path" />
                  追加到路径 (如 /share/abc)
                </label>
                <label>
                  <input type="radio" v-model="paramType" value="query" />
                  作为查询参数 (如 ?token=xxx)
                </label>
              </div>
            </div>

            <div class="form-group">
              <label>有效期</label>
              <select v-model="expiresIn">
                <option :value="0">永久有效</option>
                <option :value="30">30 分钟</option>
                <option :value="60">1 小时</option>
                <option :value="1440">1 天</option>
                <option :value="10080">7 天</option>
                <option :value="43200">30 天</option>
              </select>
            </div>

            <div class="form-actions">
              <button class="btn btn-secondary" @click="showCreateForm = false">取消</button>
              <button 
                class="btn btn-primary" 
                @click="createShareLink"
                :disabled="!selectedAppId || isLoading"
              >
                创建
              </button>
            </div>
          </div>
        </div>

        <!-- Share links list -->
        <div class="share-list">
          <div v-if="isLoading" class="loading">加载中...</div>
          <div v-else-if="shareLinks.length === 0" class="empty">暂无分享链接</div>
          <div 
            v-else 
            v-for="link in shareLinks" 
            :key="link.id" 
            class="share-item"
            :class="{ expired: link.expired }"
          >
            <div class="share-info">
              <div class="share-name">{{ getNavItemName(link.appid) }}</div>
              <div class="share-url">
                <code>{{ getShareUrl(link.id) }}</code>
                <button class="copy-btn" @click="copyToClipboard(getShareUrl(link.id))">复制</button>
              </div>
              <div class="share-meta">
                <span v-if="link.params" class="params">
                  参数: {{ link.params.startsWith('__path__:') ? link.params.substring(9) : link.params }}
                  ({{ link.params.startsWith('__path__:') ? '路径' : '查询' }})
                </span>
                <span v-if="link.permanent" class="permanent">永久有效</span>
                <span v-else-if="link.expired" class="expired-tag">已过期</span>
                <span v-else class="expires">过期: {{ formatDate(link.expiresAt!) }}</span>
                <span class="created">创建: {{ formatDate(link.createdAt) }}</span>
              </div>
            </div>
            <button class="delete-btn" @click="deleteShareLink(link.id)">删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

.create-section {
  margin-bottom: 20px;
}

.create-form {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
  color: #666;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.param-type-selector {
  margin-top: 8px;
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #666;
}

.param-type-selector label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.param-type-selector input[type="radio"] {
  width: auto;
  margin: 0;
}

.form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background: #4a90d9;
  color: white;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #eee;
  color: #333;
}

.share-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.loading, .empty {
  text-align: center;
  color: #999;
  padding: 20px;
}

.share-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  gap: 12px;
}

.share-item.expired {
  opacity: 0.6;
}

.share-info {
  flex: 1;
  min-width: 0;
}

.share-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.share-url {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.share-url code {
  flex: 1;
  background: #eee;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-btn {
  padding: 4px 8px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  flex-shrink: 0;
}

.share-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.share-meta span {
  background: #eee;
  padding: 2px 6px;
  border-radius: 4px;
}

.permanent {
  background: #d4edda !important;
  color: #155724 !important;
}

.expired-tag {
  background: #f8d7da !important;
  color: #721c24 !important;
}

.delete-btn {
  padding: 6px 12px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 90vh;
  }
  
  .share-url {
    flex-direction: column;
    align-items: stretch;
  }
  
  .share-url code {
    width: 100%;
  }
}
</style>
