let permission;
let noteID = 1;
let contentCache = '';

document.addEventListener('DOMContentLoaded', async () => {
    // 数据目录权限检查
    permission = await litebrowser.dataDirPermission();
    if (!permission.read) {
        const id = showMessage('error', '数据目录不可读, 所有项目将显示初始消息!');
        setTimeout(() => closeMessage(id), 8000);
    }
    if (!permission.write) {
        const id = showMessage('warning', '数据目录不可写, 所有修改将无法存储到磁盘!');
        setTimeout(() => closeMessage(id), 8000);
    }
    // 显示笔记
    showNote(noteID);
    setInterval(() => saveNote(noteID, true), 5 * 1000); // 自动保存
});

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9': // 读取对应笔记
                e.preventDefault();
                showNote(parseInt(e.key));
                break;

            case 's': // 保存当前笔记
                e.preventDefault();
                saveNote(noteID);
                break;

            case '0': // 切换临时笔记
                e.preventDefault();
                showNote(-1);
                break;

            case 'd': // 删除当前笔记
                e.preventDefault();
                deleteNote(noteID);
                break;

            default:
                break;
        }
    } else if (e.altKey) { // 格式化快捷键
        switch (e.key.toLowerCase()) {
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6': // 切换标题
                e.preventDefault();
                formatText(`H${e.key}`);
                break;

            case 'i': // 斜体
                e.preventDefault();
                formatText('I');
                break;

            case 'b': // 粗体
                e.preventDefault();
                formatText('B');
                break;

            case 'u': // 下划线
                e.preventDefault();
                formatText('U');
                break;

            case '+': // 图片放大
                e.preventDefault();
                formatImages('+');
                break;

            case '-': // 图片缩小
                e.preventDefault();
                formatImages('-');
                break;

            default:
                break;
        }
    }
});

// 显示笔记
function showNote(key) {
    if (key === -1) {
        noteID = -1;
        document.querySelector('.note').innerHTML = `当前为临时笔记`;
        return;
    }
    // 显示读取笔记的消息
    const msgID = showMessage('warning', `正在读取笔记${key}...`);
    // 读取笔记内容
    litebrowser.notepad.get(key)
        .then(response => {
            // 移除读取消息
            closeMessage(msgID);
            if (response.status) {
                // 清理HTML
                const rawSafeHtml = DOMPurify.sanitize(response.message);
                // 替换<a>标签跳转方法(新窗口打开)
                const safeHtml = rawSafeHtml.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>/gi, (match, href, rest) => {
                    // 检查是否已经有 target 属性
                    if (!/target\s*=\s*['"]?_blank['"]?/i.test(rest)) {
                        return `<a href="${href}"${rest} target="_blank">`;
                    }
                    return match;
                });

                // 显示笔记内容
                document.querySelector('.note').innerHTML = safeHtml;
                contentCache = safeHtml;
                noteID = key;
                // 显示成功消息
                const okID = showMessage('success', `笔记${key}读取成功`);
                setTimeout(() => closeMessage(okID), 500);
            } else {
                showMessage('error', response.message);
            }
        });
}

// 保存笔记
function saveNote(key, isauto = false) {
    if (noteID == -1) return;
    if (!permission.write) return;
    // 显示读取笔记的消息
    const msgID = !isauto ? showMessage('warning', `正在保存笔记${key}...`) : null;
    const note = document.querySelector('.note');
    if (note.innerHTML === contentCache && isauto) return; // 内容未更改
    // 保存笔记内容
    litebrowser.notepad.set(key, note.innerHTML)
        .then(response => {
            if (!isauto) closeMessage(msgID);
            if (response.status) {
                contentCache = note.innerHTML;
                // 显示成功消息
                const okID = showMessage('success', `${isauto ? '自动' : `笔记${key}`}保存成功`);
                setTimeout(() => closeMessage(okID), isauto ? 500 : 2000);
            } else {
                showMessage('error', `${isauto ? '自动' : ''}保存错误:` + response.message);
            }
        });
}

// 删除笔记
function deleteNote(key) {
    if (noteID == -1) return;
    if (!permission.write) return;
    if (!confirm(`确定要删除笔记${key}吗？此操作不可撤销！`)) return;
    // 显示删除笔记的消息
    const msgID = showMessage('warning', `正在删除笔记${key}...`);
    // 删除笔记内容
    litebrowser.notepad.del(key)
        .then(response => {
            // 移除删除消息
            closeMessage(msgID);
            if (response.status) {
                // 显示成功消息
                const okID = showMessage('success', `笔记${key}删除成功`);
                setTimeout(() => closeMessage(okID), 2000);
                // 显示临时笔记
                showNote(-1);
            } else {
                showMessage('error', response.message);
            }
        });
}

function formatText(target) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    let blockNode = range.startContainer;
    let newElement;

    // 确保是一个元素节点
    while (blockNode && blockNode.nodeType !== 1) blockNode = blockNode.parentNode;
    const editableRoot = document.querySelector('.note');

    // 向上遍历 DOM 树，直到父节点是可编辑的根元素为止
    while (blockNode && blockNode.parentNode !== editableRoot) {
        blockNode = blockNode.parentNode;
    }
    if (!blockNode || blockNode === editableRoot) return;

    // 获取当前块级元素标签名称
    const currentTag = blockNode.tagName;

    if (currentTag === target) {
        // 如已经是目标格式，则切换回普通段落
        newElement = document.createElement('P');
        newElement.innerHTML = blockNode.innerHTML;
        blockNode.parentNode.replaceChild(newElement, blockNode);
    } else {
        // 如不是目标格式，则切换到目标格式
        newElement = document.createElement(target);
        newElement.innerHTML = blockNode.innerHTML;
        blockNode.parentNode.replaceChild(newElement, blockNode);
    }

    selection.removeAllRanges();
    range.selectNodeContents(newElement);
    selection.addRange(range);
}

function formatImages(control) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);

    // 获取公共祖先容器
    const container = range.commonAncestorContainer;
    const root = container.nodeType === Node.ELEMENT_NODE
        ? container
        : container.parentElement;

    if (!root) return;
    root.querySelectorAll('img').forEach(img => {
        if (!range.intersectsNode(img)) return;
        const old = parseInt(img.style.width) || 100;
        console.log(isNaN(img.style.width) || old == 0);
        if (control == "+") {
            img.style.width = (old + 1) + '%';
        } else if (control == "-" && old > 1) {
            img.style.width = (old - 1) + '%';
        }
    });
}