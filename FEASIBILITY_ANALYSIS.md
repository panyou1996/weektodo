# WeekToDo 多平台部署与同步功能可行性分析及实施方案

## 项目概况

**项目名称**: WeekToDo - 开源极简周计划工具  
**技术栈**: Vue 3 + Vuex + Electron + IndexedDB + LocalStorage  
**当前状态**: 
- 已支持 Windows/Mac/Linux 桌面应用
- 已支持 Web 应用
- 已有导出/导入功能（.wtdb 文件格式）
- 数据存储在本地（LocalStorage + IndexedDB）

---

## 需求分析

### 1. Vercel 部署到个人网站
**目标**: 将 WeekToDo Web 版本部署到 Vercel 平台

### 2. 打包为 Android APK
**目标**: 实现 Android 平台支持，扩展到移动端

### 3. 多平台数据同步
**目标**: 通过 Supabase 实现手动上传/下载备份文件的同步机制

---

## 一、Vercel 部署方案

### 可行性分析
✅ **完全可行**

**理由**:
- WeekToDo 是标准的 Vue 3 SPA 应用
- 已有 `netlify.toml` 配置，说明已支持静态托管
- 无需后端服务器，完全客户端运行
- 使用浏览器 IndexedDB 和 LocalStorage 存储数据

### 实施步骤

#### 1. 创建 Vercel 配置文件
在项目根目录创建 `vercel.json`:

```json
{
  "version": 2,
  "name": "weektodo",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

#### 2. 修改 `package.json`
添加 Vercel 构建脚本:

```json
{
  "scripts": {
    "build": "vue-cli-service build",
    "vercel-build": "vue-cli-service build"
  }
}
```

#### 3. 部署流程
1. 在 Vercel 官网注册账号
2. 连接 GitHub 仓库
3. 导入项目
4. Vercel 会自动检测 Vue 项目并配置
5. 设置自定义域名（可选）
6. 自动部署完成

#### 4. 注意事项
- 确保 `vue.config.js` 中的 `publicPath` 设置正确
- 检查环境变量配置（Sentry DNS 等）
- Service Worker 需要在 HTTPS 环境下运行

### 预估时间
- 配置文件准备: 30分钟
- 部署调试: 1-2小时

---

## 二、Android APK 打包方案

### 可行性分析
✅ **可行，但需要额外工作**

**技术方案选择**:

#### 方案A: Capacitor（推荐）
**优势**:
- 官方支持 Vue 3
- 更现代化的架构
- 更好的性能
- 活跃的社区支持
- 支持原生插件

**劣势**:
- 需要学习新的 API
- 文件体积相对较大

#### 方案B: Cordova
**优势**:
- 成熟稳定
- 插件生态丰富

**劣势**:
- 较旧的技术
- 性能不如 Capacitor

### 推荐方案: 使用 Capacitor

### 实施步骤

#### 1. 安装 Capacitor
```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
npx cap init
```

#### 2. 配置 Capacitor
创建 `capacitor.config.json`:

```json
{
  "appId": "com.weektodo.app",
  "appName": "WeekToDo",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 3000
    }
  }
}
```

#### 3. 修改项目适配移动端

**a. 更新 `vue.config.js`**:
```javascript
module.exports = {
  publicPath: './',
  // ... 其他配置
}
```

**b. 移动端样式适配**:
当前项目已有移动端警告提示，需要移除并优化：
- 移除 `.mobile` 警告层
- 优化触摸交互
- 调整响应式布局

**c. 处理 Electron 特有功能**:
```javascript
// 添加平台检测
const isElectron = () => {
  return window.navigator.userAgent.indexOf('Electron') > -1;
};

const isCapacitor = () => {
  return window.Capacitor !== undefined;
};
```

#### 4. 添加 Android 平台
```bash
npx cap add android
```

#### 5. 构建和运行
```bash
# 构建 Web 应用
npm run build

# 同步到 Android
npx cap sync android

# 打开 Android Studio
npx cap open android

