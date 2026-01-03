import { produce as immerProduceFn } from "immer";
import { produce as limuProduceFn } from "limu";
import { create as mutativeProduceFn } from "mutative";
import { describe, it } from "vitest";
import type { StateCreator, StoreApi, StoreMutatorIdentifier } from "zustand";
import { create, createStore } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { mutable } from "zustand-mutable";

type CounterState = {
  count: number;
  inc: () => void;
};

type ExampleStateCreator<T, A> = <
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
  U = T,
>(
  f: StateCreator<T, [...Mps, ["org/example", A]], Mcs>,
) => StateCreator<T, Mps, [["org/example", A], ...Mcs], U & A>;

type Write<T, U> = Omit<T, keyof U> & U;
type StoreModifyAllButSetState<S, A> = S extends {
  getState: () => infer T;
}
  ? Omit<StoreApi<T & A>, "setState">
  : never;

declare module "zustand/vanilla" {
  interface StoreMutators<S, A> {
    "org/example": Write<S, StoreModifyAllButSetState<S, A>>;
  }
}

describe("counter state spec (single middleware)", () => {
  it("mutable (immer)", () => {
    const useBoundStore = create<CounterState>()(
      mutable(
        (set, get) => ({
          count: 0,
          inc: () =>
            set((state) => {
              state.count = get().count + 1;
            }),
        }),
        immerProduceFn,
      ),
    );
    const _TestComponent = () => {
      useBoundStore((s) => s.count) * 2;
      useBoundStore((s) => s.inc)();
      useBoundStore().count * 2;
      useBoundStore().inc();
      useBoundStore.getState().count * 2;
      useBoundStore.getState().inc();
      return null;
    };
    _TestComponent;

    const testSubtyping: StoreApi<object> = createStore(
      mutable(() => ({ count: 0 }), immerProduceFn),
    );
    expect(testSubtyping).toBeDefined();

    const exampleMiddleware = ((initializer) => initializer) as ExampleStateCreator<
      CounterState,
      { additional: number }
    >;

    const testDerivedSetStateType = create<CounterState>()(
      exampleMiddleware(
        mutable(
          (set, get) => ({
            count: 0,
            inc: () =>
              set((state) => {
                state.count = get().count + 1;
                // biome-ignore lint/suspicious/noExplicitAny: all good
                type OmitFn<T> = Exclude<T, (...args: any[]) => any>;
                expectTypeOf<OmitFn<Parameters<typeof set>[0]>>().not.toExtend<{
                  additional: number;
                }>();
                expectTypeOf<ReturnType<typeof get>>().toExtend<{
                  additional: number;
                }>();
              }),
          }),
          immerProduceFn,
        ),
      ),
    );
    expect(testDerivedSetStateType).toBeDefined();
    // the type of the `getState` should include our new property
    expectTypeOf(testDerivedSetStateType.getState()).toExtend<{
      additional: number;
    }>();
    // the type of the `setState` should not include our new property
    expectTypeOf<Parameters<typeof testDerivedSetStateType.setState>[0]>().not.toExtend<{
      additional: number;
    }>();
  });

  it("mutable (mutative)", () => {
    const useBoundStore = create<CounterState>()(
      mutable(
        (set, get) => ({
          count: 0,
          inc: () =>
            set((state) => {
              state.count = get().count + 1;
            }),
        }),
        mutativeProduceFn,
      ),
    );
    const _TestComponent = () => {
      useBoundStore((s) => s.count) * 2;
      useBoundStore((s) => s.inc)();
      useBoundStore().count * 2;
      useBoundStore().inc();
      useBoundStore.getState().count * 2;
      useBoundStore.getState().inc();
      return null;
    };
    _TestComponent;

    const testSubtyping: StoreApi<object> = createStore(
      mutable(() => ({ count: 0 }), mutativeProduceFn),
    );
    expect(testSubtyping).toBeDefined();

    const exampleMiddleware = ((initializer) => initializer) as ExampleStateCreator<
      CounterState,
      { additional: number }
    >;

    const testDerivedSetStateType = create<CounterState>()(
      exampleMiddleware(
        mutable(
          (set, get) => ({
            count: 0,
            inc: () =>
              set((state) => {
                state.count = get().count + 1;
                // biome-ignore lint/suspicious/noExplicitAny: all good
                type OmitFn<T> = Exclude<T, (...args: any[]) => any>;
                expectTypeOf<OmitFn<Parameters<typeof set>[0]>>().not.toExtend<{
                  additional: number;
                }>();
                expectTypeOf<ReturnType<typeof get>>().toExtend<{
                  additional: number;
                }>();
              }),
          }),
          mutativeProduceFn,
        ),
      ),
    );
    expect(testDerivedSetStateType).toBeDefined();
    // the type of the `getState` should include our new property
    expectTypeOf(testDerivedSetStateType.getState()).toExtend<{
      additional: number;
    }>();
    // the type of the `setState` should not include our new property
    expectTypeOf<Parameters<typeof testDerivedSetStateType.setState>[0]>().not.toExtend<{
      additional: number;
    }>();
  });

  it("mutable (limu)", () => {
    const useBoundStore = create<CounterState>()(
      mutable(
        (set, get) => ({
          count: 0,
          inc: () =>
            set((state) => {
              state.count = get().count + 1;
            }),
        }),
        (state) => limuProduceFn(state),
      ),
    );
    const _TestComponent = () => {
      useBoundStore((s) => s.count) * 2;
      useBoundStore((s) => s.inc)();
      useBoundStore().count * 2;
      useBoundStore().inc();
      useBoundStore.getState().count * 2;
      useBoundStore.getState().inc();
      return null;
    };
    _TestComponent;

    const testSubtyping: StoreApi<object> = createStore(
      mutable(
        () => ({ count: 0 }),
        (state) => limuProduceFn(state),
      ),
    );
    expect(testSubtyping).toBeDefined();

    const exampleMiddleware = ((initializer) => initializer) as ExampleStateCreator<
      CounterState,
      { additional: number }
    >;

    const testDerivedSetStateType = create<CounterState>()(
      exampleMiddleware(
        mutable(
          (set, get) => ({
            count: 0,
            inc: () =>
              set((state) => {
                state.count = get().count + 1;
                // biome-ignore lint/suspicious/noExplicitAny: all good
                type OmitFn<T> = Exclude<T, (...args: any[]) => any>;
                expectTypeOf<OmitFn<Parameters<typeof set>[0]>>().not.toExtend<{
                  additional: number;
                }>();
                expectTypeOf<ReturnType<typeof get>>().toExtend<{
                  additional: number;
                }>();
              }),
          }),
          (state) => limuProduceFn(state),
        ),
      ),
    );
    expect(testDerivedSetStateType).toBeDefined();
    // the type of the `getState` should include our new property
    expectTypeOf(testDerivedSetStateType.getState()).toExtend<{
      additional: number;
    }>();
    // the type of the `setState` should not include our new property
    expectTypeOf<Parameters<typeof testDerivedSetStateType.setState>[0]>().not.toExtend<{
      additional: number;
    }>();
  });
});

