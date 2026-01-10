<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNavStore } from '../stores/navStore';
import type { NavItem } from '../types';

const route = useRoute();
const router = useRouter();
const store = useNavStore();

const item = ref<NavItem | null>(null);

const statusClass = computed(() => {
  return item.value?.serviceInfo?.status || 'unknown';
});

const statusText = computed(() => {
  const status = item.value?.serviceInfo?.status;
  if (status === 'online') return '运行中';
  if (status === 'offline') return '已停止';
  return '未知';
});

function goBack() {
  router.push('/');
}

function getIconDisplay(icon?: string): string {
  if (!icon) return '🖥️';
  if (icon.length <= 2) return icon;
  return icon;
}

function isIconUrl(icon?: string): boolean {
  if (!icon) return false;
  return /^(https?:\/\/|\/)/.test(icon);
}

onMounted(async () => {
  if (!store.navItems.length) {
    await store.loadData();
  }
  const appid = route.params.appid as string;
  item.value = store.getNavItemByAppId(appid) || null;
  
  if (!item.value || item.value.type !== 'service') {
    router.push('/');
  }
});
</script>

<template>
  <div class="service-detail-page">
    <header class="page-header">
      <button class="back-btn" @click="goBack">
        ← 返回
      </button>
    </header>

    <div v-if="item" class="detail-content">
      <div class="detail-card">
        <div class="card-header">
          <div class="card-icon">
            <img 
              v-if="isIconUrl(item.icon)" 
              :src="item.icon" 
              :alt="item.name"
              class="icon-image"
            />
            <span v-else class="icon-emoji">{{ getIconDisplay(item.icon) }}</span>
          </div>
          <div class="card-title-area">
            <h1 class="page-title">{{ item.name }}</h1>
            <span class="status-badge" :class="statusClass">{{ statusText }}</span>
          </div>
        </div>

        <div class="info-section">
          <h2 class="section-title">服务描述</h2>
          <p class="description">{{ item.description || '暂无描述' }}</p>
        </div>

        <div v-if="item.serviceInfo?.description" class="info-section">
          <h2 class="section-title">详细信息</h2>
          <p class="description">{{ item.serviceInfo.description }}</p>
        </div>

        <div v-if="item.serviceInfo?.features?.length" class="info-section">
          <h2 class="section-title">功能特性</h2>
          <div class="features-grid">
            <div v-for="feature in item.serviceInfo.features" :key="feature" class="feature-item">
              <span class="feature-icon">✓</span>
              <span>{{ feature }}</span>
            </div>
          </div>
        </div>

        <div v-if="item.serviceInfo?.contact" class="info-section">
          <h2 class="section-title">联系方式</h2>
          <p class="contact">{{ item.serviceInfo.contact }}</p>
        </div>

        <div v-if="item.link" class="info-section">
          <h2 class="section-title">相关链接</h2>
          <a :href="item.link" target="_blank" rel="noopener noreferrer" class="external-link">
            {{ item.link }}
            <span class="link-icon">↗</span>
          </a>
        </div>
      </div>
    </div>

    <div v-else class="loading">
      加载中...
    </div>
  </div>
</template>

<style scoped>
.service-detail-page {
  min-height: 100vh;
  background: var(--bg-color);
  padding: 2rem;
}

.page-header {
  max-width: 800px;
  margin: 0 auto 2rem;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: var(--glass-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.back-btn:hover {
  background: var(--card-bg);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.detail-content {
  max-width: 800px;
  margin: 0 auto;
}

.detail-card {
  background: var(--card-bg);
  border-radius: var(--radius-xl);
  padding: 2rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.card-icon {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--primary-light) 0%, rgba(139, 92, 246, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-image {
  width: 48px;
  height: 48px;
  object-fit: contain;
  border-radius: 8px;
}

.icon-emoji {
  font-size: 2.5rem;
}

.card-title-area {
  flex: 1;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.status-badge {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.online {
  background: rgba(34, 197, 94, 0.15);
  color: var(--success-color);
}

.status-badge.offline {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger-color);
}

.status-badge.unknown {
  background: rgba(156, 163, 175, 0.15);
  color: var(--text-secondary);
}

.info-section {
  margin-bottom: 1.5rem;
}

.info-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.75rem 0;
}

.description {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--glass-bg);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  color: var(--text-primary);
}

.feature-icon {
  color: var(--success-color);
  font-weight: bold;
}

.contact {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin: 0;
}

.external-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--glass-bg);
  border-radius: var(--radius-md);
  color: var(--primary-color);
  text-decoration: none;
  font-size: 0.9rem;
  transition: all var(--transition-fast);
  word-break: break-all;
}

.external-link:hover {
  background: var(--primary-light);
}

.link-icon {
  flex-shrink: 0;
}

.loading {
  text-align: center;
  padding: 4rem;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .service-detail-page {
    padding: 1rem;
  }

  .detail-card {
    padding: 1.5rem;
  }

  .card-header {
    flex-direction: column;
    text-align: center;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
