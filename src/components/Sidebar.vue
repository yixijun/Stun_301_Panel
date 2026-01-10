<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useNavStore } from '../stores/navStore';
import CategoryList from './CategoryList.vue';

const store = useNavStore();
const isMobileMenuOpen = ref(false);
const currentTheme = ref<'light' | 'dark' | 'system'>('system');

const emit = defineEmits<{
  (e: 'openSettings'): void;
  (e: 'addCategory'): void;
  (e: 'editCategory', id: string): void;
  (e: 'deleteCategory', id: string): void;
}>();

onMounted(() => {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    currentTheme.value = saved;
    applyTheme(saved);
  }
});

function applyTheme(theme: 'light' | 'dark' | 'system') {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

function toggleTheme() {
  const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
  const currentIndex = themes.indexOf(currentTheme.value);
  const nextTheme = themes[(currentIndex + 1) % themes.length];
  currentTheme.value = nextTheme;
  localStorage.setItem('theme', nextTheme);
  applyTheme(nextTheme);
}

function getThemeIcon() {
  switch (currentTheme.value) {
    case 'light': return '☀️';
    case 'dark': return '🌙';
    default: return '💻';
  }
}

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
        class="theme-toggle icon-btn"
        @click="toggleTheme"
        :aria-label="'切换主题: ' + currentTheme"
        :title="currentTheme === 'light' ? '浅色模式' : currentTheme === 'dark' ? '深色模式' : '跟随系统'"
      >
        <span class="icon">{{ getThemeIcon() }}</span>
      </button>

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
  height: 60px;
  background: var(--sidebar-bg);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-color);
  padding: 0 1rem;
  align-items: center;
  justify-content: space-between;
  z-index: 100;
  transition: background-color var(--transition-normal);
}

.mobile-logo {
  font-size: 1.15rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.menu-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  padding: 0.5rem;
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.menu-btn:hover {
  color: var(--primary-color);
  transform: scale(1.1);
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
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  z-index: 199;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.mobile-only {
  display: none;
}

.sidebar {
  width: 280px;
  height: 100vh;
  background: var(--sidebar-bg);
  backdrop-filter: blur(20px);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 200;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.05);
  transition: background-color var(--transition-normal);
}

.sidebar-header {
  padding: 1.5rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(180deg, rgba(99, 102, 241, 0.03) 0%, transparent 100%);
}

.logo {
  font-size: 1.35rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: -0.5px;
}

.close-btn {
  font-size: 1.2rem;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
}

.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

.sidebar-footer {
  padding: 1.25rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(0deg, var(--primary-light) 0%, transparent 100%);
}

.theme-toggle {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  font-size: 1.25rem;
  background: var(--glass-bg);
  border: 2px solid var(--border-color);
  transition: all var(--transition-normal);
  flex-shrink: 0;
}

.theme-toggle:hover {
  border-color: var(--primary-color);
  background: var(--primary-light);
  transform: rotate(20deg);
}

.edit-toggle {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--glass-bg);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 600;
  transition: all var(--transition-normal);
}

.edit-toggle:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: var(--primary-light);
  transform: translateY(-1px);
}

.edit-toggle.active {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.settings-btn {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  font-size: 1.25rem;
  background: var(--glass-bg);
  border: 2px solid var(--border-color);
  transition: all var(--transition-normal);
}

.settings-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: var(--primary-light);
  transform: rotate(45deg);
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
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .sidebar-header {
    padding: 1rem;
  }
}
</style>
