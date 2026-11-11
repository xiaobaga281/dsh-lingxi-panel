/**
 * 灵犀 · 场景分类（纯本地）
 *
 * 为什么按场景：读文件类失败（路径不存在）和命令类失败（超时/权限）需要的
 * 注入篇幅完全不同。全局一套参数只能折中；分场景各学各的，才谈得上"越用越准"。
 */
const FILE_TOOLS = ['read', 'write', 'edit', 'glob', 'grep', 'lsp'];
const COMMAND_TOOLS = ['bash', 'pwsh', 'terminal_open', 'terminal_read', 'terminal_signal'];
const WEB_TOOLS = ['web_fetch', 'web_search'];

export function sceneOf(tool) {
  const name = String(tool ?? '').toLowerCase();
  if (FILE_TOOLS.some((item) => name === item || name.startsWith(item + '_'))) return 'file';
  if (COMMAND_TOOLS.some((item) => name === item || name.startsWith(item))) return 'command';
  if (WEB_TOOLS.some((item) => name === item || name.startsWith(item))) return 'web';
  return 'other';
}

/** 默认预算（字符）：读文件类通常短、命令类信息量大。 */
export const DEFAULT_BUDGETS = {
  file: 500,
  command: 700,
  web: 500,
  other: 700,
};
