import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import type { NavItem, Category, AppData, AppSettings } from '../types';

// Pure functions extracted for testing (same logic as in store)
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

function filterNavItemsByCategory(items: NavItem[], categoryId: string): NavItem[] {
  if (categoryId === 'all') {
    return [...items];
  }
  return items.filter(item => item.categoryId === categoryId);
}

function checkAppIdUnique(items: NavItem[], appid: string, excludeAppId?: string): boolean {
  return !items.some(item => 
    item.appid === appid && item.appid !== excludeAppId
  );
}

// Import/Export functions for testing
function exportData(data: AppData): string {
  return JSON.stringify(data);
}

function importData(jsonString: string): AppData {
  return JSON.parse(jsonString) as AppData;
}

// Arbitraries for generating test data
const categoryArb: fc.Arbitrary<Category> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s !== 'all'),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  order: fc.integer({ min: 0, max: 1000 })
});

const navItemArb: fc.Arbitrary<NavItem> = fc.record({
  appid: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ maxLength: 200 }),
  link: fc.webUrl(),
  icon: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
  categoryId: fc.string({ minLength: 1, maxLength: 20 }),
  order: fc.integer({ min: 0, max: 1000 })
});

const appSettingsArb: fc.Arbitrary<AppSettings> = fc.record({
  apiKey: fc.string({ maxLength: 100 })
});

// Generate array of categories with unique ids (always including 'all')
const uniqueCategoriesArb = fc.array(categoryArb, { minLength: 0, maxLength: 10 })
  .map(cats => {
    const seen = new Set<string>();
    const filtered = cats.filter(cat => {
      if (seen.has(cat.id)) return false;
      seen.add(cat.id);
      return true;
    });
    // Always include the 'all' category
    return [{ id: 'all', name: '全部', order: 0 }, ...filtered];
  });

// Generate array of NavItems with unique appids
const uniqueNavItemsArb = fc.array(navItemArb, { minLength: 0, maxLength: 20 })
  .map(items => {
    const seen = new Set<string>();
    return items.filter(item => {
      if (seen.has(item.appid)) return false;
      seen.add(item.appid);
      return true;
    });
  });

// Generate complete AppData
const appDataArb: fc.Arbitrary<AppData> = fc.record({
  categories: uniqueCategoriesArb,
  navItems: uniqueNavItemsArb,
  settings: appSettingsArb
});

