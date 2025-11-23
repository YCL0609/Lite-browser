function showMessage(level, message) {
    // 获取或创建消息容器
    let container = document.querySelector('.lite-browser-notes-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'lite-browser-notes-container';
        document.body.appendChild(container);
    }
    // 根据级别设置样式
    let levelClass;
    switch (level) {
        case 'success':
            levelClass = 'success';
            break;
        case 'warning':
            levelClass = 'warning';
            break;
        case 'error':
            levelClass = 'error';
            break;
        default:
            levelClass = 'info';
    }

    // 创建消息元素
    const messageDiv = document.createElement('div');
    messageDiv.className = `lite-browser-note lite-browser-${levelClass}`;
    messageDiv.id = `note-${crypto.randomUUID()}`;
    messageDiv.innerText = message;

    // 点击消息时移除
    messageDiv.addEventListener('click', () => {
        if (messageDiv.parentNode) messageDiv.parentNode.removeChild(messageDiv);
        if (!container.hasChildNodes()) document.body.removeChild(container);
    });

    container.appendChild(messageDiv);
    return messageDiv.id;
}

function closeMessage(id) {
    const messageDiv = document.getElementById(id);
    const container = document.querySelector('.lite-browser-notes-container');
    if (messageDiv) container.removeChild(messageDiv)
}