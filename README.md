# zustand-mutable

[![npm version](https://img.shields.io/npm/v/zustand-mutable.svg)](https://www.npmjs.com/package/zustand-mutable)
[![test](https://github.com/zustandjs/zustand-mutable/actions/workflows/test.yml/badge.svg)](https://github.com/zustandjs/zustand-mutable/actions/workflows/test.yml)
[![license](https://img.shields.io/npm/l/zustand-mutable.svg)](https://github.com/zustandjs/zustand-mutable/blob/main/LICENSE)

A sweet way to use immer-like mutable updates with Zustand.

## Introduction

Zustand's immutable state updates can become verbose when dealing with deeply nested state. This middleware lets you write state updates using a mutable API pattern, similar to Immer's draft pattern.

**Key benefit:** You choose your own produce function - use [Immer](https://github.com/immerjs/immer), [Mutative](https://github.com/unadlib/mutative), [Limu](https://github.com/tnfe/limu), or any library that follows the produce pattern.

## Installation

```bash
npm install zustand-mutable zustand

# Plus your preferred produce library (pick one):
npm install immer      # Most popular
npm install mutative   # Faster alternative
npm install limu       # Another option
```

## Quick Start

```typescript
import { create } from 'zustand'
import { mutable } from 'zustand-mutable'
import { produce } from 'immer'

type CounterState = {
  count: number
  inc: () => void
}

const useStore = create<CounterState>()(
  mutable(
    (set, get) => ({
      count: 0,
      inc: () =>
        set((state) => {
          state.count = get().count + 1 // Mutate directly!
        }),
    }),
    produce,
  ),
)
```

## API Reference

### `mutable(initializer, produceFn)`

Wraps your Zustand store initializer to enable mutable-style updates.

| Parameter     | Type                                              | Description                                 |
| ------------- | ------------------------------------------------- | ------------------------------------------- |
| `initializer` | `StateCreator<T>`                                 | Your standard Zustand store initializer     |
| `produceFn`   | `(recipe: (state: T) => void) => (state: T) => T` | A produce function from your chosen library |

## Supported Libraries

### Immer

The most popular immutable state library.

```typescript
import { produce } from 'immer'

const useStore = create<State>()(
  mutable(
    (set, get) => ({
      // your state and actions
    }),
    produce,
  ),
)
```

### Mutative

A faster alternative to Immer with similar API.

```typescript
import { create as mutativeProduce } from 'mutative'

const useStore = create<State>()(
  mutable(
    (set, get) => ({
      // your state and actions
    }),
    mutativeProduce,
  ),
)
```

### Limu

Another immutable update library. Requires a wrapper function.

```typescript
import { produce } from 'limu'

const useStore = create<State>()(
  mutable(
    (set, get) => ({
      // your state and actions
    }),
    (recipe) => produce(recipe),
  ),
)
```

## Middleware Composition

`zustand-mutable` works seamlessly with other Zustand middleware.

### With devtools

```typescript
import { devtools } from 'zustand/middleware'

const useStore = create<CounterState>()(
  mutable(
    devtools(
      (set, get) => ({
        count: 0,
        inc: () =>
          set(
            (state) => {
              state.count = get().count + 1
            },
            false,
            { type: 'inc', by: 1 },
          ),
      }),
      { name: 'counter' },
    ),
    produce,
  ),
)
```

### With persist

```typescript
import { persist } from 'zustand/middleware'

const useStore = create<CounterState>()(
  persist(
    mutable(
      (set, get) => ({
        count: 0,
        inc: () =>
          set((state) => {
            state.count = get().count + 1
          }),
      }),
      produce,
    ),
    { name: 'counter-storage' },
  ),
)
```

### Combining Multiple Middleware

You can stack multiple middleware together:

```typescript
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'

const useStore = create<CounterState>()(
  devtools(
    subscribeWithSelector(
      persist(
        mutable(
          (set, get) => ({
            count: 0,
            inc: () =>
              set((state) => {
                state.count = get().count + 1
              }),
          }),
          produce,
        ),
        { name: 'counter' },
      ),
    ),
    { name: 'counter-devtools' },
  ),
)
```

## TypeScript

This library is written in TypeScript and provides full type safety out of the box.

- The `Draft<T>` type automatically makes your state mutable inside updater functions
- Proper type inference is maintained through middleware composition
- Works with strict TypeScript configurations

```typescript
set((state) => {
  // `state` is typed as Draft<YourState>
  // You can mutate it directly with full type safety
  state.nested.deeply.value = 'new value'
})
```

## Requirements

- `zustand` >= 5.0.9 (peer dependency)
- One of: `immer`, `mutative`, or `limu`

## License

MIT
