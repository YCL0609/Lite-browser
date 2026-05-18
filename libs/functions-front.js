/**
 * 消息提示工具，支持 success/warning/error/info 四种消息类型
 */
class NoteMessage {
    static #isinit = false;

    /**
     * 初始化消息样式并插入页面，使用`#isinit`避免重复注入
     * @returns {Promise<void>}
     */
    static async #init() {
        if (this.#isinit) return;
        const css = ".LB-notes-container{position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none}.LB-note{min-width:200px;max-width:90vw;padding:8px 14px;border-radius:10px;box-shadow:0 2px 8px #00000033;color:#000;pointer-events:auto;cursor:pointer}.LB-info{background-color:#00ffffbb}.LB-error{background-color:#ff0000bb}.LB-success{background-color:#00ff00bb}.LB-warning{background-color:#ffff00bb}";
        const style = document.createElement('style');
        style.innerText = css;
        document.head.appendChild(style);
        this.#isinit = true;
    }

    /**
     * 显示提示消息，消息被用户点击时会自动移除
     * @param {'success'|'warning'|'error'|'info'} level 消息级别
     * @param {string} message 提示内容文本
     * @returns {string} 唯一消息元素 id
     */
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

    /**
     * 移除指定 id 的提示消息，若消息不存在则无操作
     * @param {string} id 消息元素的 id
     * @returns {void}
     */
    static closeMessage(id) {
        if (!this.#isinit || !id) return;
        const messageDiv = document.getElementById(id);
        const container = document.querySelector('.LB-notes-container');
        if (messageDiv) container.removeChild(messageDiv)
    }
}

/**
 * 工具文件操作控制器，用于读写删除工具数据文件并显示权限提示
 */
class toolsFileControl {
    static #permission = { read: false, write: false };
    static #toolName = "";
    static #isInit = false;
    static #lang = null;
    static #noLangText = "[Translation missing]";

    /**
     * 初始化文件操作控制器
     * @param {string} toolName 当前工具名称，用于访问 litebrowser 对应接口
     * @param {Object|null} lang 语言包对象，用于显示本地化消息
     * @returns {Promise<void>}
     */
    static async init(toolName = "", lang = null) {
        if (this.#isInit) return;
        try {
            // 设置工具名称
            this.#toolName = toolName;
            // 获取权限信息
            const permission = await litebrowser.dataDirPermission() || {};
            this.#permission = {
                read: permission.read ?? false,
                write: permission.write ?? false
            };
            // 设置语言文件
            this.#lang = lang;
            this.#lang ??= await litebrowser.getLang();
            // 标记已初始化
            this.#isInit = true;

            // 权限提示逻辑
            if (!this.#permission.read) {
                const id = NoteMessage.showMessage('error', this.#lang.permission?.read.tip ?? this.#noLangText);
                setTimeout(() => NoteMessage.closeMessage(id), 8000);
            }
            if (!this.#permission.write) {
                const id = NoteMessage.showMessage('warning', this.#lang.permission?.write.tip ?? this.#noLangText);
                setTimeout(() => NoteMessage.closeMessage(id), 8000);
            }
        } catch (err) {
            alert('toolsFileControl initialization failed!');
            console.error('toolsFileControl initialization failed: ', err.stack);
        }
    }

    /**
     * 读取本地文件内容
     * @param {string|null} name 待读取文件名
     * @returns {Promise<string>} 文件内容文本
     * @throws 读取失败时抛出异常
     */
    static async getFile(name = null) {
        if (!this.#isInit) throw new Error('Uninitialized toolsFileControl!');
        const msgID = NoteMessage.showMessage('warning', this.#lang.toolsFileControl?.loading ?? this.#noLangText);
        const tool = litebrowser[this.#toolName];
        const content = await tool?.get(name);
        if (!content?.status) {
            const unknowTip = this.#lang.toolsFileControl?.unknow ?? this.#noLangText
            NoteMessage.closeMessage(msgID);
            NoteMessage.showMessage('error', content?.message || unknowTip);
            throw new Error(content?.message || unknowTip);
        }
        NoteMessage.closeMessage(msgID);
        const okID = NoteMessage.showMessage('success', this.#lang.toolsFileControl?.readOK ?? this.#noLangText);
        setTimeout(() => NoteMessage.closeMessage(okID), 500);
        return content.message;
    }

    /**
     * 保存数据到本地文件
     *  - 若 `isauto` 参数为 `true`，则表示自动保存，此时会显示不同的提示消息且提示持续时间更短
     * @param {string} content 要保存的文本内容
     * @param {boolean} [isauto=false] 是否为自动保存
     * @param {any} [extparam=null] 额外参数，将传递给保存接口
     * @returns {Promise<boolean>} 保存成功返回 true，否则 false
     */
    static async saveFile(content = '', isauto = false, extparam = null) {
        if (!this.#isInit) throw new Error('Uninitialized toolsFileControl!');
        if (!this.#permission?.write) return;
        const msgID = !isauto ? NoteMessage.showMessage('warning', this.#lang.toolsFileControl?.saving ?? this.#noLangText) : null;
        const tool = litebrowser[this.#toolName];
        const response = await tool?.set(content, extparam);
        if (!isauto) NoteMessage.closeMessage(msgID);
        if (response?.status) {
            const OKTip = this.#lang.toolsFileControl?.saveOK ?? this.#noLangText;
            const autoOKTip = this.#lang.toolsFileControl?.autoSaveOK?? this.#noLangText;
            const okID = NoteMessage.showMessage('success', isauto ? autoOKTip : OKTip);
            setTimeout(() => NoteMessage.closeMessage(okID), isauto ? 500 : 2000);
            return true;
        } else {
            const unknowTip = this.#lang.toolsFileControl?.unknow ?? this.#noLangText;
            const errtext = response?.message || unknowTip;
            NoteMessage.showMessage('error', errtext);
            console.error(errtext);
            return false;
        }
    }

    /**
     * 删除指定文件
     * @param {string|null} name 待删除文件名
     * @returns {Promise<boolean>} 删除成功返回 true，否则 false
     */
    static async deleteFile(name = null) {
        if (!this.#isInit) throw new Error('Uninitialized toolsFileControl!');
        if (!this.#permission?.write) return
        const tool = litebrowser[this.#toolName];
        if (typeof tool?.del !== 'function') return;

        if (!confirm(this.#lang.toolsFileControl?.delCheck ?? this.#noLangText)) return;
        const msgID = NoteMessage.showMessage('warning', this.#lang.toolsFileControl?.deleting ?? this.#noLangText);
        try {
            const response = await tool.del(name);
            NoteMessage.closeMessage(msgID);
            if (response.status) {
                const okID = NoteMessage.showMessage('success', this.#lang.toolsFileControl?.deleteOK ?? this.#noLangText);
                setTimeout(() => NoteMessage.closeMessage(okID), 2000);
                return true;
            } else {
                NoteMessage.showMessage('error', response.message);
                console.error(response.message);
                return false;
            }
        } catch (err) {
            const Tip = this.#lang.toolsFileControl?.delError ?? this.#noLangText;
            NoteMessage.closeMessage(msgID);
            NoteMessage.showMessage('error', Tip + err.message);
            console.error(Tip, err.stack);
            return false;
        }
    }
}

export {
    NoteMessage,
    toolsFileControl,
}