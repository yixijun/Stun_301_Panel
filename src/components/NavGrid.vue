<script setup lang="ts">
import { useNavStore } from '../stores/navStore';
import NavCard from './NavCard.vue';

const store = useNavStore();

const emit = defineEmits<{
  (e: 'editItem', appid: string): void;
  (e: 'deleteItem', appid: string): void;
}>();

function handleEdit(appid: string) {
  emit('editItem', appid);
}

function handleDelete(appid: string) {
  emit('deleteItem', appid);
}
</script>

<template>
  <div class="nav-grid-container">
    <div v-if="store.filteredNavItems.length === 0" class="empty-state">
      <div class="empty-icon">📭</div>
      <p class="empty-text">暂无导航项</p>
      <p v-if="store.isEditMode" class="empty-hint">点击右上角"添加导航项"按钮开始添加</p>
    </div>
    
    <div v-else class="nav-grid">
      <NavCard
        v-for="item in store.filteredNavItems"
        :key="item.appid"
        :item="item"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>

<style scoped>
.nav-grid-container {
  min-height: 200px;
  position: relative;
  z-index: 1;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 2rem;
  text-align: center;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-xl);
  border: 2px dashed var(--border-color);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.25rem;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.empty-text {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.empty-hint {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .nav-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .empty-state {
    padding: 3rem 1.5rem;
  }

  .empty-icon {
    font-size: 3rem;
  }

  .empty-text {
    font-size: 1.05rem;
  }
}
</style>
