const { shell, clipboard, dialog, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const { isDebug } = require('../lib/config');
const htmlPath = path.join(__dirname, '..', 'html');
const debugMenu = isDebug ? Menu.buildFromTemplate([{
  label: '忽略缓存刷新(shift+F5)',
  accelerator: 'shift+F5',
  role: 'forceReload'
}, {
  label: '开发者工具(F12)',
  accelerator: 'F12',
  role: 'toggleDevTools'
}]) : null;

// 菜单项目
module.exports = [{
  label: '工具...',
  submenu: [{
    label: '笔记本',
    accelerator: 'Alt+1',
    click: () => openToolsWindow(500, 500, 'notepad.html')
  }, {
    label: '画图板',
    accelerator: 'Alt+2',
    click: () => openToolsWindow(1024, 600, 'paint.html')
  }, {
    label: '电子表格',
    accelerator: 'Alt+3',
    click: () => openToolsWindow(1024, 600, 'excel.html')
  }, {
    label: '代码编辑器',
    accelerator: 'Alt+4',
    click: () => openToolsWindow(1024, 600, 'code.html')
  }]
}, {
  label: '编辑...',
  submenu: [{
    label: '撤销',
    accelerator: 'CmdOrCtrl+Z',
    role: 'undo'
  }, {
    label: '重做',
    accelerator: 'CmdOrCtrl+Y',
    role: 'redo'
  }, {
    label: '全选',
    accelerator: 'CmdOrCtrl+A',
    role: 'selectall'
  }, {
    type: 'separator'
  }, {
    label: '剪切',
    accelerator: 'CmdOrCtrl+X',
    role: 'cut'
  }, {
    label: '复制',
    accelerator: 'CmdOrCtrl+C',
    role: 'copy'
  }, {
    label: '粘贴',
    accelerator: 'CmdOrCtrl+V',
    role: 'paste'
  }, {
    label: '粘贴为纯文本',
    accelerator: 'CmdOrCtrl+Shift+V',
    role: 'pasteAndMatchStyle'
  }]
}, {
  label: '控制...',
  submenu: [{
    label: '后退',
    accelerator: 'Alt+Left',
    click: () => BrowserWindow.getFocusedWindow().webContents.executeJavaScript('history.back()')
  }, {
    label: '刷新(F5)',
    accelerator: 'F5',
    role: 'reload'
  }, {
    label: '前进',
    accelerator: 'Alt+Right',
    click: () => BrowserWindow.getFocusedWindow().webContents.executeJavaScript('history.forward()')
  }, {
    type: 'separator'
  }, {
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
    label: '显示当前网址',
    accelerator: 'F10',
    click: () => {
      const url = BrowserWindow.getFocusedWindow().webContents.getURL();
      dialog.showMessageBox({
        type: 'info',
        title: '当前网址',
        message: url,
        buttons: ['复制到剪贴板', '关闭'],
        defaultId: 1,
        cancelId: 1
      })
        .then(result => {
          if (result.response === 0) clipboard.writeText(url);
        });
    }
  }, {
    label: '注入JavaScript文件',
    accelerator: 'F1',
    click: insertJS
  }]
}, {
  label: '忽略缓存刷新(shift+F5)',
  accelerator: 'shift+F5',
  role: 'forceReload'
}, {
  label: '在独立线程中打开(F9)',
  accelerator: 'F9',
  click: () => {
    const url = BrowserWindow.getFocusedWindow().webContents.getURL();
    const newwin = new BrowserWindow({ width: 1024, height: 600 });
    newwin.loadURL(url);
  }
}];

function openToolsWindow(width, height, htmlfile) {
  const newwin = new BrowserWindow({
    width: width,
    height: height,
    webPreferences: {
      session: global.nomenuSession,
      preload: path.join(__dirname, 'preload', 'tools.js')
    }
  });
  newwin.setMenu(debugMenu);
  newwin.loadURL(pathToFileURL(path.join(htmlPath, 'tools', htmlfile)).href);
}

function insertJS() {
  const mainWindow = BrowserWindow.getFocusedWindow();
  if (!mainWindow || mainWindow.isDestroyed()) {
    dialog.showErrorBox('错误', '当前没有可用的浏览器窗口');
    return;
  }

  mainWindow.webContents.executeJavaScript('litebrowser.registerWindow()');

  const childWindow = new BrowserWindow({
    parent: mainWindow,
    width: 500,
    height: 500,
    webPreferences: {
      additionalArguments: [`--parent-window-id=${mainWindow.id}`],
      session: global.nomenuSession,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload', 'insertjs.js')
    }
  });
  childWindow.setMenu(debugMenu);
  childWindow.loadFile(path.join(htmlPath, 'insert', 'index.html'));
}