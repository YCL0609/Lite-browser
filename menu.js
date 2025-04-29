const { shell, ipcMain, Menu, BrowserWindow } = require('electron');
const path = require('path');
const htmlPath = path.join(__dirname, 'html');

// 菜单项目
module.exports = [{
  label: '工具...',
  submenu: [{
    label: '笔记本',
    accelerator: 'Alt+1',
    click: () => {
      const newwin = new BrowserWindow({ width: 300, height: 300 });
      newwin.setMenu(null);
      newwin.loadURL(path.join(htmlPath, 'tools', 'notepad.html'))
    }
  }, {
    label: '画图板',
    accelerator: 'Alt+2',
    click: () => {
      const newwin = new BrowserWindow({ width: 1024, height: 600 });
      newwin.setMenu(null);
      newwin.loadURL(path.join(htmlPath, 'tools', 'paint.html'))
    }
  }, {
    label: '电子表格',
    accelerator: 'Alt+3',
    click: () => {
      const newwin = new BrowserWindow({ width: 1024, height: 600 });
      newwin.setMenu(null);
      newwin.loadURL(path.join(htmlPath, 'tools', 'excel.html'))
    }
  }, {
    label: '代码编辑器',
    accelerator: 'Alt+4',
    click: () => {
      const newwin = new BrowserWindow({ width: 1024, height: 600 });
      newwin.setMenu(null);
      newwin.loadURL(path.join(htmlPath, 'tools', 'code.html'))
    }
  }]
}, {
  label: '编辑...',
  submenu: [{
    label: '撤销',
    accelerator: 'Ctrl+Z',
    role: 'undo'
  }, {
    label: '重做',
    accelerator: 'Ctrl+Y',
    role: 'redo'
  }, {
    label: '全选',
    accelerator: 'Ctrl+A',
    role: 'selectall'
  }, {
    type: 'separator'
  }, {
    label: '剪切',
    accelerator: 'Ctrl+X',
    role: 'cut'
  }, {
    label: '复制',
    accelerator: 'Ctrl+C',
    role: 'copy'
  }, {
    label: '粘贴',
    accelerator: 'Ctrl+V',
    role: 'paste'
  }, {
    label: '粘贴为纯文本',
    accelerator: 'CmdOrCtrl+Shift+V',
    role: 'pasteAndMatchStyle'
  }]
}, {
  label: '控制...',
  submenu: [{
    label: '全屏',
    accelerator: 'F11',
    role: 'toggleFullScreen'
  }, {
    label: '开发者工具',
    accelerator: 'F12',
    role: 'toggleDevTools'
  }, {
    type: 'separator'
  }, {
    label: '用默认浏览器打开',
    accelerator: 'F8',
    click: () => {
      const url = BrowserWindow.getFocusedWindow().webContents.getURL();
      shell.openExternal(url);
    }
  }, {
    label: '在独立线程中打开',
    accelerator: 'F9',
    click: () => {
      const url = BrowserWindow.getFocusedWindow().webContents.getURL();
      const newwin = new BrowserWindow({ width: 1024, height: 600 });
      newwin.loadURL(url);
    }
  }, {
    label: '显示当前网址',
    accelerator: 'F10',
    click: () => {
      const url = BrowserWindow.getFocusedWindow().webContents.getURL();
      const newwin = new BrowserWindow({ width: 500, height: 200 });
      newwin.setMenu(null);
      newwin.loadURL('data:text/html,<meta charset="UTF-8"><title>当前网址</title><body style=word-wrap:break-word;word-break:break-all>' + url)
    }
  }]
}, {
  label: '刷新(F5)',
  accelerator: 'F5',
  role: 'reload'
}, {
  label: '忽略缓存刷新(shift+F5)',
  accelerator: 'shift+F5',
  role: 'forceReload'
}, {
  label: '注入JavaScript文件',
  click: insertJS
}
];



function insertJS() {
  const mainWindow = BrowserWindow.getFocusedWindow();
  const childWindow = new BrowserWindow({
    parent: mainWindow,
    width: 500,
    height: 500,
    webPreferences: {
      additionalArguments: [`--parent-window-id=${mainWindow.id}`],
      session: global.insertSession,
      contextIsolation: true,
      preload: path.join(htmlPath, 'insert', 'preload.js')
    }
  });
  childWindow.setMenu(null);
  childWindow.loadFile(path.join(htmlPath, 'insert', 'index.html'));
  ipcMain.once('send-data-back', (_, data) => mainWindow.webContents.executeJavaScript(data));
};