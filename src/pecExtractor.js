class PECExtractor {
  constructor() {
    this.pecs = [];
    this.currentPec = null;
    this.networkTopology = null;
  }

  // 设置网络拓扑信息
  setNetworkTopology(topology) {
    this.networkTopology = topology;
  }

  // 提取所有 PEC
  extractPECs(trieTree) {
    this.pecs = [];
    this.currentPec = null;
    
    // 深度优先遍历 Trie 树
    this.dfsTraverse(trieTree.root, []);
    
    // 后处理：合并具有相同特征的相邻PEC
    this.mergeSimilarPECs();
    
    return this.pecs;
  }

  // 深度优先遍历 - 修复后的版本
  dfsTraverse(node, path) {
    // 1. 处理前缀结束节点
    if (node.isEndOfPrefix) {
      this.createPEC(node, path, 'exact');
    }
    
    // 2. 处理中间节点（如果它们定义了重要的路由特征）
    if (this.shouldCreatePECForNode(node, path)) {
      this.createPEC(node, path, 'intermediate');
    }
    
    // 3. 递归遍历子节点
    for (const [bit, child] of node.children) {
      this.dfsTraverse(child, [...path, bit]);
    }
  }

  // 判断是否应该为节点创建PEC
  shouldCreatePECForNode(node, path) {
    // 避免重复创建PEC
    if (node.isEndOfPrefix) return false;
    
    // 检查节点是否定义了重要的路由特征
    return (node.weights && node.weights.size > 0) || 
           node.origin || 
           this.hasRoutingCharacteristics(node) ||
           this.isSignificantRoutingPoint(node, path);
  }

  // 检查节点是否具有路由特征
  hasRoutingCharacteristics(node) {
    return node.sources && node.sources.length > 0;
  }

  // 检查是否是重要的路由点
  isSignificantRoutingPoint(node, path) {
    // 检查是否是网络拓扑中的重要节点
    // 例如：路径长度、子节点数量等
    if (path.length === 0) return true; // 根节点
    if (node.children.size > 1) return true; // 分支节点
    if (path.length <= 8) return true; // 前8位（A类网络）
    if (path.length <= 16) return true; // 前16位（B类网络）
    
    return false;
  }

  // 创建 PEC - 增强版本
  createPEC(node, path, type = 'exact') {
    const pec = {
      id: this.pecs.length + 1,
      prefix: node.prefix || this.generatePrefixFromPath(path),
      binaryPath: path,
      type: type, // 'exact' 或 'intermediate'
      sources: node.sources || [],
      origin: node.origin,
      weights: node.weights || new Map(),
      characteristics: this.analyzePECCharacteristics(node, path),
      description: this.generatePECDescription(node, path, type),
      ipRange: this.calculateIPRange(path)
    };
    
    this.pecs.push(pec);
  }

  // 从路径生成前缀
  generatePrefixFromPath(path) {
    if (path.length === 0) return '0.0.0.0/0';
    
    // 将二进制路径转换为IP地址
    let binary = path.join('');
    // 补齐到32位
    while (binary.length < 32) {
      binary += '0';
    }
    
    // 转换为IP地址
    const octets = [];
    for (let i = 0; i < 4; i++) {
      const octet = binary.substring(i * 8, (i + 1) * 8);
      octets.push(parseInt(octet, 2));
    }
    
    return `${octets.join('.')}/${path.length}`;
  }

  // 计算IP地址范围
  calculateIPRange(path) {
    if (path.length === 0) {
      return { start: '0.0.0.0', end: '255.255.255.255' };
    }
    
    // 计算起始IP
    let startBinary = path.join('');
    while (startBinary.length < 32) {
      startBinary += '0';
    }
    
    // 计算结束IP
    let endBinary = path.join('');
    while (endBinary.length < 32) {
      endBinary += '1';
    }
    
    const startIP = this.binaryToIP(startBinary);
    const endIP = this.binaryToIP(endBinary);
    
    return { start: startIP, end: endIP };
  }

  // 二进制转IP地址
  binaryToIP(binary) {
    const octets = [];
    for (let i = 0; i < 4; i++) {
      const octet = binary.substring(i * 8, (i + 1) * 8);
      octets.push(parseInt(octet, 2));
    }
    return octets.join('.');
  }

  // 分析 PEC 特征 - 增强版本
  analyzePECCharacteristics(node, path) {
    const characteristics = {
      prefixLength: path.length,
      sourceTypes: new Set(),
      routerCount: new Set(),
      interfaceCount: new Set(),
      actionTypes: new Set(),
      // 新增重要特征
      ospfConfig: this.extractOSPFConfig(node),
      networkTopology: this.extractNetworkTopology(node),
      routingPolicies: this.extractRoutingPolicies(node),
      trafficFlow: this.analyzeTrafficFlow(node, path)
    };

    // 分析来源信息
    if (node.sources) {
      node.sources.forEach(source => {
        characteristics.sourceTypes.add(source.type);
        if (source.router) {
          characteristics.routerCount.add(source.router);
        }
        if (source.interface) {
          characteristics.interfaceCount.add(source.interface);
        }
        if (source.action) {
          characteristics.actionTypes.add(source.action);
        }
      });
    }

    return {
      prefixLength: characteristics.prefixLength,
      sourceTypes: Array.from(characteristics.sourceTypes),
      routerCount: characteristics.routerCount.size,
      interfaceCount: characteristics.interfaceCount.size,
      actionTypes: Array.from(characteristics.actionTypes),
      ospfConfig: characteristics.ospfConfig,
      networkTopology: characteristics.networkTopology,
      routingPolicies: characteristics.routingPolicies,
      trafficFlow: characteristics.trafficFlow
    };
  }

  // 提取OSPF配置
  extractOSPFConfig(node) {
    const ospfConfig = {
      origin: node.origin,
      weights: node.weights ? Object.fromEntries(node.weights) : {},
      area: null,
      cost: null
    };

    // 从sources中提取更多OSPF信息
    if (node.sources) {
      node.sources.forEach(source => {
        if (source.type === 'ospf') {
          ospfConfig.area = source.area || ospfConfig.area;
          ospfConfig.cost = source.cost || ospfConfig.cost;
        }
      });
    }

    return ospfConfig;
  }

  // 提取网络拓扑信息
  extractNetworkTopology(node) {
    if (!this.networkTopology) return {};

    const topology = {
      connectedRouters: [],
      linkCosts: {},
      pathCosts: {}
    };

    // 分析到各路由器的连接
    if (node.weights) {
      for (const [router, cost] of node.weights) {
        topology.connectedRouters.push(router);
        topology.linkCosts[router] = cost;
      }
    }

    return topology;
  }

  // 提取路由策略
  extractRoutingPolicies(node) {
    const policies = {
      accessLists: [],
      prefixLists: [],
      routeMaps: [],
      community: []
    };

    if (node.sources) {
      node.sources.forEach(source => {
        if (source.type === 'acl') {
          policies.accessLists.push(source.name || source.number);
        } else if (source.type === 'prefix-list') {
          policies.prefixLists.push(source.name);
        } else if (source.type === 'route-map') {
          policies.routeMaps.push(source.name);
        }
      });
    }

    return policies;
  }

  // 分析流量流向
  analyzeTrafficFlow(node, path) {
    const flow = {
      direction: 'bidirectional',
      ingress: [],
      egress: [],
      loadBalancing: false
    };

    // 基于路径和权重分析流量流向
    if (node.weights && node.weights.size > 1) {
      flow.loadBalancing = true;
    }

    return flow;
  }

  // 生成 PEC 描述 - 增强版本
  generatePECDescription(node, path, type) {
    const prefix = node.prefix || this.generatePrefixFromPath(path);
    const sources = node.sources || [];
    
    let description = `PEC for ${type === 'exact' ? 'exact prefix' : 'prefix range'} ${prefix} (${path.length} bits)`;
    
    if (node.origin) {
      description += ` originating from router ${node.origin}`;
    }
    
    if (sources.length > 0) {
      const sourceTypes = [...new Set(sources.map(s => s.type))];
      description += ` with ${sourceTypes.join(', ')} configuration`;
    }
    
    if (node.weights && node.weights.size > 0) {
      description += ` and routing weights`;
    }
    
    return description;
  }

  // 合并具有相同特征的相邻PEC
  mergeSimilarPECs() {
    const mergedPECs = [];
    const processed = new Set();

    for (let i = 0; i < this.pecs.length; i++) {
      if (processed.has(i)) continue;

      const currentPEC = this.pecs[i];
      let mergedPEC = { ...currentPEC };
      processed.add(i);

      // 查找可以合并的相邻PEC
      for (let j = i + 1; j < this.pecs.length; j++) {
        if (processed.has(j)) continue;

        const nextPEC = this.pecs[j];
        if (this.canMergePECs(mergedPEC, nextPEC)) {
          mergedPEC = this.mergeTwoPECs(mergedPEC, nextPEC);
          processed.add(j);
        }
      }

      mergedPECs.push(mergedPEC);
    }

    this.pecs = mergedPECs;
  }

  // 判断两个PEC是否可以合并
  canMergePECs(pec1, pec2) {
    // 检查是否相邻
    if (!this.areAdjacentPECs(pec1, pec2)) return false;
    
    // 检查是否具有相同的路由特征
    return this.haveSameRoutingCharacteristics(pec1, pec2);
  }

  // 判断两个PEC是否相邻
  areAdjacentPECs(pec1, pec2) {
    // 检查二进制路径是否相邻
    const path1 = pec1.binaryPath;
    const path2 = pec2.binaryPath;
    
    if (Math.abs(path1.length - path2.length) !== 1) return false;
    
    const shorterPath = path1.length < path2.length ? path1 : path2;
    const longerPath = path1.length < path2.length ? path2 : path1;
    
    // 检查较短的路径是否是较长路径的前缀
    for (let i = 0; i < shorterPath.length; i++) {
      if (shorterPath[i] !== longerPath[i]) return false;
    }
    
    return true;
  }

  // 判断两个PEC是否具有相同的路由特征
  haveSameRoutingCharacteristics(pec1, pec2) {
    // 比较OSPF配置
    if (JSON.stringify(pec1.characteristics.ospfConfig) !== 
        JSON.stringify(pec2.characteristics.ospfConfig)) {
      return false;
    }
    
    // 比较路由策略
    if (JSON.stringify(pec1.characteristics.routingPolicies) !== 
        JSON.stringify(pec2.characteristics.routingPolicies)) {
      return false;
    }
    
    return true;
  }

  // 合并两个PEC
  mergeTwoPECs(pec1, pec2) {
    const merged = {
      id: Math.min(pec1.id, pec2.id),
      prefix: this.mergePrefixes(pec1.prefix, pec2.prefix),
      binaryPath: pec1.binaryPath.length < pec2.binaryPath.length ? 
                  pec1.binaryPath : pec2.binaryPath,
      type: 'merged',
      sources: [...new Set([...pec1.sources, ...pec2.sources])],
      origin: pec1.origin || pec2.origin,
      weights: new Map([...pec1.weights, ...pec2.weights]),
      characteristics: this.mergeCharacteristics(pec1.characteristics, pec2.characteristics),
      description: `Merged PEC from ${pec1.id} and ${pec2.id}`,
      ipRange: this.mergeIPRanges(pec1.ipRange, pec2.ipRange)
    };
    
    return merged;
  }

  // 合并前缀
  mergePrefixes(prefix1, prefix2) {
    // 选择较短的前缀（更通用的）
    const [ip1, mask1] = prefix1.split('/');
    const [ip2, mask2] = prefix2.split('/');
    
    return parseInt(mask1) <= parseInt(mask2) ? prefix1 : prefix2;
  }

  // 合并特征
  mergeCharacteristics(char1, char2) {
    return {
      prefixLength: Math.min(char1.prefixLength, char2.prefixLength),
      sourceTypes: [...new Set([...char1.sourceTypes, ...char2.sourceTypes])],
      routerCount: Math.max(char1.routerCount, char2.routerCount),
      interfaceCount: Math.max(char1.interfaceCount, char2.interfaceCount),
      actionTypes: [...new Set([...char1.actionTypes, ...char2.actionTypes])],
      ospfConfig: char1.ospfConfig,
      networkTopology: char1.networkTopology,
      routingPolicies: char1.routingPolicies,
      trafficFlow: char1.trafficFlow
    };
  }

  // 合并IP范围
  mergeIPRanges(range1, range2) {
    return {
      start: this.getMinIP(range1.start, range2.start),
      end: this.getMaxIP(range1.end, range2.end)
    };
  }

  // 获取较小的IP地址
  getMinIP(ip1, ip2) {
    const parts1 = ip1.split('.').map(Number);
    const parts2 = ip2.split('.').map(Number);
    
    for (let i = 0; i < 4; i++) {
      if (parts1[i] < parts2[i]) return ip1;
      if (parts1[i] > parts2[i]) return ip2;
    }
    return ip1;
  }

  // 获取较大的IP地址
  getMaxIP(ip1, ip2) {
    const parts1 = ip1.split('.').map(Number);
    const parts2 = ip2.split('.').map(Number);
    
    for (let i = 0; i < 4; i++) {
      if (parts1[i] > parts2[i]) return ip1;
      if (parts1[i] < parts2[i]) return ip2;
    }
    return ip1;
  }

  // 根据 IP 地址查找对应的 PEC
  findPECForIP(ip, trieTree) {
    const longestMatch = trieTree.getLongestMatch(ip);
    if (!longestMatch) {
      return null;
    }
    
    // 找到对应的 PEC
    return this.pecs.find(pec => pec.prefix === longestMatch.prefix);
  }

  // 获取 PEC 统计信息 - 增强版本
  getPECStats() {
    const stats = {
      totalPECs: this.pecs.length,
      prefixLengthDistribution: {},
      sourceTypeDistribution: {},
      routerDistribution: {},
      typeDistribution: {},
      ospfConfigDistribution: {}
    };

    this.pecs.forEach(pec => {
      // 前缀长度分布
      const length = pec.characteristics.prefixLength;
      stats.prefixLengthDistribution[length] = (stats.prefixLengthDistribution[length] || 0) + 1;
      
      // 来源类型分布
      pec.characteristics.sourceTypes.forEach(type => {
        stats.sourceTypeDistribution[type] = (stats.sourceTypeDistribution[type] || 0) + 1;
      });
      
      // 路由器分布
      if (pec.origin) {
        stats.routerDistribution[pec.origin] = (stats.routerDistribution[pec.origin] || 0) + 1;
      }
      
      // PEC类型分布
      stats.typeDistribution[pec.type] = (stats.typeDistribution[pec.type] || 0) + 1;
      
      // OSPF配置分布
      if (pec.characteristics.ospfConfig.origin) {
        const origin = pec.characteristics.ospfConfig.origin;
        stats.ospfConfigDistribution[origin] = (stats.ospfConfigDistribution[origin] || 0) + 1;
      }
    });

    return stats;
  }

  // 导出 PEC 数据 - 增强版本
  exportPECs(format = 'json') {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(this.pecs, null, 2);
      case 'csv':
        return this.convertToCSV();
      case 'txt':
        return this.convertToText();
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // 转换为 CSV 格式 - 增强版本
  convertToCSV() {
    if (this.pecs.length === 0) return '';
    
    const headers = ['ID', 'Prefix', 'Type', 'Prefix Length', 'Source Types', 'Origin', 'IP Range', 'Description'];
    const rows = this.pecs.map(pec => [
      pec.id,
      pec.prefix,
      pec.type,
      pec.characteristics.prefixLength,
      pec.characteristics.sourceTypes.join(';'),
      pec.origin || 'N/A',
      `${pec.ipRange.start}-${pec.ipRange.end}`,
      pec.description
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  }

  // 转换为文本格式 - 增强版本
  convertToText() {
    if (this.pecs.length === 0) return 'No PECs found.';
    
    let text = 'Packet Equivalence Classes (PECs)\n';
    text += '=====================================\n\n';
    
    this.pecs.forEach(pec => {
      text += `PEC ${pec.id}: ${pec.prefix} (${pec.type})\n`;
      text += `  Prefix Length: ${pec.characteristics.prefixLength} bits\n`;
      text += `  IP Range: ${pec.ipRange.start} - ${pec.ipRange.end}\n`;
      text += `  Source Types: ${pec.characteristics.sourceTypes.join(', ')}\n`;
      text += `  Origin: ${pec.origin || 'N/A'}\n`;
      text += `  OSPF Config: ${JSON.stringify(pec.characteristics.ospfConfig)}\n`;
      text += `  Description: ${pec.description}\n`;
      text += '\n';
    });
    
    return text;
  }

  // 验证 PEC 完整性 - 增强版本
  validatePECs() {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    this.pecs.forEach((pec, index) => {
      // 检查前缀格式
      if (!this.isValidPrefix(pec.prefix)) {
        validation.isValid = false;
        validation.errors.push(`PEC ${index + 1}: Invalid prefix format: ${pec.prefix}`);
      }
      
      // 检查来源信息
      if (!pec.sources || pec.sources.length === 0) {
        validation.warnings.push(`PEC ${index + 1}: No source information`);
      }
      
      // 检查路径长度一致性
      if (pec.binaryPath.length !== pec.characteristics.prefixLength) {
        validation.isValid = false;
        validation.errors.push(`PEC ${index + 1}: Path length mismatch`);
      }
      
      // 检查IP范围一致性
      if (pec.ipRange && pec.ipRange.start && pec.ipRange.end) {
        if (!this.isValidIPRange(pec.ipRange)) {
          validation.warnings.push(`PEC ${index + 1}: Invalid IP range`);
        }
      }
    });

    return validation;
  }

  // 验证IP范围
  isValidIPRange(range) {
    if (!range.start || !range.end) return false;
    
    const startParts = range.start.split('.').map(Number);
    const endParts = range.end.split('.').map(Number);
    
    for (let i = 0; i < 4; i++) {
      if (startParts[i] > endParts[i]) return false;
      if (startParts[i] < endParts[i]) return true;
    }
    
    return true;
  }

  // 验证前缀格式
  isValidPrefix(prefix) {
    const prefixRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
    if (!prefixRegex.test(prefix)) return false;
    
    const [, mask] = prefix.split('/');
    const maskNum = parseInt(mask);
    return maskNum >= 0 && maskNum <= 32;
  }
}

module.exports = { PECExtractor };
