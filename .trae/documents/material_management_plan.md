# 3DPrintPop - 耗材管理功能重构计划

## 项目概述
本项目是一个3D打印助手应用，采用前后端分离架构。当前耗材管理功能位于设置页面中，现在需要将其移至管理员后台首页作为单独功能，并整合耗材使用统计。

## 实施计划

### [ ] 任务1: 创建新的耗材管理页面
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 在 `frontend/src/pages/` 目录下创建 `MaterialManagement.jsx` 文件
  - 实现耗材的添加、编辑、删除功能
  - 整合耗材使用统计功能
- **Success Criteria**:
  - 新的耗材管理页面能够正常显示
  - 所有耗材管理功能正常工作
  - 耗材使用统计显示在耗材表单中
- **Test Requirements**:
  - `programmatic` TR-1.1: 页面能够正常加载，无控制台错误
  - `programmatic` TR-1.2: 能够添加、编辑、删除耗材
  - `programmatic` TR-1.3: 耗材使用统计正确显示
  - `human-judgement` TR-1.4: 页面布局合理，操作方便
- **Notes**: 参考Settings.jsx中的耗材管理代码

### [ ] 任务2: 修改管理员后台首页导航栏
- **Priority**: P0
- **Depends On**: 任务1
- **Description**:
  - 修改 `AdminDashboard.jsx` 文件
  - 添加耗材管理的导航链接
  - 保持与其他导航项的样式一致
- **Success Criteria**:
  - 导航栏中显示耗材管理链接
  - 点击链接能够跳转到耗材管理页面
- **Test Requirements**:
  - `programmatic` TR-2.1: 导航链接正确指向新页面
  - `human-judgement` TR-2.2: 导航链接样式与其他链接一致
- **Notes**: 移除或保留原有的耗材使用统计链接，根据整合情况决定

### [ ] 任务3: 从设置页面移除耗材管理部分
- **Priority**: P1
- **Depends On**: 任务1
- **Description**:
  - 修改 `Settings.jsx` 文件
  - 移除耗材管理相关的代码和UI部分
- **Success Criteria**:
  - 设置页面不再显示耗材管理部分
  - 其他设置功能不受影响
- **Test Requirements**:
  - `programmatic` TR-3.1: 设置页面加载正常，无控制台错误
  - `human-judgement` TR-3.2: 设置页面布局合理，无残留的耗材管理内容
- **Notes**: 确保只移除耗材管理部分，不影响其他设置功能

### [ ] 任务4: 测试功能完整性
- **Priority**: P1
- **Depends On**: 任务1, 任务2, 任务3
- **Description**:
  - 测试新的耗材管理页面的所有功能
  - 测试管理员后台首页的导航功能
  - 测试设置页面的其他功能
- **Success Criteria**:
  - 所有功能正常工作
  - 无控制台错误
  - 页面布局合理
- **Test Requirements**:
  - `programmatic` TR-4.1: 所有API调用正常，无错误
  - `programmatic` TR-4.2: 页面导航正常
  - `human-judgement` TR-4.3: 整体用户体验良好
- **Notes**: 测试时确保数据一致性

## 技术要点

1. **前端实现**:
   - 创建新的 `MaterialManagement.jsx` 页面
   - 从 `Settings.jsx` 复制耗材管理相关代码
   - 整合耗材使用统计功能
   - 修改 `AdminDashboard.jsx` 添加导航链接

2. **后端实现**:
   - 保持现有的耗材相关API不变
   - 确保耗材使用统计API能够正确返回数据

3. **路由配置**:
   - 确保新页面有正确的路由配置

## 预期成果

- 新的耗材管理页面，包含完整的耗材管理功能和使用统计
- 管理员后台首页导航栏添加耗材管理链接
- 设置页面不再包含耗材管理部分
- 所有功能正常工作，前后端保持一致

## 注意事项

- 确保数据迁移平滑，不丢失现有耗材数据
- 保持代码风格一致
- 确保所有API调用正确
- 测试时使用真实数据场景