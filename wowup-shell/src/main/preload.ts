// All of the Node.js APIs are available in the preload process.

import { ipcRenderer, IpcRendererEvent } from "electron";
import * as path from "path";

(window as any).path = {
  join: path.join,
};

(window as any).require = (reqPath: string): any => {
  const newPath = path.join(__dirname, "..", "renderer", reqPath);
  return require(newPath);
};
// It has the same sandbox as a Chrome extension.
window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector);
    if (element) {
      element.innerText = text;
    }
  };

  for (const type of ["chrome", "node", "electron"]) {
    replaceText(
      `${type}-version`,
      process.versions[type as keyof NodeJS.ProcessVersions]
    );
  }
});

window.rendererInvoke = (channel: string, ...args: any[]): Promise<any> => {
  return ipcRenderer.invoke(channel, ...args);
};

window.rendererOff = (event: string, listener: (...args: any[]) => void) => {
  ipcRenderer.removeListener(event, listener);
};

window.rendererOn = (
  channel: string,
  listener: (event: IpcRendererEvent, ...args: any[]) => void
) => {
  ipcRenderer.on(channel, listener);
};
