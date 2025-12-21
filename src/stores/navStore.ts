import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Category, NavItem, AppData, AppSettings } from '../types';
import { DEFAULT_APP_DATA } from '../types';
import { apiClient } from '../api/client';

export const useNavStore = defineStore('nav', () => {
  // State
  const categories = ref<Category[]>([...DEFAULT_APP_DATA.categories]);
  const navItems = ref<NavItem[]>([]);
  const settings = ref<AppSettings>({ ...DEFAULT_APP_DATA.settings });
  const isEditMode = ref(false);
  const selectedCategoryId = ref('all');
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const isAuthenticated = ref(false);

  // Getters
  const filteredNavItems = computed(() => {
    if (selectedCategoryId.value === 'all') {
      return [...navItems.value].sort((a, b) => a.order - b.order);
    }
    return navItems.value
      .filter(item => item.categoryId === selectedCategoryId.value)
      .sort((a, b) => a.order - b.order);
  });

  const sortedCategories = computed(() => {
    return [...categories.value].sort((a, b) => a.order - b.order);
  });

  const customCategories = computed(() => {
    return sortedCategories.value.filter(c => c.id !== 'all');
  });

  // Actions - Data Loading/Saving
  async function loadData(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      const data = await apiClient.getData();
      categories.value = data.categories;
      navItems.value = data.navItems;
      settings.value = data.settings;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load data';
      // Use default data on error
      categories.value = [...DEFAULT_APP_DATA.categories];
      navItems.value = [];
      settings.value = { ...DEFAULT_APP_DATA.settings };
    } finally {
      isLoading.value = false;
    }
  }


  async function saveData(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      const data: AppData = {
        categories: categories.value,
        navItems: navItems.value,
        settings: settings.value
      };
      await apiClient.saveData(data);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to save data';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  // Actions - Edit Mode
  function toggleEditMode(): void {
    isEditMode.value = !isEditMode.value;
  }

  function setEditMode(value: boolean): void {
    isEditMode.value = value;
  }

  // Actions - Category Selection
  function selectCategory(categoryId: string): void {
    selectedCategoryId.value = categoryId;
  }

  // Actions - Category Management
  function addCategory(name: string): Category {
    const maxOrder = categories.value.reduce((max, c) => Math.max(max, c.order), 0);
    const newCategory: Category = {
      id: `cat_${Date.now()}`,
      name,
      order: maxOrder + 1
    };
    categories.value.push(newCategory);
    saveData();
    return newCategory;
  }

  function updateCategory(id: string, name: string): boolean {
    if (id === 'all') return false; // Cannot edit "全部" category
    const category = categories.value.find(c => c.id === id);
    if (!category) return false;
    category.name = name;
    saveData();
    return true;
  }

  function deleteCategory(id: string): boolean {
    if (id === 'all') return false; // Cannot delete "全部" category
    const index = categories.value.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    // Reassign nav items to "all" category
    navItems.value.forEach(item => {
      if (item.categoryId === id) {
        item.categoryId = 'all';
      }
    });
    
    categories.value.splice(index, 1);
    
    // If deleted category was selected, switch to "all"
    if (selectedCategoryId.value === id) {
      selectedCategoryId.value = 'all';
    }
    
    saveData();
    return true;
  }


  // Actions - NavItem Management
  function isAppIdUnique(appid: string, excludeAppId?: string): boolean {
    return !navItems.value.some(item => 
      item.appid === appid && item.appid !== excludeAppId
    );
  }

  function addNavItem(item: Omit<NavItem, 'order'>): { success: boolean; error?: string } {
    // Validate appid uniqueness
    if (!isAppIdUnique(item.appid)) {
      return { success: false, error: 'AppID already exists' };
    }
    
    const maxOrder = navItems.value.reduce((max, i) => Math.max(max, i.order), 0);
    const newItem: NavItem = {
      ...item,
      order: maxOrder + 1
    };
    navItems.value.push(newItem);
    saveData();
    return { success: true };
  }

  function updateNavItem(
    appid: string, 
    updates: Partial<Omit<NavItem, 'appid' | 'order'>>
  ): { success: boolean; error?: string } {
    const item = navItems.value.find(i => i.appid === appid);
    if (!item) {
      return { success: false, error: 'NavItem not found' };
    }
    
    Object.assign(item, updates);
    saveData();
    return { success: true };
  }

  function updateNavItemWithAppId(
    oldAppId: string,
    newData: Omit<NavItem, 'order'>
  ): { success: boolean; error?: string } {
    const itemIndex = navItems.value.findIndex(i => i.appid === oldAppId);
    if (itemIndex === -1) {
      return { success: false, error: 'NavItem not found' };
    }
    
    // If appid is changing, check uniqueness
    if (newData.appid !== oldAppId && !isAppIdUnique(newData.appid)) {
      return { success: false, error: 'AppID already exists' };
    }
    
    const existingItem = navItems.value[itemIndex];
    if (!existingItem) {
      return { success: false, error: 'NavItem not found' };
    }
    const existingOrder = existingItem.order;
    navItems.value[itemIndex] = {
      ...newData,
      order: existingOrder
    };
    saveData();
    return { success: true };
  }

  function deleteNavItem(appid: string): boolean {
    const index = navItems.value.findIndex(i => i.appid === appid);
    if (index === -1) return false;
    navItems.value.splice(index, 1);
    saveData();
    return true;
  }

  function getNavItemByAppId(appid: string): NavItem | undefined {
    return navItems.value.find(i => i.appid === appid);
  }


  // Actions - Settings
  function updateApiKey(apiKey: string): void {
    settings.value.apiKey = apiKey;
    saveData();
  }

  function updateAuthCredentials(username: string, password: string): void {
    settings.value.authUsername = username;
    settings.value.authPassword = password;
    saveData();
  }

  // Actions - Authentication
  async function login(username: string, password: string): Promise<boolean> {
    // 先加载数据获取认证信息
    if (categories.value.length <= 1 && navItems.value.length === 0) {
      await loadData();
    }
    
    const validUsername = settings.value.authUsername || 'admin';
    const validPassword = settings.value.authPassword || 'admin123';
    
    if (username === validUsername && password === validPassword) {
      isAuthenticated.value = true;
      // 保存登录状态到 sessionStorage
      sessionStorage.setItem('nav_auth', 'true');
      return true;
    }
    return false;
  }

  function logout(): void {
    isAuthenticated.value = false;
    sessionStorage.removeItem('nav_auth');
  }

  function checkAuth(): boolean {
    const auth = sessionStorage.getItem('nav_auth');
    if (auth === 'true') {
      isAuthenticated.value = true;
      return true;
    }
    return false;
  }

  // Actions - Import/Export
  function exportData(): AppData {
    return {
      categories: categories.value,
      navItems: navItems.value,
      settings: settings.value
    };
  }

  function importData(data: AppData): void {
    categories.value = data.categories;
    navItems.value = data.navItems;
    settings.value = data.settings;
    saveData();
  }

  // Pure functions for testing (no side effects)
  function filterNavItemsByCategory(items: NavItem[], categoryId: string): NavItem[] {
    if (categoryId === 'all') {
      return [...items];
    }
    return items.filter(item => item.categoryId === categoryId);
  }

  function reassignItemsOnCategoryDelete(
    items: NavItem[], 
    deletedCategoryId: string
  ): NavItem[] {
    return items.map(item => {
      if (item.categoryId === deletedCategoryId) {
        return { ...item, categoryId: 'all' };
      }
      return item;
    });
  }

  function checkAppIdUnique(items: NavItem[], appid: string, excludeAppId?: string): boolean {
    return !items.some(item => 
      item.appid === appid && item.appid !== excludeAppId
    );
  }

  return {
    // State
    categories,
    navItems,
    settings,
    isEditMode,
    selectedCategoryId,
    isLoading,
    error,
    isAuthenticated,
    
    // Getters
    filteredNavItems,
    sortedCategories,
    customCategories,
    
    // Actions - Data
    loadData,
    saveData,
    
    // Actions - Edit Mode
    toggleEditMode,
    setEditMode,
    
    // Actions - Category
    selectCategory,
    addCategory,
    updateCategory,
    deleteCategory,
    
    // Actions - NavItem
    isAppIdUnique,
    addNavItem,
    updateNavItem,
    updateNavItemWithAppId,
    deleteNavItem,
    getNavItemByAppId,
    
    // Actions - Settings
    updateApiKey,
    updateAuthCredentials,
    
    // Actions - Authentication
    login,
    logout,
    checkAuth,
    
    // Actions - Import/Export
    exportData,
    importData,
    
    // Pure functions for testing
    filterNavItemsByCategory,
    reassignItemsOnCategoryDelete,
    checkAppIdUnique
  };
});
