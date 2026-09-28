# 文案与定位清单

盘点日期：2026-09-28。仅记录固定 UI 文案与结构，不保存真实歌曲或账户信息。完整翻译词典见 `src/dictionary.ts`。

| 区域 | 现场观察的英文 | 定位依据 | 保护边界 |
| --- | --- | --- | --- |
| 主导航 | Explore / Create / Library / Studio | `/discover`、`/create`、`/me`、`/studio` 链接 | 歌曲、作者等内容链接不匹配 |
| 资料库标签 | Songs / Playlists / Workspaces / Voices / Lyrics / Styles | `role=tablist` 下的 `a[role=tab]` | 不替换同名普通按钮与歌曲名 |
| 创作模式 | Simple / Advanced / Sounds | `role=tablist` 且 `aria-label="Create form mode"` | 输入值保持原文 |
| 创作区 | Lyrics / Styles / More Options | 从模式 tablist 向上定位含输入区的最小祖先 | 排除 textarea、contenteditable、歌曲链接与标题容器 |
| 高级选项 | Vocal Gender / Duration / Max Mode / Weirdness / Style Influence / Variety / Personalize | 创作表单内的精确文案 | 无匹配则保留原文 |
| 资料库筛选 | Filters (2) / Liked / Disliked / Public / Private / Uploads / Full song / Cover / Voices / Downloads / Hide Disliked / Hide Stems | Filters combobox 的 `aria-controls` 与 listbox ID 关联 | 不硬编码动态 ID，不翻译无关联列表 |
| 歌曲菜单 | Remix / Edit / Publish / Share / Download / Manage / Add to Queue / Add to Playlist / Song Radio / Report / Move to Trash | `.context-menu-item > button[aria-label]` | 只处理动作节点，保留歌曲内容 |

`base-ui-*` ID 与 `css-*` class 在重新加载后变化，不能作为固定定位依据。歌曲菜单的结构类名是当前观察到的例外，改版后可能需要维护。

词典还包含常见大小写变体及部分候选操作；词典存在并不等于真实页面已验证。搜索 placeholder、部分弹窗、其他账号版本和未访问的资料库子页仍需要补充实际安装验证。顶层导航在其他页面也会汉化，但不代表这些页面的内部内容已覆盖。

0.1.1 根据用户截图增加 Audio / Voice / Inspo，并将同一个创作面板的适配扩展到歌曲详情和资料库路径。模式标签不依赖编辑器加载完成。只改变组件识别条件，不扩大到歌曲详情主体；评论、简介等 UI 的覆盖仍需后续适配。