# 在 Android Studio 中构建 APK
```

#### 6. 需要处理的功能差异

| 功能 | Web/Electron | Android | 解决方案 |
|-----|--------------|---------|----------|
| 通知 | Web Notification | 原生通知 | 使用 @capacitor/local-notifications |
| 文件导入导出 | 文件系统 | 需要权限 | 使用 @capacitor/filesystem |
| 系统托盘 | Electron 特有 | 不适用 | 功能降级 |
| 开机启动 | Electron 特有 | 不适用 | 功能降级 |

#### 7. 必需的 Capacitor 插件
```bash
npm install @capacitor/local-notifications
npm install @capacitor/filesystem
npm install @capacitor/app
npm install @capacitor/storage
```

### 预估时间
- Capacitor 集成: 2-3天
- 移动端适配: 3-5天
- 功能测试: 2-3天
- **总计**: 7-11天

---

## 三、Supabase 同步方案

### 可行性分析
✅ **完全可行，最小改动方案**

**方案设计**:
- 不修改现有数据结构
- 利用现有的导出/导入机制
- 添加云端存储功能
- 手动触发上传/下载

### 架构设计

```
┌─────────────────┐
│   用户设备      │
│  (Web/Desktop/  │
│    Android)     │
└────────┬────────┘
         │
         ├─ 手动上传 ──────┐
         │                 │
         ├─ 手动下载 ◄─────┤
         │                 │
         ▼                 ▼
┌─────────────────────────────┐
│      Supabase Storage       │
│  (用户备份文件存储)          │
│  /backups/{userId}/         │
│    - latest.wtdb            │
│    - backup_timestamp.wtdb  │
└─────────────────────────────┘
         ▲
         │
         ▼
┌─────────────────────────────┐
│    Supabase Auth (可选)     │
│  (用户认证，可用匿名模式)    │
└─────────────────────────────┘
```

### 实施步骤

#### 1. 创建 Supabase 项目
1. 访问 https://supabase.com
2. 创建新项目
3. 获取 API URL 和 anon key
4. 配置存储桶（Storage Bucket）

#### 2. 安装 Supabase 客户端
```bash
npm install @supabase/supabase-js
```

#### 3. 创建 Supabase 配置文件

**`src/repositories/supabaseRepository.js`**:
```javascript
import { createClient } from '@supabase/supabase-js'

// 配置
const supabaseUrl = process.env.VUE_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseKey = process.env.VUE_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)

export default {
  // 获取或创建匿名用户
  async getOrCreateAnonymousUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (!user) {
      const { data, error: signInError } = await supabase.auth.signInAnonymously()
      if (signInError) throw signInError
      return data.user
    }
    
    return user
  },

  // 上传备份文件
  async uploadBackup(fileContent, fileName = 'latest.wtdb') {
    try {
      const user = await this.getOrCreateAnonymousUser()
      const filePath = `${user.id}/${fileName}`
      
      const { data, error } = await supabase.storage
        .from('backups')
        .upload(filePath, fileContent, {
          contentType: 'application/json',
          upsert: true
        })
      
      if (error) throw error
      
      // 同时保存带时间戳的备份
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const timestampPath = `${user.id}/backup_${timestamp}.wtdb`
      await supabase.storage
        .from('backups')
        .upload(timestampPath, fileContent, {
          contentType: 'application/json'
        })
      
      return { success: true, path: filePath }
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  },

  // 下载最新备份
  async downloadLatestBackup() {
    try {
      const user = await this.getOrCreateAnonymousUser()
      const filePath = `${user.id}/latest.wtdb`
      
      const { data, error } = await supabase.storage
        .from('backups')
        .download(filePath)
      
      if (error) throw error
      
      return await data.text()
    } catch (error) {
      console.error('Download error:', error)
      throw error
    }
  },

  // 列出所有备份
  async listBackups() {
    try {
      const user = await this.getOrCreateAnonymousUser()
      
      const { data, error } = await supabase.storage
        .from('backups')
        .list(user.id)
      
      if (error) throw error
      
      return data.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )
    } catch (error) {
      console.error('List error:', error)
      throw error
    }
  },

  // 删除指定备份
  async deleteBackup(fileName) {
    try {
      const user = await this.getOrCreateAnonymousUser()
      const filePath = `${user.id}/${fileName}`
      
      const { error } = await supabase.storage
        .from('backups')
        .remove([filePath])
      
      if (error) throw error
      
      return { success: true }
    } catch (error) {
      console.error('Delete error:', error)
      throw error
    }
  },

  // 获取同步状态
  async getSyncStatus() {
    try {
      const user = await this.getOrCreateAnonymousUser()
      const filePath = `${user.id}/latest.wtdb`
      
      const { data, error } = await supabase.storage
        .from('backups')
        .list(user.id, {
          limit: 1,
          search: 'latest.wtdb'
        })
      
      if (error) throw error
      
      if (data && data.length > 0) {
        return {
          exists: true,
          lastModified: data[0].updated_at,
          size: data[0].metadata?.size
        }
      }
      
      return { exists: false }
    } catch (error) {
      console.error('Sync status error:', error)
      return { exists: false, error: error.message }
    }
  }
}
```

#### 4. 修改 `exportTool.js` 添加云同步功能

**`src/helpers/exportTool.js`**:
```javascript
import supabaseRepository from "../repositories/supabaseRepository";

