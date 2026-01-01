const infoDiv = document.getElementById('info');
const info = getUrlParams();
const message = {
    code: {
        info: "错误代码:",
        default: "-999"
    },
    desc: {
        info: "错误描述:",
        default: "ERR_UNKNOWN_DISPLAY_ERROR"
    },
    time: {
        info: "发生时间:",
        default: new Date().toTimeString()
    },
    url: {
        info: "错误网址:",
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