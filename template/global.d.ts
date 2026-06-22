/// <reference path="./node_modules/@zeppos/device-types/dist/index.d.ts" />

declare const __SIMULATOR__: boolean;

interface GlobalData {
  render: (fn: () => any) => any;
  App: () => any;
  onPageInit?: () => void;
  onPageRender: () => () => void;
  onPageDestroy?: () => void;
}

declare module '@zeppos/zml/base-app' {
  export function BaseApp(config: any): any;
}

declare module '@zeppos/zml/base-side' {
  export function BaseSideService(config: any): any;
}

declare module '@zeppos/zml/base-page' {
  export function BasePage(config: any): any;
}
