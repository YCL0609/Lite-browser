import { getFile, getLocale, isolateImage } from '../../../libs/functions.js';
import { DataPath } from '../../../libs/config.js';
import { ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
const lang = getLocale();
const defaultMarkDown = lang.tools.markdown.default;
const mdFiles = path.join(DataPath.tools, 'markdown', 'index.md');
const imgListFile = path.join(DataPath.tools, 'markdown', 'imglist.json');
const imgDir = path.join(DataPath.tools, 'markdown', 'imgs');
let imgIDsCache = null;

// 读取MarkDown内容
ipcMain.handle('tools-markdown-get', () => {
    // 存储目录权限检查
    if (!DataPath.access.R) return { status: true, message: defaultMarkDown };

    try {
        const rawHtml = getFile(mdFiles, defaultMarkDown);
        // 还原图像url
        const content = rawHtml.replace(/\$([^$]+)\$/g, (_, filename) => {
            const filePath = path.join(imgDir, filename);
            const fileUrl = `file://${filePath.replace(/\\/g, '/')}`;
            return fileUrl;
        });
        return { status: true, message: content };
    } catch (err) {
        debugLog('error', 'Failed to get markdown tool content:', err.message);
        return { status: false, message: err.message };
    }
});

// 保存MarkDown内容
ipcMain.handle('tools-markdown-set', (_, content) => {
    // 存储目录权限检查
    if (!DataPath.access.W) return { status: false, message: lang.permission.write.info };

    try {
        // 分离图像
        imgIDsCache ??= JSON.parse(getFile(imgListFile, '[]'));
        if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
        const resualt = isolateImage(content, imgDir, imgIDsCache);
        if (resualt.isUpdate) {
            imgIDsCache = resualt.IDCache;
            fs.writeFileSync(imgListFile, JSON.stringify(imgIDsCache), 'utf-8');
        }
        // 写入剩余文件
        fs.writeFileSync(mdFiles, resualt.html, 'utf-8');
        return { status: true, message: 'OK' };
    } catch (err) {
        debugLog('error', 'Markdown tool content update failed:', err.message);
        return { status: false, message: err.message }
    }
});

// 删除MarkDown内容
ipcMain.handle('tools-markdown-del', () => {
    // 存储目录权限检查
    if (!DataPath.access.W) return { status: false, message: lang.permission.write.info };

    try {
        fs.rmSync(path.join(DataPath.tools, 'markdown'), { force: true, recursive: true });
        return { status: true, message: 'OK' };
    } catch (err) {
        debugLog('error', 'Failed to delete markdown tool content:', err.message);
        return { status: false, message: err.message };
    }
});