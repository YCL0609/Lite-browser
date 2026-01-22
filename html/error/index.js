const langRaw = await litebrowser.getLang();
const lang = langRaw.errorpage;

// 语言切换
if (langRaw.Info.lang != "zh") {
    document.title = lang.title;
    document.querySelectorAll('[data-langId]').forEach(e => {
        const langId = e.dataset.langid.replace(/@/g, 'errorpage');
        const langTo = e.dataset.langTo ?? "innerText";
        const langIndex = langId.split('.');
        let value = langRaw;
        for (let i = 0; i < langIndex.length; i++) {
            value = value[langIndex[i]] ?? "[Translation missing]";
        }
        e[langTo] = value;
    });
}

const infoDiv = document.getElementById('info');
const info = getUrlParams();
const message = {
    code: {
        info: lang.message.code,
        default: "-999"
    },
    desc: {
        info: lang.message.desc,
        default: "ERR_UNKNOWN_DISPLAY_ERROR"
    },
    time: {
        info: lang.message.time,
        default: new Date().toTimeString()
    },
    url: {
        info: lang.message.url,
        default: "N/A"
    }
};

// 显示信息
['code', 'desc', 'time', 'url'].forEach(id => {
    const p = document.createElement('p');
    const a = document.createElement('a');
    const isEmpty = ['', undefined].includes(info[id])

    p.id = id;
    a.id = id + '-content';
    p.innerText = message[id].info;
    a.innerHTML = isEmpty ? message[id].default : info[id];

    p.appendChild(a);
    infoDiv.appendChild(p);
});


// 来自 https://github.com/YCL0609/YCL-Public-library
function getUrlParams(name) {
    const urlSearch = window.location.search;
    const params = new URLSearchParams(urlSearch);
    if (!name) {
        // 不传 name：返回所有参数的键值对对象
        const allParams = {};
        for (const [key, value] of params.entries()) {
            allParams[key] = value;
        }
        return allParams;
    } else {
        // 传入 name 返回特定参数的值
        const value = params.get(name);
        return value === null ? undefined : value; // 参数不存在时返回 undefined
    }
}