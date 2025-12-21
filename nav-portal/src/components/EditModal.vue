<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useNavStore } from '../stores/navStore';
import type { NavItem } from '../types';

const props = defineProps<{
  type: 'category' | 'navItem';
  editingId: string | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const store = useNavStore();

// Category form
const categoryName = ref('');

// NavItem form
const navItemForm = ref({
  appid: '',
  name: '',
  description: '',
  link: '',
  icon: '',
  categoryId: 'all'
});

// Validation errors
const errors = ref<Record<string, string>>({});

// Computed
const isEditing = computed(() => props.editingId !== null);

const modalTitle = computed(() => {
  if (props.type === 'category') {
    return isEditing.value ? '编辑分类' : '添加分类';
  }
  return isEditing.value ? '编辑导航项' : '添加导航项';
});

// Initialize form data
onMounted(() => {
  if (props.type === 'category' && props.editingId) {
    const category = store.categories.find(c => c.id === props.editingId);
    if (category) {
      categoryName.value = category.name;
    }
  } else if (props.type === 'navItem' && props.editingId) {
    const item = store.getNavItemByAppId(props.editingId);
    if (item) {
      navItemForm.value = {
        appid: item.appid,
        name: item.name,
        description: item.description,
        link: item.link,
        icon: item.icon || '',
        categoryId: item.categoryId
      };
    }
  }
});

// Validation
function validateCategory(): boolean {
  errors.value = {};
  if (!categoryName.value.trim()) {
    errors.value.categoryName = '请输入分类名称';
    return false;
  }
  return true;
}

function validateNavItem(): boolean {
  errors.value = {};
  
  if (!navItemForm.value.appid.trim()) {
    errors.value.appid = '请输入 AppID';
  } else if (!isEditing.value || navItemForm.value.appid !== props.editingId) {
    // Check uniqueness only for new items or when appid is changed
    if (!store.isAppIdUnique(navItemForm.value.appid, props.editingId || undefined)) {
      errors.value.appid = 'AppID 已存在，请使用其他标识';
    }
  }
  
  if (!navItemForm.value.name.trim()) {
    errors.value.name = '请输入名称';
  }
  
  if (!navItemForm.value.link.trim()) {
    errors.value.link = '请输入链接';
  } else if (!isValidUrl(navItemForm.value.link)) {
    errors.value.link = '请输入有效的 URL';
  }
  
  return Object.keys(errors.value).length === 0;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Submit handlers
function handleSubmit() {
  if (props.type === 'category') {
    handleCategorySubmit();
  } else {
    handleNavItemSubmit();
  }
}

function handleCategorySubmit() {
  if (!validateCategory()) return;
  
  if (isEditing.value && props.editingId) {
    store.updateCategory(props.editingId, categoryName.value.trim());
  } else {
    store.addCategory(categoryName.value.trim());
  }
  
  emit('close');
}

function handleNavItemSubmit() {
  if (!validateNavItem()) return;
  
  const itemData: Omit<NavItem, 'order'> = {
    appid: navItemForm.value.appid.trim(),
    name: navItemForm.value.name.trim(),
    description: navItemForm.value.description.trim(),
    link: navItemForm.value.link.trim(),
    icon: navItemForm.value.icon.trim() || undefined,
    categoryId: navItemForm.value.categoryId
  };
  
  if (isEditing.value && props.editingId) {
    const result = store.updateNavItemWithAppId(props.editingId, itemData);
    if (!result.success) {
      errors.value.appid = result.error || '更新失败';
      return;
    }
  } else {
    const result = store.addNavItem(itemData);
    if (!result.success) {
      errors.value.appid = result.error || '添加失败';
      return;
    }
  }
  
  emit('close');
}

function handleClose() {
  emit('close');
}

function handleOverlayClick(event: Event) {
  if (event.target === event.currentTarget) {
    handleClose();
  }
}
</script>

<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ modalTitle }}</h2>
        <button class="close-btn icon-btn" @click="handleClose" aria-label="关闭">
          ✕
        </button>
      </div>
      
      <!-- Category Form -->
      <form v-if="type === 'category'" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="categoryName">分类名称</label>
          <input
            id="categoryName"
            v-model="categoryName"
            type="text"
            placeholder="输入分类名称"
            autofocus
          />
          <p v-if="errors.categoryName" class="error">{{ errors.categoryName }}</p>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="secondary" @click="handleClose">取消</button>
          <button type="submit">{{ isEditing ? '保存' : '添加' }}</button>
        </div>
      </form>
      
      <!-- NavItem Form -->
      <form v-else @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="appid">AppID <span class="required">*</span></label>
          <input
            id="appid"
            v-model="navItemForm.appid"
            type="text"
            placeholder="唯一标识符，如 my-app"
            :disabled="isEditing"
          />
          <p v-if="errors.appid" class="error">{{ errors.appid }}</p>
        </div>
        
        <div class="form-group">
          <label for="name">名称 <span class="required">*</span></label>
          <input
            id="name"
            v-model="navItemForm.name"
            type="text"
            placeholder="显示名称"
            autofocus
          />
          <p v-if="errors.name" class="error">{{ errors.name }}</p>
        </div>
        
        <div class="form-group">
          <label for="description">描述</label>
          <textarea
            id="description"
            v-model="navItemForm.description"
            placeholder="简短描述"
            rows="2"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="link">链接 <span class="required">*</span></label>
          <input
            id="link"
            v-model="navItemForm.link"
            type="url"
            placeholder="https://example.com"
          />
          <p v-if="errors.link" class="error">{{ errors.link }}</p>
        </div>
        
        <div class="form-group">
          <label for="icon">图标</label>
          <input
            id="icon"
            v-model="navItemForm.icon"
            type="text"
            placeholder="emoji 或图标 URL"
          />
        </div>
        
        <div class="form-group">
          <label for="category">分类</label>
          <select id="category" v-model="navItemForm.categoryId">
            <option 
              v-for="cat in store.sortedCategories" 
              :key="cat.id" 
              :value="cat.id"
            >
              {{ cat.name }}
            </option>
          </select>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="secondary" @click="handleClose">取消</button>
          <button type="submit">{{ isEditing ? '保存' : '添加' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.close-btn {
  font-size: 1.2rem;
  color: var(--text-secondary);
}

.close-btn:hover {
  color: var(--text-primary);
}

.required {
  color: var(--danger-color);
}

textarea {
  resize: vertical;
  min-height: 60px;
}

input:disabled {
  background-color: var(--bg-color);
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
