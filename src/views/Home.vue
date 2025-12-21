<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useNavStore } from '../stores/navStore';
import Sidebar from '../components/Sidebar.vue';
import NavGrid from '../components/NavGrid.vue';
import EditModal from '../components/EditModal.vue';
import SettingsModal from '../components/SettingsModal.vue';

const store = useNavStore();

// Modal states
const showSettingsModal = ref(false);
const showEditModal = ref(false);
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
      <div class="content-header" v-if="store.isEditMode">
        <button class="add-nav-btn" @click="openAddNavItem">
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
  </div>
</template>

<style scoped>
.home-layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-left: 260px;
  padding: 1.5rem 2rem;
  background: var(--bg-color);
  min-height: 100vh;
}

.content-header {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: flex-end;
}

.add-nav-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.add-nav-btn:hover {
  background: var(--primary-hover);
}

.loading {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.error-message {
  text-align: center;
  padding: 1rem;
  color: var(--danger-color);
  background: #fff5f5;
  border-radius: 8px;
  margin-top: 1rem;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: 1rem;
    padding-top: 70px; /* Account for mobile header */
  }

  .content-header {
    margin-bottom: 1rem;
  }

  .add-nav-btn {
    width: 100%;
    justify-content: center;
    padding: 0.8rem 1rem;
  }
}
</style>
