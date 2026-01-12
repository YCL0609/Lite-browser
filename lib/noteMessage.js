export class NoteMessage {
    static #isinit = false;

    static #init() {
        if (this.#isinit) return;
        const css = ".LB-notes-container{position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none}.LB-note{min-width:200px;max-width:90vw;padding:8px 14px;border-radius:10px;box-shadow:0 2px 8px #00000033;color:#000;pointer-events:auto;cursor:pointer}.LB-info{background-color:#00ffffbb}.LB-error{background-color:#ff0000bb}.LB-success{background-color:#00ff00bb}.LB-warning{background-color:#ffff00bb}";
        const style = document.createElement('style');
        style.innerText = css;
        document.head.appendChild(style);
        this.#isinit = true;
    }

    static showMessage(level, message) {
        if (!this.#isinit) this.#init();
        // 获取或创建消息容器
        let container = document.querySelector('.LB-notes-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'LB-notes-container';
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
            case 'info':
                levelClass = 'info';
                break;
            default:
                levelClass = 'info';
        }

        // 创建消息元素
        const messageDiv = document.createElement('div');
        messageDiv.className = `LB-note LB-${levelClass}`;
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

    static closeMessage(id) {
        if (!this.#isinit || !id) return;
        const messageDiv = document.getElementById(id);
        const container = document.querySelector('.LB-notes-container');
        if (messageDiv) container.removeChild(messageDiv)
    }
}