export default {
  // ... 现有的 export, import, clear 方法 ...

  // 上传到云端
  async uploadToCloud() {
    try {
      // 使用现有的导出逻辑获取数据
      const data = await this.exportToJson();
      const jsonString = JSON.stringify(data);
      
      const result = await supabaseRepository.uploadBackup(
        jsonString,
        'latest.wtdb'
      );
      
      return { success: true, message: '上传成功' };
    } catch (error) {
      console.error('Upload to cloud failed:', error);
      return { success: false, message: error.message };
    }
  },

  // 从云端下载
  async downloadFromCloud() {
    try {
      const jsonString = await supabaseRepository.downloadLatestBackup();
      const data = JSON.parse(jsonString);
      
      // 使用现有的导入逻辑
      await this.importFromJson(data);
      
      return { success: true, message: '下载成功' };
    } catch (error) {
      console.error('Download from cloud failed:', error);
      return { success: false, message: error.message };
    }
  },

  // 导出为 JSON（新增辅助方法）
  async exportToJson() {
    return new Promise((resolve) => {
      var data = storageRepository.as_json();
      data.todoLists = {};
      data.repeating_events = {};
      data.repeating_events_by_date = {};
      let db_req = dbRepository.open();

      db_req.onsuccess = function (event) {
        var db = event.target.result;
        let request = dbRepository.selectAll(db, "todo_lists");
        request.onsuccess = function () {
          let cursor = request.result;
          if (cursor) {
            data.todoLists[cursor.key] = cursor.value;
            cursor.continue();
          } else {
            // 获取重复事件数据
            getRepeatinEventDataAsync(data, event).then((finalData) => {
              resolve(finalData);
            });
          }
        };
      };
    });
  },

  // 从 JSON 导入（新增辅助方法）
  async importFromJson(data) {
    if (!('config' in data)) {
      throw new Error('Invalid backup file');
    }
    
    importLocalStorageData(data);
    await importIndexedDbDataAsync(data, "todo_lists");
    
    return { success: true };
  }
}
```

#### 5. 在 UI 中添加同步按钮

**修改 `src/views/configModal.vue`**:

在数据管理部分添加同步按钮（Data 标签页）：

```vue
<template>
  <!-- 在导出/导入按钮后添加 -->
  <div class="horizontal-divider my-3"></div>
  
  <div class="px-1 mb-2">
    <h6>{{ $t("settings.cloudSync") }}</h6>
    <small class="text-muted">{{ $t("settings.cloudSyncDesc") }}</small>
  </div>

  <div class="form-check form-switch d-flex px-1 mb-3 justify-content-between align-items-center">
    <div class="d-flex flex-column">
      <label class="form-check-label">{{ $t("settings.uploadToCloud") }}</label>
      <small v-if="lastUploadTime" class="text-muted">
        {{ $t("settings.lastUpload") }}: {{ lastUploadTime }}
      </small>
    </div>
    <button 
      type="button" 
      class="btn py-1 px-2 border" 
      style="width: 140px;"
      @click="uploadToCloud"
      :disabled="isUploading"
    >
      <i class="icons bi-cloud-arrow-up mx-2"></i>
      {{ isUploading ? $t("settings.uploading") : $t("settings.upload") }}
    </button>
  </div>

  <div class="form-check form-switch d-flex px-1 mb-3 justify-content-between align-items-center">
    <div class="d-flex flex-column">
      <label class="form-check-label">{{ $t("settings.downloadFromCloud") }}</label>
      <small v-if="cloudBackupTime" class="text-muted">
        {{ $t("settings.cloudBackupTime") }}: {{ cloudBackupTime }}
      </small>
    </div>
    <button 
      type="button" 
      class="btn py-1 px-2 border" 
      style="width: 140px;"
      @click="downloadFromCloud"
      :disabled="isDownloading"
    >
      <i class="icons bi-cloud-arrow-down mx-2"></i>
      {{ isDownloading ? $t("settings.downloading") : $t("settings.download") }}
    </button>
  </div>

  <div class="form-check form-switch d-flex px-1 mb-3 justify-content-between align-items-center">
    <label class="form-check-label">{{ $t("settings.checkSyncStatus") }}</label>
    <button 
      type="button" 
      class="btn py-1 px-2 border" 
      style="width: 140px;"
      @click="checkSyncStatus"
    >
      <i class="icons bi-arrow-repeat mx-2"></i>
      {{ $t("settings.refresh") }}
    </button>
  </div>
