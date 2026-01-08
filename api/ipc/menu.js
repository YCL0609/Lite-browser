import { ipcMain, BrowserWindow } from 'electron';
import { isMac } from '../../lib/config.js';
import { contextMenu, TopMenu } from '../menu.js';

// 右键菜单响应
ipcMain.on('menu-contextmenu', (event, x, y) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) contextMenu.popup({ window: win, x, y });
});

// 菜单栏切换事件
ipcMain.on('menu-switch-top-menu', (event, isShow) => {
    if (isMac) return; // macOS 不支持隐藏菜单栏
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    win.setMenu(isShow ? TopMenu : null);
});