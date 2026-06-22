const STALE = 1;
const CLEAN = 0;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

class ZeppReactive {
  activeEffect: ReactiveEffect<unknown> | null = null;
  globalScope: ReactiveEffect<any>[] = [];
  activeScope: ReactiveEffect<unknown>[] = this.globalScope;

  targetMap = new WeakMap<
    object,
    Map<string | symbol, Set<ReactiveEffect<unknown>>>
  >();
  Updates: ReactiveEffect<unknown>[] | null = null;
  reactiveMap = new WeakMap<object, any>();

  public effect<T>(
    fn: (prev: T | undefined) => T,
    initialValue?: T
  ): ReactiveEffect<T> {
    const eff = new ReactiveEffect(fn, this);
    eff.value = initialValue;
    eff.run();
    return eff;
  }

  public memo<T>(fn: () => T): () => T {
    const system = this;
    let value: T;
    let initialized = false;

    // computation runner
    const eff = new ReactiveEffect(
      () => {
        const newVal = fn();
        if (!initialized) {
          value = newVal;
          initialized = true;
        } else if (!Object.is(newVal, value)) {
          value = newVal;
          // 通知依赖这个 memo 的 effect
          system.trigger(wrapper, "value");
        }
        return value;
      },
      this,
      true
    );

    eff.run();

    const wrapper = () => {
      // 如果当前有活跃 effect，就 track 这个 memo
      if (system.activeEffect) {
        system.track(wrapper, "value", system.activeEffect);
      }
      return value;
    };

    return wrapper;
  }

  public reactive<T extends object>(
    obj: T,
    options?: {
      deep?: boolean;
    }
  ): T {
    if (this.reactiveMap.has(obj)) {
      return this.reactiveMap.get(obj);
    }
    const system = this;
    return new Proxy(obj, {
      get(target, key, receiver) {
        const res = Reflect.get(target, key, receiver);
        if (system.activeEffect) {
          system.track(target, key, system.activeEffect);
        }

        if (options?.deep && typeof res === "object" && res !== null) {
          return system.reactive(res, options);
        }
        return res;
      },
      set(target, key, value, receiver) {
        const old = (target as any)[key];
        const ok = Reflect.set(target, key, value, receiver);
        if (!Object.is(old, value)) {
          system.trigger(target, key);
        }
        return ok;
      },
    });
  }

  public track(
    target: object,
    key: string | symbol,
    eff: ReactiveEffect<unknown>
  ) {
    let depsMap = this.targetMap.get(target);
    if (!depsMap) {
      depsMap = new Map();
      this.targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
      dep = new Set();
      depsMap.set(key, dep);
    }
    if (!dep.has(eff)) {
      dep.add(eff);
      eff.deps.push(dep); // 反向记录
    }
  }

  public untrack<T>(fn: () => T): T {
    const prev = this.activeEffect;
    this.activeEffect = null;
    try {
      return fn();
    } finally {
      this.activeEffect = prev;
    }
  }

  public scoped<T>(fn: () => T, scoped: ReactiveEffect<unknown>[]): T {
    let prev = this.activeScope;
    this.activeScope = scoped;
    try {
      return fn();
    } finally {
      this.activeScope = prev;
    }
  }

  public trigger(target: object, key: string | symbol) {
    const depsMap = this.targetMap.get(target);
    if (!depsMap) return;
    const dep = depsMap.get(key);
    if (!dep) return;
    for (const eff of dep) {
      if (eff.state !== STALE) {
        eff.state = STALE;
        this.queueUpdate(eff);
      }
    }
    this.flushUpdates();
  }

  public queueUpdate(eff: ReactiveEffect<unknown>) {
    if (!this.Updates) this.Updates = [];
    this.Updates.push(eff);
  }

  public flushUpdates() {
    if (!this.Updates) return;
    const queue = this.Updates;
    this.Updates = null;
    for (const eff of queue) {
      if (eff.state === STALE) eff.run();
    }
  }

  public watch<T>(
    source: () => T,
    cb: (newValue: T, oldValue: T | undefined) => void
  ) {
    let oldValue: T | undefined;
    let initialized = false;

    // 用 effect 包裹 source
    const eff = this.effect(() => {
      const newValue = source();
      if (!initialized) {
        oldValue = newValue;
        initialized = true;
      } else {
        if (!Object.is(newValue, oldValue)) {
          this.untrack(() => cb(newValue, oldValue));
          oldValue = newValue;
        }
      }
    });
    return () => {
      eff.stop();
    };
  }

  public computed<T>(getter: () => T): { get value(): T } {
    const system = this;
    let value!: T;
    let dirty = true;
    let initialized = false;
    const KEY: unique symbol = Symbol("computed:value");

    // runner 用来更新缓存值
    const runner = new ReactiveEffect(
      () => {
        const newVal = getter();
        if (!initialized || !Object.is(newVal, value)) {
          value = newVal;
          initialized = true;
          dirty = false;
          system.trigger(wrapper, KEY);
        }
      },
      this,
      true
    );

    // 初次运行
    runner.run();

    // 包装对象，外部通过 .value 访问
    const wrapper = {
      get value() {
        if (dirty) {
          runner.run();
          dirty = false;
        }
        if (system.activeEffect) {
          system.track(wrapper, KEY, system.activeEffect);
        }
        return value;
      },
    };

    return wrapper;
  }

