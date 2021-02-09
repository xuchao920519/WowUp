import { IpcRendererEvent } from "electron";

declare global {
  interface Window {
    rendererInvoke: (channel: string, ...args: any[]) => Promise<any>;
    rendererOff: (
      event: string,
      listener: (...args: any[]) => void
    ) => void;
    rendererOn: (
      channel: string,
      listener: (event: IpcRendererEvent, ...args: any[]) => void
    ) => void;
  }
}
