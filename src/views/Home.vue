<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useNavStore } from '../stores/navStore';
import Sidebar from '../components/Sidebar.vue';
import NavGrid from '../components/NavGrid.vue';
import EditModal from '../components/EditModal.vue';
import SettingsModal from '../components/SettingsModal.vue';
import ShareModal from '../components/ShareModal.vue';

const store = useNavStore();

// Modal states
const showSettingsModal = ref(false);
const showEditModal = ref(false);
const showShareModal = ref(false);
const editModalType = ref<'category' | 'navItem'>('category');
const editingId = ref<string | null>(null);

// Load data on mount
onMounted(async () => {
  await store.loadData();
});

// Settings modal handlers
function openSettings() {
  showSettingsModal.value = true;
}

function closeSettings() {
  showSettingsModal.value = false;
}

// Category modal handlers
function openAddCategory() {
  editModalType.value = 'category';
  editingId.value = null;
  showEditModal.value = true;
}

function openEditCategory(id: string) {
  editModalType.value = 'category';
  editingId.value = id;
  showEditModal.value = true;
}

function handleDeleteCategory(id: string) {
  if (confirm('确定要删除此分类吗？该分类下的导航项将被移至"全部"分类。')) {
    store.deleteCategory(id);
  }
}

// NavItem modal handlers
function openAddNavItem() {
  editModalType.value = 'navItem';
  editingId.value = null;
  showEditModal.value = true;
}

function openEditNavItem(appid: string) {
  editModalType.value = 'navItem';
  editingId.value = appid;
  showEditModal.value = true;
}

function handleDeleteNavItem(appid: string) {
  if (confirm('确定要删除此导航项吗？')) {
    store.deleteNavItem(appid);
  }
}

function closeEditModal() {
  showEditModal.value = false;
  editingId.value = null;
}

// Share modal handlers
function openShareModal() {
  showShareModal.value = true;
}

function closeShareModal() {
  showShareModal.value = false;
}
</script>

<template>
  <div class="home-layout">
    <Sidebar
      @open-settings="openSettings"
      @add-category="openAddCategory"
      @edit-category="openEditCategory"
      @delete-category="handleDeleteCategory"
    />
    
    <main class="main-content">
      <!-- Share button always visible -->
      <div class="content-header">
        <button class="share-btn" @click="openShareModal">
          <span>🔗</span> 分享链接
        </button>
        <button v-if="store.isEditMode" class="add-nav-btn" @click="openAddNavItem">
          <span>➕</span> 添加导航项
        </button>
      </div>
      
      <NavGrid
        @edit-item="openEditNavItem"
        @delete-item="handleDeleteNavItem"
      />
      
      <div v-if="store.isLoading" class="loading">
        加载中...
      </div>
      
      <div v-if="store.error" class="error-message">
        {{ store.error }}
      </div>
    </main>
    
    <!-- Settings Modal -->
    <SettingsModal
      v-if="showSettingsModal"
      @close="closeSettings"
    />
    
    <!-- Edit Modal (Category or NavItem) -->
    <EditModal
      v-if="showEditModal"
      :type="editModalType"
      :editing-id="editingId"
      @close="closeEditModal"
    />

    <!-- Share Modal -->
    <ShareModal
      v-if="showShareModal"
      @close="closeShareModal"
    />
  </div>
</template>

<style scoped>
.home-layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-left: 280px;
  padding: 2rem 2.5rem;
  background: var(--bg-color);
  min-height: 100vh;
  position: relative;
  transition: background-color var(--transition-normal);
}

.main-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: linear-gradient(135deg, var(--primary-light) 0%, rgba(139, 92, 246, 0.05) 100%);
  pointer-events: none;
}

.content-header {
  margin-bottom: 2rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.875rem;
  position: relative;
  z-index: 1;
}

.share-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  color: var(--text-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.share-btn:hover {
  background: var(--card-bg);
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.add-nav-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.add-nav-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
}

.add-nav-btn:hover::before {
  left: 100%;
}

.add-nav-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -10px rgba(99, 102, 241, 0.5);
}

.loading {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
  font-size: 1rem;
}

.error-message {
  text-align: center;
  padding: 1.25rem;
  color: var(--danger-color);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-md);
  margin-top: 1.5rem;
  font-weight: 500;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: 1.25rem;
    padding-top: 80px;
  }

  .content-header {
    margin-bottom: 1.25rem;
  }

  .add-nav-btn {
    flex: 1;
    justify-content: center;
    padding: 0.875rem 1rem;
  }

  .share-btn {
    flex: 1;
    justify-content: center;
    padding: 0.875rem 1rem;
  }
}
</style>
