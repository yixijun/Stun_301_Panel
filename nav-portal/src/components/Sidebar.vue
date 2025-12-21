<script setup lang="ts">
import { useNavStore } from '../stores/navStore';
import CategoryList from './CategoryList.vue';

const store = useNavStore();

const emit = defineEmits<{
  (e: 'openSettings'): void;
  (e: 'addCategory'): void;
  (e: 'editCategory', id: string): void;
  (e: 'deleteCategory', id: string): void;
}>();

function handleToggleEditMode() {
  store.toggleEditMode();
}

function handleOpenSettings() {
  emit('openSettings');
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h1 class="logo">Nav Portal</h1>
    </div>
    
    <div class="sidebar-content">
      <CategoryList
        @add-category="emit('addCategory')"
        @edit-category="(id) => emit('editCategory', id)"
        @delete-category="(id) => emit('deleteCategory', id)"
      />
    </div>
    
    <div class="sidebar-footer">
      <button 
        class="edit-toggle"
        :class="{ active: store.isEditMode }"
        @click="handleToggleEditMode"
        :aria-pressed="store.isEditMode"
      >
        <span class="icon">✏️</span>
        <span>{{ store.isEditMode ? '退出编辑' : '编辑模式' }}</span>
      </button>
      
      <button 
        class="settings-btn icon-btn"
        @click="handleOpenSettings"
        aria-label="设置"
      >
        <span class="icon">⚙️</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  height: 100vh;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
}

.sidebar-header {
  padding: 1.25rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

.logo {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.edit-toggle {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: var(--bg-color);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.edit-toggle:hover {
  background: var(--border-color);
}

.edit-toggle.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.settings-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  font-size: 1.2rem;
}

.icon {
  font-style: normal;
}
</style>
