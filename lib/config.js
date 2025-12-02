const path = require('path');
const fs = require('fs');

// 调试相关
const isDebug = ['true', '1'].includes((process.env.LITE_BROWSER_DEBUG || '').toLowerCase());

// 数据目录
const DataPath = process.env.LITE_BROWSER_DATA_PATH || path.resolve(path.join(__dirname, '..','..'));

// 数据目录读权限检测
const isDataDirCanWrite = (() => {
    try {
        fs.accessSync(DataPath, fs.constants.W_OK | fs.constants.X_OK);
        return true;
    } catch (_) {
        return false;
    }
})();

// 数据目录写权限检测
const isDataDirCanRead = (() => {
    try {
        fs.accessSync(DataPath, fs.constants.R_OK | fs.constants.X_OK);
        return true;
    } catch (_) {
        return false;
    }
})();

// 默认代码编辑器内容
const defaultCode = {
    html: '<h1>简易代码编辑器</h1>',
    css: `
/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
    body {
        background-color: #333;
        color: #fff;
    }
}`,
    js: `document.writeln('hello World');`
};

// 默认笔记内容
const defaultNote = `
<p>Ctrl+数字(1-9) 切换到对应编号的笔记本;</p><br>
<p>Ctrl+0 切换到临时笔记;</p><br>
<p>Ctrl+S 手动保存当前笔记;</p><br>
<p>Ctrl+D 删除当前笔记;</p><br>
<p>Alt+数字(1-6) 将当前行设置为对应编号的<b>标题</b>或恢复为普通文本;</p><br>
<p>Alt+I 将当前行设置为<b>斜体</b>或恢复为普通文本;</p><br>
<p>Alt+B 将当前行设置为<b>粗体</b>或恢复为普通文本;</p><br>
<p>Alt+U 将当前行添加<b>下划线</b>或恢复为普通文本;</p><br>`;

// 默认MarkDown内容
const defaultMarkDown = `
# MarkDown 演示
这是一个实时MarkDown预览测试。

~~删除线~~ **加粗** *斜体* 
- [ ] 复选框测试1
- [x] 复选框测试2

## 代码
\`\`\`javascript
    const world = "Hello world";
    console.log(world);
\`\`\`

## 表格
| 名称 | 描述 | 仓库链接 |
| :--- | :--- | :---: |
| Marked | JS库 | https://github.com/markedjs/marked |
| DOMPurify | 清理库 | https://github.com/cure53/DOMPurify |

## 安全测试
<script>
    alert('XSS 尝试1');
    document.writeln('XSS 尝试2');
</script>
[XSS 尝试3](javascript:alert(1))
<img src=x onerror=alert(1) alt= "XSS 尝试4">`

// 默认配置
const defaultSetting = {
    search: { id: 1, url: '' },
    theme: { color: { main: '#60eeee', text: '#000000' }, background: null }
};

// 支持的图片MIME类型
const imageMIME = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
    'image/avif': 'avif',
    'image/apng': 'apng',
    'image/heic': 'heic',
    'image/heif': 'heif'
};

module.exports = {
    DataPath,
    isDebug,
    isDataDirCanRead,
    isDataDirCanWrite,
    defaultMarkDown,
    defaultSetting,
    defaultNote,
    defaultCode,
    imageMIME
}