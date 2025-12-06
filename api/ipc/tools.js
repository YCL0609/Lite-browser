import { isDataDirCanRead, isDataDirCanWrite, ToolsFile, defaultCode, defaultNote, defaultMarkDown } from '../../lib/config.js';
import { getFile } from '../../lib/getFile.js';
import { ipcMain } from 'electron';
import fs from 'fs';

// 读取笔记内容
ipcMain.handle('tools-notepad-get', (_, id) => {
    // 合规性和存储目录权限检查
    if (typeof id !== 'number' || id < 1 || id > 9 || !Number.isInteger(id)) return { status: false, message: '笔记ID错误' };
    if (!isDataDirCanRead) return { status: true, message: defaultNote };

    try {
        const content = getFile(ToolsFile.notepad[id], defaultNote);
        return { status: true, message: content };
    } catch (err) {
        return { status: false, message: err.stack }
    }
});

// 保存笔记内容
ipcMain.handle('tools-notepad-set', (_, id, content) => {
    // 合规性和存储目录权限检查
    if (typeof id !== 'number' || id < 1 || id > 9 || !Number.isInteger(id)) return { status: false, message: '笔记ID错误' };
    if (!isDataDirCanWrite) return { status: false, message: '数据目录不可写' };

    try {
        getFile(ToolsFile.notepad[id], defaultNote); // 确保文件存在
        fs.writeFileSync(ToolsFile.notepad[id], content, 'utf-8');
        return { status: true, message: 'OK' };
    } catch (err) {
        return { status: false, message: err.stack }
    }
});

// 删除笔记内容
ipcMain.handle('tools-notepad-del', (_, id) => {
    // 合规性和存储目录权限检查
    if (typeof id !== 'number' || id < 1 || id > 9 || !Number.isInteger(id)) return { status: false, message: '笔记ID错误' };
    if (!isDataDirCanWrite) return { status: false, message: '数据目录不可写' };

    try {
        fs.unlinkSync(ToolsFile.notepad[id]);
        return { status: true, message: 'OK' };
    } catch (err) {
        return { status: false, message: err.stack }
    }
});

// 读取代码编辑器内容
ipcMain.handle('tools-code-get', async () => {
    // 存储目录权限检查
    if (!isDataDirCanRead) return { status: true, message: { html: defaultCode.html, css: defaultCode.css, js: defaultCode.js } };

    try {
        const [htmlText, cssText, jsText] = await Promise.all([
            getFile(ToolsFile.code.html, defaultCode.html),
            getFile(ToolsFile.code.css, defaultCode.css),
            getFile(ToolsFile.code.js, defaultCode.js)
        ]);
        return { status: true, message: { html: htmlText, css: cssText, js: jsText } };
    } catch (err) {
        return { status: false, message: err.stack };
    }
});


// 保存代码编辑器内容
ipcMain.handle('tools-code-set', (_, type, content) => {
    // 合规性和存储目录权限检查
    if (!['html', 'css', 'js'].includes(type)) return { status: false, message: '类型错误' };
    if (!isDataDirCanWrite) return { status: false, message: '数据目录不可写' };
    
    try {
        fs.writeFileSync(ToolsFile.code[type], content, 'utf-8');
        return { status: true, message: 'OK' };
    } catch (err) {
        return { status: false, message: err.stack }
    }
});

// 删除代码编辑器内容
ipcMain.handle('tools-code-del', () => {
    // 存储目录权限检查
    if (!isDataDirCanWrite) return { status: false, message: '数据目录不可写' };

    try {
        fs.unlinkSync(ToolsFile.code.html);
        fs.unlinkSync(ToolsFile.code.css);
        fs.unlinkSync(ToolsFile.code.js);
        return { status: true, message: 'OK' };
    } catch (err) {
        return { status: false, message: err.stack }
    }
});

// 读取MarkDown内容
ipcMain.handle('tools-markdown-get', () => {
    // 存储目录权限检查
    if (!isDataDirCanRead) return { status: true, message: defaultMarkDown };

    try {
        const content = getFile(ToolsFile.markdown, defaultMarkDown);
        return { status: true, message: content };
    } catch (err) {
        return { status: false, message: err.stack }
    }
});

// 保存MarkDown内容
ipcMain.handle('tools-markdown-set', (_, content) => {
    // 存储目录权限检查
    if (!isDataDirCanWrite) return { status: false, message: '数据目录不可写' };

    try {
        fs.writeFileSync(ToolsFile.markdown, 'utf-8');
        return { status: true, message: 'OK' };
    } catch (err) {
        return { status: false, message: err.stack }
    }
});

// 删除MarkDown内容
ipcMain.handle('tools-markdown-del', () => {
    // 存储目录权限检查
    if (!isDataDirCanWrite) return { status: false, message: '数据目录不可写' };

    try {
        fs.unlinkSync(ToolsFile.markdown);
        return { status: true, message: 'OK' };
    } catch (err) {
        return { status: false, message: err.stack }
    }
});