const { getFile } = require('../../lib/function');
const { DataPath, isDataDirCanRead, isDataDirCanWrite, defaultCode, defaultNote, defaultMarkDown } = require('../../lib/config');
const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const toolsPath = path.join(DataPath, 'tools');

// 读取笔记内容
ipcMain.handle('tools-notepad-get', (_, id) => {
    if (typeof id !== 'number' || id < 1 || id > 9 || !Number.isInteger(id)) return { status: false, message: '笔记ID错误' };
    if (!isDataDirCanRead) return { status: true, message: defaultNote };
    const filePath = path.join(toolsPath, 'notepad', `${id}.txt`);
    try {
        const content = getFile(filePath, defaultNote);
        return { status: true, message: content };
    } catch (err) {
        return { status: false, message: err.stack }
    }
});

// 保存笔记内容
ipcMain.handle('tools-notepad-set', (_, id, content) => {
    if (typeof id !== 'number' || id < 1 || id > 9 || !Number.isInteger(id)) return { status: false, message: '笔记ID错误' };
    if (!isDataDirCanWrite) return { status: false, message: '数据目录不可写' };
    const filePath = path.join(toolsPath, 'notepad', `${id}.txt`);
    try {
        getFile(filePath, defaultNote); // 确保文件存在
        fs.writeFileSync(filePath, content, 'utf-8');
        return { status: true, message: 'OK' };
    } catch (err) {
        return { status: false, message: err.stack }
    }
});

// 删除笔记内容
ipcMain.handle('tools-notepad-del', (_, id) => {
    if (typeof id !== 'number' || id < 1 || id > 9 || !Number.isInteger(id)) return { status: false, message: '笔记ID错误' };
    if (!isDataDirCanWrite) return { status: false, message: '数据目录不可写' };
    const filePath = path.join(toolsPath, 'notepad', `${id}.txt`);
    try {
        fs.unlinkSync(filePath);
        return { status: true, message: 'OK' };
    } catch (err) {
        return { status: false, message: err.stack }
    }
});

// 读取代码编辑器内容
ipcMain.handle('tools-code-get', async () => {
    if (!isDataDirCanRead) return { status: true, message: { html: defaultCode.html, css: defaultCode.css, js: defaultCode.js } };
    const filePath_html = path.join(toolsPath, 'code', 'index.html');
    const filePath_css = path.join(toolsPath, 'code', 'index.css');
    const filePath_js = path.join(toolsPath, 'code', 'index.js');

    try {
        const [htmlText, cssText, jsText] = await Promise.all([
            getFile(filePath_html, defaultCode.html),
            getFile(filePath_css, defaultCode.css),
            getFile(filePath_js, defaultCode.js)
        ]);

        return { status: true, message: { html: htmlText, css: cssText, js: jsText } };
    } catch (err) {
        return { status: false, message: err.stack };
    }
});


// 保存代码编辑器内容
ipcMain.handle('tools-code-set', (_, type, content) => {
    if (!['html', 'css', 'js'].includes(type)) return { status: false, message: '类型错误' };
    if (!isDataDirCanWrite) return { status: false, message: '数据目录不可写' };
    const filePath = path.join(toolsPath, 'code', `index.${type}`); // 确保文件存在
    try {
        fs.writeFileSync(filePath, content, 'utf-8');
        return { status: true, message: 'OK' };
    } catch (err) {
        return { status: false, message: err.stack }
    }
});

// 删除代码编辑器内容
ipcMain.handle('tools-code-del', () => {
    const filePath_html = path.join(toolsPath, 'code', 'index.html');
    const filePath_css = path.join(toolsPath, 'code', 'index.css');
    const filePath_js = path.join(toolsPath, 'code', 'index.js');
    if (!isDataDirCanWrite) return { status: false, message: '数据目录不可写' };

    try {
        fs.unlinkSync(filePath_html);
        fs.unlinkSync(filePath_css);
        fs.unlinkSync(filePath_js);
        return { status: true, message: 'OK' };
    } catch (err) {
        return { status: false, message: err.stack }
    }
});

// 读取MarkDown内容
ipcMain.handle('tools-markdown-get', () => {
    if (!isDataDirCanRead) return { status: true, message: defaultMarkDown };
    const filePath = path.join(toolsPath, 'markdown.md');
    try {
        const content = getFile(filePath, defaultMarkDown);
        return { status: true, message: content };
    } catch (err) {
        return { status: false, message: err.stack }
    }
});

// 保存MarkDown内容
ipcMain.handle('tools-markdown-set', (_, content) => {
    if (!isDataDirCanWrite) return { status: false, message: '数据目录不可写' };
    const filePath = path.join(toolsPath, 'markdown.md');
    try {
        fs.writeFileSync(filePath, content, 'utf-8');
        return { status: true, message: 'OK' };
    } catch (err) {
        return { status: false, message: err.stack }
    }
});

// 删除MarkDown内容
ipcMain.handle('tools-markdown-del', () => {
    const filePath = path.join(toolsPath, 'markdown.md');
    if (!isDataDirCanWrite) return { status: false, message: '数据目录不可写' };

    try {
        fs.unlinkSync(filePath);
        return { status: true, message: 'OK' };
    } catch (err) {
        return { status: false, message: err.stack }
    }
});