describe("counter state spec (double middleware)", () => {
  it("mutable (immer) & devtools", () => {
    const useBoundStore = create<CounterState>()(
      mutable(
        devtools(
          (set, get) => ({
            count: 0,
            inc: () =>
              set(
                (state) => {
                  state.count = get().count + 1;
                },
                false,
                { type: "inc", by: 1 },
              ),
          }),
          { name: "prefix" },
        ),
        immerProduceFn,
      ),
    );
    const _TestComponent = () => {
      useBoundStore((s) => s.count) * 2;
      useBoundStore((s) => s.inc)();
      useBoundStore().count * 2;
      useBoundStore().inc();
      useBoundStore.getState().count * 2;
      useBoundStore.getState().inc();
      useBoundStore.setState({ count: 0 }, false, "reset");
      return null;
    };
    _TestComponent;
    expect(useBoundStore).toBeDefined();
  });

  it("mutable (mutative) & devtools", () => {
    const useBoundStore = create<CounterState>()(
      mutable(
        devtools(
          (set, get) => ({
            count: 0,
            inc: () =>
              set(
                (state) => {
                  state.count = get().count + 1;
                },
                false,
                { type: "inc", by: 1 },
              ),
          }),
          { name: "prefix" },
        ),
        mutativeProduceFn,
      ),
    );
    const _TestComponent = () => {
      useBoundStore((s) => s.count) * 2;
      useBoundStore((s) => s.inc)();
      useBoundStore().count * 2;
      useBoundStore().inc();
      useBoundStore.getState().count * 2;
      useBoundStore.getState().inc();
      useBoundStore.setState({ count: 0 }, false, "reset");
      return null;
    };
    _TestComponent;
    expect(useBoundStore).toBeDefined();
  });

  it("mutable (limu) & devtools", () => {
    const useBoundStore = create<CounterState>()(
      mutable(
        devtools(
          (set, get) => ({
            count: 0,
            inc: () =>
              set(
                (state) => {
                  state.count = get().count + 1;
                },
                false,
                { type: "inc", by: 1 },
              ),
          }),
          { name: "prefix" },
        ),
        (state) => limuProduceFn(state),
      ),
    );
    const _TestComponent = () => {
      useBoundStore((s) => s.count) * 2;
      useBoundStore((s) => s.inc)();
      useBoundStore().count * 2;
      useBoundStore().inc();
      useBoundStore.getState().count * 2;
      useBoundStore.getState().inc();
      useBoundStore.setState({ count: 0 }, false, "reset");
      return null;
    };
    _TestComponent;
    expect(useBoundStore).toBeDefined();
  });
});