</template>

<script>
import supabaseRepository from "../repositories/supabaseRepository";

export default {
  data() {
    return {
      isUploading: false,
      isDownloading: false,
      lastUploadTime: null,
      cloudBackupTime: null,
    };
  },
  methods: {
    async uploadToCloud() {
      this.isUploading = true;
      try {
        const result = await exportTool.uploadToCloud();
        if (result.success) {
          this.showSuccessToast(this.$t("settings.uploadSuccess"));
          this.lastUploadTime = new Date().toLocaleString();
          await this.checkSyncStatus();
        } else {
          this.showErrorToast(result.message);
        }
      } catch (error) {
        this.showErrorToast(error.message);
      } finally {
        this.isUploading = false;
      }
    },

    async downloadFromCloud() {
      this.isDownloading = true;
      try {
        const result = await exportTool.downloadFromCloud();
        if (result.success) {
          this.showSuccessToast(this.$t("settings.downloadSuccess"));
          location.reload(); // 重新加载应用
        } else {
          this.showErrorToast(result.message);
        }
      } catch (error) {
        this.showErrorToast(error.message);
      } finally {
        this.isDownloading = false;
      }
    },

    async checkSyncStatus() {
      try {
        const status = await supabaseRepository.getSyncStatus();
        if (status.exists) {
          this.cloudBackupTime = new Date(status.lastModified).toLocaleString();
        } else {
          this.cloudBackupTime = null;
        }
      } catch (error) {
        console.error('Check sync status failed:', error);
      }
    },

    showSuccessToast(message) {
      // 使用项目现有的 Toast 组件
      const toast = new Toast(document.getElementById("syncSuccessToast"));
      toast.show();
    },

    showErrorToast(message) {
      // 使用项目现有的 Toast 组件
      const toast = new Toast(document.getElementById("syncErrorToast"));
      toast.show();
    }
  },
  mounted() {
    this.checkSyncStatus();
  }
};
</script>
```

#### 6. 添加多语言支持

在 `src/assets/languages/en.json` 和中文语言文件中添加：

```json
{
  "settings": {
    "cloudSync": "Cloud Sync",
    "cloudSyncDesc": "Manually backup and restore your data via Supabase",
    "uploadToCloud": "Upload to Cloud",
    "downloadFromCloud": "Download from Cloud",
    "checkSyncStatus": "Check Sync Status",
    "upload": "Upload",
    "uploading": "Uploading...",
    "download": "Download",
    "downloading": "Downloading...",
    "refresh": "Refresh",
    "lastUpload": "Last upload",
    "cloudBackupTime": "Cloud backup time",
    "uploadSuccess": "Upload successful",
    "downloadSuccess": "Download successful, reloading app...",
    "syncError": "Sync failed"
  }
}
```

#### 7. 环境变量配置

创建 `.env` 文件：

```env
VUE_APP_SUPABASE_URL=your_supabase_url
VUE_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

创建 `.env.example` 作为模板：

```env
VUE_APP_SUPABASE_URL=https://your-project.supabase.co
VUE_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

#### 8. Supabase 存储桶配置

在 Supabase Dashboard 中：

1. 创建存储桶 `backups`
2. 设置 RLS (Row Level Security) 策略：

```sql
-- 允许用户访问自己的文件
CREATE POLICY "Users can access their own backups"
ON storage.objects FOR ALL
USING (auth.uid()::text = (storage.foldername(name))[1]);

