const { ipcRenderer } = require("electron");

const remote = require("electron").remote;
const Menu = remote.Menu;
const menuContextTemplate = [
    {
        label: "复制",
        role: "copy",
        click: () => {
            console.log("copy");
        }
    },
    {
        label: "粘贴",
        role: "paste",
        click: () => {
            console.log("paste");
        }
    },
    {
        label: "刷新",
        role: "reload",
        click: () => {
            console.log("reload");
        }
    },
    {
        label: "前进",
        role: "goForward",
        click: () => {
            console.log("goForward");
        }
    },
    {
        label: "后退",
        role: "goBack",
        click: () => {
            console.log("goBack");
        }
    },
    {
        label: "打开控制台",
        role: "openDevTool",
        click: () => {
            console.log("openDevTool");
            ipcRenderer.send('open-dev-tool');
        }
    },
];

// 用于构建MenuItem
const menuBuilder = Menu.buildFromTemplate(menuContextTemplate);
window.onload = () => {
    // 监听鼠标右键的点击事件
    window.addEventListener("contextmenu", (e) => {
        // 阻止默认事件
        e.preventDefault();
        // 调用popup方法弹出菜单
        menuBuilder.popup({
            window: remote.getCurrentWindow()
        })
    }, false);
}