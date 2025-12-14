import { untrack, type ReactiveEffect } from '@x1a0ma17x/zeppos-reactive';
import { BaseWidget, BaseWidgetClass } from './BaseWidget.js';
import { HmWidgetFactory } from './common.js';

const FuncComponentMap = new WeakMap<Function, BaseWidgetClass<BaseWidget>>();

export var activeFuncComp: FuncComponent<BaseWidget, any> | null = null;

export declare interface FuncComponent<
  T extends BaseWidget,
  P extends T['props'],
> extends BaseWidget {
  props: P;
  __child: T | null;
  __effects: ReactiveEffect<unknown>[];
}

export function FuncComponent<
  T extends BaseWidget,
  P extends Record<string, any>,
>(
  Comp: (props: P, self: BaseWidget) => T,
): BaseWidgetClass<FuncComponent<T, P>> {
  if (FuncComponentMap.has(Comp)) {
    return FuncComponentMap.get(Comp)! as BaseWidgetClass<FuncComponent<T, P>>;
  } else {
    const name = Comp.name || 'AnonymousFuncComp';
    const _ = {
      [name]: class implements FuncComponent<T, P> {
        __isAsukaWidget: true = true;
        __child: T | null = null;
        __effects: ReactiveEffect<unknown>[] = [];
        constructor(public props: P) {}
        setup(): void {
          let prev = activeFuncComp;
          activeFuncComp = this;
          try {
            this.__child = untrack(() => Comp(this.props, this));
          } finally {
            activeFuncComp = prev;
          }
          if (this.__child) this.__child.setup();
        }
        render(view: HmWidgetFactory): void {
          if (!this.__child) {
            throw new Error(`Component not setup, name: ${Comp.name}`);
          }
          this.__child.render(view);
        }
        clear(): void {
          this.__child!.clear();
        }
        cleanup(): void {
          this.__child!.cleanup();
          this.__effects.forEach((effect) => effect.stop());
          this.__effects = [];
        }
      },
    };
    FuncComponentMap.set(Comp, _[Comp.name]);
    return _[name];
  }
}

export function defineFields(fields: Record<string, any>) {
  if (activeFuncComp === null) {
    console.log(
      `defineFields should be called in func component setup() synchronously`,
    );
    return;
  }
  Object.assign(activeFuncComp, fields);
}