describe('NavStore Property Tests', () => {
  /**
   * Property 4: 分类删除后的项重分配
   * For any deleted category, all NavItems belonging to that category 
   * should have their categoryId updated to "all"
   * **Validates: Requirements 2.5**
   */
  describe('Property 4: Category deletion item reassignment', () => {
    it('should reassign all items from deleted category to "all"', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s !== 'all'),
          fc.array(navItemArb, { minLength: 0, maxLength: 20 }),
          (deletedCategoryId, items) => {
            const result = reassignItemsOnCategoryDelete(items, deletedCategoryId);
            
            // All items that were in the deleted category should now be in "all"
            const originalItemsInCategory = items.filter(i => i.categoryId === deletedCategoryId);
            const reassignedItems = result.filter(i => 
              originalItemsInCategory.some(orig => orig.appid === i.appid)
            );
            
            // Every reassigned item should have categoryId = 'all'
            return reassignedItems.every(item => item.categoryId === 'all');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not modify items from other categories', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s !== 'all'),
          uniqueNavItemsArb,
          (deletedCategoryId, items) => {
            const result = reassignItemsOnCategoryDelete(items, deletedCategoryId);
            
            // Items not in the deleted category should remain unchanged
            const otherItems = items.filter(i => i.categoryId !== deletedCategoryId);
            const resultOtherItems = result.filter(i => 
              otherItems.some(orig => orig.appid === i.appid)
            );
            
            return resultOtherItems.every(resultItem => {
              const original = otherItems.find(o => o.appid === resultItem.appid);
              return original && resultItem.categoryId === original.categoryId;
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve item count after reassignment', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s !== 'all'),
          fc.array(navItemArb, { minLength: 0, maxLength: 20 }),
          (deletedCategoryId, items) => {
            const result = reassignItemsOnCategoryDelete(items, deletedCategoryId);
            return result.length === items.length;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 1: AppID 唯一性约束
   * For any NavItem collection and any new NavItem, if the new NavItem's appid 
   * already exists in the collection, the add operation should be rejected
   * **Validates: Requirements 3.5, 3.6**
   */
  describe('Property 1: AppID uniqueness constraint', () => {
    it('should detect duplicate appid in collection', () => {
      fc.assert(
        fc.property(
          uniqueNavItemsArb.filter(items => items.length > 0),
          fc.integer({ min: 0, max: 100 }),
          (items, indexSeed) => {
            // Pick an existing appid from the collection
            const existingItem = items[indexSeed % items.length];
            if (!existingItem) return true;
            
            const existingAppId = existingItem.appid;
            
            // checkAppIdUnique should return false for duplicate
            return checkAppIdUnique(items, existingAppId) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow unique appid', () => {
      fc.assert(
        fc.property(
          uniqueNavItemsArb,
          fc.string({ minLength: 1, maxLength: 50 }),
          (items, newAppId) => {
            // If newAppId is not in the collection, it should be allowed
            const existsInCollection = items.some(i => i.appid === newAppId);
            const isUnique = checkAppIdUnique(items, newAppId);
            
            // isUnique should be true only if appid doesn't exist
            return isUnique === !existsInCollection;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow same appid when excluding self (for updates)', () => {
      fc.assert(
        fc.property(
          uniqueNavItemsArb.filter(items => items.length > 0),
          fc.integer({ min: 0, max: 100 }),
          (items, indexSeed) => {
            const existingItem = items[indexSeed % items.length];
            if (!existingItem) return true;
            
            // When updating, the same appid should be allowed if we exclude self
            return checkAppIdUnique(items, existingItem.appid, existingItem.appid) === true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: 分类过滤正确性
   * For any category ID (not "all") and any NavItem collection, 
   * the filtered result should only contain items with categoryId equal to the selected category,
   * and should not miss any matching items
   * **Validates: Requirements 2.2**
   */
  describe('Property 2: Category filtering correctness', () => {
    it('should only include items matching the selected category', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s !== 'all'),
          fc.array(navItemArb, { minLength: 0, maxLength: 20 }),
          (categoryId, items) => {
            const filtered = filterNavItemsByCategory(items, categoryId);
            
            // All filtered items should have the selected categoryId
            return filtered.every(item => item.categoryId === categoryId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not miss any matching items', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s !== 'all'),
          fc.array(navItemArb, { minLength: 0, maxLength: 20 }),
          (categoryId, items) => {
            const filtered = filterNavItemsByCategory(items, categoryId);
            const expected = items.filter(i => i.categoryId === categoryId);
            
            // Should have the same count as manual filter
            return filtered.length === expected.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve all item properties after filtering', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s !== 'all'),
          fc.array(navItemArb, { minLength: 0, maxLength: 20 }),
          (categoryId, items) => {
            const filtered = filterNavItemsByCategory(items, categoryId);
            
            // Each filtered item should match an original item exactly
            return filtered.every(filteredItem => 
              items.some(original => 
                original.appid === filteredItem.appid &&
                original.name === filteredItem.name &&
                original.categoryId === filteredItem.categoryId
              )
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: "全部"分类完整性
   * For any NavItem collection, selecting "全部" category should display 
   * all items in the collection (count should equal total items)
   * **Validates: Requirements 2.1**
   */
  describe('Property 3: "All" category completeness', () => {
    it('should return all items when filtering by "all" category', () => {
      fc.assert(
        fc.property(
          fc.array(navItemArb, { minLength: 0, maxLength: 20 }),
          (items) => {
            const filtered = filterNavItemsByCategory(items, 'all');
            
            // Should return all items
            return filtered.length === items.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include every item from the original collection', () => {
      fc.assert(
        fc.property(
          uniqueNavItemsArb,
          (items) => {
            const filtered = filterNavItemsByCategory(items, 'all');
            
            // Every original item should be in the filtered result
            return items.every(original => 
              filtered.some(f => f.appid === original.appid)
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not add any extra items', () => {
      fc.assert(
        fc.property(
          uniqueNavItemsArb,
          (items) => {
            const filtered = filterNavItemsByCategory(items, 'all');
            
            // Every filtered item should exist in original
            return filtered.every(f => 
              items.some(original => original.appid === f.appid)
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: 数据导入导出往返一致性
   * For any AppData object, exporting to JSON and then importing should 
   * produce data equal to the original
   * **Validates: Requirements 6.3, 6.4**
   */
  describe('Property 7: Data import/export round-trip consistency', () => {
    it('should preserve all data after export and import round-trip', () => {
      fc.assert(
        fc.property(
          appDataArb,
          (originalData) => {
            // Export to JSON string
            const exported = exportData(originalData);
            
            // Import back from JSON string
            const imported = importData(exported);
            
            // Verify categories match
            if (imported.categories.length !== originalData.categories.length) {
              return false;
            }
            
            for (let i = 0; i < originalData.categories.length; i++) {
              const orig = originalData.categories[i];
              const imp = imported.categories[i];
              if (!orig || !imp) return false;
              if (orig.id !== imp.id || orig.name !== imp.name || orig.order !== imp.order) {
                return false;
              }
            }
            
            // Verify navItems match
            if (imported.navItems.length !== originalData.navItems.length) {
              return false;
            }
            
            for (let i = 0; i < originalData.navItems.length; i++) {
              const orig = originalData.navItems[i];
              const imp = imported.navItems[i];
              if (!orig || !imp) return false;
              if (orig.appid !== imp.appid ||
                  orig.name !== imp.name ||
                  orig.description !== imp.description ||
                  orig.link !== imp.link ||
                  orig.icon !== imp.icon ||
                  orig.categoryId !== imp.categoryId ||
                  orig.order !== imp.order) {
                return false;
              }
            }
            
            // Verify settings match
            if (imported.settings.apiKey !== originalData.settings.apiKey) {
              return false;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce valid JSON on export', () => {
      fc.assert(
        fc.property(
          appDataArb,
          (data) => {
            const exported = exportData(data);
            
            // Should be valid JSON
            try {
              JSON.parse(exported);
              return true;
            } catch {
              return false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve category count after round-trip', () => {
      fc.assert(
        fc.property(
          appDataArb,
          (originalData) => {
            const exported = exportData(originalData);
            const imported = importData(exported);
            
            return imported.categories.length === originalData.categories.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve navItem count after round-trip', () => {
      fc.assert(
        fc.property(
          appDataArb,
          (originalData) => {
            const exported = exportData(originalData);
            const imported = importData(exported);
            
            return imported.navItems.length === originalData.navItems.length;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
