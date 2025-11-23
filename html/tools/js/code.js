const htmlInput = document.getElementById("htmlInput");
const cssInput = document.getElementById("cssInput");
const jsInput = document.getElementById("jsInput");
const codeCache = { html: '', css: '', js: '' }
let permission;

// 快捷键保存
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey) {
        if (e.key.toLocaleLowerCase() === 's') {
            e.preventDefault();
            saveCode();
        }
    }
});

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

    // 实时预览
    [htmlInput, cssInput, jsInput].forEach((textarea) => {
        textarea.addEventListener("input", updatePreview);
        textarea.addEventListener("keydown", handleTabKey);
    });

    // 读取历史代码
    const msgID = showMessage('warning', `正在读取历史代码...`);
    litebrowser.code.get()
        .then(response => {
            closeMessage(msgID);
            if (response.status) {
                // 显示笔记内容
                htmlInput.value = response.message.html;
                cssInput.value = response.message.css;
                jsInput.value = response.message.js;

                // 初始化缓存
                codeCache.html = response.message.html;
                codeCache.css = response.message.css;
                codeCache.js = response.message.js;

                // 更新预览
                updatePreview();

                // 显示成功消息
                const okID = showMessage('success', `历史代码读取成功`);
                setTimeout(() => closeMessage(okID), 1000);
            } else {
                showMessage('error', response.message);
            }

            // 设置自动保存
            setInterval(() => saveCode(true), 5 * 1000)
        });

    function updatePreview() {
        const html = htmlInput.value;
        const css = `<style>${cssInput.value}<\/style>`;
        const js = `<script>${jsInput.value}<\/script>`;
        document.getElementById('preview').srcdoc = html + css + js;
    };

    function handleTabKey(event) {
        if (event.key === "Tab") {
            event.preventDefault();
            const { selectionStart, selectionEnd, value } = event.target;
            event.target.value =
                value.substring(0, selectionStart) + "  " + value.substring(selectionEnd);
            event.target.selectionStart = event.target.selectionEnd = selectionStart + 2;
        }
    }
});

// 保存代码
function saveCode(isauto = false) {
    if (!permission.write) return;
    let changed = [];
    const input = { html: htmlInput, css: cssInput, js: jsInput };
    const msgID = !isauto ? showMessage('warning', `正在保存...`) : null;

    ['html', 'css', 'js'].forEach(e => {
        // 统一换行符，避免 Windows CRLF/LF 导致的误判
        const cacheVal = (codeCache[e] || '').replace(/\r\n/g, '\n');
        const inputVal = (input[e].value || '').replace(/\r\n/g, '\n');
        if (cacheVal !== inputVal) changed.push(e);
    })
    if (!isauto) changed = ['html', 'css', 'js']; // 手动保存时，全部保存
    if (changed.length === 0) return;

    // 保存到文件
    Promise.all(changed.map(item => litebrowser.code.set(item, input[item].value)))
        .then(results => {
            // 判断是否成功
            let isok = true;
            results.forEach((res) => {
                if (!res.status) isok = false;
            });

            // 更新缓存
            changed.forEach(e => codeCache[e] = input[e].value);

            // UI处理
            if (msgID) closeMessage(msgID);
            if (isok) {
                const okID = showMessage('success', `${isauto ? '自动' : ''}保存成功`);
                setTimeout(() => closeMessage(okID), isauto ? 500 : 2000);
            } else {
                showMessage('error', `${isauto ? '自动' : ''}保存错误`);
            }
        });
}