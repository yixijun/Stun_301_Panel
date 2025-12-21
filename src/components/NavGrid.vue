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
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-text {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0 0 0.5rem 0;
}

.empty-hint {
  font-size: 0.9rem;
  color: var(--text-secondary);
  opacity: 0.7;
  margin: 0;
}
</style>
