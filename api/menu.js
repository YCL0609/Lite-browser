import { shell, clipboard, dialog, BrowserWindow, Menu } from 'electron';
import { openToolsWindow, insertJS } from '../lib/menuControl.js';
import { isMac, ToolsInfo } from '../lib/config.js';

// 工具菜单
const ToolsMenu = {
  label: '工具...',
  submenu: ToolsInfo.id.map((id, index) => ({
    label: ToolsInfo.name[index],
    accelerator: `Alt+${index + 1}`,
    click: () => openToolsWindow(`${id}.html`)
  }))
};

// 编辑菜单
const EditMenu = {
  label: '编辑...',
  submenu: [
    { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
    { label: '重做', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
    { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectall' },
    { type: 'separator' },
    { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
    { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
    { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
    { label: '粘贴为纯文本', accelerator: 'CmdOrCtrl+Shift+V', role: 'pasteAndMatchStyle' }
  ]
};

// 控制菜单
const controlSubmenu = [
  {
    label: '后退', accelerator: 'Alt+Left',
    click: () => {
      const win = getFocusedWindow().navigationHistory;
      if (win?.canGoBack()) win.goBack();
    }
  },
  {
    label: '刷新', accelerator: 'F5', role: 'reload'
  },
  {
    label: '忽略缓存刷新', accelerator: 'Shift+F5', role: 'forceReload'
  },
  {
    label: '前进', accelerator: 'Alt+Right',
    click: () => {
      const win = getFocusedWindow().navigationHistory;
      if (win?.canGoForward()) win.goForward();
    }
  },
  { type: 'separator' },
  {
    label: '全屏', accelerator: 'F11', role: 'toggleFullScreen'
  },
  {
    label: '显示当前网址', accelerator: 'F10',
    click: async () => {
      const url = getWebContents()?.getURL();
      if (!url) return;
      dialog.showMessageBox({
        type: 'info',
        title: '当前网址',
        message: url,
        buttons: ['复制到剪贴板', '关闭'],
        defaultId: 1,
        cancelId: 1
      }).then(code => {
        if (code === 0) clipboard.writeText(url);
      })
    }
  },
  {
    label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools'
  },
  { type: 'separator' },
  {
    label: '用默认浏览器打开', accelerator: 'F9',
    click: () => {
      const url = getWebContents()?.getURL();
      if (url) shell.openExternal(url);
    }
  },
];

// 菜单切换
const MenuSwitch = [{
  label: '切换菜单栏可见性', accelerator: 'F8',
  click: () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.webContents.executeJavaScript('litebrowser.switchTopMenu()');
  }
}, {
  label: '关闭右键菜单', accelerator: 'F7',
  click: () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.webContents.executeJavaScript('litebrowser.switchContextMenu()');
  }
}];

// JavaScript注入
const JSInsert = {
  label: 'JavaScript注入',
  accelerator: 'F1',
  click: insertJS
};

/****************************/

// 右键菜单
const contextMenu = Menu.buildFromTemplate([
  ToolsMenu,
  EditMenu,
  { label: '控制...', submenu: controlSubmenu },
  JSInsert,
  ...MenuSwitch,
]);

// 顶部菜单
const TopMenu = Menu.buildFromTemplate([
  ToolsMenu,
  EditMenu,
  {
    label: '控制...',
    submenu: [
      ...controlSubmenu,
      ...MenuSwitch,
      ...(isMac ? [JSInsert] : [])
    ]
  },
  ...(isMac ? [] : [JSInsert]),
]);

// 调试菜单
const debugMenu = Menu.buildFromTemplate([
  { label: '忽略缓存刷新', accelerator: 'Shift+F5', role: 'forceReload' },
  { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' },
]);

export { contextMenu, TopMenu, debugMenu };