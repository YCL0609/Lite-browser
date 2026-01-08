import { app, session } from 'electron';
import path from 'path';
import fs from 'fs';

/**************** 程序基础 ****************/

// 调试相关
const _debugValue = (process.env.LITE_BROWSER_DEBUG || '').trim().toLowerCase();
const isDebug = ['true', '1', 'yes'].includes(_debugValue);

// 是否为 Mac 环境
const isMac = process.platform === 'darwin';

// 代码文件主目录
const appPath = app.getAppPath();

// 无菜单Session
let _nomenuSession = null;
function getNomenuSession() {
    return _nomenuSession ??= session.fromPartition('persist:nomenu');
}

// 窗口图标
const _iconDir = app.isPackaged ? path.join(appPath, '..', 'icons') : path.join(appPath, 'icons');
const iconPath = (() => {
    const iconMap = {
        'win32': 'icon.ico',
        'darwin': 'icon.icns',
        'linux': 'icon.png'
    };
    const iconName = iconMap[process.platform] || 'icon.png';
    return path.join(_iconDir, iconName);
})();

/**************** 数据目录 ****************/

// 数据目录
const _defaultDataPath = (() => {
    // 生产环境
    if (app.isPackaged) {
        // macOS (.app 同级目录)
        if (process.platform === 'darwin') {
            return path.resolve(appPath, '../../..');
        }
        // Windows/Linux (resources 目录)
        return path.resolve(path.dirname(appPath));
    }

    // 开发环境
    return path.join(appPath, 'resources');
})();
const DataPath = process.env.LITE_BROWSER_DATA_PATH || _defaultDataPath;

// 数据目录读权限检测
const isDataDirCanWrite = (() => {
    try {
        fs.accessSync(DataPath, fs.constants.W_OK | fs.constants.X_OK);
        return true;
    } catch (_) {
        return false;
    }
})();

// 数据目录写权限检测
const isDataDirCanRead = (() => {
    try {
        fs.accessSync(DataPath, fs.constants.R_OK | fs.constants.X_OK);
        return true;
    } catch (_) {
        return false;
    }
})();

/**************** 主页面 ******************/

// 默认配置
const defaultSetting = {
    search: { id: 1, url: '' },
    theme: { color: { main: '#60eeee', text: '#000000' }, background: null }
};

// 支持的图片MIME类型
const imageMIME = {
    'image/gif': 'gif',
    'image/bmp': 'bmp',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/tiff': 'tiff',
    'image/avif': 'avif',
    'image/apng': 'apng',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'image/svg+xml': 'svg'
};

/**************** 小工具 ******************/

// 小工具基本信息
const ToolsInfo = {
    id: ['notepad', 'paint', 'code', 'base64', 'markdown'],
    name: ['笔记本', '画图板', '代码编辑器', 'Base64工具', 'Markdown编辑器']
};

// 小工具存储位置信息
let notepadFiles = [], codeFiles = {};
const ToolsPath = path.join(DataPath, 'tools');
for (let i = 1; i <= 9; i++) notepadFiles.push(path.join(ToolsPath, 'notepad', i + '.txt'));
['html', 'css', 'js'].forEach(e => codeFiles[e] = path.join(ToolsPath, 'code', 'index.' + e));
const ToolsFile = {
    markdown: path.join(ToolsPath, 'markdown.md'),
    notepad: notepadFiles,
    code: codeFiles,
}

// 默认代码编辑器内容
const defaultCode = {
    html: '<h1>简易代码编辑器</h1>',
    css: `
/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
    body {
        background-color: #333;
        color: #fff;
    }
}`,
    js: `document.writeln('hello World');`
};

// 默认笔记内容
const defaultNote = `
<p>Ctrl+数字(1-9) 切换到对应编号的笔记本;</p><br>
<p>Ctrl+0 切换到临时笔记;</p><br>
<p>Ctrl+S 手动保存当前笔记;</p><br>
<p>Ctrl+D 删除当前笔记;</p><br>
<p>Alt+数字(1-6) 将当前行设置为对应编号的<b>标题</b>或恢复为普通文本;</p><br>
<p>Alt+I 将当前行设置为<b>斜体</b>或恢复为普通文本;</p><br>
<p>Alt+B 将当前行设置为<b>粗体</b>或恢复为普通文本;</p><br>
<p>Alt+U 将当前行添加<b>下划线</b>或恢复为普通文本;</p><br>`;

// 默认MarkDown内容
const defaultMarkDown = `
# MarkDown 演示
这是一个实时MarkDown预览测试。

~~删除线~~ **加粗** *斜体* 
- [ ] 复选框测试1
- [x] 复选框测试2

## 代码
\`\`\`javascript
    const world = "Hello world";
    console.log(world);
\`\`\`

## 表格
| 名称 | 描述 | 仓库链接 |
| :--- | :--- | :---: |
| Marked | JS库 | https://github.com/markedjs/marked |
| DOMPurify | 清理库 | https://github.com/cure53/DOMPurify |

## 安全测试
<script>
    alert('XSS 尝试1');
    document.writeln('XSS 尝试2');
</script>
[XSS 尝试3](javascript:alert(1))
<img src=x onerror=alert(1) alt= "XSS 尝试4">`

export {
    isMac,
    appPath,
    isDebug,
    DataPath,
    iconPath,
    ToolsInfo,
    ToolsFile,
    imageMIME,
    defaultNote,
    defaultCode,
    defaultSetting,
    defaultMarkDown,
    getNomenuSession,
    isDataDirCanRead,
    isDataDirCanWrite
}