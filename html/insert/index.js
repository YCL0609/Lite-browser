let jsList
const listdiv = document.getElementById('list');
document.getElementById('id').innerText = window.litebrowser.parentID;
GetList();

async function GetList() {
    const list = await window.litebrowser.getList();
    const date = new Date(list.time.start);
    const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
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
    jsList = list.list;
    listdiv.innerHTML = '';
    list.list.map((item, index) => {
        const div = document.createElement('div');
        div.dataset.jsid = index;
        div.dataset.isselent = 0;
        const date = new Date(item.time);
        const datestr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        div.innerHTML = `<a style="float: left">${item.name}</a><a style="float: right;">${datestr}</a>`;
        div.onclick = event => {
            listdiv.childNodes.forEach(item => item.dataset.isselent = 0);
            event.currentTarget.dataset.isselent = 1;
        };
        div.ondblclick = event => window.litebrowser.insertJS(window.litebrowser.parentID, jsList[event.currentTarget.dataset.jsid].name);
        listdiv.appendChild(div);
    })
}

function RemoveJS() {
    const element = document.querySelector('[data-isselent="1"]');
    if (element) {
        const name = jsList[element.dataset.jsid].name;
        window.litebrowser.removeJS(name)
    }
}