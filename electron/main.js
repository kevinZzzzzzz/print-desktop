const {
  app,
  BrowserWindow,
  BrowserView,
  Tray,
  nativeImage,
  Menu,
  BaseWindow,
  WebContentsView,
  Notification,
  globalShortcut,
  protocol,
  ipcMain,
} = require("electron");
const crypto = require("crypto");
// const { autoUpdater } = require("electron-updater");
// const Multispinner = require("multispinner");
const path = require("path");
const listenEvent = require("./listenEvent.js");
let store; // 在全局作用域中声明
let tray;
const NODE_ENV = process.env.NODE_ENV;
const isDev = NODE_ENV === "development"; // 开发环境
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true"; // 禁用安全警告
app.commandLine.appendSwitch("disable-web-security");
app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors"); // 允许跨域
app.commandLine.appendSwitch("--ignore-certificate-errors", "true"); // 忽略证书相关错误
let win; // 窗口实例

protocol.registerSchemesAsPrivileged([
  {
    scheme: "print-desktop",
    privileges: {
      standard: true,
      secure: true,
      bypassCSP: true,
      supportFetchAPI: true,
      allowServiceWorkers: true,
      corsEnabled: true,
    },
  },
]);
// 加载一个新的BrowserWindow实例，并打开窗口
const createWindow = async () => {
  win = new BrowserWindow({
    width: 1000,
    height: 800,
    frame: true,
    // alwaysOnTop: true,
    titleBarStyle: "default",
    backgroundColor: "#fff",
    title: "测试xxx",
    icon: path.join(__dirname, "../../", "public/icons/256x256.png"),
    webPreferences: {
      sandbox: false,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      contextIsolation: true,
      webSecurity: false,
      enableRemoteModule: true,
      nodeIntegration: true, // 解决无法使用 require 加载的 bug
      // 引入预加载脚本
      preload: path.join(__dirname, "preload.js"),
    },
  });
  win.setAlwaysOnTop(true); // 打开后置顶
  win.removeMenu(); // 隐藏菜单栏
  setTimeout(() => {
    win.setAlwaysOnTop(false);
  }, 3000);
  if (isDev) {
    win.loadURL("http://192.168.120.178:8881/#/home");
    win.webContents.openDevTools();
  } else {
    win.loadFile("build/index.html");
    // win.webContents.openDevTools();
  }
  win.on("close", (e) => {
    e.preventDefault(); // 阻止退出程序
    // win.setSkipTaskbar(false); // 取消任务栏显示
    win.hide(); // 隐藏主程序窗口
  });
  const { default: Store } = await import("electron-store");
  store = new Store(); // 仓库初始化
  // 事件监听
  listenEvent(win, store);
};
// app模块在ready事件被激发后才会创建浏览器窗口，可以通过使用app.whenReady()API来监听此事件
app.whenReady().then(() => {
  createWindow();
  // autoUpdater.checkForUpdates(); // 热更新

  new Notification({
    title: "初始化",
    body: "打印机初始化完成",
  }).show();
  // 托盘
  const icon = nativeImage.createFromPath(
    path.join(__dirname, "../../", "public/icons/256x256.png")
  );
  const tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "退出",
      icon: nativeImage.createFromPath(
        path.join(__dirname, "../../", "public/icons/16x16.png")
      ),
      click: function () {
        win.destroy();
        app.quit();
      },
    },
  ]);
  tray.setToolTip("print-desktops");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    win.show();
  });
});
// macOS在没有窗口打开则打开一个新的窗口
app.on("activate", () => {
  // activate事件，用来监听app模块如果没有任何浏览器窗口是打开的，则创建一个新的窗口
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 监听窗口关闭时退出应用
// app.on("window-all-closed", () => {
//   new Notification({
//     title: "测试",
//     body: "测试结束",
//   }).show();
//   if (process.platform !== "darwin") {
//     // 如果不是macOS系统
//     app.quit();
//   }
// });
