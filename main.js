// Modules to control application life and create native browser window
const {
  app,
  BrowserWindow,
  Tray,
  ipcMain,
  globalShortcut,
  clipboard,
  Menu,
  nativeImage,
} = require("electron");
const path = require("node:path");
require("electron-reload")(__dirname);
const Store = require("electron-store");
const { v4: uuid } = require("uuid");
const crypto = require("crypto");

let tray = null;
const store = new Store();

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 350,
    height: 400,
    frame: false,
    movable: true,
    resizable: false,
    // skipTaskbar: true,
    icon: path.join(__dirname, "assets", "icons", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      contentSecurityPolicy: "default-src 'self' data:; img-src 'self' data:;",
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile("index.html");

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // hide window on load
  mainWindow.hide();

  // tray icon
  const iconPath = path.join(__dirname, "assets", "icons", "icon.png");
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);
  tray.setToolTip("Clips");

  // context menu
  if (!store.has("settings")) {
    store.set("settings", {
      theme: "system",
      alwaysOnTop: true,
    });
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Always on top",
      type: "checkbox",
      checked: store.get("settings.alwaysOnTop"),
      click: () => {
        store.set("settings.alwaysOnTop", !store.get("settings.alwaysOnTop"));
      },
    },
    {
      label: "Theme",
      enabled: false,
    },
    {
      label: "Dark",
      type: "radio",
      checked: store.get("settings.theme") === "dark",
      click: () => {
        store.set("settings.theme", "dark");
        mainWindow.webContents.send("theme-changed", { theme: "dark" });
      },
      accelerator: "",
    },
    {
      label: "Light",
      type: "radio",
      checked: store.get("settings.theme") === "light",
      click: () => {
        store.set("settings.theme", "light");
        mainWindow.webContents.send("theme-changed", { theme: "light" });
      },
      accelerator: "",
    },
    {
      label: "System default",
      type: "radio",
      checked: store.get("settings.theme") === "system",
      click: () => {
        store.set("settings.theme", "system");
        mainWindow.webContents.send("theme-changed", { theme: "system" });
      },
      accelerator: "",
    },
    {
      label: "Quit",
      click: () => {
        app.quit();
      },
    },
  ]);

  function updateWindowProperties() {
    mainWindow.setAlwaysOnTop(store.get("settings.alwaysOnTop"));
  }

  updateWindowProperties();

  store.onDidChange("settings.alwaysOnTop", updateWindowProperties);

  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    toggleWindow(mainWindow);
  });

  // toggling window via shortcuts
  globalShortcut.register("Alt+K", () => {
    toggleWindow(mainWindow);
  });

  ipcMain.on("minimize-window", () => {
    mainWindow.hide();
  });

  // create an entry for clips
  if (!store.get("clips")) {
    store.set("clips", []);
  }

  // save text clip
  ipcMain.on("save-text-clip-request", (event, data) => {
    const { text } = data;
    let storedClips = store.get("clips") || [];

    if (text.trim().length >= 1) {
      if (!storedClips.some((clip) => clip.text === text)) {
        storedClips = storedClips.map((storedClip) => {
          storedClip.newClip = false;
          return storedClip;
        });

        storedClips.push({
          id: uuid(),
          type: "text",
          text: text,
          newClip: true,
          clipped_at: new Date(),
        });
        store.set("clips", storedClips);

        event.reply("save-text-clip-response", {
          saved: true,
          clips: storedClips,
        });
      } else {
        const { clips, moved } = moveClipToTop(storedClips, null, text, null);
        if (moved) {
          store.set("clips", clips);
          event.reply("save-text-clip-response", { clips });
        }
      }
    }
  });

  // save image clip
  ipcMain.on("save-image-clip-request", (event, data) => {
    const { imageDataUrl, hash, prevHash } = data;

    let storedClips = store.get("clips") || [];

    if (
      !storedClips.some((clip) => clip.hash === hash && clip.hash !== prevHash)
    ) {
      storedClips = storedClips.map((storedClip) => {
        storedClip.newClip = false;
        return storedClip;
      });

      storedClips.push({
        id: uuid(),
        type: "image",
        imageDataUrl: imageDataUrl,
        hash: hash,
        newClip: true,
        clipped_at: new Date(),
      });
      store.set("clips", storedClips);

      event.reply("save-image-clip-response", {
        saved: true,
        clips: storedClips,
      });
    } else {
      const { clips } = moveClipToTop(storedClips, null, null, hash);
      store.set("clips", clips);
      event.reply("move-clip-to-top-response", { moved: true, clips });
    }
  });

  ipcMain.on("move-clip-to-top-request", (event, data) => {
    const { clipId } = data;
    let storedClips = store.get("clips") || [];
    const { clips } = moveClipToTop(storedClips, clipId, null, null);
    store.set("clips", clips);
    event.reply("move-clip-to-top-response", { moved: true, clips });
  });

  function moveClipToTop(storedClips, clipId, clipText, clipImageHash) {
    const clipIndex = storedClips.findIndex(
      (clip) =>
        clip.id === clipId ||
        clip.text === clipText ||
        clip.hash === clipImageHash
    );
    if (clipIndex !== -1 && !storedClips[clipIndex].newClip) {
      let movedClip = storedClips.splice(clipIndex, 1)[0];
      movedClip.newClip = true;
      if (movedClip.type === "text") {
        clipboard.writeText(movedClip.text);
      } else {
        const imageData = nativeImage.createFromDataURL(movedClip.imageDataUrl);
        clipboard.writeImage(imageData);
      }

      storedClips = storedClips.map((storedClip) => {
        storedClip.newClip = false;
        return storedClip;
      });
      storedClips.push(movedClip);
      return { moved: true, clips: storedClips };
    }
    return { moved: false, clips: storedClips };
  }

  ipcMain.on("delete-clip-request", (event, data) => {
    const { clipId } = data;
    const storedClips = store.get("clips") || [];
    let updatedClips = storedClips.filter((clip) => clip.id !== clipId);
    clipboard.clear();

    updatedClips = updatedClips.map((storedClip, index) => {
      if (index === updatedClips.length - 1) {
        storedClip.newClip = true;
        if (storedClip.type === "text") {
          clipboard.writeText(storedClip.text);
        } else if (storedClip.type === "image" && storedClip.imageDataUrl) {
          const imageData = nativeImage.createFromDataURL(
            storedClip.imageDataUrl
          );
          clipboard.writeImage(imageData);
        }
      } else {
        storedClip.newClip = false;
      }
      return storedClip;
    });
    store.set("clips", updatedClips);
    event.reply("delete-clip-response", { deleted: true, clips: updatedClips });
  });

  // get all clips
  ipcMain.on("get-all-clips-request", () => {
    const storedClips = store.get("clips") || [];
    mainWindow.webContents.send("get-all-clips-response", {
      clips: storedClips,
    });
  });

  // clear all clips
  ipcMain.on("clear-all-clips", () => {
    store.delete("clips");

    // Notify the renderer process that clips are cleared
    mainWindow.webContents.send("clips-cleared");
  });

  // send data on load
  mainWindow.webContents.on("dom-ready", () => {
    mainWindow.webContents.send("theme-changed", {
      theme: store.get("settings.theme"),
    });
  });

  // end of mainWindow
}

function toggleWindow(window) {
  if (window.isVisible()) {
    window.hide();
  } else {
    window.show();
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
