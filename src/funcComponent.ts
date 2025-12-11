import { BaseWidget, BaseWidgetClass } from './BaseWidget.js';
import { HmWidgetFactory } from './common.js';

const FuncComponentMap = new WeakMap<Function, BaseWidgetClass<BaseWidget>>();

let activeFuncComp: BaseWidget | null = null;

export declare interface FuncComponent<
  T extends BaseWidget,
  P extends T['props'],
> extends BaseWidget {
  props: P;
  __child: T | null;
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
        constructor(public props: P) {
          if(name === 'MenuItem') {
            console.log(`MenuItem constructor, onClick=${this.props.onClick}`);
          }
        }
        setup(): void {
          if(name === 'MenuItem') {
            console.log(`MenuItem setup, onClick=${this.props.onClick}`);
          }
          // console.log(`${name}(FuncComponent) setup`);
          let prev = activeFuncComp;
          activeFuncComp = this;
          try {
            this.__child = Comp(this.props, this);
            if(this.__child) this.__child.setup();
          } finally {
            activeFuncComp = prev;
          }
        }
        render(view: HmWidgetFactory): void {
          // console.log(`${name}(FuncComponent) render`);
          if (!this.__child) {
            throw new Error(`Component not setup, name: ${Comp.name}`);
          }
          this.__child.render(view);
        }
        clear(): void {
          this.__child!.clear();
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
