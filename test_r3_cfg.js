const { ConfigParser } = require('./src/configParser');

async function testR3Config() {
  try {
    const configParser = new ConfigParser();
    const config = await configParser.parseFile('example_r3_config.cfg');
    
    console.log('=== r3.cfg 解析测试 ===');
    console.log(`主机名: ${config.hostname}`);
    console.log(`命名 ACL 数量: ${config.namedAcls.length}`);
    
    config.namedAcls.forEach((acl, index) => {
      console.log(`\n${index + 1}. ACL 名称: "${acl.name}"`);
      console.log(`   类型: "${acl.type}"`);
      console.log(`   方向: "${acl.direction}"`);
      console.log(`   描述: "${acl.description}"`);
      console.log(`   规则数量: ${acl.rules.length}`);
      
      acl.rules.forEach((rule, ruleIndex) => {
        console.log(`   ${ruleIndex + 1}. ${rule.action} ${rule.protocol}`);
        console.log(`      源: ${JSON.stringify(rule.source)}`);
        console.log(`      目标: ${JSON.stringify(rule.destination)}`);
        console.log(`      原始行: ${rule.line}`);
      });
    });
    
    // 检查是否有错误的 "extended" 名称
    const hasExtendedName = config.namedAcls.some(acl => acl.name === 'extended');
    console.log(`\n是否有错误的 'extended' 名称: ${hasExtendedName}`);
    
    if (hasExtendedName) {
      console.log('❌ 解析仍然有问题！');
    } else {
      console.log('✅ 解析成功！');
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testR3Config();
