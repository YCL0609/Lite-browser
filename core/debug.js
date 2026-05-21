import { isDebug, isTrace, isLog } from './config.js';
import { Menu } from 'electron';

/**
 * 调试模式额外菜单项目 (仅在 `isDebug` 为真时创建)
 * @type {Electron.Menu|null}
 */
const debugMenu = isDebug ? Menu.buildFromTemplate([
    { label: '忽略缓存刷新(ForceReload)', accelerator: 'Shift+F5', role: 'forceReload' },
    { label: '开发者工具(DevTools)', accelerator: 'F12', role: 'toggleDevTools' },
]) : null;

const _useColor = process.stdout.isTTY && process.stdout.getColorDepth() > 1 && !process.env.NO_COLOR;
const _levelTable = {
    table: { txt: '', color: '', stderr: false },
    info: { txt: '[INFO]', color: '\x1b[36m', stderr: false },
    warn: { txt: '[WARN]', color: '\x1b[33m', stderr: true },
    error: { txt: '[ERROR]', color: '\x1b[31m', stderr: true },
};
/**
 * 打印调试日志 (仅在 `isDebug` 为真时输出)
 *  - `info` 级别输出到`stdout`，`warn`和`error`级别输出到`stderr`
 *  - 当 `isTrace` 为真时，`warn` 和 `error` 级别会附加调用栈跟踪信息
 * @param {'table'|'info'|'warn'|'error'} level - 日志级别，支持 'table'|'info'|'warn'|'error'
 * @param {...any} args - 要输出的任意数量的参数，会附加对应级别的标签在前面
 * @returns {void}
 */
function debugLog(level, ...args) {
    if (!isLog) return;
    const detail = _levelTable[level.trim().toLowerCase()];
    if (!detail) return;
    const color = _useColor ? detail.color : ''

    if (detail.stderr) {
        if (isTrace) {
            console.trace(color, detail.txt, ...args, _useColor ? '\x1b[0m' : '');
        } else {
            console.warn(color, detail.txt, ...args, _useColor ? '\x1b[0m' : '');
        }
    } else if (level === 'table') {
        console.table(...args)
    } else {
        console.log(color, detail.txt, ...args, _useColor ? '\x1b[0m' : '');
    }
}

export {
    debugLog,
    debugMenu,
}