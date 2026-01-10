<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useNavStore } from '../stores/navStore';
import type { NavItem, NavItemType } from '../types';

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
  categoryId: 'all',
  type: 'web' as NavItemType,
  // Service specific
  serviceStatus: 'unknown' as 'online' | 'offline' | 'unknown',
  serviceDescription: '',
  serviceFeatures: '',
  serviceContact: '',
  // MC specific
  mcHost: '',
  mcPort: ''
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

const showLinkField = computed(() => {
  return navItemForm.value.type === 'web' || navItemForm.value.type === 'service';
});

const showServiceFields = computed(() => {
  return navItemForm.value.type === 'service';
});

const showMcFields = computed(() => {
  return navItemForm.value.type === 'mc-java' || navItemForm.value.type === 'mc-pe';
});

const defaultMcPort = computed(() => {
  return navItemForm.value.type === 'mc-java' ? '25565' : '19132';
});

// Watch type changes to set default port
watch(() => navItemForm.value.type, (newType: NavItemType) => {
  if (newType === 'mc-java' && !navItemForm.value.mcPort) {
    navItemForm.value.mcPort = '25565';
  } else if (newType === 'mc-pe' && !navItemForm.value.mcPort) {
    navItemForm.value.mcPort = '19132';
  }
});

// Initialize form data
onMounted(() => {
  if (props.type === 'category' && props.editingId) {
    const category = store.categories.find((c: { id: string }) => c.id === props.editingId);
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
        categoryId: item.categoryId,
        type: item.type || 'web',
        serviceStatus: item.serviceInfo?.status || 'unknown',
        serviceDescription: item.serviceInfo?.description || '',
        serviceFeatures: item.serviceInfo?.features?.join(', ') || '',
        serviceContact: item.serviceInfo?.contact || '',
        mcHost: item.mcServer?.host || '',
        mcPort: item.mcServer?.port?.toString() || ''
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
    if (!store.isAppIdUnique(navItemForm.value.appid, props.editingId || undefined)) {
      errors.value.appid = 'AppID 已存在，请使用其他标识';
    }
  }
  
  if (!navItemForm.value.name.trim()) {
    errors.value.name = '请输入名称';
  }
  
  // Link validation for web and service types
  if (showLinkField.value) {
    if (!navItemForm.value.link.trim()) {
      errors.value.link = '请输入链接';
    } else if (!isValidUrl(navItemForm.value.link)) {
      errors.value.link = '请输入有效的 URL';
    }
  }
  
  // MC server validation
  if (showMcFields.value) {
    if (!navItemForm.value.mcHost.trim()) {
      errors.value.mcHost = '请输入服务器地址';
    }
    if (navItemForm.value.mcPort && isNaN(parseInt(navItemForm.value.mcPort))) {
      errors.value.mcPort = '端口必须是数字';
    }
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
    link: navItemForm.value.link.trim() || '',
    icon: navItemForm.value.icon.trim() || undefined,
    categoryId: navItemForm.value.categoryId,
    type: navItemForm.value.type
  };
  
  // Add service info if type is service
  if (navItemForm.value.type === 'service') {
    itemData.serviceInfo = {
      status: navItemForm.value.serviceStatus,
      description: navItemForm.value.serviceDescription.trim() || undefined,
      features: navItemForm.value.serviceFeatures.trim() 
        ? navItemForm.value.serviceFeatures.split(',').map((f: string) => f.trim()).filter(Boolean)
        : undefined,
      contact: navItemForm.value.serviceContact.trim() || undefined
    };
  }
  
  // Add MC server info if type is mc-java or mc-pe
  if (navItemForm.value.type === 'mc-java' || navItemForm.value.type === 'mc-pe') {
    const defaultPort = navItemForm.value.type === 'mc-java' ? 25565 : 19132;
    itemData.mcServer = {
      host: navItemForm.value.mcHost.trim(),
      port: navItemForm.value.mcPort ? parseInt(navItemForm.value.mcPort) : defaultPort
    };
  }
  
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
      <form v-else @submit.prevent="handleSubmit" class="nav-item-form">
        <div class="form-group">
          <label for="navType">类型 <span class="required">*</span></label>
          <select id="navType" v-model="navItemForm.type">
            <option value="web">🌐 网页链接</option>
            <option value="service">🖥️ 服务面板</option>
            <option value="mc-java">☕ Minecraft Java版</option>
            <option value="mc-pe">📱 Minecraft 基岩版</option>
          </select>
        </div>

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
        
        <!-- Link field for web and service -->
        <div v-if="showLinkField" class="form-group">
          <label for="link">链接 <span class="required">*</span></label>
          <input
            id="link"
            v-model="navItemForm.link"
            type="url"
            placeholder="https://example.com"
          />
          <p v-if="errors.link" class="error">{{ errors.link }}</p>
        </div>

        <!-- Service specific fields -->
        <template v-if="showServiceFields">
          <div class="form-section">
            <h3 class="section-title">服务信息</h3>
            
            <div class="form-group">
              <label for="serviceStatus">服务状态</label>
              <select id="serviceStatus" v-model="navItemForm.serviceStatus">
                <option value="online">🟢 运行中</option>
                <option value="offline">🔴 已停止</option>
                <option value="unknown">⚪ 未知</option>
              </select>
            </div>

            <div class="form-group">
              <label for="serviceDescription">详细描述</label>
              <textarea
                id="serviceDescription"
                v-model="navItemForm.serviceDescription"
                placeholder="服务的详细描述"
                rows="3"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="serviceFeatures">功能特性</label>
              <input
                id="serviceFeatures"
                v-model="navItemForm.serviceFeatures"
                type="text"
                placeholder="用逗号分隔，如：高可用, 自动备份, 监控"
              />
            </div>

            <div class="form-group">
              <label for="serviceContact">联系方式</label>
              <input
                id="serviceContact"
                v-model="navItemForm.serviceContact"
                type="text"
                placeholder="管理员联系方式"
              />
            </div>
          </div>
        </template>

        <!-- MC server specific fields -->
        <template v-if="showMcFields">
          <div class="form-section">
            <h3 class="section-title">服务器信息</h3>
            
            <div class="form-group">
              <label for="mcHost">服务器地址 <span class="required">*</span></label>
              <input
                id="mcHost"
                v-model="navItemForm.mcHost"
                type="text"
                placeholder="mc.example.com"
              />
              <p v-if="errors.mcHost" class="error">{{ errors.mcHost }}</p>
            </div>

            <div class="form-group">
              <label for="mcPort">端口</label>
              <input
                id="mcPort"
                v-model="navItemForm.mcPort"
                type="text"
                :placeholder="`默认 ${defaultMcPort}`"
              />
              <p v-if="errors.mcPort" class="error">{{ errors.mcPort }}</p>
            </div>
          </div>
        </template>
        
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

.nav-item-form {
  max-height: 60vh;
  overflow-y: auto;
}

.form-section {
  margin: 1.5rem 0;
  padding: 1rem;
  background: var(--glass-bg);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}
</style>
