const { ipcRenderer, clipboard } = require("electron");

const {
  getClearClipsBtn,
  toggleEmptyClipsMessage,
  clearClipsContainer,
  showClips,
  getDeleteClipsDialog,
  getConfirmClipsDeletionBtn,
  getCancelClipsDeletionBtn,
  getGoToTopBtn,
} = require("./utils");
const crypto = require("crypto");

document.getElementById("minimize").addEventListener("click", () => {
  ipcRenderer.send("minimize-window");
});

let prevHash = "";
function getLatestClipFromDeviceClipboard() {
  const text = clipboard.readText();
  const image = clipboard.readImage();

  if (!image.isEmpty()) {
    const imageDataUrl = image.toDataURL();
    const hash = crypto.createHash("sha256").update(imageDataUrl).digest("hex");

    if (hash !== prevHash) {
      ipcRenderer.send("save-image-clip-request", {
        imageDataUrl: imageDataUrl,
        hash: hash,
        prevHash: prevHash,
      });
      prevHash = hash;
    }

    return;
  }

  ipcRenderer.send("save-text-clip-request", { text });
}

ipcRenderer.removeAllListeners("save-text-clip-response");

ipcRenderer.on("save-text-clip-response", (event, data) => {
  const { clips } = data;
  showClips([...clips].reverse());
});

ipcRenderer.removeAllListeners("save-image-clip-response");

ipcRenderer.on("save-image-clip-response", (event, data) => {
  const { clips } = data;

  showClips([...clips].reverse());
});

document.addEventListener("DOMContentLoaded", () => {
  ipcRenderer.send("get-all-clips-request");
  applyTheme();
});

ipcRenderer.on("get-all-clips-response", (event, data) => {
  const { clips } = data;
  showClips([...clips].reverse());
});

ipcRenderer.on("move-clip-to-top-response", (event, data) => {
  const { clips, moved } = data;

  if (moved) {
    console.log(clips);
    showClips([...clips].reverse());
  }
});

getClearClipsBtn().addEventListener("click", () => {
  getDeleteClipsDialog().setAttribute("open", true);
});

getConfirmClipsDeletionBtn().addEventListener("click", () => {
  getDeleteClipsDialog().setAttribute("open", false);
  ipcRenderer.send("clear-all-clips");
  clipboard.clear();
  toggleEmptyClipsMessage();
});

getCancelClipsDeletionBtn().addEventListener("click", () => {
  getDeleteClipsDialog().setAttribute("open", false);
});

ipcRenderer.on("clips-cleared", () => {
  clearClipsContainer();
  toggleEmptyClipsMessage(true);
});

ipcRenderer.on("delete-clip-response", (event, data) => {
  const { clips, deleted } = data;
  if (deleted) {
    showClips([...clips].reverse());
  }
});

ipcRenderer.on("theme-changed", (event, data) => {
  const { theme } = data;
  applyTheme(theme);
});

function applyTheme(theme) {
  console.log(theme);
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else if (theme === "system") {
    document.documentElement.removeAttribute("data-theme");
  }
}

getGoToTopBtn().addEventListener("click", () => {
  document.documentElement.scrollTop = 0;
});

setInterval(getLatestClipFromDeviceClipboard, 500);
