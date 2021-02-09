/* eslint-disable @typescript-eslint/no-var-requires */
import { app } from "electron";
import { EventEmitter } from "events";
import * as path from "path";
import * as fs from "fs-extra";
import { Disposable } from "./utils";

export interface Extension extends Disposable {
  activate(): void;
}

export class ExtensionContainer implements Disposable {
  extension: Extension;
  metadata: ExtensionMetadata;

  get name(): string {
    return this.metadata.name || "";
  }

  get version(): string {
    return this.metadata.version || "";
  }

  constructor(extension: Extension, metadata: ExtensionMetadata) {
    this.extension = extension;
    this.metadata = metadata;
  }

  dispose(): void {
    try {
      this.extension?.dispose();
    } catch (e) {
      console.error(`Failed to dispose ${this.name}`, e);
    }
  }
}

export interface WowupExtensionMetadata {
  icon?: string;
}

export interface ExtensionMetadata {
  name: string;
  version: string;
  wowup?: WowupExtensionMetadata;

  // derived
  path: string;
  iconPath: string;
  iconBase64: string;
}

export interface ExtensionContext {
  appVersion: string;
}

declare interface ExtensionManager {
  on(
    event: "extension-loaded",
    listener: (name: ExtensionContainer) => void
  ): this;
}

class ExtensionManager extends EventEmitter implements Disposable {
  private readonly _extensionContext: ExtensionContext;
  private readonly _extensionPath: string;
  private _extensionCollection: { [name: string]: ExtensionContainer };

  constructor() {
    super();

    this._extensionPath = path.join(
      app.getPath("userData"),
      "wowup-extensions"
    );
    console.debug(this._extensionPath);

    this._extensionCollection = {};
    this._extensionContext = {
      appVersion: app.getVersion(),
    };

    fs.ensureDirSync(this._extensionPath);
  }

  dispose(): void {
    Object.keys(this._extensionCollection).forEach((key) => {
      this._extensionCollection[key].dispose();
    });
    this._extensionCollection = {};
  }

  async listExtensions() {
    const results = await fs.readdir(this._extensionPath, {
      withFileTypes: true,
    });

    return results
      .filter((result) => result.isDirectory())
      .map((dir) => path.join(this._extensionPath, dir.name));
  }

  instantiateExtension(path: string) {
    return this._instantiateExtension(path);
  }

  installExtension(path: string) {
    return this._installExtension(path);
  }

  private async _installExtension(extensionPath: string) {
    try {
      const extensionMetadata = this._loadExtensionMetadata(extensionPath);
      await fs.copy(
        extensionPath,
        path.join(this._extensionPath, extensionMetadata.name)
      );
      console.log("success!");
    } catch (err) {
      console.error(err);
    }
  }

  private _loadExtensionMetadata(extPath: string) {
    const extensionMetadata: ExtensionMetadata = require(path.join(
      extPath,
      "package.json"
    ));
    this._validateMetadata(extensionMetadata);

    return extensionMetadata;
  }

  private async _instantiateExtension(extPath: string) {
    try {
      const extensionMetadata = this._loadExtensionMetadata(extPath);
      const extension: Extension = require(extPath);
      this._validateExtension(extension);

      extensionMetadata.path = extPath;
      extensionMetadata.iconPath = path.join(
        extPath,
        extensionMetadata.wowup?.icon
      );
      extensionMetadata.iconBase64 = await this._loadIcon(
        extensionMetadata.iconPath
      );

      extension.activate.call(null, this._extensionContext);

      const extensionContainer = new ExtensionContainer(
        extension,
        extensionMetadata
      );

      this._extensionCollection[extensionContainer.name] = extensionContainer;
      this.emit("extension-loaded", extensionContainer);
    } catch (e) {
      console.error("Failed to load extension", e);
    }
  }

  private async _loadIcon(iconPath: string) {
    const buffer = await fs.readFile(iconPath);
    return `data:image/png;charset=utf-8;base64,${buffer.toString("base64")}`;
  }

  private _validateExtension(extension: Extension) {
    if (!extension) {
      throw new Error("Invalid extension detected");
    }

    if (typeof extension.activate !== "function") {
      throw new Error("Extension activate method is required");
    }

    if (typeof extension.dispose !== "function") {
      throw new Error("Extension dispose method is required");
    }
  }

  private _validateMetadata(metadata: ExtensionMetadata) {
    if (!metadata.name) {
      throw new Error("Extension metadata.name is required");
    }

    if (!metadata.version) {
      throw new Error("Extension metadata.version is required");
    }

    return true;
  }
}

export const extensionManager = new ExtensionManager();
