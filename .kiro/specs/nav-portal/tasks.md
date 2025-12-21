# Implementation Plan: Nav Portal

## Overview

使用 Vue 3 + TypeScript 构建前端，Node.js Express 构建后端，支持本地部署和 Cloudflare Pages 部署。采用增量开发方式，先搭建核心框架，再逐步实现各功能模块。

## Tasks

- [x] 1. 项目初始化和基础架构
  - [x] 1.1 创建 Vue 3 + TypeScript 项目结构
    - 使用 Vite 创建项目
    - 配置 TypeScript、ESLint
    - 安装依赖：vue-router、pinia、axios
    - _Requirements: 7.1_
  - [x] 1.2 创建 TypeScript 类型定义
    - 定义 Category、NavItem、AppSettings、AppData 接口
    - 定义 StorageAdapter 接口
    - _Requirements: 3.4, 3.5_
  - [x] 1.3 创建 Node.js Express 后端基础结构
    - 创建 server 目录和入口文件
    - 配置 Express 和 CORS
    - _Requirements: 7.2_

- [x] 2. 存储层实现
  - [x] 2.1 实现存储适配器接口和本地文件适配器
    - 创建 StorageAdapter 抽象接口
    - 实现 LocalFileAdapter（JSON 文件读写）
    - _Requirements: 4.1, 4.4, 7.4_
  - [x] 2.2 编写属性测试：数据持久化往返一致性
    - **Property 5: 数据持久化往返一致性**
    - **Validates: Requirements 4.1, 4.2, 4.3**
  - [x] 2.3 实现 Cloudflare KV 适配器
    - 实现 KVAdapter 用于 Cloudflare 环境
    - _Requirements: 4.4, 7.5_

- [x] 3. 后端 API 实现
  - [x] 3.1 实现数据 API 端点
    - GET /api/data - 获取所有数据
    - POST /api/data - 保存所有数据
    - _Requirements: 4.2, 4.3_
  - [x] 3.2 实现 Webhook API 端点
    - GET /api/link - 获取导航项链接
    - POST /api/link - 更新导航项链接
    - 实现 API Key 验证中间件
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [x] 3.3 编写属性测试：API 链接更新往返一致性
    - **Property 6: API 链接更新往返一致性**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [x] 4. Checkpoint - 后端功能验证
  - 确保所有后端测试通过
  - 验证 API 端点正常工作
  - 如有问题请询问用户


- [x] 5. 前端状态管理
  - [x] 5.1 实现 Pinia Store
    - 创建 navStore 管理分类和导航项
    - 实现数据加载、保存方法
    - 实现编辑模式状态
    - _Requirements: 4.2, 4.3_
  - [x] 5.2 实现分类管理逻辑
    - 添加、编辑、删除分类
    - 分类删除时重分配导航项
    - _Requirements: 2.3, 2.4, 2.5_
  - [x] 5.3 编写属性测试：分类删除后的项重分配
    - **Property 4: 分类删除后的项重分配**
    - **Validates: Requirements 2.5**
  - [x] 5.4 实现导航项管理逻辑
    - 添加、编辑、删除导航项
    - AppID 唯一性验证
    - 分类过滤
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 2.2_
  - [x] 5.5 编写属性测试：AppID 唯一性约束
    - **Property 1: AppID 唯一性约束**
    - **Validates: Requirements 3.5, 3.6**
  - [x] 5.6 编写属性测试：分类过滤正确性
    - **Property 2: 分类过滤正确性**
    - **Validates: Requirements 2.2**
  - [x] 5.7 编写属性测试："全部"分类完整性
    - **Property 3: "全部"分类完整性**
    - **Validates: Requirements 2.1**

- [x] 6. 前端 UI 组件
  - [x] 6.1 实现页面布局和 Sidebar 组件
    - 左右分栏布局
    - 分类列表显示
    - 编辑模式开关
    - 设置按钮
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 6.2 实现 CategoryList 组件
    - 显示分类列表
    - 分类选择交互
    - 编辑模式下的添加/编辑/删除按钮
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 6.3 实现 NavGrid 和 NavCard 组件
    - 导航项网格布局
    - 卡片显示名称、描述、图标
    - 点击跳转链接
    - _Requirements: 3.1, 3.2_
  - [x] 6.4 实现 EditModal 组件
    - 分类编辑表单
    - 导航项编辑表单（名称、appid、描述、链接、分类）
    - AppID 唯一性验证提示
    - _Requirements: 2.3, 2.4, 3.3, 3.4, 3.5, 3.6_
  - [x] 6.5 实现 SettingsModal 组件
    - API Key 配置
    - 数据导出功能
    - 数据导入功能
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 6.6 编写属性测试：数据导入导出往返一致性
    - **Property 7: 数据导入导出往返一致性**
    - **Validates: Requirements 6.3, 6.4**

- [x] 7. Checkpoint - 前端功能验证
  - 确保所有前端测试通过
  - 验证 UI 交互正常
  - 如有问题请询问用户

- [x] 8. Cloudflare Pages 部署配置
  - [x] 8.1 创建 Cloudflare Pages Functions
    - 创建 functions/api/[[path]].ts 动态路由
    - 适配 Cloudflare 环境的请求处理
    - _Requirements: 7.3_
  - [x] 8.2 配置部署文件
    - 创建 wrangler.toml 配置
    - 配置 KV namespace 绑定
    - 更新 package.json 构建脚本
    - _Requirements: 7.6, 7.7_

- [x] 9. Final Checkpoint - 完整功能验证
  - 确保所有测试通过
  - 验证本地部署正常运行
  - 验证 Cloudflare 部署配置正确
  - 如有问题请询问用户

## Notes

- 所有任务（包括测试任务）都是必须执行的
- 每个任务都关联了具体的需求条目以便追溯
- Checkpoint 任务用于阶段性验证
- 属性测试使用 fast-check 库，每个测试至少运行 100 次迭代
