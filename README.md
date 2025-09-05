# Network Configuration Analyzer

一个用于分析网络设备配置文件的工具，可以提取网络前缀并构建 Trie 树来识别 Packet Equivalence Classes (PECs)。
## 简单实例（用的很小的配置文件）

### 提取ACL：
<img width="587" height="787" alt="image" src="https://github.com/user-attachments/assets/3601ccbe-1f41-4d5e-9f2c-73c7c5a05311" />

### 创建TRIE_tree 
<img width="583" height="697" alt="image" src="https://github.com/user-attachments/assets/4e1e7b37-5038-4318-a893-bf4c0c9bab29" />

### 划分PEC
<img width="588" height="246" alt="image" src="https://github.com/user-attachments/assets/38a9f3eb-b5a1-4638-985d-592615abee90" />





## 功能特性

- **配置文件解析**: 支持多种网络设备配置格式（Cisco、Juniper、华为、Arista）
- **前缀提取**: 自动识别静态路由、访问控制列表、前缀列表中的网络前缀
- **Trie 树构建**: 将提取的前缀构建到二进制 Trie 树中，记录来源信息
- **PEC 提取**: 通过深度优先遍历提取所有的 Packet Equivalence Classes
- **可视化展示**: 直观的 Web 界面展示分析结果
- **数据导出**: 支持 JSON、CSV、TXT 格式导出

## 技术架构

- **后端**: Node.js + Express
- **前端**: React + TypeScript
- **数据结构**: 自定义 Trie 树实现
- **文件处理**: Multer 处理文件上传

## 安装和运行

### 1. 安装依赖

```bash
# 安装所有依赖（服务器端和客户端）
npm run install-all

# 或者分别安装
npm run install-server    # 安装服务器端依赖
npm run install-client    # 安装客户端依赖
```

### 2. 启动应用

```bash
# 开发模式（同时启动服务器和客户端）
npm run dev

# 生产模式
npm run build    # 构建客户端
npm start        # 启动服务器
```

### 3. 访问应用

- http://localhost:3002

## 使用方法

1. **上传配置文件**: 拖拽或点击上传网络设备配置文件
2. **自动解析**: 系统自动检测配置类型并解析内容
3. **查看结果**: 
   - 配置分析结果
   - Trie 树可视化
   - PEC 列表和统计
4. **导出数据**: 选择格式导出分析结果

## 支持的配置格式

### Cisco 配置
- 静态路由: `ip route <prefix> <mask> <interface> [next-hop]`
- BGP 网络: `network <prefix> mask <mask>`
- 访问控制列表: `access-list <number> <action> <prefix>`
- 前缀列表: `ip prefix-list <name> <action> <prefix>`

### 其他厂商
- Juniper (基础支持)
- 华为 (基础支持)
- Arista (基础支持)

## 核心算法

### Trie 树构建
1. 将 IP 前缀转换为二进制位序列
2. 按位构建树结构
3. 在叶节点记录前缀信息和来源

### PEC 提取
1. 深度优先遍历 Trie 树
2. 在每个前缀结束节点创建 PEC
3. 记录前缀特征和来源信息

## 项目结构

```
├── server.js                 # Express 服务器
├── src/
│   ├── trieTree.js          # Trie 树实现
│   ├── configParser.js      # 配置文件解析器
│   └── pecExtractor.js      # PEC 提取器
├── client/                   # React 前端应用
│   ├── src/
│   │   ├── components/      # React 组件
│   │   ├── App.js          # 主应用组件
│   │   └── index.js        # 应用入口
│   └── public/              # 静态资源
└── uploads/                 # 上传文件临时目录
```

## API 接口

### POST /api/upload
上传并分析配置文件

**请求**: multipart/form-data
- `config`: 配置文件

**响应**:
```json
{
  "success": true,
  "configData": {...},
  "trieTree": {...},
  "pecs": [...]
}
```

## 示例输出

### 配置分析结果
- 路由器主机名
- 静态路由数量
- 访问控制列表数量
- 前缀列表数量
- 接口配置

### Trie 树可视化
- 二进制位节点
- 前缀结束标记
- 来源信息显示

### PEC 列表
- PEC ID 和前缀
- 前缀长度和来源类型
- 路由器信息
- 详细描述

## 开发说明

### 添加新的配置格式支持
1. 在 `configParser.js` 中添加新的解析方法
2. 更新 `detectConfigType` 方法
3. 测试新格式的解析

### 扩展 PEC 提取逻辑
1. 修改 `pecExtractor.js` 中的特征分析
2. 添加新的 PEC 分类规则
3. 更新可视化组件

## 许可证

MIT License

## 贡献

