class PECExtractor {
  constructor() {
    this.pecs = [];
    this.currentPec = null;
  }

  // 提取所有 PEC
  extractPECs(trieTree) {
    this.pecs = [];
    this.currentPec = null;
    
    // 深度优先遍历 Trie 树
    this.dfsTraverse(trieTree.root, []);
    
    return this.pecs;
  }

  // 深度优先遍历
  dfsTraverse(node, path) {
    // 如果当前节点是前缀结束节点，创建一个新的 PEC
    if (node.isEndOfPrefix) {
      this.createPEC(node, path);
    }
    
    // 递归遍历子节点
    for (const [bit, child] of node.children) {
      this.dfsTraverse(child, [...path, bit]);
    }
  }

  // 创建 PEC
  createPEC(node, path) {
    const pec = {
      id: this.pecs.length + 1,
      prefix: node.prefix,
      binaryPath: path,
      sources: node.sources,
      characteristics: this.analyzePECCharacteristics(node, path),
      description: this.generatePECDescription(node, path)
    };
    
    this.pecs.push(pec);
  }

  // 分析 PEC 特征
  analyzePECCharacteristics(node, path) {
    const characteristics = {
      prefixLength: path.length,
      sourceTypes: new Set(),
      routerCount: new Set(),
      interfaceCount: new Set(),
      actionTypes: new Set()
    };

    // 分析来源信息
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

    return {
      prefixLength: characteristics.prefixLength,
      sourceTypes: Array.from(characteristics.sourceTypes),
      routerCount: characteristics.routerCount.size,
      interfaceCount: characteristics.interfaceCount.size,
      actionTypes: Array.from(characteristics.actionTypes)
    };
  }

  // 生成 PEC 描述
  generatePECDescription(node, path) {
    const prefix = node.prefix;
    const sources = node.sources;
    
    let description = `PEC for prefix ${prefix} (${path.length} bits)`;
    
    if (sources.length > 0) {
      const sourceTypes = [...new Set(sources.map(s => s.type))];
      description += ` with ${sourceTypes.join(', ')} configuration`;
      
      if (sources[0].router) {
        description += ` from router ${sources[0].router}`;
      }
    }
    
    return description;
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

  // 获取 PEC 统计信息
  getPECStats() {
    const stats = {
      totalPECs: this.pecs.length,
      prefixLengthDistribution: {},
      sourceTypeDistribution: {},
      routerDistribution: {}
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
      if (pec.sources[0] && pec.sources[0].router) {
        const router = pec.sources[0].router;
        stats.routerDistribution[router] = (stats.routerDistribution[router] || 0) + 1;
      }
    });

    return stats;
  }

  // 导出 PEC 数据
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

  // 转换为 CSV 格式
  convertToCSV() {
    if (this.pecs.length === 0) return '';
    
    const headers = ['ID', 'Prefix', 'Prefix Length', 'Source Types', 'Router', 'Description'];
    const rows = this.pecs.map(pec => [
      pec.id,
      pec.prefix,
      pec.characteristics.prefixLength,
      pec.characteristics.sourceTypes.join(';'),
      pec.sources[0]?.router || 'N/A',
      pec.description
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  }

  // 转换为文本格式
  convertToText() {
    if (this.pecs.length === 0) return 'No PECs found.';
    
    let text = 'Packet Equivalence Classes (PECs)\n';
    text += '=====================================\n\n';
    
    this.pecs.forEach(pec => {
      text += `PEC ${pec.id}: ${pec.prefix}\n`;
      text += `  Prefix Length: ${pec.characteristics.prefixLength} bits\n`;
      text += `  Source Types: ${pec.characteristics.sourceTypes.join(', ')}\n`;
      text += `  Router: ${pec.sources[0]?.router || 'N/A'}\n`;
      text += `  Description: ${pec.description}\n`;
      text += '\n';
    });
    
    return text;
  }

  // 验证 PEC 完整性
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
    });

    return validation;
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
