import hmUI from '@zos/ui';
import { BaseWidget, BaseWidgetClass, NativeWidget } from './BaseWidget.js';
import { ExtendWidgetProps, HmWidgetFactory } from './common.js';
import { effect as _effect, type ReactiveEffect } from '@x1a0ma17x/zeppos-reactive';
import { activeFuncComp, FuncComponent } from './funcComponent.js';
export * from '@x1a0ma17x/zeppos-reactive';

const effect = <T>(fn: (prev: T | undefined) => T, initialValue?: T) => {
  const eff = _effect(fn, initialValue);
  if (activeFuncComp) {
    activeFuncComp.__effects.push(eff as ReactiveEffect<unknown>);
  }
  return eff;
};

export { effect };

export function createComponent<
  T extends BaseWidget,
  P extends T['props'],
  K extends Partial<P>,
>(Comp: BaseWidgetClass<T>, props: K): ExtendWidgetProps<T, K>;
export function createComponent<
  P extends Record<string, any>,
  K extends BaseWidget,
>(
  Comp: (props: P, self: BaseWidget) => K,
  props: Partial<P>,
): ExtendWidgetProps<FuncComponent<K, P>, P>;
export function createComponent<
  T extends BaseWidget,
  P extends T['props'],
  K extends BaseWidget,
>(
  Comp: BaseWidgetClass<T> | ((props: P, self: BaseWidget) => K),
  props: Partial<P>,
): ExtendWidgetProps<T, P> | ExtendWidgetProps<FuncComponent<K, P>, P> {
  if (typeof Comp !== 'function') {
    throw new Error('Component must be a function or a class, received:' + Comp);
  }
  if (!Comp?.prototype?.render) {
    return new (FuncComponent(Comp as (props: P, self: BaseWidget) => K))(
      props,
    ) as ExtendWidgetProps<FuncComponent<K, P>, P>;
  } else
    return new (Comp as BaseWidgetClass<T>)(props) as ExtendWidgetProps<T, P>;
}

export function createWidget(
  type: (typeof hmUI.prop)[keyof typeof hmUI.prop],
  props: Record<string, any>,
): NativeWidget {
  return {
    __isAsukaWidget: true,
    __isNativeWidget: true,
    __active: false,
    __widget: null,
    props,
    setup() {},
    render(view: HmWidgetFactory) {
      if (this.__widget) this.clear();
      this.__widget = view.createWidget(type, props);
      this.__active = true;
    },
    clear() {
      if (this.__widget) {
        hmUI.deleteWidget(this.__widget);
        this.__widget = null;
      }
      this.__active = false;
    },
    cleanup() {},
  };
}

export function createElement(type: string) {
  let _type = type.toUpperCase();
  if (!(_type in hmUI.widget)) {
    throw new Error(`Invalid widget type: ${_type}`);
  }
  return createWidget(hmUI.widget[_type as keyof typeof hmUI.widget], {});
}

export function setProp(widget: NativeWidget, prop: string, value: any) {
  widget.props[prop] = value;
  if (widget.__active) {
    widget.__widget?.setProperty(hmUI.prop.MORE, widget.props as any); // TODO 不一定适用于所有的组件
  }
}

function setProperties(widget: NativeWidget, props: Record<string, any>) {
  Object.assign(widget.props, props);
  if (widget.__active) {
    widget.__widget?.setProperty(hmUI.prop.MORE, widget.props as any); // TODO 不一定适用于所有的组件
  }
}

// solid-js compatible
export function spread<T extends Record<string, any>>(
  widget: NativeWidget,
  accessor: (() => T) | T,
  skipChildren?: Boolean,
): void {
  if (typeof accessor === 'function') {
    effect(() => {
      const props: T = (accessor as any)();
      setProperties(widget, props);
    });
  } else {
    setProperties(widget, accessor);
  }
}

export declare namespace JSX {
  type IntrinsicElements = Record<
    Lowercase<keyof typeof hmUI.widget>,
    Parameters<typeof hmUI.createWidget>[1]
  >;
}
