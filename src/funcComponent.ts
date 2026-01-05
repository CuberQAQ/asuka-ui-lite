import {
  scoped,
  untrack,
  type ReactiveEffect,
} from '@x1a0ma17x/zeppos-reactive';
import { BaseWidget, BaseWidgetClass } from './BaseWidget.js';
import { HmWidgetFactory } from './common.js';

const FuncComponentMap = new WeakMap<Function, BaseWidgetClass<BaseWidget>>();

export var activeFuncComp: FuncComponent<BaseWidget, any> | null = null;

var activeFuncCnt = 0;

export declare interface FuncComponent<
  T extends BaseWidget,
  P extends T['props'],
> extends BaseWidget {
  props: P;
  __child: T | null;
  __effects: ReactiveEffect<unknown>[];
  __disposes: (() => void)[];
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
        __disposes: (() => void)[] = [];
        constructor(public props: P) {}
        setup(): void {

          // console.log(`${++activeFuncCnt} FuncComponent setup: ${name}`);

          scoped(() => {
            let prev = activeFuncComp;
            activeFuncComp = this;
            try {
              this.__child = untrack(() => Comp(this.props, this));
            } finally {
              activeFuncComp = prev;
            }
            if (this.__child) this.__child.setup();
          }, this.__effects);
        }
        render(view: HmWidgetFactory): void {
          this.__child?.render(view);
        }
        clear(): void {
          this.__child?.clear();
        }
        cleanup(): void {
          // console.log(`${activeFuncCnt++} FuncComponent cleanup: ${name}`);
          this.__child?.cleanup();
          this.__child = null;
          this.__effects.forEach((effect) => effect.stop());
          this.__effects = [];
          this.__disposes.forEach((dispose) => dispose());
          this.__disposes = [];
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

export function onCleanup(fn: () => void) {
  if (activeFuncComp === null) {
    console.log(
      `onCleanup should be called in func component setup() synchronously`,
    );
    return;
  }
  activeFuncComp.__disposes.push(fn);
}
