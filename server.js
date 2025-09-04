const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { ConfigParser } = require('./src/configParser');
const { TrieTree } = require('./src/trieTree');
const { PECExtractor } = require('./src/pecExtractor');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// 配置文件上传处理
const upload = multer({ dest: 'uploads/' });

// 路由
app.post('/api/upload', upload.single('config'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const configParser = new ConfigParser();
    const trieTree = new TrieTree();
    const pecExtractor = new PECExtractor();

    // 设置网络拓扑信息
    const networkTopology = new Map([
      ['r0', 10],
      ['r1', 10], 
      ['r2', 10],
      ['r3', 10] // 添加 r3
    ]);
    trieTree.setNetworkTopology(networkTopology);

    // 解析配置文件
    const configData = await configParser.parseFile(req.file.path);
    
    // 构建 Trie 树
    configData.staticRoutes.forEach(route => {
      trieTree.insert(route.prefix, {
        type: 'static-route',
        router: configData.hostname,
        interface: route.interface,
        nextHop: route.nextHop
      });
    });

    // 插入标准 ACL
    configData.accessLists.forEach(acl => {
      trieTree.insert(acl.prefix, {
        type: 'access-list',
        router: configData.hostname,
        aclNumber: acl.number,
        action: acl.action,
        aclType: acl.type
      });
    });

    // 插入命名 ACL (新增)
    configData.namedAcls.forEach(namedAcl => {
      namedAcl.rules.forEach(rule => {
        if (rule.source && rule.source.value) {
          trieTree.insert(rule.source.value, {
            type: 'named-acl',
            router: configData.hostname,
            aclName: namedAcl.name,
            direction: namedAcl.direction,
            action: rule.action,
            protocol: rule.protocol,
            description: namedAcl.description
          });
        }
        if (rule.destination && rule.destination.value) {
          trieTree.insert(rule.destination.value, {
            type: 'named-acl',
            router: configData.hostname,
            aclName: namedAcl.name,
            direction: namedAcl.direction,
            action: rule.action,
            protocol: rule.protocol,
            description: namedAcl.description
          });
        }
      });
    });

    configData.prefixLists.forEach(prefixList => {
      trieTree.insert(prefixList.prefix, {
        type: 'prefix-list',
        router: configData.hostname,
        listName: prefixList.name,
        action: prefixList.action
      });
    });

    // 提取 PEC
    const pecs = pecExtractor.extractPECs(trieTree);

    res.json({
      success: true,
      configData,
      trieTree: trieTree.getTreeData(),
      pecs
    });

  } catch (error) {
    console.error('Error processing config:', error);
    res.status(500).json({ error: error.message });
  }
});

// 服务 React 应用
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
