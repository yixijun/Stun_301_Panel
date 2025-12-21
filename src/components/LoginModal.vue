<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  (e: 'login', username: string, password: string): void;
}>();

const username = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);

function handleSubmit() {
  error.value = '';
  
  if (!username.value.trim() || !password.value.trim()) {
    error.value = '请输入用户名和密码';
    return;
  }
  
  isLoading.value = true;
  emit('login', username.value.trim(), password.value);
}

function setError(msg: string) {
  error.value = msg;
  isLoading.value = false;
}

defineExpose({ setError });
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>Nav Portal</h1>
        <p>请登录以继续</p>
      </div>
      
      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="请输入用户名"
            autocomplete="username"
            :disabled="isLoading"
          />
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="请输入密码"
            autocomplete="current-password"
            :disabled="isLoading"
          />
        </div>
        
        <p v-if="error" class="error-msg">{{ error }}</p>
        
        <button type="submit" class="login-btn" :disabled="isLoading">
          {{ isLoading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color);
  padding: 1rem;
}

.login-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
  box-shadow: var(--shadow-hover);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  font-size: 1.75rem;
  color: var(--primary-color);
  margin: 0 0 0.5rem 0;
}

.login-header p {
  color: var(--text-secondary);
  margin: 0;
}

.login-form .form-group {
  margin-bottom: 1.25rem;
}

.login-form label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
}

.login-form input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
}

.error-msg {
  color: var(--danger-color);
  font-size: 0.9rem;
  margin: 0 0 1rem 0;
  text-align: center;
}

.login-btn {
  width: 100%;
  padding: 0.875rem;
  font-size: 1rem;
  font-weight: 600;
  margin-top: 0.5rem;
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.5rem;
  }
}
</style>
