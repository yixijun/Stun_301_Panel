/**
 * Property-Based Tests for NavController - API Link Update
 * Feature: nav-portal, Property 6: API 链接更新往返一致性
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { LocalFileAdapter } from '../storage/localAdapter.js';
import { AppData, Category, NavItem, AppSettings } from '../types.js';
import { rmSync, existsSync } from 'fs';

// Test file path
const TEST_FILE_PATH = './test-data/api-test-nav-data.json';

// Arbitraries for generating test data
const categoryArbitrary: fc.Arbitrary<Category> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  order: fc.nat({ max: 1000 })
});

const navItemArbitrary: fc.Arbitrary<NavItem> = fc.record({
  appid: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0 && !s.includes(' ')),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ maxLength: 500 }),
  link: fc.webUrl(),
  icon: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  categoryId: fc.string({ minLength: 1, maxLength: 20 }),
  order: fc.nat({ max: 1000 })
});

const appSettingsArbitrary: fc.Arbitrary<AppSettings> = fc.record({
  apiKey: fc.string({ minLength: 1, maxLength: 64 }).filter(s => s.trim().length > 0)
});

// Generate AppData with at least one NavItem for testing link updates
const appDataWithNavItemsArbitrary: fc.Arbitrary<AppData> = fc.record({
  categories: fc.array(categoryArbitrary, { minLength: 1, maxLength: 5 }),
  navItems: fc.array(navItemArbitrary, { minLength: 1, maxLength: 10 }),
  settings: appSettingsArbitrary
});

describe('NavController Property Tests - API Link Update', () => {
  let adapter: LocalFileAdapter;

  beforeEach(() => {
    adapter = new LocalFileAdapter(TEST_FILE_PATH);
  });

  afterEach(() => {
    // Clean up test file
    if (existsSync(TEST_FILE_PATH)) {
      rmSync(TEST_FILE_PATH);
    }
    if (existsSync('./test-data') && !existsSync('./test-data/test-nav-data.json')) {
      rmSync('./test-data', { recursive: true });
    }
  });

  /**
   * Property 6: API 链接更新往返一致性
   * For any valid appid and new link value, after updating via POST,
   * a GET request should return the same link value
   * Validates: Requirements 5.1, 5.2, 5.3, 5.4
   */
  it('Property 6: API link update round-trip consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        appDataWithNavItemsArbitrary,
        fc.webUrl(),
        async (appData, newLink) => {
          // Setup: Save initial data with nav items
          await adapter.saveData(appData);

          // Pick a random existing appid from the nav items
          const randomIndex = Math.floor(Math.random() * appData.navItems.length);
          const targetAppId = appData.navItems[randomIndex].appid;

          // Update the link using storage adapter (simulating POST /api/link)
          const updateSuccess = await adapter.updateNavItemLink(targetAppId, newLink);
          expect(updateSuccess).toBe(true);

          // Get the link back (simulating GET /api/link)
          const retrievedItem = await adapter.getNavItem(targetAppId);
          expect(retrievedItem).not.toBeNull();
          
          // Verify round-trip consistency
          expect(retrievedItem!.link).toBe(newLink);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: Non-existent appid should return null/false
   * Validates: Requirements 5.6
   */
  it('Non-existent appid returns null for getNavItem', async () => {
    await fc.assert(
      fc.asyncProperty(
        appDataWithNavItemsArbitrary,
        fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
        async (appData, randomAppId) => {
          // Setup: Save initial data
          await adapter.saveData(appData);

          // Only test if the random appid doesn't exist in the data
          const existingAppIds = appData.navItems.map(item => item.appid);
          if (!existingAppIds.includes(randomAppId)) {
            const result = await adapter.getNavItem(randomAppId);
            expect(result).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: Update non-existent appid should return false
   * Validates: Requirements 5.6
   */
  it('Update non-existent appid returns false', async () => {
    await fc.assert(
      fc.asyncProperty(
        appDataWithNavItemsArbitrary,
        fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
        fc.webUrl(),
        async (appData, randomAppId, newLink) => {
          // Setup: Save initial data
          await adapter.saveData(appData);

          // Only test if the random appid doesn't exist in the data
          const existingAppIds = appData.navItems.map(item => item.appid);
          if (!existingAppIds.includes(randomAppId)) {
            const result = await adapter.updateNavItemLink(randomAppId, newLink);
            expect(result).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
