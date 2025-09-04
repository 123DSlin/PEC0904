const fs = require('fs').promises;

class ConfigParser {
  constructor() {
    this.parsers = {
      'cisco': this.parseCiscoConfig.bind(this),
      'juniper': this.parseJuniperConfig.bind(this),
      'huawei': this.parseHuaweiConfig.bind(this),
      'arista': this.parseAristaConfig.bind(this)
    };
  }

  // 主解析方法
  async parseFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n');
      
      // 自动检测配置类型
      const configType = this.detectConfigType(lines);
      const parser = this.parsers[configType];
      
      if (!parser) {
        throw new Error(`Unsupported configuration type: ${configType}`);
      }
      
      return parser(lines);
    } catch (error) {
      throw new Error(`Failed to parse configuration file: ${error.message}`);
    }
  }

  // 检测配置文件类型
  detectConfigType(lines) {
    const firstLines = lines.slice(0, 10).join('\n').toLowerCase();
    
    if (firstLines.includes('version') && firstLines.includes('hostname')) {
      return 'cisco';
    } else if (firstLines.includes('version') && firstLines.includes('system')) {
      return 'juniper';
    } else if (firstLines.includes('sysname') || firstLines.includes('display')) {
      return 'huawei';
    } else if (firstLines.includes('!') && firstLines.includes('hostname')) {
      return 'arista';
    }
    
    // 默认为 Cisco 格式
    return 'cisco';
  }

  // 解析 Cisco 配置
  parseCiscoConfig(lines) {
    const config = {
      hostname: '',
      staticRoutes: [],
      accessLists: [],
      prefixLists: [],
      interfaces: [],
      bgpNetworks: [],
      namedAcls: [] // 新增：命名 ACL
    };

    let currentSection = '';
    let currentAcl = null;
    let currentNamedAcl = null;
    let currentPrefixList = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('hostname ')) {
        config.hostname = line.replace('hostname ', '').trim();
      }
      
      // 静态路由
      else if (line.startsWith('ip route ')) {
        const routeMatch = line.match(/ip route (\S+) (\S+) (\S+)(?:\s+(\S+))?/);
        if (routeMatch) {
          config.staticRoutes.push({
            prefix: `${routeMatch[1]}/${this.ipToMask(routeMatch[2])}`,
            mask: routeMatch[2],
            interface: routeMatch[3],
            nextHop: routeMatch[4] || null
          });
        }
      }
      
      // BGP 网络宣告
      else if (line.includes('network ') && line.includes('mask ')) {
        const networkMatch = line.match(/network (\S+) mask (\S+)/);
        if (networkMatch) {
          config.bgpNetworks.push({
            prefix: `${networkMatch[1]}/${this.ipToMask(networkMatch[2])}`,
            mask: networkMatch[2]
          });
        }
      }
      
      // 命名访问控制列表 (新增) - 支持多种格式
      else if (line.startsWith('ip access-list ')) {
        // 处理两种格式：
        // 1. ip access-list BLOCK_R1_NETWORK2_IN (标准命名 ACL)
        // 2. ip access-list extended BLOCK_R1_NETWORK2_IN (扩展命名 ACL)
        let namedAclMatch = line.match(/ip access-list (\w+)(?:\s+(\w+))?/);
        if (namedAclMatch) {
          let aclName, aclType;
          
          if (namedAclMatch[1] === 'extended') {
            // 格式: ip access-list extended BLOCK_R1_NETWORK2_IN
            aclName = namedAclMatch[2];  // 第二个匹配组是 ACL 名称
            aclType = 'extended';
          } else {
            // 格式: ip access-list BLOCK_R1_NETWORK2_IN
            aclName = namedAclMatch[1];  // 第一个匹配组是 ACL 名称
            aclType = namedAclMatch[2] || 'UNSPECIFIED';
          }
          
          // 创建 ACL 对象
          if (aclType === 'extended') {
            currentNamedAcl = {
              name: aclName,
              direction: 'extended',
              type: 'extended',
              rules: [],
              description: this.extractAclDescription(aclName)
            };
          } else {
            currentNamedAcl = {
              name: aclName,
              direction: aclType || 'UNSPECIFIED',
              type: 'standard',
              rules: [],
              description: this.extractAclDescription(aclName)
            };
          }
          config.namedAcls.push(currentNamedAcl);
        }
      }
      
      // 标准访问控制列表 (数字格式)
      else if (line.startsWith('access-list ') && !line.includes(' extended')) {
        const aclMatch = line.match(/access-list (\d+) (\w+) (\S+)(?:\s+(\S+))?/);
        if (aclMatch) {
          config.accessLists.push({
            number: aclMatch[1],
            action: aclMatch[2],
            prefix: this.parseAclPrefix(aclMatch[3]),
            wildcard: aclMatch[4] || null,
            type: 'standard'
          });
        }
      }
      
      // 扩展访问控制列表 (数字格式)
      else if (line.startsWith('access-list ') && line.includes(' extended')) {
        const extendedAclMatch = line.match(/access-list (\d+) extended/);
        if (extendedAclMatch) {
          currentAcl = {
            number: extendedAclMatch[1],
            type: 'extended',
            rules: []
          };
          config.accessLists.push(currentAcl);
        }
      }
      
      // 命名 ACL 规则 (新增)
      else if (currentNamedAcl && (line.startsWith('permit ') || line.startsWith('deny '))) {
        // 重置 currentAcl，避免与命名 ACL 冲突
        currentAcl = null;
        const rule = this.parseNamedAclRule(line);
        if (rule) {
          currentNamedAcl.rules.push(rule);
        }
      }
      
      // 标准访问控制列表
      else if (line.startsWith('access-list ')) {
        const aclMatch = line.match(/access-list (\d+) (\w+) (\S+)(?:\s+(\S+))?/);
        if (aclMatch) {
          config.accessLists.push({
            number: aclMatch[1],
            action: aclMatch[2],
            prefix: this.parseAclPrefix(aclMatch[3]),
            wildcard: aclMatch[4] || null,
            type: 'standard'
          });
        }
      }
      
      // 扩展访问控制列表
      else if (line.startsWith('access-list ') && line.includes(' extended')) {
        const extendedAclMatch = line.match(/access-list (\d+) extended/);
        if (extendedAclMatch) {
          currentAcl = {
            number: extendedAclMatch[1],
            type: 'extended',
            rules: []
          };
          config.accessLists.push(currentAcl);
        }
      }
      
      // 扩展 ACL 规则
      else if (currentAcl && (line.startsWith('permit ') || line.startsWith('deny '))) {
        const rule = this.parseExtendedAclRule(line);
        if (rule) {
          currentAcl.rules.push(rule);
        }
      }
      
      // 前缀列表
      else if (line.startsWith('ip prefix-list ')) {
        const prefixMatch = line.match(/ip prefix-list (\S+) (\w+) (\S+)/);
        if (prefixMatch) {
          config.prefixLists.push({
            name: prefixMatch[1],
            action: prefixMatch[2],
            prefix: prefixMatch[3]
          });
        }
      }
      
      // 接口配置
      else if (line.startsWith('interface ')) {
        const interfaceMatch = line.match(/interface (\S+)/);
        if (interfaceMatch) {
          currentSection = 'interface';
          const interfaceName = interfaceMatch[1];
          let interfaceConfig = { 
            name: interfaceName, 
            ipAddress: null,
            appliedAcls: [] // 新增：应用的 ACL 列表
          };
          
          // 查找接口的 IP 地址和 ACL 配置
          for (let j = i + 1; j < lines.length; j++) {
            const nextLine = lines[j].trim();
            if (nextLine.startsWith('interface ') || nextLine === '!') {
              break;
            }
            if (nextLine.startsWith('ip address ')) {
              const ipMatch = nextLine.match(/ip address (\S+) (\S+)/);
              if (ipMatch) {
                interfaceConfig.ipAddress = `${ipMatch[1]}/${this.ipToMask(ipMatch[2])}`;
              }
            }
            // 新增：解析 ACL 应用配置
            else if (nextLine.startsWith('ip access-group ')) {
              const aclMatch = nextLine.match(/ip access-group (\S+) (\w+)/);
              if (aclMatch) {
                interfaceConfig.appliedAcls.push({
                  aclName: aclMatch[1],
                  direction: aclMatch[2] // 'in' 或 'out'
                });
              }
            }
          }
          
          if (interfaceConfig.ipAddress) {
            config.interfaces.push(interfaceConfig);
          }
        }
      }
    }

    return config;
  }

  // 解析命名 ACL 规则 (新增) - 重新设计，支持多种格式
  parseNamedAclRule(line) {
    console.log(`Debug: Parsing ACL rule: ${line}`); // 调试信息
    
    // 1. 先按空格分割，获取所有参数（忽略注释）
    const parts = line.trim().split(/\s+/).filter(part => 
      part !== '!' && 
      !part.startsWith('!') && 
      !part.startsWith('src:') && 
      !part.startsWith('dst:') &&
      !part.endsWith(';') &&
      !part.includes('/') // 过滤掉包含 '/' 的注释部分
    );
    
    // 2. 去重，保留第一个出现的 'any'
    const uniqueParts = [];
    const seenAny = new Set();
    for (const part of parts) {
      if (part === 'any') {
        if (!seenAny.has('any')) {
          uniqueParts.push(part);
          seenAny.add('any');
        }
      } else {
        uniqueParts.push(part);
      }
    }
    
    console.log(`Debug: Parsed parts: [${uniqueParts.join(', ')}]`);
    
    if (uniqueParts.length < 3) return null;
    
    const [action, protocol, ...addressParts] = uniqueParts;
    
    // 3. 根据参数数量识别规则类型
    if (addressParts.length === 2) {
      // 格式: permit ip any any
      return this.parseSimpleRule(action, protocol, addressParts);
    } else if (addressParts.length === 3) {
      // 格式: deny ip 160.0.0.0 31.255.255.255 any
      // 或者: deny ip any 160.0.0.0 31.255.255.255
      return this.parseComplexRule(action, protocol, addressParts);
    }
    
    return null;
  }
  
  // 解析简单规则: permit ip any any
  parseSimpleRule(action, protocol, [source, destination]) {
    const rule = {
      action: action,
      protocol: protocol,
      source: this.parseAclAddress(source),
      destination: this.parseAclAddress(destination),
      line: `${action} ${protocol} ${source} ${destination}`.trim()
    };
    
    console.log(`Debug: Simple rule:`, rule);
    return rule;
  }
  
  // 解析复杂规则: 包含通配符掩码
  parseComplexRule(action, protocol, [first, second, third]) {
    let sourceAddress, destinationAddress;
    
    // 判断第一个地址是源地址还是目标地址
    if (first === 'any') {
      // 格式: deny ip any 160.0.0.0 31.255.255.255
      // first = any (源地址)
      // second = 160.0.0.0 (目标地址)
      // third = 31.255.255.255 (目标地址通配符掩码)
      sourceAddress = { type: 'any', value: '0.0.0.0/0' };
      destinationAddress = this.parseWildcardAddress(second, third);
      console.log(`Debug: Complex rule (any source): source=${first}, dest=${second} ${third} -> ${JSON.stringify(destinationAddress)}`);
    } else {
      // 格式: deny ip 160.0.0.0 31.255.255.255 any
      // first = 160.0.0.0 (源地址)
      // second = 31.255.255.255 (源地址通配符掩码)
      // third = any (目标地址)
      sourceAddress = this.parseWildcardAddress(first, second);
      destinationAddress = this.parseAclAddress(third);
      console.log(`Debug: Complex rule (any dest): source=${first} ${second} -> ${JSON.stringify(sourceAddress)}, dest=${third}`);
    }
    
    const rule = {
      action: action,
      protocol: protocol,
      source: sourceAddress,
      destination: destinationAddress,
      line: `${action} ${protocol} ${first} ${second} ${third}`.trim()
    };
    
    console.log(`Debug: Complex rule:`, rule);
    return rule;
  }

  // 解析扩展 ACL 规则 (新增)
  parseExtendedAclRule(line) {
    const ruleMatch = line.match(/(permit|deny) (\S+)(?:\s+(\S+))?(?:\s+(\S+))?(?:\s+(\S+))?/);
    if (ruleMatch) {
      const [_, action, protocol, source, destination, options] = ruleMatch;
      
      return {
        action: action,
        protocol: protocol,
        source: source ? this.parseAclAddress(source) : null,
        destination: destination ? this.parseAclAddress(destination) : null,
        options: options || null,
        line: line.trim()
      };
    }
    return null;
  }

  // 解析 ACL 地址 (新增)
  parseAclAddress(address) {
    if (address === 'any') {
      return { type: 'any', value: '0.0.0.0/0' };
    } else if (address === 'host') {
      return { type: 'host', value: null }; // 需要下一行
    } else if (address.includes('/')) {
      return { type: 'prefix', value: address };
    } else if (this.isValidIP(address)) {
      return { type: 'ip', value: address };
    } else {
      return { type: 'unknown', value: address };
    }
  }

  // 解析通配符地址 (新增) - 改进版本
  parseWildcardAddress(ip, wildcard) {
    if (!ip || !wildcard) return null;
    
    try {
      const ipParts = ip.split('.').map(part => parseInt(part));
      const wildcardParts = wildcard.split('.').map(part => parseInt(part));
      
      // 计算网络地址
      const networkParts = ipParts.map((ipPart, i) => ipPart & ~wildcardParts[i]);
      
      // 计算 CIDR 掩码长度
      let cidrLength = 32;
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 8; j++) {
          if (wildcardParts[i] & (1 << (7 - j))) {
            cidrLength--;
          }
        }
      }
      
      // 验证 CIDR 长度
      if (cidrLength < 0 || cidrLength > 32) {
        console.log(`Warning: Invalid CIDR length ${cidrLength} for wildcard ${wildcard}`);
        return { type: 'unknown', value: `${ip} ${wildcard}` };
      }
      
      const cidrPrefix = `${networkParts.join('.')}/${cidrLength}`;
      console.log(`Debug: Wildcard ${ip} ${wildcard} -> CIDR ${cidrPrefix}`);
      return { type: 'prefix', value: cidrPrefix };
    } catch (error) {
      console.log(`Error parsing wildcard: ${ip} ${wildcard}`, error);
      return { type: 'unknown', value: `${ip} ${wildcard}` };
    }
  }

  // 提取 ACL 描述信息 (新增)
  extractAclDescription(aclName) {
    // 根据 ACL 名称推断其用途
    const descriptions = {
      'BLOCK_R1_NETWORK2_IN': 'Block incoming traffic from R1 Network2',
      'BLOCK_R1_NETWORK2_OUT': 'Block outgoing traffic to R1 Network2',
      'PERMIT_TRUSTED_IN': 'Permit incoming traffic from trusted sources',
      'DENY_UNTRUSTED_IN': 'Deny incoming traffic from untrusted sources'
    };
    
    return descriptions[aclName] || `Access Control List: ${aclName}`;
  }

  // 解析 Juniper 配置
  parseJuniperConfig(lines) {
    // 基础实现，可以根据需要扩展
    return {
      hostname: 'juniper-router',
      staticRoutes: [],
      accessLists: [],
      prefixLists: [],
      interfaces: [],
      bgpNetworks: [],
      namedAcls: []
    };
  }

  // 解析华为配置
  parseHuaweiConfig(lines) {
    // 基础实现，可以根据需要扩展
    return {
      hostname: 'huawei-router',
      staticRoutes: [],
      accessLists: [],
      prefixLists: [],
      interfaces: [],
      bgpNetworks: [],
      namedAcls: []
    };
  }

  // 解析 Arista 配置
  parseAristaConfig(lines) {
    // 基础实现，可以根据需要扩展
    return {
      hostname: 'arista-router',
      staticRoutes: [],
      accessLists: [],
      prefixLists: [],
      interfaces: [],
      bgpNetworks: [],
      namedAcls: []
    };
  }

  // 将子网掩码转换为 CIDR 格式
  ipToMask(mask) {
    if (mask.includes('.')) {
      // 已经是点分十进制格式，转换为 CIDR
      const octets = mask.split('.').map(octet => parseInt(octet));
      let cidr = 0;
      for (let octet of octets) {
        cidr += octet.toString(2).split('1').length - 1;
      }
      return cidr;
    }
    return mask;
  }

  // 解析 ACL 前缀
  parseAclPrefix(prefix) {
    if (prefix === 'any') {
      return '0.0.0.0/0';
    } else if (prefix === 'host') {
      return '32'; // 需要结合下一行
    }
    return prefix;
  }

  // 验证 IP 地址格式
  isValidIP(ip) {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) return false;
    
    const parts = ip.split('.').map(part => parseInt(part));
    return parts.every(part => part >= 0 && part <= 255);
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

module.exports = { ConfigParser };
