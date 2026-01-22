import { shell, clipboard, dialog, BrowserWindow, Menu } from 'electron';
import { openToolsWindow, insertJS, getLocale } from '../lib/functions.js';
import { isMac, ToolsID } from '../lib/config.js';

// 获取翻译文件
const lang = getLocale();

// 工具菜单
const ToolsMenu = {
  label: lang.menu.tools.index,
  submenu: ToolsID.map((id, index) => ({
    label: lang.tools.name[index],
    accelerator: `Alt+${index + 1}`,
    click: () => openToolsWindow(`${id}.html`)
  }))
};

// 编辑菜单
const editText = lang.menu.edit;
const EditMenu = {
  label: editText.index,
  submenu: [
    { label: editText.undo, accelerator: 'CmdOrCtrl+Z', role: 'undo' },
    { label: editText.redo, accelerator: 'CmdOrCtrl+Y', role: 'redo' },
    { label: editText.selectall, accelerator: 'CmdOrCtrl+A', role: 'selectall' },
    { type: 'separator' },
    { label: editText.cut, accelerator: 'CmdOrCtrl+X', role: 'cut' },
    { label: editText.copy, accelerator: 'CmdOrCtrl+C', role: 'copy' },
    { label: editText.paste, accelerator: 'CmdOrCtrl+V', role: 'paste' },
    { label: editText.pastetext, accelerator: 'CmdOrCtrl+Shift+V', role: 'pasteAndMatchStyle' }
  ]
};

// 控制菜单
const ctrlText = lang.menu.control;
const controlMenu_Page = [
  {
    label: ctrlText.back, accelerator: 'Alt+Left',
    click: () => {
      const win = BrowserWindow.getFocusedWindow().navigationHistory;
      if (win?.canGoBack()) win.goBack();
    }
  },
  { label: ctrlText.reload, accelerator: 'F5', role: 'reload' },
  { label: ctrlText.forceReload, accelerator: 'Shift+F5', role: 'forceReload' },
  {
    label: ctrlText.forward, accelerator: 'Alt+Right',
    click: () => {
      const win = BrowserWindow.getFocusedWindow().navigationHistory;
      if (win?.canGoForward()) win.goForward();
    }
  }
];
const controlMenu_Window = [
  { label: ctrlText.fullScreen, accelerator: 'F11', role: 'toggleFullScreen' },
  {
    label: ctrlText.showurl.index, accelerator: 'F10',
    click: async () => {
      const win = BrowserWindow.getFocusedWindow();
      if (!win) return;
      const url = win.webContents.getURL();
      dialog.showMessageBox({
        type: 'info',
        title: ctrlText.showurl.title,
        message: url,
        buttons: [ctrlText.showurl.copyBtn, lang.public.close],
        defaultId: 1,
        cancelId: 1
      }).then(code => {
        if (code === 0) clipboard.writeText(url);
      })
    }
  },
  { label: ctrlText.devTools, accelerator: 'F12', role: 'toggleDevTools' },
  {
    label: ctrlText.openOutside, accelerator: 'F9',
    click: () => {
      const win = BrowserWindow.getFocusedWindow();
      if (!win) return;
      const url = win.webContents.getURL();
      if (url) shell.openExternal(url);
    }
  }
];

// 菜单切换
const MenuSwitch = [{
  label: ctrlText.switchTopMenu, accelerator: 'F8',
  click: () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.webContents.executeJavaScript('litebrowser.switchTopMenu()');
  }
}, {
  label: ctrlText.switchContentMenu, accelerator: 'F7',
  click: () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.webContents.executeJavaScript('litebrowser.switchContextMenu()');
  }
}];

// JavaScript注入
const JSInsert = {
  label: ctrlText.insertJS,
  accelerator: 'F1',
  click: insertJS
};

/****************************/

// 右键菜单
const contextMenu = Menu.buildFromTemplate([
  ToolsMenu,
  EditMenu,
  {
    label: ctrlText.index,
    submenu: [
      ...controlMenu_Window,
      ...(isMac ? [JSInsert] : [])
    ]
  },
  { type: 'separator' },
  ...controlMenu_Page,
  { type: 'separator' },
  ...MenuSwitch,
  JSInsert,
]);

// 顶部菜单
const TopMenu = Menu.buildFromTemplate([
  ToolsMenu,
  EditMenu,
  {
    label: ctrlText.index,
    submenu: [
      ...controlMenu_Page,
      { type: 'separator' },
      ...controlMenu_Window,
      { type: 'separator' },
      ...MenuSwitch,
      ...(isMac ? [JSInsert] : [])
    ]
  },
  ...(isMac ? [] : [JSInsert]),
]);

export { contextMenu, TopMenu };