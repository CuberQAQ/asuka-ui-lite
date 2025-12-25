import hmUI from '@zos/ui';
import { BaseWidget, BaseWidgetClass, NativeWidget } from './BaseWidget.js';
import { ExtendWidgetProps, HmWidgetFactory } from './common.js';
import {
  effect as _effect,
  effect,
  type ReactiveEffect,
} from '@x1a0ma17x/zeppos-reactive';
import { activeFuncComp, FuncComponent } from './funcComponent.js';
import { px } from '@zos/utils';
export * from '@x1a0ma17x/zeppos-reactive';

// const effect = <T>(fn: (prev: T | undefined) => T, initialValue?: T) => {
//   const eff = _effect(fn, initialValue);
//   if (activeFuncComp) {
//     activeFuncComp.__effects.push(eff as ReactiveEffect<unknown>);
//   }
//   return eff;
// };

// export { effect };

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
    throw new Error(
      'Component must be a function or a class, received:' + Comp,
    );
  }
  if (!Comp?.prototype?.render) {
    return new (FuncComponent(Comp as (props: P, self: BaseWidget) => K))(
      props,
    ) as ExtendWidgetProps<FuncComponent<K, P>, P>;
  } else
    return new (Comp as BaseWidgetClass<T>)(props) as ExtendWidgetProps<T, P>;
}

var activeWidgetCnt = 0;




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
    setup() {
      console.log(`${++activeWidgetCnt} widget created`);
    },
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
    cleanup() {
      console.log(`${activeWidgetCnt--} widget cleanup`);
      this.props = {};
    },
  };
}

export function createElement(type: string) {
  let _type = type.toUpperCase();
  if (!(_type in hmUI.widget)) {
    throw new Error(`Invalid widget type: ${_type}`);
  }
  return createWidget(hmUI.widget[_type as keyof typeof hmUI.widget], {});
}

const PxMapProps = {
  'x': 'x',
  'y': 'y',
  'w': 'w',
  'h': 'h',
  'text_size': 'text_size',
  'radius': 'radius',
  'center_x': 'center_x',
  'center_y': 'center_y',
  'line_width': 'line_width',
  'line_progress_end_x': 'line_progress_end_x',
  'line_progress_end_y': 'line_progress_end_y',
  'line_progress_start_x': 'line_progress_start_x',
  'line_progress_start_y': 'line_progress_start_y',
  'line_progress_width': 'line_progress_width',
  'pos_x': 'pos_x',
  'pos_y': 'pos_y',
}

export function setProp(widget: NativeWidget, prop: string, value: any) {
  if(prop in PxMapProps && typeof value === 'string') value = px(parseInt(value));
  widget.props[prop] = value;
  if (widget.__active) {
    if (typeof value === 'function' || prop.endsWith('func')) {
      if (widget.__widget) (widget.__widget as any)[prop] = value;
    } else {
      const safeProps: Record<string, any> = {};
      for (const key in widget.props) {
        if (typeof widget.props[key] !== 'function' && !key.endsWith('func')) {
          safeProps[key] = widget.props[key];
        }
      }
      widget.__widget?.setProperty(hmUI.prop.MORE, safeProps as any);
    }
  }
}

function setProperties(widget: NativeWidget, props: Record<string, any>) {
  const safeProps: Record<string, any> = {};
  for (const key in props) {
    if (typeof props[key] === 'function' || key.endsWith('func')) {
      if (widget.__widget) (widget.__widget as any)[key] = props[key];
    } else {
      if(key in PxMapProps && typeof props[key] === 'string') props[key] = px(parseInt(props[key]));
      safeProps[key] = props[key];
    }
  }
  Object.assign(widget.props, props);
  widget.__widget?.setProperty(hmUI.prop.MORE, safeProps as any);
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
