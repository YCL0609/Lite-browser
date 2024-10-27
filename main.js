const { app, BrowserWindow, Menu } = require('electron');
const menu_tool = require('./Tools/menu').default;
// const menu_tool = require('../Tools.asar/menu').default;

// 菜单-编辑
const menu_edit = [{
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
}]

// 菜单-页面
const menu_page = [{
  label: '刷新',
  accelerator: 'F5',
  role: 'reload'
}, {
  label: '忽略缓存刷新',
  accelerator: 'shift+F5',
  role: 'forceReload'
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
}, {
  label: '全屏',
  accelerator: 'F11',
  role: 'toggleFullScreen'

}, {
  label: '开发者工具',
  accelerator: 'F12',
  role: 'toggleDevTools'
}];

app.setPath('userData', process.cwd() + "\\resources\\Data");// 用户配置文件夹
app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1024,
    height: 600,
    minWidth: 1024,
    minHeight: 600
  })
  win.loadFile('index.html');

  // 标题栏菜单
  const titleMenu = Menu.buildFromTemplate(
    menu_edit
      .concat(menu_tool)
      .concat(menu_page)
      .concat({ label: '关闭菜单(全局)', click: () => { Menu.setApplicationMenu(null) } })
  )
  Menu.setApplicationMenu(titleMenu);

  // 右键菜单
  const contextMenu = Menu.buildFromTemplate(
    menu_edit
      .concat(menu_tool)
      .concat(menu_page)
  );
  win.webContents.on('context-menu', (e) => {
    e.preventDefault();
    contextMenu.popup(win);
  });
})
app.on('window-all-closed', () => app.quit());