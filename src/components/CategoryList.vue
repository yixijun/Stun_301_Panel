<script setup lang="ts">
import { useNavStore } from '../stores/navStore';

const store = useNavStore();

const emit = defineEmits<{
  (e: 'addCategory'): void;
  (e: 'editCategory', id: string): void;
  (e: 'deleteCategory', id: string): void;
}>();

function selectCategory(id: string) {
  store.selectCategory(id);
}

function handleAddCategory() {
  emit('addCategory');
}

function handleEditCategory(id: string, event: Event) {
  event.stopPropagation();
  emit('editCategory', id);
}

function handleDeleteCategory(id: string, event: Event) {
  event.stopPropagation();
  emit('deleteCategory', id);
}
</script>

<template>
  <div class="category-list">
    <div class="category-header">
      <span class="category-title">分类</span>
      <button 
        v-if="store.isEditMode"
        class="add-btn icon-btn"
        @click="handleAddCategory"
        aria-label="添加分类"
      >
        ➕
      </button>
    </div>
    
    <ul class="categories">
      <li 
        v-for="category in store.sortedCategories" 
        :key="category.id"
        class="category-item"
        :class="{ active: store.selectedCategoryId === category.id }"
        @click="selectCategory(category.id)"
        role="button"
        :aria-selected="store.selectedCategoryId === category.id"
        tabindex="0"
        @keydown.enter="selectCategory(category.id)"
      >
        <span class="category-name">{{ category.name }}</span>
        
        <div v-if="store.isEditMode && category.id !== 'all'" class="category-actions">
          <button 
            class="action-btn icon-btn"
            @click="handleEditCategory(category.id, $event)"
            aria-label="编辑分类"
          >
            ✏️
          </button>
          <button 
            class="action-btn icon-btn danger"
            @click="handleDeleteCategory(category.id, $event)"
            aria-label="删除分类"
          >
            🗑️
          </button>
        </div>
        
        <span v-else class="category-count">
          {{ category.id === 'all' 
            ? store.navItems.length 
            : store.navItems.filter(item => item.categoryId === category.id).length 
          }}
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.category-list {
  padding: 0 0.5rem;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.5rem;
}

.category-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.add-btn {
  font-size: 0.9rem;
  padding: 0.25rem;
}

.categories {
  list-style: none;
  margin: 0;
  padding: 0;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 0.75rem;
  margin: 0.25rem 0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.category-item:hover {
  background: var(--bg-color);
}

.category-item.active {
  background: var(--primary-color);
  color: white;
}

.category-item.active .category-count {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.category-name {
  flex: 1;
  font-size: 0.95rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-count {
  font-size: 0.8rem;
  padding: 0.15rem 0.5rem;
  background: var(--bg-color);
  border-radius: 10px;
  color: var(--text-secondary);
  min-width: 24px;
  text-align: center;
}

.category-actions {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  font-size: 0.85rem;
  padding: 0.2rem 0.35rem;
  opacity: 0.7;
  transition: opacity 0.15s ease;
}

.action-btn:hover {
  opacity: 1;
}

.action-btn.danger:hover {
  color: var(--danger-color);
}

.category-item.active .action-btn {
  color: white;
}

.category-item.active .action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.category-item.active .action-btn.danger:hover {
  color: #ffcccc;
}
</style>
