# AGENTS.md

## What this repo is

Acceptance test suite for `@fultslop/axiom` — a TypeScript transformer that injects runtime contract guards from JSDoc `@pre`, `@post`, and `@invariant` tags.

This repo is for black-box acceptance testing and does **not** contain the transformer source. It only tests published builds of `@fultslop/axiom` (installed from the local Verdaccio registry at `http://localhost:4873`).

## Commands

| Command | Purpose |
|---|---|
| `npm test` | Run all Jest tests |
| `npm run build:dev` | Compile `src/` fixtures with the transformer applied (`tspc -p tsconfig.dev.json`) |
| `npm run typecheck` | Type-check without emitting |
| `npm run lint` | ESLint check |

## Project layout

```
src/          TypeScript fixture files — compiled with the axiom transformer
test/         Jest test files
  helpers/    Shared helpers (build-output.ts, etc.)
docs/
  superpowers/
    specs/    Design documents for features under test
    plans/    Acceptance test plans (one file per phase)
```

## Two testing approaches

### 1. ts-jest (fast, in-process)
Fixtures in `src/` are compiled by ts-jest on every `npm test` run with the transformer applied. Tests import from `@src/<fixture>` and assert on runtime behavior directly.

### 2. Full-program compile + run (`compileAndRun`)
Used in `test/v090-acceptance.test.ts` and similar files. Each test writes a TypeScript fixture to a temp directory, compiles it with `npx tspc` (ts-patch + transformer plugin), reads the compiled JS, and optionally runs it with `node`. Assertions target the compiled output text or the runtime stdout.

```typescript
// compileAndRun signature
function compileAndRun(
    fixture: string,   // TypeScript source
    testName: string,  // stem for temp filenames and the exported name used in runner
    testCall?: string, // JS expression to run, e.g. "myFn(-1)"; omit to skip execution
): { output: string; compiled: string; exitCode: number; success: boolean }
```

Transformer warnings appear in the compile step's stderr. To test warnings, return `stderr` alongside `compiled` from the helper.

## Key runtime types

```typescript
import { ContractViolationError, InvariantViolationError } from '@fultslop/axiom';
```

- `ContractViolationError("PRE", location, expression)` — `@pre` guard fired
- `ContractViolationError("POST", location, expression)` — `@post` guard fired
- `InvariantViolationError(location, expression)` — `@invariant` guard fired

## Fixture conventions

- One fixture file per feature area in `src/`; matching test file in `test/`
- Fixture functions must be `export`ed for ts-jest to instrument them
- Full-program tests do not need a src fixture file — the fixture is the inline string passed to `compileAndRun`

## Plans and specs

- Specs (design docs): `docs/superpowers/specs/<date>-<topic>.md`
- Plans (test plans): `docs/superpowers/plans/<date>-<topic>-phase-<x>.md`

When implementing a plan, work phase by phase (A → B → C → D). Run `npm test` after each phase to confirm no regressions before moving to the next.

## Platform

You are running on Windows 11. 