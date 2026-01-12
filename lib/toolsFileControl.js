import { NoteMessage } from "./noteMessage.js";

export class toolsFileControl {
    static #permission = { read: false, write: false };
    static #toolName = "";
    static #isInit = false;

    static async init(toolName = "") {
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

            // 标记已初始化
            this.#isInit = true;

            // 权限提示逻辑
            if (!this.#permission.read) {
                const id = NoteMessage.showMessage('error', '数据目录不可读, 所有项目将显示初始消息!');
                setTimeout(() => NoteMessage.closeMessage(id), 8000);
            }
            if (!this.#permission.write) {
                const id = NoteMessage.showMessage('warning', '数据目录不可写, 所有修改将无法存储到磁盘!');
                setTimeout(() => NoteMessage.closeMessage(id), 8000);
            }
        } catch (err) {
            alert('toolsFileControl初始化失败: ' + err.stack);
            console.error('toolsFileControl初始化失败:', err.stack);
        }
    }

    // 读取文件
    static async getFile(name = null) {
        if (!this.#isInit) throw new Error('Uninitialized toolsFileControl!');
        const msgID = NoteMessage.showMessage('warning', `正在读取历史文件...`);
        const tool = litebrowser[this.#toolName];
        const content = await tool?.get(name);
        if (!content?.status) {
            NoteMessage.closeMessage(msgID);
            NoteMessage.showMessage('error', content?.message || '未知错误');
            console.error(content?.message || '未知错误');
            return null;
        }
        NoteMessage.closeMessage(msgID);
        const okID = NoteMessage.showMessage('success', '读取成功');
        setTimeout(() => NoteMessage.closeMessage(okID), 500);
        return content.message;
    }

    // 保存文件
    static async saveFile(content = '', isauto = false, extparam = null) {
        if (!this.#isInit) throw new Error('Uninitialized toolsFileControl!');
        if (!this.#permission?.write) return;
        const msgID = !isauto ? NoteMessage.showMessage('warning', '正在保存文件...') : null;
        const tool = litebrowser[this.#toolName];
        const response = await tool?.set(content, extparam);
        if (!isauto) NoteMessage.closeMessage(msgID);
        if (response?.status) {
            const okID = NoteMessage.showMessage('success', isauto ? '自动保存成功' : '保存成功');
            setTimeout(() => NoteMessage.closeMessage(okID), isauto ? 500 : 2000);
            return true;
        } else {
            const errtext = (isauto ? '自动保存失败:' : '保存失败:') + response?.message || '未知错误';
            NoteMessage.showMessage('error', errtext);
            console.error(errtext);
            return false;
        }
    }

    // 删除文件
    static async deleteFile(name = null) {
        if (!this.#isInit) throw new Error('Uninitialized toolsFileControl!');
        if (!this.#permission?.write) return
        const tool = litebrowser[this.#toolName];
        if (typeof tool?.del !== 'function') return;

        if (!confirm(`确定要删除吗？操作不可撤销！`)) return;
        const msgID = NoteMessage.showMessage('warning', '正在删除...');
        try {
            const response = await tool.del(name);
            NoteMessage.closeMessage(msgID);
            if (response.status) {
                const okID = NoteMessage.showMessage('success', '删除成功');
                setTimeout(() => NoteMessage.closeMessage(okID), 2000);
                return true;
            } else {
                NoteMessage.showMessage('error', response.message);
                console.error(response.message);
                return false;
            }
        } catch (err) {
            NoteMessage.closeMessage(msgID);
            NoteMessage.showMessage('error', '删除失败: ' + err.message);
            console.error('删除失败:', err.stack);
            return false;
        }
    }
}