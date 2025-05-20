let bookmark_list, search_url;
const default_url = ['https://www.bing.com/search?q=%s', 'https://www.google.com/search?q=%s', 'https://www.baidu.com/s?wd=%s'];
litebrowser.getBookmarks()
    .then(json => {
        const List = JSON.parse(json);
        bookmark_list = List;
        // 添加书签到页面
        Object.keys(List).map(i => {
            // 主页面
            const div = document.createElement('div');
            div.innerHTML = `<a href="#" id="bookmark-${i}" onclick="window.open('${List[i].url}')">${List[i].title}</a>`;
            document.getElementById('bookmark').appendChild(div);
            // 删除页面
            const option = document.createElement('option');
            option.value = i;
            option.innerHTML = List[i].title;
            document.getElementById('bookmark-del').appendChild(option)
        })
    });
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
        if (setting.theme.background != null) litebrowser.getSetting(true)
            .then(imgurl => document.body.style.backgroundImage = `url('${imgurl}')`);
    });

Poop(0)///////////////////////////////////

// 输入框回车
document.getElementById('word').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') urljump();
});

// 搜索引擎下拉框
document.getElementById('search-engine').addEventListener('change', (event) => {
    const url = document.getElementById('search-url');
    url.disabled = event.target.value != -1;
    url.value = event.target.value == -1 ? "" : default_url[event.target.value]
});

// 搜索跳转
function urljump() {
    const input = document.getElementById('word').value;
    if (typeof input === 'string' && input.trim() === '') return; // 防止输入为空
    const pattern = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//;
    if (pattern.test(input)) {
        window.open(input)
    } else {
        const url = search_url.replace('%s', encodeURIComponent(input));
        window.open(url)
    }
}

// 应用颜色设置
function applyColor(main, text) {
    const color1 = main + "c5";
    document.querySelectorAll('h1')[0].style.color = color1;
    document.getElementsByClassName('box')[0].style.backgroundColor = color1;
    document.getElementsByClassName('title')[0].style.color = text
}

// 更改设置
function changeSetting() {
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
            "background": @@
        }
    }`;
    console.log(json);
    // litebrowser.setSetting(json);
    applyColor(settings[2], settings[3]);
}

// 更换背景
function changeBackground(input) {
    const files = input.files;
    if (files.length === 0) return
    const reader = new FileReader();
    reader.onload = () => {
        litebrowser.imgSetting(files[0].type, reader.result.split(',')[1]);
        document.body.style.backgroundImage = `url(${reader.result})`;
    };
    reader.readAsDataURL(files[0]);
}

// 弹窗事件
function Poop(id = -1) {
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
window.bookmark = class bookmark {

    static delete() { // 删除书签
        const select = document.getElementById('bookmark-del');
        if (select.value == -1) return
        document.getElementById(`bookmark-${select.value}`).innerHTML = '';
        select.remove(select.selectedIndex);
        Poop(-1)
    }

    static add() { // 添加书签
        const url = document.getElementById('bookmark-url').value;
        const name = document.getElementById('bookmark-name').value;
        if (url == '' || name == '') return;
        const time = Date.now();
        const div = document.createElement('div');
        div.innerHTML = `<a href="#" id="bookmark-${time}" onclick="window.open('${url}')">${name}</a>`;
        document.getElementById('bookmark').appendChild(div);
        const option = document.createElement('option');
        option.value = time;
        option.innerHTML = name;
        document.getElementById('bookmark-del').appendChild(option);
        litebrowser.addBookmark(name, url, time);
        Poop(-1);
    }

    static edit(process) { // 修改书签
        const delbtn = document.getElementById('bookmark-del-btn');
        const addbtn = document.getElementById('bookmark-add-btn');
        switch (process) {
            case 0: // 选择要修改的书签
                delbtn.innerText = '选择';
                delbtn.onclick = () => bookmark.edit(1);
                Poop(2);
                break;
            case 1: // 加载书签
                const select = document.getElementById('bookmark-del');
                if (select.value == -1) return;
                Poop(-1)
                addbtn.innerText = '修改';
                addbtn.onclick = () => bookmark.edit(2);
                document.getElementById('bookmark-name').value = bookmark_list[select.value].title;
                document.getElementById('bookmark-url').value = bookmark_list[select.value].url;
                Poop(1);
                break;
            case 2: // 修改书签
                Poop(-1);
                bookmark.add();
                delbtn.innerText = '删除';
                delbtn.onclick = () => bookmark.delete();
                addbtn.innerText = '添加';
                addbtn.onclick = () => bookmark.add();
                break;
            default: return
        }
    }
};