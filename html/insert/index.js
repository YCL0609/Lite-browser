let jsList
let isAutoMode = false;
const btnlist = ['openDir', 'add', 'delete', 'rename', 'refresh', 'auto'];
const listdiv = document.getElementById('list');
const tipDiv = document.getElementsByClassName('tipDiv')[0];
const tipText = document.getElementById('tip');
document.getElementById('id').innerText = litebrowser.parentID;
GetList();

// 按钮提示
btnlist.forEach(id => {
    let timmer;
    const btn = document.getElementById(id);
    btn.addEventListener('mouseenter', e => {
        timmer = setTimeout(() => {
            tipDiv.style.display = "block";
            tipText.innerText = e.target.dataset.tip ?? '';
        }, 1000)
    });

    btn.addEventListener('mouseleave', e => {
        tipDiv.style.display = "none";
        tipText.innerText = '';
        clearTimeout(timmer);
    })
})

// 刷新脚本列表
document.getElementById('refresh').addEventListener('click', GetList);

// 添加脚本
document.getElementById('add').addEventListener('click', litebrowser.addJS);

// 打开脚本目录
document.getElementById('openDir').addEventListener('click', litebrowser.openDir);

// 删除脚本
document.getElementById('delete').addEventListener('click', () => {
    const element = document.querySelector('[data-isselent="1"]');
    if (!element) return;
    litebrowser.removeJS(element.dataset.jsid)
    element.remove();
})

// 配置JS自动执行
document.getElementById('auto').addEventListener('click', async () => {
    if (isAutoMode) {
        // 恢复正常页面
        const selented = [];
        document.querySelectorAll('[data-isselent="1"]').forEach(item => selented.push(item.dataset.jsid));
        litebrowser.changeAutoJS(litebrowser.parentID, selented);
        isAutoMode = false;
        document.getElementById('auto-info').style.display = 'none';
        listdiv.childNodes.forEach(item => item.dataset.isselent = 0);
    } else {
        // 显示选择页面
        const jsList = await litebrowser.getAutoJS(litebrowser.parentID);
        if (jsList.errID === -1) return;
        isAutoMode = true;
        document.getElementById('auto-info').style.display = 'block';
        document.querySelectorAll('[data-jsid]').forEach(item => {
            item.dataset.isselent = 0;
            if (jsList.hosts.includes(item.dataset.jsid)) item.dataset.isselent = 1;
            item.onclick = event => event.currentTarget.dataset.isselent = event.currentTarget.dataset.isselent == 1 ? 0 : 1;
            item.ondblclick = null;
        });
    }
})

// 获取脚本列表
async function GetList() {
    const date = new Date();
    const list = await litebrowser.getList();
    const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
    document.getElementById('time').innerText = time;
    document.getElementById('used').innerText = Math.round(list.used * 100) / 100 + 'ms';
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
        div.ondblclick = () => litebrowser.insertJS(litebrowser.parentID, item);
        listdiv.appendChild(div);
    }
}