describe("counter state spec (triple middleware)", () => {
  it("devtools & persist & mutable (immer)", () => {
    const useBoundStore = create<CounterState>()(
      devtools(
        persist(
          mutable(
            (set, get) => ({
              count: 0,
              inc: () =>
                set((state) => {
                  state.count = get().count + 1;
                }),
            }),
            immerProduceFn,
          ),
          { name: "count" },
        ),
        { name: "prefix" },
      ),
    );
    const _TestComponent = () => {
      useBoundStore((s) => s.count) * 2;
      useBoundStore((s) => s.inc)();
      useBoundStore().count * 2;
      useBoundStore().inc();
      useBoundStore.getState().count * 2;
      useBoundStore.getState().inc();
      useBoundStore.setState({ count: 0 }, false, "reset");
      useBoundStore.persist.hasHydrated();
      return null;
    };
    _TestComponent;
    expect(useBoundStore).toBeDefined();
  });

  it("devtools & persist & mutable (mutative)", () => {
    const useBoundStore = create<CounterState>()(
      devtools(
        persist(
          mutable(
            (set, get) => ({
              count: 0,
              inc: () =>
                set((state) => {
                  state.count = get().count + 1;
                }),
            }),
            mutativeProduceFn,
          ),
          { name: "count" },
        ),
        { name: "prefix" },
      ),
    );
    const _TestComponent = () => {
      useBoundStore((s) => s.count) * 2;
      useBoundStore((s) => s.inc)();
      useBoundStore().count * 2;
      useBoundStore().inc();
      useBoundStore.getState().count * 2;
      useBoundStore.getState().inc();
      useBoundStore.setState({ count: 0 }, false, "reset");
      useBoundStore.persist.hasHydrated();
      return null;
    };
    _TestComponent;
    expect(useBoundStore).toBeDefined();
  });

  it("devtools & persist & mutable (limu)", () => {
    const useBoundStore = create<CounterState>()(
      devtools(
        persist(
          mutable(
            (set, get) => ({
              count: 0,
              inc: () =>
                set((state) => {
                  state.count = get().count + 1;
                }),
            }),
            (state) => limuProduceFn(state),
          ),
          { name: "count" },
        ),
        { name: "prefix" },
      ),
    );
    const _TestComponent = () => {
      useBoundStore((s) => s.count) * 2;
      useBoundStore((s) => s.inc)();
      useBoundStore().count * 2;
      useBoundStore().inc();
      useBoundStore.getState().count * 2;
      useBoundStore.getState().inc();
      useBoundStore.setState({ count: 0 }, false, "reset");
      useBoundStore.persist.hasHydrated();
      return null;
    };
    _TestComponent;
    expect(useBoundStore).toBeDefined();
  });
});

