import { getSettings } from '../../core/index.js';
import { ipcMain, BrowserWindow } from 'electron';
import { contextMenu, TopMenu } from '../menu.js';
const settings = getSettings();
const isContentMenu = settings?.app.contentMenu;
const isTopMenu = settings?.app.topMenu;

// 右键菜单响应
ipcMain.on('menu-contextmenu', (event, x, y) => {
    if (!isContentMenu) return
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) contextMenu.popup({ window: win, x, y });
});

// 菜单栏切换事件
ipcMain.on('menu-switch-top-menu', (event, isShow) => {
    if (!isTopMenu) return;
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.setMenu(isShow ? TopMenu : null);
});