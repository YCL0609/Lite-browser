const path = require('path');

const isDebug = ['true', '1'].includes((process.env.LITE_BROWSER_DEBUG || '').toLowerCase());
const DataPath = process.env.LITE_BROWSER_DATA_PATH || path.resolve(path.join(__dirname, '..','..'));

const defaultSetting = {
    search: { id: 1, url: '' },
    theme: { color: { main: '#60eeee', text: '#000000' }, background: null }
};
const imageMIME = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
    'image/x-icon': 'ico',
    'image/avif': 'avif',
    'image/apng': 'apng',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'image/x-xbitmap': 'xbm'
};


module.exports = {
    isDebug,
    DataPath,
    defaultSetting,
    imageMIME
}