describe("counter state spec (quadruple middleware)", () => {
  it("devtools & subscribeWithSelector & persist & mutable (immer)", () => {
    const useBoundStore = create<CounterState>()(
      devtools(
        subscribeWithSelector(
          persist(
            mutable(
              (set, get) => ({
                count: 0,
                inc: () =>
                  set((state) => {
                    state.count = get().count + 1;
                  }),
              }),
              immerProduceFn,
            ),
            { name: "count" },
          ),
        ),
        { name: "prefix" },
      ),
    );
    const _TestComponent = () => {
      useBoundStore((s) => s.count) * 2;
      useBoundStore((s) => s.inc)();
      useBoundStore().count * 2;
      useBoundStore().inc();
      useBoundStore.getState().count * 2;
      useBoundStore.getState().inc();
      useBoundStore.subscribe(
        (state) => state.count,
        (count) => console.log(count * 2),
      );
      useBoundStore.setState({ count: 0 }, false, "reset");
      useBoundStore.persist.hasHydrated();
      return null;
    };
    _TestComponent;
    expect(useBoundStore).toBeDefined();
  });

  it("devtools & subscribeWithSelector & persist & mutable (immer)", () => {
    const useBoundStore = create<CounterState>()(
      devtools(
        subscribeWithSelector(
          persist(
            mutable(
              (set, get) => ({
                count: 0,
                inc: () =>
                  set((state) => {
                    state.count = get().count + 1;
                  }),
              }),
              mutativeProduceFn,
            ),
            { name: "count" },
          ),
        ),
        { name: "prefix" },
      ),
    );
    const _TestComponent = () => {
      useBoundStore((s) => s.count) * 2;
      useBoundStore((s) => s.inc)();
      useBoundStore().count * 2;
      useBoundStore().inc();
      useBoundStore.getState().count * 2;
      useBoundStore.getState().inc();
      useBoundStore.subscribe(
        (state) => state.count,
        (count) => console.log(count * 2),
      );
      useBoundStore.setState({ count: 0 }, false, "reset");
      useBoundStore.persist.hasHydrated();
      return null;
    };
    _TestComponent;
    expect(useBoundStore).toBeDefined();
  });
  it("devtools & subscribeWithSelector & persist & mutable (limu)", () => {
    const useBoundStore = create<CounterState>()(
      devtools(
        subscribeWithSelector(
          persist(
            mutable(
              (set, get) => ({
                count: 0,
                inc: () =>
                  set((state) => {
                    state.count = get().count + 1;
                  }),
              }),
              (state) => limuProduceFn(state),
            ),
            { name: "count" },
          ),
        ),
        { name: "prefix" },
      ),
    );
    const _TestComponent = () => {
      useBoundStore((s) => s.count) * 2;
      useBoundStore((s) => s.inc)();
      useBoundStore().count * 2;
      useBoundStore().inc();
      useBoundStore.getState().count * 2;
      useBoundStore.getState().inc();
      useBoundStore.subscribe(
        (state) => state.count,
        (count) => console.log(count * 2),
      );
      useBoundStore.setState({ count: 0 }, false, "reset");
      useBoundStore.persist.hasHydrated();
      return null;
    };
    _TestComponent;
    expect(useBoundStore).toBeDefined();
  });
});
