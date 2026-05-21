let errorTip = "处理错误:";
let processing = "正在处理...";
let errorString = "Base64 字符串格式不正确，无法解码为文本";

document.addEventListener('DOMContentLoaded', async () => {
    // 语言切换
    const langRaw = await litebrowser.getLang();
    const lang = langRaw.tools.base64;
    if (langRaw.Info.lang != "zh") {
        errorTip = lang.errorTip;
        processing = lang.processing;
        errorString = lang.errorString;
        document.title = lang.title;
        document.querySelectorAll('[data-langId]').forEach(e => {
            const langId = e.dataset.langid.replace(/@/g, 'tools.base64');
            const langTo = e.dataset.langTo ?? "innerText";
            const langIndex = langId.split('.');
            let value = langRaw;
            for (let i = 0; i < langIndex.length; i++) {
                value = value[langIndex[i]] ?? "[Translation missing]";
            }
            e[langTo] = value;
        });
    }
});

// 切换输入类型的显示/隐藏
function switchType() {
    const type = document.getElementById('inputType').value;
    document.getElementById('decodeBtn').style.display = type === 'text' ? '' : 'none';
    document.getElementById('textInputDiv').style.display = type === 'text' ? 'block' : 'none';
    document.getElementById('fileInputDiv').style.display = type === 'file' ? 'block' : 'none';
    // 清空输入和错误信息
    document.getElementById('textInput').value = '';
    document.getElementById('fileInput').value = '';
    document.getElementById('outputArea').value = '';
    document.getElementById('errorMsg').textContent = '';
}

// 处理输入并执行编码或解码
async function processInput(operation) {
    document.getElementById('errorMsg').innerHTML = processing;
    const inputType = document.getElementById('inputType').value;
    try {
        if (inputType === 'text') {
            const text = document.getElementById('textInput').value.trim();
            if (!text) return;
            if (operation === 'encode') {
                // 编码文本
                const utf8Bytes = new TextEncoder().encode(text);
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result.split(',')[1];
                    document.getElementById('outputArea').value = base64;
                };
                reader.onerror = e => { throw e };
                reader.readAsDataURL(new Blob([utf8Bytes]));
            } else {
                // 解码文本
                try {
                    const base64 = text.replace(/^data:.*,/, '').trim();
                    const binaryString = atob(base64);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    const decoded = new TextDecoder('utf-8').decode(bytes);
                    document.getElementById('outputArea').value = decoded;
                } catch (e) {
                    throw new Error(errorString);
                }
            }
        } else if (inputType === 'file') {
            // 处理文件输入
            const fileInput = document.getElementById('fileInput');
            const file = fileInput.files[0];
            if (!file) return;

            if (operation === 'encode') {
                // 编码文件
                const base64DataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(file);
                });
                document.getElementById('outputArea').value = base64DataUrl;
            }
        }

    } catch (e) {
        console.error(e);
        document.getElementById('outputArea').value = e.stack;
        document.getElementById('errorMsg').innerHTML = `<a style="color:red">${errorTip}: ${e.message}</a>`;
    }
}