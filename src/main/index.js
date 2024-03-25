import { app, BrowserWindow,ipcMain, globalShortcut } from 'electron';
import '../renderer/store'
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}


let mainWindow, templateWindow;
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

  //模板预览窗口
  function createTemplateWindow(){
    ipcMain.on('template-preview',(_,htmlsrc)=>{
      if(!templateWindow) {
        templateWindow = new BrowserWindow({
          height: 600,
          // useContentSize: true,
          width: 1200,
          x: 100,
          y: 100,
          title:"内容查看",
          webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
          },
        })
      } else {
        templateWindow.focus();
      }
      templateWindow.webContents.closeDevTools();
      templateWindow.loadFile(htmlsrc);
    
      templateWindow.on('closed',()=>{
        templateWindow = null;
      })
    })
  }

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 600,
    // useContentSize: true,
    width: 1200,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
  })
  mainWindow.loadURL(winURL)
  mainWindow.webContents.closeDevTools();
  globalShortcut.register("CommandOrControl+Shift+i", () => {
    mainWindow.webContents.openDevTools();
  });

  mainWindow.on('closed', () => {
    mainWindow = null
  })
  createTemplateWindow();
}

ipcMain.on('open-dev-tool',()=>{
  mainWindow.webContents.openDevTools();
})

// // 获取APP当前主题模式
// ipcMain.handle("dark-mode", () => {
//   return nativeTheme.themeSource;
// });
// // 设置APP主题模式
// ipcMain.handle("dark-mode:change", (_, type) => {
//   nativeTheme.themeSource = type;
//   return nativeTheme.themeSource;
// });

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
