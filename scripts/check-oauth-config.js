// 飞书 OAuth 配置检查脚本
// 运行：node scripts/check-oauth-config.js

const APP_ID = 'cli_a9cfd8bf1e785cd3';
const REDIRECT_URI = 'http://localhost:3000/api/auth/callback';

console.log('=== 飞书 OAuth 配置检查 ===\n');

console.log('📋 你的应用信息：');
console.log(`   App ID: ${APP_ID}`);
console.log(`   重定向 URL: ${REDIRECT_URI}\n`);

console.log('✅ 请按以下步骤在飞书开放平台配置：\n');

console.log('【步骤 1】访问飞书开放平台');
console.log('   https://open.feishu.cn/app\n');

console.log('【步骤 2】找到你的应用');
console.log(`   搜索或找到 App ID 为 ${APP_ID} 的应用，点击进入\n`);

console.log('【步骤 3】配置重定向 URL');
console.log('   路径：左侧菜单 → 安全设置 → 重定向 URL');
console.log(`   点击「添加」，输入：${REDIRECT_URI}`);
console.log('   点击「确认」保存\n');

console.log('【步骤 4】开通权限');
console.log('   路径：左侧菜单 → 权限管理');
console.log('   搜索并开通以下权限：');
console.log('   ✓ drive:drive:readonly (查看云空间文件)');
console.log('   ✓ bitable:app:readonly (查看多维表格)');
console.log('   可选（用于完整功能）：');
console.log('   ✓ bitable:app:read_write (读写多维表格)');
console.log('   ✓ bitable:record:read_write (读写记录)\n');

console.log('【步骤 5】创建测试版本');
console.log('   路径：左侧菜单 → 版本管理与发布');
console.log('   点击「创建版本」→ 填写版本号和说明');
console.log('   保存后申请发布测试版\n');

console.log('【步骤 6】添加测试用户');
console.log('   在测试版本详情中，添加你的飞书账号为测试用户\n');

console.log('=== 配置完成后 ===');
console.log('1. 重新访问 http://localhost:3001');
console.log('2. 点击「使用飞书账号授权登录」');
console.log('3. 使用已添加为测试用户的飞书账号登录');
console.log('4. 授权成功后即可获取多维表格列表\n');
