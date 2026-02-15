import { isDataDirCanRead, isDataDirCanWrite, ToolsPath } from '../../../libs/config.js';
import { getFile, getLocale } from '../../../libs/functions.js';
import { ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
const langRaw = getLocale();
const lang = langRaw.ipc.tools;
const defaultCode = langRaw.tools.code.default;
const imgListFile = path.join(ToolsPath, 'code', 'imglist.json');
const imgDir = path.join(ToolsPath, 'code', 'imgs');
let imgIDsCache = null;
let codeFiles = [];
['html', 'css', 'js'].forEach(e => codeFiles[e] = path.join(ToolsPath, 'code', 'index.' + e));

// 读取代码编辑器内容
ipcMain.handle('tools-code-get', async () => {
    // 存储目录权限检查
    if (!isDataDirCanRead) return { status: true, message: { html: defaultCode.html, css: defaultCode.css, js: defaultCode.js } };

    try {
        const [rawHtml, css, js] = await Promise.all([
            getFile(codeFiles.html, defaultCode.html),
            getFile(codeFiles.css, defaultCode.css),
            getFile(codeFiles.js, defaultCode.js)
        ]);
        // 还原图像url
        const html = rawHtml.replace(/\$([^$]+)\$/g, (_, filename) => {
            const filePath = path.join(imgDir, filename);
            const fileUrl = `file://${filePath.replace(/\\/g, '/')}`;
            return fileUrl;
        });
        return { status: true, message: { html: html, css: css, js: js } };
    } catch (err) {
        return { status: false, message: err.stack };
    }
});


// 保存代码编辑器内容
ipcMain.handle('tools-code-set', (_, content, type) => {
    // 合规性和存储目录权限检查
    if (!['html', 'css', 'js'].includes(type)) return { status: false, message: lang.code.typeError };
    if (!isDataDirCanWrite) return { status: false, message: langRaw.permission.write.info };

    try {
        if (type == 'html') {
            // 分离图像
            imgIDsCache ??= JSON.parse(getFile(imgListFile, '[]'));
            if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
            const resualt = isolateImage(content, imgDir, imgIDsCache);
            if (resualt.isUpdate) {
                imgIDsCache = resualt.IDCache;
                fs.writeFileSync(imgListFile, JSON.stringify(imgIDsCache));
                content = resualt.html;
            }
        }
        fs.writeFileSync(codeFiles[type], content, 'utf-8');
        return { status: true, message: 'OK' };
    } catch (err) {
        return { status: false, message: err.stack }
    }
});

// 删除代码编辑器内容
ipcMain.handle('tools-code-del', () => {
    // 存储目录权限检查
    if (!isDataDirCanWrite) return { status: false, message: langRaw.permission.write.info };

    try {
        fs.rmSync(path.join(ToolsPath, 'code'), { force: true, recursive: true });
        return { status: true, message: 'OK' };
    } catch (err) {
        return { status: false, message: err.stack }
    }
});