import { NoteMessage } from '../libs/functions-front.js'
const default_url = ['https://www.bing.com/search?q=%s', 'https://www.google.com/search?q=%s', 'https://www.baidu.com/s?wd=%s'];
const langRaw = await litebrowser.getLang();
const lang = langRaw.mainWindow;
let bookmark_list, search_url;

// 语言切换
if (langRaw.Info.lang != "zh") {
    document.title = lang.title;
    document.querySelectorAll('[data-langId]').forEach(e => {
        const langId = e.dataset.langid.replace(/@/g, 'mainWindow');
        const langTo = e.dataset.langTo ?? "innerText";
        const langIndex = langId.split('.');
        let value = langRaw;
        for (let i = 0; i < langIndex.length; i++) {
            value = value[langIndex[i]] ?? "[Translation missing]";
        }
        e[langTo] = value;
    });
}

// 数据目录权限检查
litebrowser.dataDirPermission()
    .then(permission => {
        if (!permission.read) NoteMessage.showMessage('error', langRaw.permission.read.tip);
        if (!permission.write) NoteMessage.showMessage('warning', langRaw.permission.write.tip);
    });

// 加载书签
litebrowser.getBookmarks()
    .then(json => {
        const List = JSON.parse(json);
        bookmark_list = List;
        // 添加书签到页面
        Object.keys(List).map(i => {
            // 主页面
            const div = document.createElement('div');
            div.innerHTML = `<a href="#" id="bookmark-${i}" onclick="litebrowser.newWindow('${List[i].url}')">${List[i].title}</a>`;
            document.getElementById('bookmark').appendChild(div);
            // 删除页面
            const option = document.createElement('option');
            option.value = i;
            option.innerHTML = List[i].title;
            document.getElementById('bookmark-del').appendChild(option)
        })
    });

// 加载设置
litebrowser.getSetting(false)
    .then(json => {
        const setting = JSON.parse(json);
        // 搜索引擎
        document.getElementById('search-engine').value = setting.search.id;
        const url = (setting.search.id == -1) ? setting.search.url : default_url[setting.search.id];
        document.getElementById('search-url').value = url;
        search_url = url;
        // 颜色样式
        document.getElementById('color-main').value = setting.theme.color.main;
        document.getElementById('color-text').value = setting.theme.color.text;
        applyColor(setting.theme.color.main, setting.theme.color.text);
        // 背景
        if (setting.theme.background !== null) litebrowser.getSetting(true)
            .then(imgurl => document.body.style.backgroundImage = `url('${imgurl}')`);
    });

// 输入框回车
document.getElementById('word').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const input = document.getElementById('word').value;
        if (input.trim() === '') return;
        const pattern = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//;
        if (pattern.test(input)) {
            litebrowser.newWindow(input)
        } else {
            const url = search_url.replace('%s', encodeURIComponent(input));
            litebrowser.newWindow(url)
        }
    }
});

// 搜索引擎下拉框
document.getElementById('search-engine').addEventListener('change', (event) => {
    const url = document.getElementById('search-url');
    url.disabled = event.target.value != -1;
    url.value = event.target.value == -1 ? "" : default_url[event.target.value]
});

// 更改设置
document.getElementById('applySetting').addEventListener('click', () => {
    const items = ['search-engine', 'search-url', 'color-main', 'color-text'];
    const settings = items.map(e => document.getElementById(e).value);
    const json = `{
        "search": {
            "id": ${settings[0]},
            "url": "${settings[1]}"
            },
            "theme": {
                "color": {
                    "main": "${settings[2]}",
                    "text": "${settings[3]}"
            },
            "background": @bgpic@
            }
            }`;
    litebrowser.setSetting(json);
    applyColor(settings[2], settings[3]);
    search_url = settings[1];
    Poop()
})

// 更换背景
document.getElementById('bgselect').addEventListener('change', (input) => {
    const files = input.currentTarget.files;
    if (files.length === 0) return
    const reader = new FileReader();
    reader.onload = () => {
        litebrowser.imgSetting(files[0].type, reader.result.split(',')[1]);
        document.body.style.backgroundImage = `url(${reader.result})`;
    };
    reader.readAsDataURL(files[0]);
});

