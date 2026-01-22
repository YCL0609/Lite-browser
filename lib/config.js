import { app } from 'electron';
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

// 支持的语言
const supportLang = ['en', 'zh'];

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

// 小工具存储位置信息
let notepadFiles = [], codeFiles = {};
const _toolsPath = path.join(DataPath, 'tools');
for (let i = 0; i < 9; i++) notepadFiles.push(path.join(_toolsPath, 'notepad', (i + 1) + '.txt'));
['html', 'css', 'js'].forEach(e => codeFiles[e] = path.join(_toolsPath, 'code', 'index.' + e));
const ToolsFile = {
    markdown: path.join(_toolsPath, 'markdown.md'),
    notepad: notepadFiles,
    code: codeFiles,
}
const ToolsID = ["notepad", "paint", "code", "base64", "markdown"]
export {
    isMac,
    appPath,
    isDebug,
    ToolsID,
    DataPath,
    iconPath,
    ToolsFile,
    imageMIME,
    supportLang,
    defaultSetting,
    isDataDirCanRead,
    isDataDirCanWrite
}