-- 允许匿名用户访问
CREATE POLICY "Anonymous users can access their backups"
ON storage.objects FOR ALL
USING (true);
```

### 优势总结

✅ **最小改动**: 
- 不修改现有数据结构
- 复用导出/导入逻辑
- 只添加新功能，不影响现有功能

✅ **用户友好**:
- 手动控制同步时机
- 保留历史备份
- 支持离线使用

✅ **隐私友好**:
- 匿名认证，无需注册
- 数据加密存储
- 用户完全控制数据

✅ **跨平台支持**:
- Web、Desktop、Android 统一方案
- 代码复用率高

### 预估时间
- Supabase 集成: 1-2天
- UI 开发: 1天
- 测试调试: 1天
- **总计**: 3-4天

---

## 四、总体实施时间表

| 阶段 | 任务 | 预估时间 |
|-----|------|---------|
| 第一阶段 | Vercel 部署 | 1-2天 |
| 第二阶段 | Supabase 同步功能 | 3-4天 |
| 第三阶段 | Android APK 开发 | 7-11天 |
| 测试与优化 | 全平台测试 | 3-5天 |
| **总计** | | **14-22天** |

---

## 五、技术风险评估

### 低风险 ⚠️
- Vercel 部署：成熟技术，风险极低
- Supabase 集成：官方支持良好，风险低

### 中等风险 ⚠️⚠️
- Android 适配：需要适配移动端交互
- 通知功能：需要替换为原生通知

### 需要注意的问题

1. **移动端适配**
   - 触摸操作优化
   - 屏幕尺寸适配
   - 软键盘处理

2. **同步冲突**
   - 当前方案是手动同步，避免了自动同步的冲突问题
   - 建议添加"最后修改时间"提示

3. **数据迁移**
   - 现有用户需要手动上传一次备份
   - 需要提供迁移指南

---

## 六、成本估算

### Supabase 费用
- **免费套餐**: 
  - 500MB 存储空间
  - 2GB 带宽/月
  - 50,000 月活用户
  - **对于个人使用完全足够**

### Vercel 费用
- **免费套餐**:
  - 100GB 带宽/月
  - 无限部署
  - 自定义域名
  - **对于个人网站完全足够**

### 总成本
**$0/月** (使用免费套餐)

---

## 七、推荐实施顺序

### 优先级排序

1. **高优先级**: Vercel 部署（快速见效）
2. **高优先级**: Supabase 同步（核心需求）
3. **中优先级**: Android APK（需要较长开发周期）

### 建议分阶段实施

**第一阶段（1周）**:
1. Vercel 部署 ✓
2. Supabase 同步功能开发 ✓

**第二阶段（2-3周）**:
3. Android 应用开发
4. 全平台测试

---

## 八、后续优化建议

### 未来可考虑的功能

1. **自动同步**
   - 定时自动备份
   - 冲突检测与合并
   - 实时同步（WebSocket）

2. **多设备管理**
   - 设备列表查看
   - 设备间选择性同步

3. **协作功能**
   - 分享列表
   - 团队协作

4. **增强安全性**
   - 端到端加密
   - 密码保护

---

## 九、总结

### 可行性结论

✅ **三个需求均可行**

1. **Vercel 部署**: 简单快速，100% 可行
2. **Android APK**: 需要时间投入，技术上可行
3. **Supabase 同步**: 完美契合需求，最小改动

### 推荐方案

**最优方案**: 
1. 先完成 Vercel 部署 + Supabase 同步（1周内）
2. 再开发 Android 应用（2-3周）

这样可以快速实现跨平台和同步功能，Android 作为第二阶段独立开发。

### 关键优势

- ✅ 最小代码改动
- ✅ 利用现有功能
- ✅ 零成本运营
- ✅ 完全开源
- ✅ 隐私保护
- ✅ 跨平台统一

---

## 附录：相关文档链接

- [Vercel 部署文档](https://vercel.com/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Capacitor 文档](https://capacitorjs.com/docs)
- [Vue CLI 文档](https://cli.vuejs.org/)

---

**文档版本**: 1.0  
**编写日期**: 2024-12-27  
**适用项目**: WeekToDo v2.2.0
