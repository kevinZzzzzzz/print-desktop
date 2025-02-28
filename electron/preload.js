const { contextBridge, ipcRenderer } = require("electron");

window.addEventListener("DOMContentLoaded", () => {
  // const replaceText = (selector, text) => {
  //   const element = document.getElementById(selector)
  //   if (element) element.innerText = text
  // }

  for (const type of ["chrome", "node", "electron"]) {
    console.log(`${type}-version`, process.versions[type]);
  }
});

contextBridge.exposeInMainWorld("$electronAPI", {
  // 展示消息
  showNotification: (title, body) =>
    ipcRenderer.send("show-notification", title, body),
  // 设置缓存
  setStoreValue: (key, value) => {
    ipcRenderer.send("setStore", key, value);
  },
  // 获取缓存
  getStoreValue: (key) => {
    const resp = ipcRenderer.sendSync("getStore", key);
    return resp;
  },
  // 删除缓存
  delStoreValue: (key) => {
    ipcRenderer.send("delStore", key);
  },
  // 清空缓存
  clearStoreValue: () => {
    ipcRenderer.send("clearStore");
  },
  // 最小化
  hideWindow: () => {
    ipcRenderer.send("hide-window");
  },
  // 全屏
  fullScreen: (flag) => {
    ipcRenderer.send("full-screen", flag);
  },
  // 判断是否全屏
  isFullScreen: () => {
    const resp = ipcRenderer.sendSync("isFullScreen");
    return resp;
  },
  // 关闭
  closeWindow: () => {
    ipcRenderer.send("close-window");
  },
  // 获取打印机信息
  getPrintInfo: () => {
    const resp = ipcRenderer.sendSync("get-printInfo");
    return resp;
  },
  printFile: ({ url, deviceName }) => {
    ipcRenderer.sendSync("print-file", { url, deviceName });
  },
});
