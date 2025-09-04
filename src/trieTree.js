class TrieNode {
  constructor() {
    this.children = new Map(); // 0 或 1
    this.isEndOfPrefix = false;
    this.prefix = null;
    this.sources = []; // 存储前缀来源信息
    this.bitPosition = 0; // 当前位位置
    this.weights = new Map(); // 存储路由权重信息 (新增)
    this.origin = null; // 存储前缀来源路由器 (新增)
  }
}

class TrieTree {
  constructor() {
    this.root = new TrieNode();
    this.prefixCount = 0;
    this.networkTopology = new Map(); // 存储网络拓扑信息 (新增)
  }

  // 设置网络拓扑信息
  setNetworkTopology(topology) {
    this.networkTopology = topology;
  }

  // 将 IP 前缀转换为二进制位数组
  prefixToBits(prefix) {
    const [ip, mask] = prefix.split('/');
    const maskLength = parseInt(mask);
    
    // 将 IP 地址转换为 32 位二进制
    const ipParts = ip.split('.').map(part => parseInt(part));
    let binary = '';
    
    for (let part of ipParts) {
      binary += part.toString(2).padStart(8, '0');
    }
    
    // 只取前 maskLength 位
    return binary.substring(0, maskLength).split('').map(bit => parseInt(bit));
  }

  // 插入前缀到 Trie 树
  insert(prefix, sourceInfo) {
    const bits = this.prefixToBits(prefix);
    let current = this.root;
    
    for (let i = 0; i < bits.length; i++) {
      const bit = bits[i];
      
      if (!current.children.has(bit)) {
        current.children.set(bit, new TrieNode());
        current.children.get(bit).bitPosition = i + 1;
      }
      
      current = current.children.get(bit);
    }
    
    // 标记为前缀结束节点
    current.isEndOfPrefix = true;
    current.prefix = prefix;
    current.sources.push(sourceInfo);
    
    // 设置前缀来源路由器 (新增)
    if (sourceInfo.router) {
      current.origin = sourceInfo.router;
    }
    
    // 计算并设置路由权重 (新增)
    this.calculateWeights(current, bits);
    
    this.prefixCount++;
  }

  // 计算路由权重 (修复版本)
  calculateWeights(node, path) {
    if (this.networkTopology.size === 0) return;
    
    const weights = new Map();
    
    // 基于实际网络拓扑计算权重
    for (const [router, connections] of this.networkTopology) {
      const weight = this.calculatePathWeight(router, path);
      weights.set(router, weight);
    }
    
    node.weights = weights;
  }

  // 计算到指定路由器的路径权重
  calculatePathWeight(targetRouter, path) {
    if (!this.networkTopology.has(targetRouter)) {
      return Infinity; // 无法到达
    }
    
    // 基于网络拓扑计算最短路径权重
    // 这里实现一个简化的Dijkstra算法
    return this.dijkstraShortestPath(targetRouter, path);
  }

  // 简化的Dijkstra最短路径算法
  dijkstraShortestPath(targetRouter, path) {
    // 简化版本：直接返回网络拓扑中的连接成本
    if (this.networkTopology.has(targetRouter)) {
      const connections = this.networkTopology.get(targetRouter);
      // 返回到其他路由器的平均成本
      let totalCost = 0;
      let connectionCount = 0;
      
      for (const [neighbor, cost] of connections) {
        totalCost += cost;
        connectionCount++;
      }
      
      if (connectionCount > 0) {
        return Math.round(totalCost / connectionCount);
      }
    }
    
    return 10; // 默认权重
  }

  // 查找前缀
  search(prefix) {
    const bits = this.prefixToBits(prefix);
    let current = this.root;
    
    for (let bit of bits) {
      if (!current.children.has(bit)) {
        return null;
      }
      current = current.children.get(bit);
    }
    
    return current.isEndOfPrefix ? current : null;
  }

  // 获取最长匹配前缀
  getLongestMatch(ip) {
    const bits = this.ipToBits(ip);
    let current = this.root;
    let longestMatch = null;
    
    for (let i = 0; i < bits.length; i++) {
      const bit = bits[i];
      
      if (!current.children.has(bit)) {
        break;
      }
      
      current = current.children.get(bit);
      
      if (current.isEndOfPrefix) {
        longestMatch = current;
      }
    }
    
    return longestMatch;
  }

  // 将 IP 地址转换为二进制位数组
  ipToBits(ip) {
    const ipParts = ip.split('.').map(part => parseInt(part));
    let binary = '';
    
    for (let part of ipParts) {
      binary += part.toString(2).padStart(8, '0');
    }
    
    return binary.split('').map(bit => parseInt(bit));
  }

  // 深度优先遍历
  traverse(callback, node = this.root, path = []) {
    if (node.isEndOfPrefix) {
      callback(node, path);
    }
    
    for (const [bit, child] of node.children) {
      this.traverse(callback, child, [...path, bit]);
    }
  }

  // 获取所有前缀
  getAllPrefixes() {
    const prefixes = [];
    this.traverse((node) => {
      prefixes.push({
        prefix: node.prefix,
        sources: node.sources,
        bitPosition: node.bitPosition,
        origin: node.origin,
        weights: node.weights
      });
    });
    return prefixes;
  }

  // 获取 Trie 树的可视化数据
  getTreeData() {
    const treeData = [];
    
    const buildNodeData = (node, path = []) => {
      const nodeData = {
        bitPosition: node.bitPosition,
        isEndOfPrefix: node.isEndOfPrefix,
        prefix: node.prefix,
        sources: node.sources,
        origin: node.origin,
        weights: node.weights,
        children: []
      };
      
      for (const [bit, child] of node.children) {
        nodeData.children.push({
          bit,
          node: buildNodeData(child, [...path, bit])
        });
      }
      
      return nodeData;
    };
    
    return buildNodeData(this.root);
  }

  // 获取统计信息
  getStats() {
    return {
      totalPrefixes: this.prefixCount,
      totalNodes: this.countNodes(this.root)
    };
  }

  countNodes(node) {
    let count = 1;
    for (const child of node.children.values()) {
      count += this.countNodes(child);
    }
    return count;
  }
}

module.exports = { TrieTree };
