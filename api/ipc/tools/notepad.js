import { isDataDirCanRead, isDataDirCanWrite, ToolsPath } from '../../../libs/config.js';
import { getFile, getLocale, isolateImage } from '../../../libs/functions.js';
import { ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
const langRaw = getLocale();
const lang = langRaw.ipc.tools;
const defaultNote = langRaw.tools.notepad.default;
const imgListFile = path.join(ToolsPath, 'notepad', 'imglist.json');
let imgIDsCache = null;
let notepadFiles = [];
for (let i = 0; i < 9; i++) notepadFiles.push(path.join(ToolsPath, 'notepad', (i + 1) + '.txt'));

// 读取笔记内容
ipcMain.handle('tools-notepad-get', (_, id) => {
    // 合规性和存储目录权限检查
    if (typeof id !== 'number' || id < 1 || id > 9 || !Number.isInteger(id)) return { status: false, message: lang.notepad.IDError };
    if (!isDataDirCanRead) return { status: true, message: defaultNote };

    try {
        const rawHtml = getFile(notepadFiles[id - 1], defaultNote);
        // 还原图像url
        const imgDir = path.join(ToolsPath, 'notepad', id.toString());
        const content = rawHtml.replace(/\$([^$]+)\$/g, (_, filename) => {
            const filePath = path.join(imgDir, filename);
            const fileUrl = `file://${filePath.replace(/\\/g, '/')}`;
            return fileUrl;
        });

        return { status: true, message: content };
    } catch (err) {
        return { status: false, message: err.stack };
    }
});


// 保存笔记内容
ipcMain.handle('tools-notepad-set', (_, content, id) => {
    // 合规性和存储目录权限检查
    if (typeof id !== 'number' || id < 1 || id > 9 || !Number.isInteger(id)) return { status: false, message: lang.notepad.IDError };
    if (!isDataDirCanWrite) return { status: false, message: langRaw.permission.write.info };

    try {
        // 分离图像
        const imgDir = path.join(ToolsPath, 'notepad', id.toString());
        if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
        imgIDsCache ??= JSON.parse(getFile(imgListFile, '{}'));
        imgIDsCache[id] ??= [];
        const resualt = isolateImage(content, imgDir, imgIDsCache[id]);
        if (resualt.isUpdate) {
            imgIDsCache[id] = resualt.IDCache;
            fs.writeFileSync(imgListFile, JSON.stringify(imgIDsCache), 'utf-8');
        }
        // 写入剩余文件
        fs.writeFileSync(notepadFiles[id - 1], resualt.html, 'utf-8');
        return { status: true, message: 'OK' };
    } catch (err) {
        return { status: false, message: err.stack }
    }
});

// 删除笔记内容
ipcMain.handle('tools-notepad-del', (_, id) => {
    // 合规性和存储目录权限检查
    if (typeof id !== 'number' || id < 1 || id > 9 || !Number.isInteger(id)) return { status: false, message: lang.notepad.IDError };
    if (!isDataDirCanWrite) return { status: false, message: langRaw.permission.write.info };

    try {
        // 删除图片文件夹和id记录
        const imgDir = path.join(ToolsPath, 'notepad', id.toString());
        if (fs.existsSync(imgDir)) fs.rmSync(imgDir, { force: true, recursive: true });
        imgIDsCache ??= JSON.parse(getFile(imgListFile, '{}'));
        if (imgIDsCache[id]) delete imgIDsCache[id];
        fs.writeFileSync(imgListFile, JSON.stringify(imgIDsCache), 'utf-8');
        // 删除笔记
        fs.unlinkSync(notepadFiles[id - 1]);

        return { status: true, message: 'OK' };
    } catch (err) {
        return { status: false, message: err.stack }
    }
});