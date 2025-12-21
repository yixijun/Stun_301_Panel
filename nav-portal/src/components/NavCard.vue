<script setup lang="ts">
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
  // If it's an emoji or short text, return as is
  if (icon.length <= 2) return icon;
  // If it's a URL, we'll handle it in template
  return icon;
}

function isIconUrl(icon?: string): boolean {
  if (!icon) return false;
  return icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('/');
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
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.nav-card:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}

.nav-card.edit-mode {
  cursor: default;
}

.nav-card.edit-mode:hover {
  transform: none;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: var(--bg-color);
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

.card-content {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-description {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

.card-actions {
  display: flex;
  gap: 0.25rem;
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
}

.action-btn {
  font-size: 0.9rem;
  padding: 0.3rem;
  background: var(--bg-color);
  border-radius: 6px;
  opacity: 0.8;
  transition: all 0.15s ease;
}

.action-btn:hover {
  opacity: 1;
  background: var(--border-color);
}

.action-btn.danger:hover {
  color: var(--danger-color);
}
</style>
