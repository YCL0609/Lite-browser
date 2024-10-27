const { BrowserWindow } = require('electron');

module.exports = {
    default: [{
        label: '工具...',
        submenu: [{
            label: '笔记本',
            click: () => {
                const newwin = new BrowserWindow({ width: 300, height: 300 });
                newwin.setMenu(null);
                // newwin.loadURL(process.cwd() + "\\resources\\tools.asar\\notepad.html")
                newwin.loadURL(process.cwd() + "\\tools\\notepad.html")
            }
        }, {
            label: '画图板',
            click: () => {
                const newwin = new BrowserWindow({ width: 1024, height: 600 });
                newwin.setMenu(null);
                // newwin.loadURL(process.cwd() + "\\resources\\tools.asar\\paint.html")
                newwin.loadURL(process.cwd() + "\\tools\\paint.html")
            }
        }, {
            label: '电子表格',
            click: () => {
                const newwin = new BrowserWindow({ width: 1024, height: 600 });
                newwin.setMenu(null);
                // newwin.loadURL(process.cwd() + "\\resources\\tools.asar\\excel.html")
                newwin.loadURL(process.cwd() + "\\tools\\excel.html")
            }
        }, {
            label: '代码编辑器',
            click: () => {
                const newwin = new BrowserWindow({ width: 1024, height: 600 });
                newwin.setMenu(null);
                // newwin.loadURL(process.cwd() + "\\resources\\tools.asar\\code.html")
                newwin.loadURL(process.cwd() + "\\tools\\code.html")
            }
        }]
    }]
};