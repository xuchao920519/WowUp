import { app, BrowserView, BrowserWindow, session } from "electron";
import * as path from "path";
import { extensionManager } from "../extensions";

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    width: 800,
  });

  // and load the index.html of the app.
  const indexPath = path.join(__dirname, "..", "..", "index.html");
  console.log(indexPath);
  mainWindow.loadFile(indexPath);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  return mainWindow;
}

// function createExtensionWindow(window: BrowserWindow) {
//   const windowBounds = window.getBounds();

//   const view = new BrowserView();
//   window.setBrowserView(view);
//   view.setBounds({
//     x: 48,
//     y: 0,
//     width: windowBounds.width - 63,
//     height: windowBounds.height,
//   });
//   view.webContents.loadURL("https://wowup.io");
//   view.setAutoResize({
//     width: true,
//     height: true,
//   });
//   return view;
// }

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  const mainWindow = createWindow();

  extensionManager.on("extension-loaded", (extension) => {
    mainWindow.webContents.send("extension-loaded", extension.metadata);
  });

  mainWindow.webContents.on("dom-ready", () => {
    const extPath = path.resolve(path.join(__dirname, "..", "..", "test-ext"));
    const extwPath = path.resolve(
      path.join(__dirname, "..", "..", "test-wowup-ext")
    );

    extensionManager
      .installExtension(extPath)
      .then(() => extensionManager.installExtension(extwPath))
      .then(() => extensionManager.listExtensions())
      .then((extensions) => {
        console.debug("Exts", extensions);
        const tasks = extensions.map((extension) =>
          extensionManager.instantiateExtension(extension)
        );

        return Promise.all(tasks);
      })
      .then(() => console.debug("Extensions loaded"))
      .catch((e) => console.error(e));
  });

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
