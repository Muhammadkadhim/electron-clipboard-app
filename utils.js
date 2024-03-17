const { ipcRenderer } = require("electron");
const moment = require("moment");

function formatTime(date) {
  return moment(date).fromNow();
}

const getClipsContainer = () => {
  return document.getElementById("clipsContainer");
};

const getAllClipContainers = () => {
  return document.querySelectorAll(".clip");
};

const getClearClipsBtn = () => {
  return document.getElementById("clearClips");
};

const getDeleteClipsDialog = () => {
  return document.getElementById("deleteClipsDialog");
};
const getConfirmClipsDeletionBtn = () => {
  return document.getElementById("confirmClipsDeletion");
};
const getCancelClipsDeletionBtn = () => {
  return document.getElementById("cancelClipsDeletion");
};

const getGoToTopBtn = () => {
  return document.getElementById("goToTop");
};

const toggleEmptyClipsMessage = (show) => {
  const noClipsMessage = document.getElementById("noClipsMessage");
  if (show) {
    noClipsMessage.style.display = "flex";
    getClearClipsBtn().disabled = true;
  } else {
    noClipsMessage.style.display = "none";
    getClearClipsBtn().disabled = false;
  }
};

const createClipContainer = (clip) => {
  // Create clip container
  const clipContainer = document.createElement("section");
  clipContainer.classList.add("clip");
  clipContainer.setAttribute("id", clip.id);
  if (clip.newClip) clipContainer.classList.add("active-clip");

  // Create clip element
  const clipElement = createClipElement(clip);
  clipContainer.appendChild(clipElement);

  // Create clip footer
  const clipContainerFooter = document.createElement("footer");
  clipContainerFooter.classList.add("clip-footer");

  // Clipped time
  const clippedTimeElement = createClippedTimeElement(clip);
  clipContainerFooter.appendChild(clippedTimeElement);

  // Delete clip button
  const deleteClipButton = createDeleteClipButton(clip);
  clipContainerFooter.appendChild(deleteClipButton);

  // Add clip footer to clip container
  clipContainer.appendChild(clipContainerFooter);

  return clipContainer;
};

const createDeleteClipButton = (clip) => {
  const deleteClipButton = document.createElement("button");
  deleteClipButton.classList.add("delete-clip-btn");
  deleteClipButton.setAttribute("id", clip.id);

  const deleteIcon = document.createElement("i");
  deleteIcon.setAttribute("data-feather", "trash-2");
  deleteIcon.classList.add("trash-icon", "pico-color-red-400");
  deleteClipButton.appendChild(deleteIcon);

  return deleteClipButton;
};

const createClippedTimeElement = (clip) => {
  const clippedTimeElement = document.createElement("span");
  clippedTimeElement.classList.add("clipped-time", "pico-color-slate-500");
  clippedTimeElement.textContent = formatTime(clip.clipped_at);

  return clippedTimeElement;
};

const createClipElement = (clip) => {
  const clipElement = document.createElement("article");
  clipElement.classList.add("clip-element");
  if (clip.type === "text") {
    const clipTextElement = document.createElement("pre");
    clipTextElement.classList.add("clip-text");
    clipElement.setAttribute("data-clip-type", "text");
    clipTextElement.textContent = clip.text;
    clipElement.appendChild(clipTextElement);
  }

  if (clip.type === "image") {
    const clipImageElement = document.createElement("img");
    clipElement.setAttribute("data-clip-type", "image");
    clipImageElement.src = `${clip.imageDataUrl}`;
    clipElement.appendChild(clipImageElement);
  }

  return clipElement;
};

const clearClipsContainer = () => {
  getClipsContainer().innerHTML = "";
};
const addActiveClipClass = (clipElement) => {
  clipElement.classList.add("active-clip");
};
const removeActiveClipClass = (clipElement) => {
  clipElement.classList.remove("active-clip");
};
const showClips = (clips) => {
  toggleEmptyClipsMessage();

  clearClipsContainer();

  if (clips.length === 0) {
    toggleEmptyClipsMessage(true);
    return;
  }

  for (let i = 0; i < clips.length; i++) {
    const clipContainer = createClipContainer(clips[i]);
    if (clips[i].newClip) {
      addActiveClipClass(clipContainer);
    } else {
      removeActiveClipClass(clipContainer);
    }

    getClipsContainer().appendChild(clipContainer);
  }

  getAllClipContainers().forEach((clipContainer) => {
    clipContainer.addEventListener("click", () => {
      const isActive = clipContainer.classList.contains("active-clip");
      if (!isActive) {
        ipcRenderer.send("move-clip-to-top-request", {
          clipId: clipContainer.id,
        });
      }
    });

    // delete clip
    const deleteClipBtn = clipContainer.querySelector(".delete-clip-btn");
    deleteClipBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      ipcRenderer.send("delete-clip-request", {
        clipId: deleteClipBtn.id,
      });
    });
  });

  // feather.replace() turning icons into SVGs
  feather.replace();
};

module.exports = {
  getClipsContainer,
  getClearClipsBtn,
  toggleEmptyClipsMessage,
  createClipElement,
  clearClipsContainer,
  showClips,
  getDeleteClipsDialog,
  getConfirmClipsDeletionBtn,
  getCancelClipsDeletionBtn,
  getGoToTopBtn,
};