// 添加书签
document.getElementById('bookmark-add-btn').onclick = () => bookmark.add(Date.now());

// 书签删除
document.getElementById('bookmark-del-btn').onclick = () => bookmark.delete();

// 编辑书签
document.getElementById('edit-bookmark').onclick = () => bookmark.edit(0);

// 应用颜色设置
function applyColor(main, text) {
    const color1 = main + "c5";
    document.querySelectorAll('h1')[0].style.color = color1;
    document.getElementsByClassName('box')[0].style.backgroundColor = color1;
    document.getElementsByClassName('title')[0].style.color = text
}

// 弹窗事件
window.Poop = (id = -1) => {
    const poop = document.getElementById('poop');
    const setting = document.getElementById('poop-setting');
    const add = document.getElementById('poop-add');
    const del = document.getElementById('poop-del');
    switch (id) {
        case 0: // 设置
            poop.style.display = "block";
            setting.style.display = "block";
            break;
        case 1: // 添加
            poop.style.display = "block";
            add.style.display = "block";
            break;
        case 2: // 删除
            poop.style.display = "block";
            del.style.display = "block";
            break;
        default:
            poop.style.display = "none";
            setting.style.display = "none";
            add.style.display = "none";
            del.style.display = "none";
            break;
    }
}

// 书签事件
class bookmark {
    static delete(useipc = true) { // 删除书签
        const select = document.getElementById('bookmark-del');
        if (select.value == -1) return
        document.getElementById(`bookmark-${select.value}`).innerHTML = '';
        useipc ? litebrowser.delBookmark(select.value) : null;
        select.remove(select.selectedIndex);
        Poop(-1)
    }

    static add(time = 0) { // 添加书签
        const url = document.getElementById('bookmark-url').value;
        const name = document.getElementById('bookmark-name').value;
        if (url == '' || name == '') return;
        const div = document.createElement('div');
        div.innerHTML = `<a href="#" id="bookmark-${time}" onclick="litebrowser.newWindow('${url}')">${name}</a>`;
        document.getElementById('bookmark').appendChild(div);
        const option = document.createElement('option');
        option.value = time;
        option.innerHTML = name;
        document.getElementById('bookmark-del').appendChild(option);
        litebrowser.addBookmark(name, url, time);
        Poop(-1);
    }

    static edit(process = -1) { // 修改书签
        const select = document.getElementById('bookmark-del');
        const delbtn = document.getElementById('bookmark-del-btn');
        const addbtn = document.getElementById('bookmark-add-btn');
        const cancelbtn0 = document.getElementById('cancel-btn0');
        const cancelbtn1 = document.getElementById('cancel-btn1');
        switch (process) {
            case -1: // 重置UI
                delbtn.innerText = lang.bookmark.deleteBtn;
                delbtn.onclick = () => this.delete();
                addbtn.innerText = lang.bookmark.addBtn;
                addbtn.onclick = () => this.add(Date.now());
                cancelbtn0.onclick = () => Poop();
                cancelbtn1.onclick = () => Poop();
                Poop();
                break;
            case 0: // 选择要修改的书签
                delbtn.innerText = lang.bookmark.chooseBtn;
                delbtn.onclick = () => this.edit(1);
                cancelbtn1.onclick = () => this.edit(-1);
                Poop(2);
                break;
            case 1: // 加载书签
                if (select.value == -1) return;
                Poop();
                addbtn.innerText = lang.bookmark.changeBtn;
                addbtn.onclick = () => this.edit(2);
                cancelbtn0.onclick = () => this.edit(-1);
                document.getElementById('bookmark-name').value = bookmark_list[select.value].title;
                document.getElementById('bookmark-url').value = bookmark_list[select.value].url;
                Poop(1);
                break;
            case 2: // 修改书签
                Poop(-1);
                this.add(select.value);
                this.delete(false);
                delbtn.innerText = lang.bookmark.deleteBtn;
                delbtn.onclick = () => this.delete();
                addbtn.innerText = lang.bookmark.addBtn;
                addbtn.onclick = () => this.add(Date.now());
                break;
            default: return
        }
    }
};