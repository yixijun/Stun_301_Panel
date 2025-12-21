/**
 * Property-Based Tests for LocalFileAdapter
 * Feature: nav-portal, Property 5: 数据持久化往返一致性
 * Validates: Requirements 4.1, 4.2, 4.3
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { LocalFileAdapter } from './localAdapter.js';
import { AppData, Category, NavItem, AppSettings } from '../types.js';
import { rmSync, existsSync } from 'fs';

// Test file path
const TEST_FILE_PATH = './test-data/test-nav-data.json';

// Arbitraries for generating test data
const categoryArbitrary: fc.Arbitrary<Category> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  order: fc.nat({ max: 1000 })
});

const navItemArbitrary: fc.Arbitrary<NavItem> = fc.record({
  appid: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ maxLength: 500 }),
  link: fc.webUrl(),
  icon: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  categoryId: fc.string({ minLength: 1, maxLength: 20 }),
  order: fc.nat({ max: 1000 })
});

const appSettingsArbitrary: fc.Arbitrary<AppSettings> = fc.record({
  apiKey: fc.string({ maxLength: 64 })
});

const appDataArbitrary: fc.Arbitrary<AppData> = fc.record({
  categories: fc.array(categoryArbitrary, { minLength: 1, maxLength: 10 }),
  navItems: fc.array(navItemArbitrary, { maxLength: 20 }),
  settings: appSettingsArbitrary
});

describe('LocalFileAdapter Property Tests', () => {
  let adapter: LocalFileAdapter;

  beforeEach(() => {
    adapter = new LocalFileAdapter(TEST_FILE_PATH);
  });

  afterEach(() => {
    // Clean up test file
    if (existsSync(TEST_FILE_PATH)) {
      rmSync(TEST_FILE_PATH);
    }
    if (existsSync('./test-data')) {
      rmSync('./test-data', { recursive: true });
    }
  });

  /**
   * Property 5: 数据持久化往返一致性
   * For any AppData object, saving to storage then reading back
   * should produce data equal to the original
   * Validates: Requirements 4.1, 4.2, 4.3
   */
  it('Property 5: Data persistence round-trip consistency', async () => {
    await fc.assert(
      fc.asyncProperty(appDataArbitrary, async (originalData) => {
        // Save data
        await adapter.saveData(originalData);
        
        // Read data back
        const retrievedData = await adapter.getData();
        
        // Verify round-trip consistency
        expect(retrievedData).toEqual(originalData);
      }),
      { numRuns: 100 }
    );
  });
});
