// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process unless
// nodeIntegration is set to true in webPreferences.
// Use preload.js to selectively enable features
// needed in the renderer process.

import { ExtensionMetadata } from "../extensions";
import { ExtensionState, extensionViewManager } from "./extension-view-manager";

const singletons: any = {};

let mainContent: HTMLDivElement;
let activeExtension: ExtensionState = undefined;

console.debug("Load");
window.addEventListener(
  "DOMContentLoaded",
  () => {
    mainContent = document.querySelector(".main-content");
    singletons["extensionViewManager"] = extensionViewManager;
  },
  false
);

window.addEventListener("extension-loaded", (evt: CustomEvent) => {
  renderExtensionIcon(evt.detail);
  if (!activeExtension) {
    activeExtension = activateExtension(evt.detail.metadata);
  }
});

// window.rendererOn(
//   "extension-loaded",
//   (evt: any, metadata: ExtensionMetadata) => {
//     console.log("extension-loaded", metadata);
//     renderExtensionIcon(metadata);
//   }
// );

function activateExtension(metadata: ExtensionMetadata) {
  console.debug("activeExtension");
  const extension = extensionViewManager.getExtensionState(metadata.name);
  if (extension.frame) {
    console.debug("activeExtension frame");
    mainContent.innerHTML = "";
    mainContent.appendChild(extension.frame);
    extension.lastActive = Date.now();
  }

  return extension;
}

function clearSelectedExtension() {
  const listItems = document.querySelectorAll("#main-action-list li");
  listItems.forEach((item) => {
    item.classList.remove("active");
  });
}

function renderExtensionIcon(state: ExtensionState) {
  const actionList = document.querySelector("#main-action-list");
  const template: any = document.querySelector("#extension-action");

  // Clone the new row and insert it into the table
  const clone = template.content.cloneNode(true);

  const listItem: HTMLElement = clone.querySelector("li");
  listItem.setAttribute("title", state.metadata.name);
  listItem.addEventListener(
    "click",
    () => {
      if (activeExtension?.metadata?.name === state.metadata.name) {
        return;
      }
      clearSelectedExtension();
      activeExtension = activateExtension(state.metadata);
      listItem.classList.add("active");
    },
    false
  );

  if (state.isActive) {
    listItem.classList.add("active");
  }

  const img: HTMLImageElement = clone.querySelector(".action-icon");
  img.src = state.metadata.iconBase64;

  actionList.appendChild(clone);
}
