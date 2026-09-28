# Suno 中文助手

Suno 常用创作界面的轻量油猴汉化脚本。默认中文，可随时通过油猴菜单恢复英文；翻译在本地完成，不调用翻译服务，也不上传页面内容。

**当前为 0.1.1 预览版。** 已核对真实 Suno 的主要界面结构，并通过自动化与本地合成页面验证；受浏览器工具限制，尚未完成在真实 Suno 安装脚本后的端到端验收。覆盖清单与验证边界见 [docs/verification.md](docs/verification.md)。不是 Suno 官方产品。

## 安装与使用

1. 在桌面 Chrome 中安装 [Tampermonkey](https://www.tampermonkey.net/)。
2. **开启脚本执行权限**：右键 Chrome 工具栏的油猴图标 → 管理扩展程序 → 打开“允许用户脚本”。油猴菜单显示“已启用”不等于这个权限已开启；若出现蓝色权限提示，应先处理。旧版浏览器设置见 [官方说明](https://www.tampermonkey.net/faq.php?q=Q209)。
3. 点击 [安装 Suno 中文助手](https://raw.githubusercontent.com/zenoskongfu/suno-zh/main/dist/suno-zh.user.js)，在油猴安装页确认脚本与域名。
4. 刷新 [Suno](https://suno.com/create)。脚本仅匹配 `suno.com` 和 `www.suno.com`。
5. 点击油猴图标，使用“切换为英文 / Show English”或“切换为中文 / Show Chinese”。选择会保存，刷新后保留；其他已打开标签页刷新后使用新选择。

如果安装链接只显示代码，在油猴管理面板新建脚本，将该链接的完整内容粘贴、保存，然后刷新 Suno。若脚本未运行，请依照 [Tampermonkey 官方 FAQ](https://www.tampermonkey.net/faq.php) 检查当前浏览器的用户脚本执行设置。

页面上没有匹配到的文字会保留原文。切换为英文会恢复本脚本仍控制的文字，不覆盖网页刚更新的内容。歌词、风格输入、歌曲标题及作者内容不作为翻译对象。

## 首版覆盖

- 主导航：Explore、Create、Library、Studio。
- 创作面板（包括歌曲详情页左侧）：Simple / Advanced / Sounds、Audio / Voice / Inspo、歌词与风格区标题，以及 More Options 中的主要标签。
- Library：资料库标签、筛选入口与绑定的筛选列表、可识别的搜索提示。
- 歌曲操作：分享、下载、播放队列、播放列表等已匹配的菜单项。
- 部分弹窗固定操作文案；未逐项验证的弹窗不计入已验收覆盖。

Studio 内部编辑器、账户详情、探索页内容、用户歌词与提示词翻译不在首版范围。切换模式、账户套餐或 Suno 改版可能带来新文案，请通过 [Issues](https://github.com/zenoskongfu/suno-zh/issues) 提供原文与所在界面；不要附带私人歌曲或账户信息。

## 开发

需要 Node.js 22+；CI 使用 Node.js 24。

```sh
npm ci
npm run check
```

`check` 包含 TypeScript 检查、Vitest DOM 测试和构建。输出为 `dist/suno-zh.user.js`，构建产物随源码提交，CI 检查两者一致。

- `src/dictionary.ts`：按上下文分组的词典。
- `src/adapter.ts`：Suno 语义定位与受保护内容边界。
- `src/engine.ts`：增量遍历、条件恢复、监听与任务生命周期。
- `src/userscript.ts`：油猴设置、菜单与启停。

核心引擎通过 `TranslationAdapter` 的 `isProtected`、`text`、`attribute` 接口匹配页面。油猴 API 只存在于入口。未来可复用词典与引擎，增加 Chrome 扩展入口。

脚本不轮询整页。初次加载遍历页面，后续只处理变更分支；队列按时间片调度，保护区域跳过，未知文案不替换。真实环境性能需要结合 Suno 当前页面实测，不能把本地 DOM 测试耗时当成浏览器性能保证。

## 提交与更新

主分支包含源码与可安装脚本。更改词典或逻辑后运行 `npm run check`，一并提交重新生成的脚本；发布更新时递增 `package.json` 版本。油猴更新地址指向本仓库主分支的脚本。

## 本地可视化验证

运行 `npm run build` 和 `npm run preview`，打开 `http://127.0.0.1:4319/create`。这是合成测试页面，不是 Suno 的复刻或真实账户会话。页面使用同一个构建脚本，并以本地菜单和 localStorage 模拟油猴 API，可复现中英文切换、刷新、输入保护和动态弹层行为。按 Ctrl+C 关闭服务。

为保持选择器和网页行为稳定，首版保留原站点的 `aria-label` 属性；可见文本是中文，屏幕阅读器仍可能读到英文。辅助功能汉化不属于已完成验收的部分。

## 0.1.1 更新

修复歌曲详情页和资料库中嵌入式创作面板未翻译的问题；补充 Audio、Voice、Inspo 文案。已有用户可重新点击安装链接更新，并刷新 Suno。歌曲详情主体的评论、说明等界面文案仍不属于本次新增覆盖。
