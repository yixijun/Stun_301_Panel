<script setup lang="ts">
import { ref, computed } from 'vue';
import { useNavStore } from '../stores/navStore';
import type { AppData } from '../types';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const store = useNavStore();

// API Key
const apiKey = ref(store.settings.apiKey);
const apiKeySaved = ref(false);

// Import/Export
const importError = ref<string | null>(null);
const importSuccess = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

// Computed
const hasChanges = computed(() => apiKey.value !== store.settings.apiKey);

// API Key handlers
function saveApiKey() {
  store.updateApiKey(apiKey.value);
  apiKeySaved.value = true;
  setTimeout(() => {
    apiKeySaved.value = false;
  }, 2000);
}

// Export handler
function handleExport() {
  const data = store.exportData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `nav-portal-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import handlers
function triggerImport() {
  fileInput.value?.click();
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  
  importError.value = null;
  importSuccess.value = false;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const data = JSON.parse(content) as AppData;
      
      // Validate data structure
      if (!validateImportData(data)) {
        importError.value = '无效的数据格式';
        return;
      }
      
      store.importData(data);
      importSuccess.value = true;
      setTimeout(() => {
        importSuccess.value = false;
      }, 2000);
    } catch {
      importError.value = '解析 JSON 文件失败';
    }
  };
  reader.onerror = () => {
    importError.value = '读取文件失败';
  };
  reader.readAsText(file);
  
  // Reset file input
  target.value = '';
}

function validateImportData(data: unknown): data is AppData {
  if (!data || typeof data !== 'object') return false;
  
  const d = data as Record<string, unknown>;
  
  // Check required fields
  if (!Array.isArray(d.categories)) return false;
  if (!Array.isArray(d.navItems)) return false;
  if (!d.settings || typeof d.settings !== 'object') return false;
  
  // Validate categories
  for (const cat of d.categories) {
    if (!cat || typeof cat !== 'object') return false;
    const c = cat as Record<string, unknown>;
    if (typeof c.id !== 'string') return false;
    if (typeof c.name !== 'string') return false;
    if (typeof c.order !== 'number') return false;
  }
  
  // Validate navItems
  for (const item of d.navItems) {
    if (!item || typeof item !== 'object') return false;
    const i = item as Record<string, unknown>;
    if (typeof i.appid !== 'string') return false;
    if (typeof i.name !== 'string') return false;
    if (typeof i.link !== 'string') return false;
    if (typeof i.categoryId !== 'string') return false;
    if (typeof i.order !== 'number') return false;
  }
  
  return true;
}

function handleClose() {
  emit('close');
}

function handleOverlayClick(event: Event) {
  if (event.target === event.currentTarget) {
    handleClose();
  }
}
</script>

<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content settings-modal" @click.stop>
      <div class="modal-header">
        <h2>设置</h2>
        <button class="close-btn icon-btn" @click="handleClose" aria-label="关闭">
          ✕
        </button>
      </div>
      
      <div class="settings-content">
        <!-- API Key Section -->
        <section class="settings-section">
          <h3>API 密钥</h3>
          <p class="section-desc">用于 Webhook API 的身份验证</p>
          
          <div class="api-key-input">
            <input
              v-model="apiKey"
              type="password"
              placeholder="输入 API 密钥"
            />
            <button 
              @click="saveApiKey"
              :disabled="!hasChanges"
              :class="{ success: apiKeySaved }"
            >
              {{ apiKeySaved ? '已保存 ✓' : '保存' }}
            </button>
          </div>
        </section>
        
        <!-- Data Management Section -->
        <section class="settings-section">
          <h3>数据管理</h3>
          <p class="section-desc">导出或导入导航数据</p>
          
          <div class="data-actions">
            <button class="secondary" @click="handleExport">
              📤 导出数据
            </button>
            <button class="secondary" @click="triggerImport">
              📥 导入数据
            </button>
            <input
              ref="fileInput"
              type="file"
              accept=".json"
              style="display: none"
              @change="handleFileSelect"
            />
          </div>
          
          <p v-if="importError" class="error-msg">{{ importError }}</p>
          <p v-if="importSuccess" class="success-msg">数据导入成功 ✓</p>
        </section>
        
        <!-- Info Section -->
        <section class="settings-section info-section">
          <h3>关于</h3>
          <p class="section-desc">
            Nav Portal - 一个简洁的导航页应用
          </p>
          <p class="version">版本 1.0.0</p>
        </section>
      </div>
      
      <div class="modal-footer">
        <button @click="handleClose">关闭</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-modal {
  max-width: 480px;
}

.close-btn {
  font-size: 1.2rem;
  color: var(--text-secondary);
}

.close-btn:hover {
  color: var(--text-primary);
}

.settings-content {
  max-height: 60vh;
  overflow-y: auto;
}

.settings-section {
  padding: 1rem 0;
  border-bottom: 1px solid var(--border-color);
}

.settings-section:last-child {
  border-bottom: none;
}

.settings-section h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.section-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.api-key-input {
  display: flex;
  gap: 0.5rem;
}

.api-key-input input {
  flex: 1;
}

.api-key-input button {
  white-space: nowrap;
}

.api-key-input button.success {
  background: var(--success-color);
}

.api-key-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.data-actions {
  display: flex;
  gap: 0.75rem;
}

.data-actions button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.error-msg {
  color: var(--danger-color);
  font-size: 0.85rem;
  margin-top: 0.75rem;
}

.success-msg {
  color: var(--success-color);
  font-size: 0.85rem;
  margin-top: 0.75rem;
}

.info-section {
  text-align: center;
}

.version {
  font-size: 0.8rem;
  color: var(--text-secondary);
  opacity: 0.7;
}
</style>
