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
  label: '控制...',
  submenu: [{
    label: '开关右键菜单',
    accelerator: 'F7',
    click: () => {
      if (!ismenudown) {
        ismenudown = true;
        const index1 = menu.findIndex(item => item.label === '控制...');
        if (index1 !== -1) {
          const index2 = menu[index1].submenu.findIndex(item => item.label === '关闭菜单(全局)');
          if (index2 !== -1) {
            menu[index1].submenu.splice(index2, 1);
          }
        }
        const newmenu = Menu.buildFromTemplate(menu);
        Menu.setApplicationMenu(newmenu);
      }

      const contextMenu = Menu.buildFromTemplate(
        menu_edit
          .concat(menu_tool)
          .concat(menu_page)
          .concat({ label: '关闭菜单栏(全局)', click: () => { Menu.setApplicationMenu(null) } })
      );
      BrowserWindow.getFocusedWindow().webContents.on('context-menu', (e) => {
        e.preventDefault();
        contextMenu.popup(contextMenu);
      });
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
  }, {
    label: '关闭菜单(全局)',
    click: () => { Menu.setApplicationMenu(null) }
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
  label: '在独立线程中打开(F9)',
  accelerator: 'F9',
  click: () => {
    const url = BrowserWindow.getFocusedWindow().webContents.getURL();
    const newwin = new BrowserWindow({ width: 1024, height: 600 });
    newwin.loadURL(url);
  }
}];

/* 一个特殊的bug,当操作过右键菜单后从菜单栏点击隐藏菜单栏会引起程序崩溃 */
let ismenudown = false;
let menu = menu_edit
  .concat(menu_tool)
  .concat(menu_page);

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
  const titleMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(titleMenu);
})
app.on('window-all-closed', () => app.quit());