import { ExtensionMetadata } from "../extensions";

export interface ExtensionState {
  metadata: ExtensionMetadata;
  frame?: HTMLIFrameElement;
  isActive: boolean;
  lastActive?: number;
}

class ExtensionViewManager {
  private readonly _extensionCollection: { [name: string]: ExtensionState };
  private readonly _maxActiveFrames: number;

  constructor() {
    this._maxActiveFrames = 2;
    this._extensionCollection = {};

    console.log("ExtensionViewManager");
    window.rendererOn(
      "extension-loaded",
      (evt: any, metadata: ExtensionMetadata) => {
        const state = this._handleExtensionLoaded(metadata);
      }
    );
  }

  getExtensionState(name: string) {
    return this._extensionCollection[name];
  }

  private _loadFrame(state: ExtensionState) {
    console.debug("_loadFrame");
    const iframe = document.createElement("iframe");
    iframe.setAttribute("frameBorder", "0");
    iframe.classList.add("extension-frame");
    iframe.src =
      "file:///" + (window as any).path.join(state.metadata.path, "index.html");
    return iframe;
  }

  private _getActiveFrameCount() {
    return Object.values(this._extensionCollection).filter(
      (ext) => ext.frame !== undefined
    ).length;
  }

  private _handleExtensionLoaded(metadata: ExtensionMetadata) {
    console.log("extension-loaded", metadata);
    const extensionState: ExtensionState = {
      metadata,
      isActive: Object.entries(this._extensionCollection).length === 0,
    };

    if (this._getActiveFrameCount() < this._maxActiveFrames) {
      extensionState.frame = this._loadFrame(extensionState);
    }

    this._extensionCollection[metadata.name] = extensionState;

    const event = new CustomEvent("extension-loaded", {
      detail: extensionState,
    });
    window.dispatchEvent(event);

    return extensionState;
  }
}

export const extensionViewManager = new ExtensionViewManager();
