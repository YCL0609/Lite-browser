let jsList
let isAutoMode = false;
const listdiv = document.getElementById('list');
document.getElementById('id').innerText = window.litebrowser.parentID;
GetList();

async function GetList() {
    const list = await window.litebrowser.getList();
    const date = new Date(list.time.start);
    const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
    document.getElementById('time').innerText = time;
    document.getElementById('used').innerText = Math.round(list.time.used * 100) / 100 + 'ms';
    // 处理错误
    if (list.error !== -1) {
        listdiv.innerHTML = '<a style="display:block;text-align:center;color:red">' + list.error + '</a>';
        return;
    }
    // 处理无列表
    if (list.list.length === 0) {
        listdiv.innerHTML = '<a style="display:block;text-align:center">暂无JavaScript文件</a>';
        return;
    }
    // 处理列表
    listdiv.innerHTML = '';
    for (const item in list.list) {
        const div = document.createElement('div');
        div.dataset.jsid = item;
        div.dataset.isselent = 0;
        div.innerHTML = `<div class="js-row"><a>${list.list[item]}</a></div>`;
        div.onclick = event => {
            listdiv.childNodes.forEach(item => item.dataset.isselent = 0);
            event.currentTarget.dataset.isselent = 1;
        };
        div.ondblclick = () => window.litebrowser.insertJS(window.litebrowser.parentID, item);
        listdiv.appendChild(div);
    }
}

function RemoveJS() {
    const element = document.querySelector('[data-isselent="1"]');
    if (element) {
        window.litebrowser.removeJS(element.dataset.jsid)
        element.remove();
    }
}

function AutoJS() {
    if (isAutoMode) {
        isAutoMode = false;
        document.getElementById('auto-info').style.display = 'none';
    } else {
        isAutoMode = true;
        document.getElementById('auto-info').style.display = 'block';
    }
}