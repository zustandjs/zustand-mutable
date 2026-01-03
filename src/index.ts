/** biome-ignore-all lint/suspicious/noExplicitAny: all good */
import type { StateCreator, StoreMutatorIdentifier } from "zustand/vanilla";

type Primitive = string | number | bigint | boolean | null | undefined;
type IfAvailable<T, Fallback = void> = true | false extends (T extends never ? true : false)
  ? Fallback
  : keyof T extends never
    ? Fallback
    : T;
type WeakReferences = IfAvailable<WeakMap<any, any>> | IfAvailable<WeakSet<any>>;
// biome-ignore lint/complexity/noBannedTypes: all good
type AtomicObject = Function | Promise<any> | Date | RegExp;

type DeepMap<T, Mutable extends boolean> = T extends Primitive | AtomicObject
  ? T
  : T extends IfAvailable<ReadonlyMap<infer K, infer V>>
    ? Mutable extends true
      ? Map<K, DeepMap<V, true>>
      : ReadonlyMap<DeepMap<K, false>, DeepMap<V, false>>
    : T extends IfAvailable<ReadonlySet<infer V>>
      ? Mutable extends true
        ? Set<DeepMap<V, true>>
        : ReadonlySet<DeepMap<V, false>>
      : T extends WeakReferences
        ? T
        : T extends object
          ? Mutable extends true
            ? { -readonly [K in keyof T]: DeepMap<T[K], true> }
            : { readonly [K in keyof T]: DeepMap<T[K], false> }
          : T;

type Draft<T> = DeepMap<T, true>;

type Mutable = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initializer: StateCreator<T, [...Mps, ["zustand/mutable", never]], Mcs>,
  produceFn: (recipe: (state: T) => void) => (state: T) => T,
) => StateCreator<T, Mps, [["zustand/mutable", never], ...Mcs]>;

declare module "zustand/vanilla" {
  // biome-ignore lint/correctness/noUnusedVariables: all good
  interface StoreMutators<S, A> {
    // biome-ignore lint/complexity/useLiteralKeys: all good
    ["zustand/mutable"]: WithMutable<S>;
  }
}

type Write<T, U> = Omit<T, keyof U> & U;
type SkipTwo<T> = T extends [any?, any?, ...infer Rest] ? Rest : never;

type SetStateType<T extends unknown[]> = Exclude<T[0], (...args: any[]) => any>;

type WithMutable<S> = Write<S, StoreMutable<S>>;

type StoreMutable<S> = S extends {
  setState: infer SetState;
}
  ? SetState extends {
      (...a: infer A1): infer Sr1;
      (...a: infer A2): infer Sr2;
    }
    ? {
        // Ideally, we would want to infer the `nextStateOrUpdater` `T` type from the
        // `A1` type, but this is infeasible since it is an intersection with
        // a partial type.
        setState(
          nextStateOrUpdater:
            | SetStateType<A2>
            | Partial<SetStateType<A2>>
            | ((state: Draft<SetStateType<A2>>) => void),
          shouldReplace?: false,
          ...a: SkipTwo<A1>
        ): Sr1;
        setState(
          nextStateOrUpdater: SetStateType<A2> | ((state: Draft<SetStateType<A2>>) => void),
          shouldReplace: true,
          ...a: SkipTwo<A2>
        ): Sr2;
      }
    : never
  : never;

type MutableImpl = <T>(
  storeInitializer: StateCreator<T, [], []>,
  produceFn: (recipeFn: (state: T) => void) => (state: T) => T,
) => StateCreator<T, [], []>;

const mutableImpl: MutableImpl = (initializer, produceFn) => (set, get, api) => {
  api.setState = (updater, replace, ...a) => {
    const nextState = typeof updater === "function" ? produceFn(updater as any) : updater;

    set(nextState, replace as any, ...a);
  };

  return initializer(api.setState, get, api);
};

export const mutable = mutableImpl as unknown as Mutable;
