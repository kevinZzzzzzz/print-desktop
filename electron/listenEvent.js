const {
  globalShortcut,
  ipcMain,
  app,
  net,
  Notification,
  BrowserWindow,
} = require("electron");
const https = require("https");
const http = require("http");
const fs = require("fs-extra");
const path = require("path");
const ptp = require("pdf-to-printer");

// 创建临时目录
const tempDir = path.join(app.getPath("temp"), "electron-print");
fs.ensureDirSync(tempDir);

function createNotification(title, body) {
  new Notification({ title, body }).show();
}
module.exports = (win, store) => {
  // 定义ipcRenderer监听事件
  // 消息弹窗
  ipcMain.on("show-notification", (event, title, body) => {
    createNotification(title, body);
  });
  // 保存数据
  ipcMain.on("setStore", (_, key, value) => {
    store.set(key, value);
  });
  // 获取数据
  ipcMain.on("getStore", (_, key) => {
    let value = store.get(key);
    _.returnValue = value || "";
  });
  // 删除数据
  ipcMain.on("delStore", (_, key) => {
    store.delete(key);
  });
  // 清空数据
  ipcMain.on("clearStore", () => {
    store.clear();
  });
  // 隐藏窗口
  ipcMain.on("hide-window", () => {
    win.minimize();
  });
  // 全屏窗口
  ipcMain.on("full-screen", (_, flag) => {
    // flag ? win.maximize() : win.minimize();
    win.setFullScreen(flag);
  });
  // 判断是否全屏
  ipcMain.on("isFullScreen", (_, flag) => {
    _.returnValue = win.isFullScreen();
  });
  // 关闭窗口
  ipcMain.on("close-window", () => {
    win.close();
  });
  // 获取系统打印机列表
  ipcMain.on("get-printInfo", async (_, flag) => {
    const printers = await win.webContents.getPrintersAsync();
    _.returnValue = printers;
  });
  // 打印
  ipcMain.on("print-file", (_, { url, deviceName }) => {
    try {
      // 下载 PDF
      const localPath = path.join(tempDir, `temp_${Date.now()}.pdf`);
      // 保存到本地
      downloadPDF(url, localPath, () => {
        ptp
          .print(localPath, {
            printer: deviceName, // 可选指定打印机
            silent: true,
          })
          .then(() => {
            createNotification("打印成功", "打印成功");
            // 删除pdf;
            try {
              fs.unlink(localPath, (err) => {
                if (err) {
                  console.error("无法删除文件:", err);
                }
              });
            } catch (err) {
              console.error("无法删除文件:", err);
            }
          });
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  });

  // 按键监听
  // 刷新
  globalShortcut.register("CommandOrControl+R", () => {
    win.reload();
  });
  // 强制刷新
  globalShortcut.register("CommandOrControl+Shift+R", () => {
    win.webContents.reloadIgnoringCache();
  });
  // 打开控制台
  globalShortcut.register("CommandOrControl+Shift+I", () => {
    win.webContents.openDevTools();
  });
};
function checkUrlProtocol(url) {
  try {
    // 自动补全协议头（处理无协议头的域名格式）
    const fullUrl = url.includes("://") ? url : `http://${url}`;
    const protocol = new URL(fullUrl).protocol.replace(":", "").toLowerCase();

    // 返回有效协议类型
    return protocol === "http" || protocol === "https" ? protocol : null;
  } catch (error) {
    // 捕获非法URL格式错误
    return null;
  }
}
// 下载 PDF 文件
const downloadPDF = async (url, outputPath, callback = null) => {
  const module = checkUrlProtocol(url) === "https" ? https : http;
  try {
    module
      .get(url, (response) => {
        if (response.statusCode === 200) {
          const fileStream = fs.createWriteStream(outputPath);
          response.pipe(fileStream);
          fileStream.on("finish", () => {
            fileStream.close();
            callback && callback();
          });
          fileStream.on("error", (err) => {
            createNotification("PDF download fail:", err);
          });
        } else {
          createNotification("PDF download fail:", response.statusCode);
        }
      })
      .on("error", (err) => {
        createNotification("PDF download fail:", err);
      });
  } catch (error) {
    createNotification("PDF download fail:", error);
  }
};
