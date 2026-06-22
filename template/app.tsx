import { BaseApp } from '@zeppos/zml/base-app';
import { render } from '@cuberqaq/asuka-ui-lite';
import AppRoot from './src/App';

App(
  BaseApp({
    globalData: {
      render: () => render(() => <AppRoot />),
      onPageRender: () => render(() => <AppRoot />),
    },
    onCreate() {
      console.log('app on create');
    },
    onDestroy() {
      console.log('app on destroy');
    },
  }),
);
