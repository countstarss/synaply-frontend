import { readdirSync } from 'fs';
import { join } from 'path';

/**
 * 合并指定语言的所有翻译文件
 * @param locale 语言代码 (如: 'en', 'zh', 'ko', 'ja')
 * @returns 合并后的翻译对象
 */
export async function mergeMessages(locale: string) {
  try {
    // 动态导入所有该语言下的 JSON 文件
    const commonMessages = await import(`../../messages/${locale}/common.json`);
    const navMessages = await import(`../../messages/${locale}/nav.json`);
    const authMessages = await import(`../../messages/${locale}/auth.json`);
    const homeMessages = await import(`../../messages/${locale}/home.json`);
    const dashboardMessages = await import(`../../messages/${locale}/dashboard.json`);
    const languageMessages = await import(`../../messages/${locale}/language.json`);

    // 合并所有消息文件
    return {
      common: commonMessages.default,
      nav: navMessages.default,
      auth: authMessages.default,
      home: homeMessages.default,
      dashboard: dashboardMessages.default,
      language: languageMessages.default
    };
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    throw error;
  }
}

/**
 * 自动发现并合并指定语言目录下的所有 JSON 文件
 * 这个版本可以自动发现新添加的 JSON 文件，无需手动更新代码
 * @param locale 语言代码
 * @returns 合并后的翻译对象
 */
export async function mergeMessagesAuto(locale: string) {
  try {
    const messagesDir = join(process.cwd(), 'messages', locale);
    const files = readdirSync(messagesDir).filter(file => file.endsWith('.json'));
    
    const messages: Record<string, Record<string, unknown>> = {};
    
    for (const file of files) {
      const moduleName = file.replace('.json', '');
      const moduleMessages = await import(`../../messages/${locale}/${file}`);
      messages[moduleName] = moduleMessages.default;
    }
    
    return messages;
  } catch (error) {
    console.error(`Failed to auto-load messages for locale: ${locale}`, error);
    // 如果自动加载失败，回退到手动加载
    return mergeMessages(locale);
  }
} 