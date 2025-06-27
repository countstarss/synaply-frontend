// 简单的验证脚本来测试新的 i18n 模块化结构
import { mergeMessages } from '../src/i18n/merge-messages.js';

async function testI18nModules() {
  const locales = ['en', 'zh', 'ko', 'ja'];

  console.log('🧪 测试新的 i18n 模块化结构...\n');

  for (const locale of locales) {
    console.log(`📋 测试语言: ${locale}`);

    try {
      const messages = await mergeMessages(locale);

      // 检查是否包含所有预期的模块
      const expectedModules = ['common', 'nav', 'auth', 'home', 'dashboard', 'language'];
      const actualModules = Object.keys(messages);

      console.log(`   ✅ 加载成功，包含模块: ${actualModules.join(', ')}`);

      // 检查是否有缺失的模块
      const missingModules = expectedModules.filter(module => !actualModules.includes(module));
      if (missingModules.length > 0) {
        console.log(`   ⚠️  缺失模块: ${missingModules.join(', ')}`);
      }

      // 检查每个模块是否有内容
      for (const moduleName of actualModules) {
        const keys = Object.keys(messages[moduleName]);
        console.log(`   📝 ${moduleName}: ${keys.length} 个翻译键`);
      }

    } catch (error) {
      console.log(`   ❌ 加载失败: ${error.message}`);
    }

    console.log('');
  }

  console.log('✅ 测试完成！');
}

testI18nModules().catch(console.error); 