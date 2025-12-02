const input = document.getElementById('input');
let contentCache = '';
let BlobUrl = null;
let permission, autoSave;

// 初始化
document.addEventListener("DOMContentLoaded", async () => {
    // 数据目录权限检查
    permission = await litebrowser.dataDirPermission()
    if (!permission.read) {
        const id = showMessage('error', '数据目录不可读, 所有项目将显示初始消息!');
        setTimeout(() => closeMessage(id), 8000);
    }
    if (!permission.write) {
        const id = showMessage('warning', '数据目录不可写, 所有修改将无法存储到磁盘!');
        setTimeout(() => closeMessage(id), 8000);
    }

    // 读取历史代码
    const msgID = showMessage('warning', `正在读取历史代码...`);
    litebrowser.markdown.get()
        .then(response => {
            closeMessage(msgID);
            if (response.status) {
                input.value = response.message;
                // 触发输入事件以渲染预览
                showMD();
                // 显示成功消息
                const okID = showMessage('success', `历史代码读取成功`);
                setTimeout(() => closeMessage(okID), 1000);
            } else {
                showMessage('error', response.message);
            }

            // 设置自动保存
            autoSave = setInterval(() => saveMD(true), 5000)
        });
});

// 页面卸载时清理 Blob URL
window.addEventListener('beforeunload', () => {
    if (BlobUrl) {
        try { URL.revokeObjectURL(BlobUrl); } catch (_) { }
        BlobUrl = null;
    }
});

// 快捷键保存
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey) {
        // 保存
        if (e.key.toLocaleLowerCase() === 's') {
            e.preventDefault();
            saveMD();
        }
        // 删除
        if (e.key.toLocaleLowerCase() === 'd') {
            e.preventDefault();
            deleteMD();
        }
    }
});

// 动态显示预览
input.addEventListener('input', showMD);

// 渲染Markdown预览
function showMD() {
    // Marked 转换
    const rawHtml = marked.parse(input.value);
    // DOMPurify 清理
    const rawSafeHtml = DOMPurify.sanitize(rawHtml);

    // 替换<a>标签跳转方法(新窗口打开)
    const safeHtml = rawSafeHtml.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>/gi, (match, href, rest) => {
        // 检查是否已经有 target 属性
        if (!/target\s*=\s*['"]?_blank['"]?/i.test(rest)) {
            return `<a href="${href}"${rest} target="_blank">`;
        }
        return match;
    });

    // 清理上一个 Blob URL
    if (BlobUrl) {
        URL.revokeObjectURL(BlobUrl);
        BlobUrl = null;
    }

    // 将相对样式表转换为绝对路径
    const cssurl = new URL('./css/markdown-iframe.css', location.href).href;

    // 构建BLOB
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${location.href}"><link rel="stylesheet" href="${cssurl}"></head><body>${safeHtml}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    BlobUrl = URL.createObjectURL(blob);
    // 设置 src 为 blob url
    const preview = document.getElementById('preview');
    preview.src = BlobUrl;
}

// 保存Markdown文件
function saveMD(isauto = false) {
    if (!permission.write) return;
    const msgID = !isauto ? showMessage('warning', '正在保存MarkDown...') : null;
    if (input.value === contentCache && isauto) return; // 内容未更改

    litebrowser.markdown.set(input.value)
        .then(response => {
            if (!isauto) closeMessage(msgID);
            if (response.status) {
                contentCache = input.value;
                // 显示成功消息
                const id = showMessage('success', 'Markdown文件保存成功');
                setTimeout(() => closeMessage(id), isauto ? 500 : 2000);
            } else {
                showMessage('error', `${isauto ? '自动' : ''}保存错误:` + response.message);
            }
        })
}

// 删除Markdown文件
function deleteMD() {
    if (!permission.write) return;
    if (!confirm('是否要清除并关闭页面？此操作不可撤销！')) return;

    clearInterval(autoSave);
    litebrowser.markdown.del()
        .then(response => {
            if (response.status) {
                input.value = '';
                showMD();
                showMessage('success', 'Markdown文件删除成功');
                setTimeout(() => self.close(), 1500);
            } else {
                showMessage('error', response.message);
            }
        })
}  