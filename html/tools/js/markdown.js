const input = document.getElementById('input');
let contentCache = '';
let permission;
marked.setOptions({ gfm: true });

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
            setInterval(() => saveMD(true), 5 * 1000)
        });
});

// 渲染Markdown预览
function showMD() {
    // Marked 转换
    const rawHtml = marked.parse(input.value);
    // DOMPurify 清理
    const safeHtml = DOMPurify.sanitize(rawHtml);
    // 渲染
    document.getElementById('preview').srcdoc = safeHtml + '<link rel="stylesheet" href="./css/markdown-iframe.css">';
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
        });
}

// 删除Markdown文件
function deleteMD() {
    if (!permission.write) return;
    if (!confirm('是否要清除并关闭页面？此操作不可撤销！')) return;

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
        });
}  