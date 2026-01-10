<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useNavStore } from './stores/navStore';
import LoginModal from './components/LoginModal.vue';

const store = useNavStore();
const loginRef = ref<InstanceType<typeof LoginModal> | null>(null);
const isCheckingAuth = ref(true);

// 初始化主题
function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') {
    document.documentElement.setAttribute('data-theme', saved);
  }
}

onMounted(async () => {
  // 初始化主题
  initTheme();
  
  // 检查是否已登录
  if (store.checkAuth()) {
    await store.loadData();
  }
  isCheckingAuth.value = false;
});

async function handleLogin(username: string, password: string) {
  const success = await store.login(username, password);
  if (success) {
    await store.loadData();
  } else {
    loginRef.value?.setError('用户名或密码错误');
  }
}
</script>

<template>
  <div v-if="isCheckingAuth" class="loading-screen">
    <div class="loading-spinner"></div>
  </div>
  <LoginModal 
    v-else-if="!store.isAuthenticated" 
    ref="loginRef"
    @login="handleLogin" 
  />
  <router-view v-else />
</template>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.loading-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
