const { getFile } = require('../../lib/function');
const { DataPath } = require('../../lib/config');
const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const toolsPath = path.join(DataPath, 'tools');
const defaultContent = '使用Ctrl+数字(1-9)可切换到对应编号的笔记本';

// 读取笔记内容
ipcMain.handle('tools-notepad-read', (_, id) => {
    if (typeof id !== 'number' || id < 1 || id > 9 || !Number.isInteger(id)) return { status: false, message: '笔记ID错误' };
    const filePath = path.join(toolsPath, 'notepad', `${id}.txt`);
    try {
        const content = getFile(filePath, defaultContent);
        return { status: true, message: content };
    } catch (err) {
        return { status: false, message: err.stack }
    }
});

// 保存笔记内容
ipcMain.handle('tools-notepad-save', (_, id, content) => {
    if (typeof id !== 'number' || id < 1 || id > 9 || !Number.isInteger(id)) return { status: false, message: '笔记ID错误' };
    const filePath = path.join(toolsPath, 'notepad', `${id}.txt`);
    try {
        getFile(filePath, defaultContent); // 确保文件存在
        fs.writeFileSync(filePath, content, 'utf-8');
        return { status: true, message: 'OK' };
    } catch (err) {
        return { status: false, message: err.stack }
    }
});

// 读取代码编辑器内容
ipcMain.handle('tools-code-get', async () => {
    const filePath_html = path.join(toolsPath, 'code', 'index.html');
    const filePath_css = path.join(toolsPath, 'code', 'index.css');
    const filePath_js = path.join(toolsPath, 'code', 'index.js');

    try {
        const [htmlText, cssText, jsText] = await Promise.all([
            getFile(filePath_html, ''),
            getFile(filePath_css, ''),
            getFile(filePath_js, '')
        ]);

        return { status: true, message: { html: htmlText, css: cssText, js: jsText } };
    } catch (err) {
        return { status: false, message: err.stack };
    }
});


// 保存代码编辑器内容
ipcMain.handle('tools-code-set', (_, type, content) => {
    if (!['html', 'css', 'js'].includes(type)) return { status: false, message: '类型错误' };
    const filePath = path.join(toolsPath, 'code', `index.${type}`); // 确保文件存在
    try {
        fs.writeFileSync(filePath, content, 'utf-8');
        return { status: true, message: 'OK' };
    } catch (err) {
        return { status: false, message: err.stack }
    }
});