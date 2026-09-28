export type Dictionary = Readonly<Record<string, string>>;
export const navigation: Dictionary = {
  Explore: '探索', Create: '创作', Library: '资料库', Studio: '工作室', Home: '首页',
};
export const library: Dictionary = {
  Songs: '歌曲', Playlists: '播放列表', Workspaces: '工作区', Voices: '声音', Lyrics: '歌词', Styles: '风格',
  Filters: '筛选', Search: '搜索', 'Search songs': '搜索歌曲', 'Search your songs': '搜索你的歌曲',
  'Search library': '搜索资料库', 'Search your library': '搜索你的资料库',
  'Newest First': '最新优先', 'Oldest First': '最早优先', 'Newest first': '最新优先', 'Oldest first': '最早优先',
  'Recently Created': '最近创建', 'Recently created': '最近创建', 'Recently Updated': '最近更新',
  'Create Playlist': '创建播放列表', 'Create playlist': '创建播放列表', 'New Playlist': '新建播放列表',
  'New playlist': '新建播放列表', 'New Workspace': '新建工作区', 'New workspace': '新建工作区',
  'My Workspace': '我的工作区', 'My Workspaces': '我的工作区', 'All Songs': '全部歌曲', 'All songs': '全部歌曲',
};
export const creation: Dictionary = {
  Simple: '简单', Advanced: '高级', Sounds: '音效', Custom: '自定义',
  Lyrics: '歌词', Styles: '风格', 'More Options': '更多选项', 'More options': '更多选项',
  'Advanced Options': '高级选项', 'Advanced options': '高级选项', 'Song Description': '歌曲描述',
  'Song description': '歌曲描述', 'Song Title': '歌曲标题', 'Song title': '歌曲标题', Title: '标题',
  'Vocal Gender': '人声性别', 'Vocal gender': '人声性别', Male: '男声', Female: '女声',
  Duration: '时长', 'Max Mode': 'Max 模式', Weirdness: '实验程度',
  'Style Influence': '风格影响力', 'Style influence': '风格影响力', Variety: '多样性',
  Personalize: '个性化', Instrumental: '纯音乐', 'Auto Lyrics': '自动歌词',
  'Write Lyrics': '写歌词', 'Write lyrics': '写歌词', 'Add Lyrics': '添加歌词',
  'Add lyrics': '添加歌词', 'Add Styles': '添加风格', 'Add styles': '添加风格',
  'Exclude Styles': '排除风格', 'Exclude styles': '排除风格', 'Audio Influence': '音频影响力',
  Create: '创作', 'Upload Audio': '上传音频', 'Upload audio': '上传音频',
  'Add Audio': '添加音频', 'Add audio': '添加音频', 'Add Persona': '添加角色',
  'Save to': '保存到', 'Song Settings': '歌曲设置', 'Clear All': '全部清除',
};
export const filters: Dictionary = {
  Filters: '筛选', Liked: '已喜欢', Disliked: '不喜欢', Public: '公开', Private: '私密',
  Uploads: '已上传', 'Full song': '完整歌曲', 'Full Song': '完整歌曲', Cover: '翻唱',
  Voices: '声音', Downloads: '下载', 'Hide Disliked': '隐藏不喜欢的歌曲', 'Hide Stems': '隐藏分轨',
  'Hide disliked': '隐藏不喜欢的歌曲', 'Hide stems': '隐藏分轨', 'Clear Filters': '清除筛选',
  'Clear filters': '清除筛选', Reset: '重置', Apply: '应用', All: '全部',
};
export const menus: Dictionary = {
  Publish: '发布', Manage: '管理', Share: '分享', 'Add to Queue': '加入播放队列', 'Add to queue': '加入播放队列',
  'Add to Playlist': '加入播放列表', 'Add to playlist': '加入播放列表',
  'Song Radio': '歌曲电台', Report: '举报', Download: '下载', Edit: '编辑',
  'Edit Song Details': '编辑歌曲信息', Rename: '重命名', 'Move to Workspace': '移至工作区',
  'Move to workspace': '移至工作区', 'Move to Trash': '移至回收站', 'Move to trash': '移至回收站',
  'Copy Link': '复制链接', 'Copy link': '复制链接', 'Get Stems': '获取分轨',
  'Remix / Edit': '混音 / 编辑', Remix: '混音', Extend: '续写', 'Reuse Prompt': '复用提示词',
  'Create Cover': '创建翻唱', 'Make Public': '设为公开', 'Make Private': '设为私密',
};
export const dialogs: Dictionary = {
  Cancel: '取消', Save: '保存', Close: '关闭', Done: '完成', Confirm: '确认',
  'Copy Link': '复制链接', 'Copy link': '复制链接', 'Create Playlist': '创建播放列表',
  'Create playlist': '创建播放列表', 'New Playlist': '新建播放列表', 'Add to Playlist': '加入播放列表',
  'Move to Workspace': '移至工作区', Share: '分享', Download: '下载',
};
export function lookup(dictionary: Dictionary, value: string): string | undefined {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  const translated = dictionary[trimmed];
  if (typeof translated !== 'string' || !Object.hasOwn(dictionary, trimmed)) return;
  return value.replace(value.trim(), translated);
}
