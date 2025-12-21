<script setup lang="ts">
import { ref } from 'vue';
import { useNavStore } from '../stores/navStore';
import CategoryList from './CategoryList.vue';

const store = useNavStore();
const isMobileMenuOpen = ref(false);

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

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false;
}
</script>

<template>
  <!-- Mobile Header -->
  <div class="mobile-header">
    <button class="menu-btn" @click="toggleMobileMenu" aria-label="菜单">
      <span>☰</span>
    </button>
    <h1 class="mobile-logo">Nav Portal</h1>
    <button class="settings-btn-mobile icon-btn" @click="handleOpenSettings" aria-label="设置">
      <span>⚙️</span>
    </button>
  </div>

  <!-- Mobile Overlay -->
  <div 
    v-if="isMobileMenuOpen" 
    class="mobile-overlay" 
    @click="closeMobileMenu"
  ></div>

  <aside class="sidebar" :class="{ 'mobile-open': isMobileMenuOpen }">
    <div class="sidebar-header">
      <h1 class="logo">Nav Portal</h1>
      <button class="close-btn icon-btn mobile-only" @click="closeMobileMenu" aria-label="关闭">
        ✕
      </button>
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
        class="settings-btn icon-btn desktop-only"
        @click="handleOpenSettings"
        aria-label="设置"
      >
        <span class="icon">⚙️</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.mobile-header {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--sidebar-bg);
  border-bottom: 1px solid var(--border-color);
  padding: 0 1rem;
  align-items: center;
  justify-content: space-between;
  z-index: 100;
}

.mobile-logo {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0;
}

.menu-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  padding: 0.5rem;
  color: var(--text-primary);
}

.settings-btn-mobile {
  font-size: 1.3rem;
}

.mobile-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 199;
}

.mobile-only {
  display: none;
}

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
  z-index: 200;
}

.sidebar-header {
  padding: 1.25rem 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0;
}

.close-btn {
  font-size: 1.2rem;
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

/* Mobile Responsive */
@media (max-width: 768px) {
  .mobile-header {
    display: flex;
  }

  .mobile-overlay {
    display: block;
  }

  .mobile-only {
    display: block;
  }

  .desktop-only {
    display: none;
  }

  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .sidebar-header {
    padding: 1rem;
  }
}
</style>
