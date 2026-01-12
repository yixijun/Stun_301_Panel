<script setup lang="ts">
import { ref } from 'vue';
import type { NavItem } from '../types';
import { useNavStore } from '../stores/navStore';

const props = defineProps<{
  item: NavItem;
}>();

const emit = defineEmits<{
  (e: 'edit', appid: string): void;
  (e: 'delete', appid: string): void;
}>();

const store = useNavStore();
const copiedField = ref<string | null>(null);

function handleClick() {
  if (!store.isEditMode && props.item.link) {
    window.open(props.item.link, '_blank', 'noopener,noreferrer');
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

function getIconDisplay(icon?: string): string {
  if (!icon) return '🔗';
  if (icon.length <= 2) return icon;
  return icon;
}

function isIconUrl(icon?: string): boolean {
  if (!icon) return false;
  return /^(https?:\/\/|\/)/.test(icon);
}

// 服务类型相关
function copyToClipboard(text: string, field: string, event: Event) {
  event.stopPropagation();
  navigator.clipboard.writeText(text);
  copiedField.value = field;
  setTimeout(() => { copiedField.value = null; }, 1500);
}

function getServiceAddress(): string {
  if (!props.item.serviceInfo?.host) return '';
  const { host, port } = props.item.serviceInfo;
  return port ? `${host}:${port}` : host;
}
</script>

<template>
  <div 
    class="nav-card"
    :class="{ 'edit-mode': store.isEditMode }"
    @click="handleClick"
    role="button"
    :tabindex="store.isEditMode ? -1 : 0"
    @keydown.enter="handleClick"
  >
    <div class="card-icon">
      <img 
        v-if="isIconUrl(item.icon)" 
        :src="item.icon" 
        :alt="item.name"
        class="icon-image"
        @error="($event.target as HTMLImageElement).style.display = 'none'"
      />
      <span v-else class="icon-emoji">{{ getIconDisplay(item.icon) }}</span>
    </div>
    
    <div class="card-content">
      <h3 class="card-title">{{ item.name }}</h3>
      <p v-if="item.description" class="card-description">{{ item.description }}</p>
      
      <!-- 服务类型显示 IP 和端口 -->
      <div v-if="item.type === 'service' && item.serviceInfo?.host" class="service-info" @click.stop>
        <div class="info-row">
          <span 
            class="info-item clickable" 
            :class="{ copied: copiedField === 'host' }"
            @click="copyToClipboard(item.serviceInfo.host!, 'host', $event)"
            title="点击复制 IP"
          >
            <span class="info-label">IP</span>
            <span class="info-value">{{ item.serviceInfo.host }}</span>
          </span>
          <span 
            v-if="item.serviceInfo.port"
            class="info-item clickable" 
            :class="{ copied: copiedField === 'port' }"
            @click="copyToClipboard(String(item.serviceInfo.port), 'port', $event)"
            title="点击复制端口"
          >
            <span class="info-label">端口</span>
            <span class="info-value">{{ item.serviceInfo.port }}</span>
          </span>
          <button 
            class="copy-all-btn"
            :class="{ copied: copiedField === 'all' }"
            @click="copyToClipboard(getServiceAddress(), 'all', $event)"
            title="复制完整地址"
          >
            {{ copiedField === 'all' ? '✓' : '📋' }}
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="store.isEditMode" class="card-actions">
      <button 
        class="action-btn icon-btn"
        @click="handleEdit"
        aria-label="编辑导航项"
      >
        ✏️
      </button>
      <button 
        class="action-btn icon-btn danger"
        @click="handleDelete"
        aria-label="删除导航项"
      >
        🗑️
      </button>
    </div>
  </div>
</template>

<style scoped>
.nav-card {
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.nav-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--transition-normal);
}

.nav-card:hover {
  box-shadow: var(--shadow-hover), var(--shadow-glow);
  transform: translateY(-4px);
  border-color: rgba(99, 102, 241, 0.2);
}

.nav-card:hover::before {
  transform: scaleX(1);
}

.nav-card.edit-mode {
  cursor: default;
}

.nav-card.edit-mode:hover {
  transform: none;
}

.nav-card.edit-mode:hover::before {
  transform: scaleX(0);
}

.card-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--primary-light) 0%, rgba(139, 92, 246, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--transition-normal);
}

.nav-card:hover .card-icon {
  transform: scale(1.05);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
}

.icon-image {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 6px;
}

.icon-emoji {
  font-size: 1.6rem;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.35rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color var(--transition-fast);
}

.nav-card:hover .card-title {
  color: var(--primary-color);
}

.card-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5;
}

/* 服务信息样式 */
.service-info {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--border-color);
}

.info-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.info-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.6rem;
  background: var(--glass-bg);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  transition: all var(--transition-fast);
}

.info-item.clickable {
  cursor: pointer;
}

.info-item.clickable:hover {
  background: var(--primary-light);
  color: var(--primary-color);
}

.info-item.copied {
  background: rgba(34, 197, 94, 0.15);
  color: var(--success-color);
}

.info-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.info-value {
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  font-weight: 600;
  color: var(--text-primary);
}

.info-item.clickable:hover .info-value,
.info-item.copied .info-value {
  color: inherit;
}

.copy-all-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: var(--primary-light);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.copy-all-btn:hover {
  background: var(--primary-color);
  color: white;
  transform: scale(1.1);
}

.copy-all-btn.copied {
  background: var(--success-color);
  color: white;
}

.card-actions {
  display: flex;
  gap: 0.35rem;
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
}

.action-btn {
  font-size: 0.9rem;
  padding: 0.4rem;
  background: var(--glass-bg);
  border-radius: var(--radius-sm);
  opacity: 0.9;
  transition: all var(--transition-fast);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border: none;
  cursor: pointer;
}

.action-btn:hover {
  opacity: 1;
  transform: scale(1.1);
  background: var(--card-bg);
}

.action-btn.danger:hover {
  color: var(--danger-color);
  background: rgba(239, 68, 68, 0.1);
}

@media (max-width: 768px) {
  .nav-card {
    padding: 1.25rem;
  }

  .card-icon {
    width: 46px;
    height: 46px;
  }

  .icon-image {
    width: 28px;
    height: 28px;
  }

  .icon-emoji {
    font-size: 1.4rem;
  }

  .card-title {
    font-size: 0.95rem;
  }

  .card-description {
    font-size: 0.8rem;
  }

  .card-actions {
    top: 0.5rem;
    right: 0.5rem;
  }
}
</style>
