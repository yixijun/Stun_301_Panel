# Requirements Document

## Introduction

一个可部署在 Cloudflare Pages 上的导航页应用，使用 Node.js 和 Vue 构建。支持分类管理、导航链接编辑、以及通过 Webhook API 动态更新链接。

## Glossary

- **Nav_Portal**: 导航页应用系统
- **Category**: 导航分类，用于组织导航链接
- **Nav_Item**: 导航项，包含名称、appid、描述和跳转链接
- **Edit_Mode**: 编辑模式，允许用户添加/修改分类和导航项
- **Webhook_API**: 用于通过 HTTP 请求更新导航链接的接口
- **AppID**: 导航项的唯一标识符

## Requirements

### Requirement 1: 页面布局

**User Story:** 作为用户，我希望看到清晰的左右分栏布局，以便快速浏览分类和导航内容。

#### Acceptance Criteria

1. THE Nav_Portal SHALL display a two-column layout with categories on the left and navigation items on the right
2. WHEN the page loads, THE Nav_Portal SHALL show "全部" category as the default selected category
3. THE Nav_Portal SHALL display the edit mode toggle and settings button at the bottom of the left sidebar

### Requirement 2: 分类管理

**User Story:** 作为用户，我希望能够管理导航分类，以便更好地组织我的导航链接。

#### Acceptance Criteria

1. THE Nav_Portal SHALL always display a "全部" category that shows all navigation items
2. WHEN a user selects a category, THE Nav_Portal SHALL filter and display only navigation items belonging to that category
3. WHILE Edit_Mode is enabled, THE Nav_Portal SHALL allow users to add new categories
4. WHILE Edit_Mode is enabled, THE Nav_Portal SHALL allow users to edit or delete existing custom categories
5. WHEN a category is deleted, THE Nav_Portal SHALL reassign its navigation items to "全部" category only

### Requirement 3: 导航项管理

**User Story:** 作为用户，我希望能够添加和编辑导航项，以便维护我的导航链接集合。

#### Acceptance Criteria

1. THE Nav_Portal SHALL display navigation items as clickable cards/icons with name and description
2. WHEN a user clicks a navigation item, THE Nav_Portal SHALL open the associated link in a new tab
3. WHILE Edit_Mode is enabled, THE Nav_Portal SHALL allow users to add new navigation items
4. WHILE Edit_Mode is enabled, THE Nav_Portal SHALL allow users to edit navigation item properties (name, appid, description, link, category)
5. WHEN creating a navigation item, THE Nav_Portal SHALL validate that the appid is unique across all items
6. IF a duplicate appid is provided, THEN THE Nav_Portal SHALL display an error message and prevent creation

### Requirement 4: 数据持久化

**User Story:** 作为用户，我希望我的导航数据能够被保存，以便下次访问时仍然可用。

#### Acceptance Criteria

1. THE Nav_Portal SHALL persist all categories and navigation items to JSON file storage
2. WHEN the page loads, THE Nav_Portal SHALL restore previously saved data from storage
3. WHEN any data changes occur, THE Nav_Portal SHALL automatically save to storage
4. THE Nav_Portal SHALL support both local file storage (Node.js) and Cloudflare KV storage modes

### Requirement 5: Webhook API

**User Story:** 作为开发者，我希望能够通过 API 更新导航链接，以便实现自动化链接管理。

#### Acceptance Criteria

1. THE Nav_Portal SHALL expose a GET endpoint to retrieve a navigation item's link by appid
2. THE Nav_Portal SHALL expose a POST endpoint to update a navigation item's link by appid
3. WHEN a GET request is made with parameters `key`, `appid`, THE Nav_Portal SHALL return the corresponding link
4. WHEN a POST request is made with parameters `key`, `appid`, `link`, THE Nav_Portal SHALL update the navigation item's link
5. IF the provided key is invalid, THEN THE Nav_Portal SHALL return an authentication error
6. IF the provided appid does not exist, THEN THE Nav_Portal SHALL return a not found error
7. THE Nav_Portal SHALL allow users to configure the API key in settings

### Requirement 6: 设置功能

**User Story:** 作为用户，我希望能够配置应用设置，以便自定义应用行为。

#### Acceptance Criteria

1. WHEN a user clicks the settings button, THE Nav_Portal SHALL display a settings modal/panel
2. THE Nav_Portal SHALL allow users to set and modify the API key for webhook authentication
3. THE Nav_Portal SHALL allow users to export all data as JSON
4. THE Nav_Portal SHALL allow users to import data from JSON file

### Requirement 7: 多环境部署支持

**User Story:** 作为开发者，我希望应用能够灵活部署在不同环境中。

#### Acceptance Criteria

1. THE Nav_Portal SHALL be built as a Vue.js application with Node.js backend
2. THE Nav_Portal SHALL support local deployment with Node.js Express server
3. THE Nav_Portal SHALL support Cloudflare Pages deployment with Pages Functions
4. WHEN deployed locally, THE Nav_Portal SHALL use local JSON file for data storage
5. WHEN deployed on Cloudflare, THE Nav_Portal SHALL use Cloudflare KV for data storage
6. THE Nav_Portal SHALL auto-detect deployment environment and use appropriate storage adapter
7. THE Nav_Portal SHALL include configuration files for both local and Cloudflare deployment