  // simple and high performance
  public merge<T1 extends object, T2 extends object>(
    obj1: T1,
    obj2: T2
  ): T1 & T2 {
    return new Proxy({} as Record<string | symbol, any>, {
      has(_, key) {
        return key in obj2 || key in obj1 || key in _;
      },
      get(_, key) {
        return key in obj2
          ? (obj2 as any)[key]
          : key in obj1
          ? (obj1 as any)[key]
          : (_ as any)[key];
      },
      set(_, key, value) {
        if (key in obj2) {
          (obj2 as any)[key] = value;
        } else if (key in obj1) {
          (obj1 as any)[key] = value;
        } else {
          (_ as any)[key] = value;
          console.log(
            `[ZeppReactive] setting an undefined field directly to a reactive object may cause reactivity lose. key: ${String(
              key
            )}.`
          );
        }
        return true;
      },
      ownKeys(_) {
        return Reflect.ownKeys(obj2).concat(
          Reflect.ownKeys(obj1),
          Reflect.ownKeys(_)
        );
      },
    }) as T1 & T2;
  }

  // solid js compatible
  public mergeProps<T extends object[]>(
    ...sources: T
  ): UnionToIntersection<T[number]> {
    const system = this;

    // 将函数源包装为 memo，以便惰性访问时能订阅变化
    const normalized = sources.map((s) =>
      typeof s === "function" ? system.memo(s as () => any) : s
    );

    return new Proxy({} as Record<string | symbol, any>, {
      get(_, key) {
        for (let i = normalized.length - 1; i >= 0; i--) {
          const source = normalized[i] as any;
          if (source && key in source) {
            const value = source[key];
            // return typeof value === "function" ? value() : value; // TODO
            return value;
          }
        }
        return (_ as any)[key];
      },
      set(_, key, value) {
        for (let i = normalized.length - 1; i >= 0; i--) {
          const source = normalized[i] as any;
          if (source && key in source) {
            source[key] = value;
            return true;
          }
        }
        (_ as any)[key] = value;
        return true;
      },
      has(_, key) {
        if (key in _) return true;
        for (let i = 0; i < normalized.length; i++) {
          const s = normalized[i] as any;
          if (s && key in s) return true;
        }
        return false;
      },
      ownKeys(_) {
        const keys: (string | symbol)[] = [];
        for (let i = 0; i < normalized.length; i++) {
          keys.push(...Reflect.ownKeys(normalized[i]));
        }
        return [...new Set(keys.concat(Reflect.ownKeys(_)))];
      },
    }) as UnionToIntersection<T[number]>;
  }
  static instance: ZeppReactive;

  clear() {
    this.activeEffect = null;
    this.globalScope.forEach((e) => e.stop());
    this.activeScope = null as any;
    this.reactiveMap = null as any;
    this.targetMap = null as any;
  }
}

export class ReactiveEffect<T> {
  public value: any;
  public state = CLEAN;
  public deps: Set<ReactiveEffect<any>>[] = []; // 记录自己所在的依赖集合
  public active = true;
  public scope: ReactiveEffect<any>[];
  // static __cnt = 0;
  // static __nextTickTimer: unknown | null = null;
  static __nextUnscopedCnt = 1;

  constructor(
    public fn: (prev: T) => T,
    private system: ZeppReactive,
    private pure = false
  ) {
    // ReactiveEffect.__cnt++;
    // if (!ReactiveEffect.__nextTickTimer) {
    //   ReactiveEffect.__nextTickTimer = setTimeout(() => {
    //     ReactiveEffect.__nextTickTimer = null;

    //     // console.log(`[Reactive] active effect count: ${ReactiveEffect.__cnt}`);
    //   }, 300);
    // }

    this.scope = system.activeScope;
    if (this.scope === system.globalScope) {
      console.log(
        `[ZeppReactive] WARN: effect created outside of scope (${ReactiveEffect.__nextUnscopedCnt++}). This is not recommended. Please use scoped effect: ${
          fn.name || "[anonymous]"
        }.`
      );
    }
    this.scope.push(this as ReactiveEffect<unknown>);
  }

  run() {
    if (!this.active) return; // 已 stop 的 effect 不再运行
    const prev = this.system.activeEffect;
    this.system.activeEffect = this as ReactiveEffect<unknown>;
    try {
      this.value = this.system.scoped(() => this.fn(this.value), this.scope);
      this.state = CLEAN;
    } finally {
      this.system.activeEffect = prev;
    }
  }

  stop() {
    if (this.active) {
      // 从所有依赖集合中移除自己
      for (const dep of this.deps) {
        dep.delete(this);
      }
      this.deps.length = 0;
      this.active = false;

      // ReactiveEffect.__cnt--;
    }

    // if (!ReactiveEffect.__nextTickTimer) {
    //   ReactiveEffect.__nextTickTimer = setTimeout(() => {
    //     ReactiveEffect.__nextTickTimer = null;

    //     // console.log(`[Reactive] active effect count: ${ReactiveEffect.__cnt}`);
    //   }, 300);
    // }
  }
}

// 绑定导出
const zeppReactive = new ZeppReactive();

export const reactive = zeppReactive.reactive.bind(zeppReactive);
export const effect = zeppReactive.effect.bind(zeppReactive);
export const computed = zeppReactive.computed.bind(zeppReactive);
export const merge = zeppReactive.merge.bind(zeppReactive);
export const watch = zeppReactive.watch.bind(zeppReactive);
export const memo = zeppReactive.memo.bind(zeppReactive);
export const mergeProps = zeppReactive.mergeProps.bind(zeppReactive);
export const untrack = zeppReactive.untrack.bind(zeppReactive);
export const scoped = zeppReactive.scoped.bind(zeppReactive);

ZeppReactive.instance = zeppReactive;

export { ZeppReactive };
