import hmUI from '@zos/ui';
import { BaseWidget, BaseWidgetClass } from './BaseWidget.js';
import { createComponent } from './jsx-runtime.js';

export interface HmWidgetFactory extends Partial<HmWidget> {
  createWidget: (
    type: (typeof hmUI.prop)[keyof typeof hmUI.prop],
    props: Record<string, any>,
  ) => HmWidget;
}
export type HmWidget = ReturnType<typeof hmUI.createWidget>;

export type ExtendWidgetProps<
  T extends BaseWidget,
  P extends Record<string, any>,
> = T & {
  props: T['props'] & P;
};

type childrenPropTypeItem =
  | BaseWidget
  | null
  | undefined
  | number
  | string
  | boolean;
type childrenPropType = childrenPropTypeItem[] | childrenPropTypeItem;

export function children(
  fn: () => childrenPropType,
): () => BaseWidget | BaseWidget[] | null {
  function normalize(value: any): any {
    while (typeof value === 'function') {
      value = value();
    }
    if (value == null || typeof value === 'boolean') return null;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
      const result: any[] = [];
      for (let i = 0; i < value.length; i++) {
        const v = normalize(value[i]);
        if (v == null) continue;
        if (Array.isArray(v)) {
          result.push(...v); // 展开嵌套数组
        } else {
          result.push(v);
        }
      }
      return result;
    }

    // 其他对象（widget、component）
    return value;
  }

  return () => normalize(fn());
}

export function childrenArray(fn: () => childrenPropType): () => BaseWidget[] {
  const getChildren = children(fn);
  return () => {
    const value = getChildren();
    if (value == null) return [];
    if (Array.isArray(value)) return value;
    return [value];
  };
}

/**
 * **渲染Asuka组件**
 * @param Comp 要渲染的组件，支持类组件和函数组件
 * @param view 含有 `createWidget` 方法的对象，包括 `hmUI`, `GROUP`, `VIEW_CONTAINER`，默认为 `hmUI`
 * @returns 清除函数(目前只是取消绘制，还没有清除组件和所有副作用)
 */
export function render<
  T extends BaseWidget,
  P extends T['props'],
  K extends BaseWidget,
>(
  Comp: BaseWidgetClass<T> | ((props: P, self: BaseWidget) => K), view: HmWidgetFactory = hmUI): () => void {
  const root = createComponent(Comp as any, {});
  root.setup();
  root.render(view);
  return () => {
    root.clear();
  };
}