window.onload = () => {
    const rootname = localStorage.getItem('rootname') || 'bing';  // 默认值为bing
    const input_Element = document.getElementById('root');
    const select_Element = document.getElementById("RootSelect");
    const markadd_Element = document.getElementById('markadd');
    const markdel_Element = document.getElementById('markdel');
    const markaddchick_Element = document.getElementById('markadd-chick');
    const markdelchick_Element = document.getElementById('markdel-chick');

    // 设置用户默认搜索引擎
    setInitialSearchEngine(rootname, input_Element, select_Element);

    // 下拉选择菜单事件
    select_Element.addEventListener("change", (event) => {
        const selectedValue = event.target.value;
        handleSelectChange(selectedValue, input_Element, select_Element);
    });

    // 自定义搜索引擎事件
    input_Element.addEventListener('input', () => {
        localStorage.setItem('root', input_Element.value); // 使用简化代码
    });

    // 书签管理事件
    markadd_Element.addEventListener('click', showAddBookmarkDiv);
    markaddchick_Element.addEventListener('click', addBookmark);
    markdel_Element.addEventListener('click', showDeleteBookmarkDiv);
    markdelchick_Element.addEventListener('click', deleteBookmark);

    // 加载书签
    loadBookmarks();

    // 输入框回车事件
    document.getElementById('word').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            urljump();
        }
    });
}

// 设置默认搜索引擎
function setInitialSearchEngine(rootname, input_Element, select_Element) {
    if (rootname === "self") {
        select_Element.value = 'self';
        input_Element.value = localStorage.getItem('root') || '';
        input_Element.style.display = null;
    } else {
        localStorage.setItem('root', 'https://cn.bing.com/search?q=');
        localStorage.setItem('rootname', 'bing');
        select_Element.value = 'bing';
    }
}

// 处理下拉选择变化
function handleSelectChange(selectedValue, input_Element, select_Element) {
    if (selectedValue === "self") {
        input_Element.style.display = "";
        localStorage.setItem('rootname', 'self');
    } else if (selectedValue === "bing") {
        localStorage.setItem('root', 'https://cn.bing.com/search?q=');
        localStorage.setItem('rootname', 'bing');
        input_Element.style.display = "none";
    }
}

// 展示添加书签的div
function showAddBookmarkDiv() {
    document.getElementById('markadd').style.display = "none";
    document.getElementById('markdel').style.display = "none";
    document.getElementById('markadd-div').style.display = "";
}

// 添加书签
function addBookmark() {
    const title = document.getElementById('markadd-name').value;
    const url = document.getElementById('markadd-url').value;
    const id = Date.now();
    const bookmarkId = 'bookmark_' + id;

    resetBookmarkUI();

    if (title && url) {
        const bookmark = { url, title, id };
        localStorage.setItem(bookmarkId, JSON.stringify(bookmark));
        addbookmark(url, title, id);
    } else {
        alert("书签标题和URL不能为空!"); // 错误提示
    }
}

// 展示删除书签的div
function showDeleteBookmarkDiv() {
    document.getElementById('markadd').style.display = "none";
    document.getElementById('markdel').style.display = "none";
    document.getElementById('markdel-div').style.display = "";
}

// 删除书签
function deleteBookmark() {
    const selectElement = document.getElementById('markdel-selsct');
    const selectedIndex = selectElement.selectedIndex;
    const selectedValue = selectElement.options[selectedIndex]?.value;

    if (selectedValue) {
        localStorage.removeItem("bookmark_" + selectedValue);
        selectElement.remove(selectedIndex);
        const linkElement = document.getElementById("bookmark-" + selectedValue);
        if (linkElement) {
            linkElement.href = "#";
            linkElement.style.textDecoration = "line-through";
        }
    } else {
        alert("请选择要删除的书签!"); // 错误提示
    }

    resetBookmarkUI();
}

// 加载书签
function loadBookmarks() {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('bookmark_')) {
            const bookmark = JSON.parse(localStorage.getItem(key));
            addbookmark(bookmark.url, bookmark.title, bookmark.id);
        }
    }
}

// 网页跳转事件
function urljump() {
    const url = document.getElementById("word").value.trim();
    if (url) {
        const pattern = /^(https?:\/\/)/i;
        const root = localStorage.getItem('root');

        try {
            if (pattern.test(url)) {
                window.open(url);
            } else {
                window.open(root + url);
            }
        } catch (err) {
            console.error("网址打开失败: ", err);
            alert("网址格式不正确!"); // 错误提示
        }
    }
}

// 添加书签到网页
function addbookmark(url, title, id) {
    const bookDiv = document.getElementById('bookmark-index');
    const delopt = document.getElementById('markdel-selsct');

    const link = document.createElement('a');
    link.textContent = title;
    link.onclick = () => { window.open(url) };
    link.href = "#";
    link.id = "bookmark-" + id;

    const br = document.createElement('br');
    bookDiv.appendChild(link);
    bookDiv.appendChild(br);

    const option = document.createElement('option');
    option.value = id;
    option.textContent = title;
    delopt.appendChild(option);
}

// 重置书签UI
function resetBookmarkUI() {
    document.getElementById('markadd').style.display = "";
    document.getElementById('markdel').style.display = "";
    document.getElementById('markadd-div').style.display = "none";
    document.getElementById('markdel-div').style.display = "none";
}
