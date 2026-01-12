<script setup lang="ts">
import { computed } from 'vue';
import type { NavItem } from '../types';
import { useNavStore } from '../stores/navStore';
import { useRouter } from 'vue-router';

const props = defineProps<{
  item: NavItem;
}>();

const emit = defineEmits<{
  (e: 'edit', appid: string): void;
  (e: 'delete', appid: string): void;
}>();

const store = useNavStore();
const router = useRouter();

const statusClass = computed(() => {
  return props.item.serviceInfo?.status || 'unknown';
});

const statusText = computed(() => {
  const status = props.item.serviceInfo?.status;
  if (status === 'online') return '运行中';
  if (status === 'offline') return '已停止';
  return '未知';
});

function handleClick() {
  if (!store.isEditMode) {
    router.push({ name: 'service-detail', params: { appid: props.item.appid } });
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
  if (!icon) return '🖥️';
  if (icon.length <= 2) return icon;
  return icon;
}

function isIconUrl(icon?: string): boolean {
  if (!icon) return false;
  return /^(https?:\/\/|\/)/.test(icon);
}
</script>

<template>
  <div 
    class="service-card"
    :class="{ 'edit-mode': store.isEditMode }"
    @click="handleClick"
    role="button"
    :tabindex="store.isEditMode ? -1 : 0"
  >
    <div class="card-header">
      <div class="card-icon">
        <img 
          v-if="isIconUrl(item.icon)" 
          :src="item.icon" 
          :alt="item.name"
          class="icon-image"
        />
        <span v-else class="icon-emoji">{{ getIconDisplay(item.icon) }}</span>
      </div>
      <div class="card-title-area">
        <h3 class="card-title">{{ item.name }}</h3>
        <span class="status-badge" :class="statusClass">{{ statusText }}</span>
      </div>
      <div v-if="store.isEditMode" class="card-actions">
        <button class="action-btn" @click="handleEdit" aria-label="编辑">✏️</button>
        <button class="action-btn danger" @click="handleDelete" aria-label="删除">🗑️</button>
      </div>
    </div>

    <p v-if="item.description" class="card-description">{{ item.description }}</p>

    <div v-if="item.serviceInfo?.host" class="server-address">
      <span class="address-icon">🌐</span>
      <span class="address-text">{{ item.serviceInfo.host }}{{ item.serviceInfo.port ? ':' + item.serviceInfo.port : '' }}</span>
    </div>

    <div v-if="item.serviceInfo?.features?.length" class="features">
      <span v-for="feature in item.serviceInfo.features.slice(0, 3)" :key="feature" class="feature-tag">
        {{ feature }}
      </span>
      <span v-if="item.serviceInfo.features.length > 3" class="feature-more">
        +{{ item.serviceInfo.features.length - 3 }}
      </span>
    </div>

    <div class="card-footer">
      <span class="view-detail">查看详情 →</span>
    </div>
  </div>
</template>

<style scoped>
.service-card {
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.service-card::before {
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

.service-card:hover {
  box-shadow: var(--shadow-hover), var(--shadow-glow);
  transform: translateY(-4px);
  border-color: rgba(99, 102, 241, 0.2);
}

.service-card:hover::before {
  transform: scaleX(1);
}

.service-card.edit-mode {
  cursor: default;
}

.service-card.edit-mode:hover {
  transform: none;
}

.service-card.edit-mode:hover::before {
  transform: scaleX(0);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
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
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.status-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
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
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.feature-tag {
  padding: 0.25rem 0.5rem;
  background: var(--glass-bg);
  border-radius: 4px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.feature-more {
  padding: 0.25rem 0.5rem;
  background: var(--primary-light);
  border-radius: 4px;
  font-size: 0.8rem;
  color: var(--primary-color);
  font-weight: 600;
}

.card-footer {
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
}

.view-detail {
  font-size: 0.85rem;
  color: var(--primary-color);
  font-weight: 600;
  transition: color var(--transition-fast);
}

.service-card:hover .view-detail {
  color: var(--accent-color);
}
</style>
