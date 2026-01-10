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
  padding: 0 0.75rem;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.75rem;
}

.category-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.add-btn {
  font-size: 0.9rem;
  padding: 0.35rem;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.add-btn:hover {
  background: var(--primary-light);
  transform: scale(1.1);
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
  padding: 0.8rem 1rem;
  margin: 0.35rem 0;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-normal);
  user-select: none;
  position: relative;
  overflow: hidden;
}

.category-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, var(--primary-color), var(--accent-color));
  transform: scaleY(0);
  transition: transform var(--transition-normal);
}

.category-item:hover {
  background: var(--primary-light);
}

.category-item:hover::before {
  transform: scaleY(1);
}

.category-item.active {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.category-item.active::before {
  display: none;
}

.category-item.active .category-count {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

.category-name {
  flex: 1;
  font-size: 0.95rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-count {
  font-size: 0.8rem;
  padding: 0.2rem 0.6rem;
  background: var(--bg-color);
  border-radius: 20px;
  color: var(--text-secondary);
  min-width: 28px;
  text-align: center;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.category-actions {
  display: flex;
  gap: 0.35rem;
}

.action-btn {
  font-size: 0.85rem;
  padding: 0.25rem 0.4rem;
  opacity: 0.8;
  transition: all var(--transition-fast);
  border-radius: var(--radius-sm);
}

.action-btn:hover {
  opacity: 1;
  transform: scale(1.1);
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
  color: #fecaca;
  background: rgba(239, 68, 68, 0.2);
}
</style>
