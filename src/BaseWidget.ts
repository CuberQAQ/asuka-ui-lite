import { HmWidget, HmWidgetFactory } from './common.js';

export interface BaseWidget {
  __isAsukaWidget: true;
  props: Record<string, any>;
  setup(): void;
  render(view: HmWidgetFactory): void;
  clear(): void;
  // cleanup?(): void;
}

export interface NativeWidget extends BaseWidget {
  __isNativeWidget: true;
  __active: boolean;
  __widget: HmWidget | null;
}

export interface BaseWidgetClass<T extends BaseWidget> {
  new (props: any): T;
}

export function isBaseWidget(widget: any): widget is BaseWidget {
  return '__isAsukaWidget' in widget;
}

export function isNativeWidget(widget: BaseWidget): widget is NativeWidget {
  return '__isNativeWidget' in widget;
}
