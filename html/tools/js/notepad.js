let noteID = 1;
let deleting = false;
let contentCache = '';
let tempNoteTip = "当前为临时笔记";

document.addEventListener('DOMContentLoaded', async () => {
    noteID = localStorage.noteID ?? 1;
    noteID = (isNaN(parseInt(noteID))) ? 1 : parseInt(noteID)
    // 语言切换
    const lang = await litebrowser.getLang();
    document.title = lang.tools.notepad.title;
    tempNoteTip = lang.tools.notepad.tempNote;
    // 数据目录权限检查
    await toolsFileControl.init('notepad', lang);
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
                if (noteID == -1 || deleting) break;
                deleting = true;
                toolsFileControl.deleteFile(noteID)
                    .then((isok) => {
                        if (isok) showNote(-1)
                        deleting = false;
                    })
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

            case '0': // 图片还原
                e.preventDefault();
                formatImages('0');
                break;

            case 'm': // 渲染数学公式
                e.preventDefault();
                renderMathInElement(document.querySelector('.note'), {
                    delimiters: [
                        { left: "$$", right: "$$", display: true },
                        { left: "$", right: "$", display: false }
                    ]
                });
                break;

            default:
                break;
        }
    }
});

// 显示笔记
async function showNote(key) {
    if (key === -1) {
        noteID = -1;
        contentCache = '';
        localStorage.noteID = 1;
        document.querySelector('.note').innerHTML = tempNoteTip;
        return;
    }
    // 读取笔记内容
    const content = await toolsFileControl.getFile(key);
    if (content === null) return;

    // 清理HTML
    const rawSafeHtml = DOMPurify.sanitize(content);
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
    localStorage.noteID = key;
    noteID = key;

    // 渲染数学公式
    renderMathInElement(document.querySelector('.note'), {
        delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false }
        ]
    });
}

// 保存笔记
function saveNote(key, isauto = false) {
    if (noteID == -1 || deleting) return;
    const note = document.querySelector('.note');
    if (note.innerHTML === contentCache && isauto) return; // 内容未更改
    // 保存笔记内容
    toolsFileControl.saveFile(note.innerHTML, isauto, key)
        .then((isok) => { if (isok) contentCache = note.innerHTML })
}

// 格式化文本
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

// 修改图片大小
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
        } else if (control == "0") {
            img.style.width = '100%';
        }
    });
}