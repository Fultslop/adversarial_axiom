# Codebase Cleanup — Naming, Organisation & Redundancy Removal

**Date:** 2026-04-12  
**Project:** axiom_acceptanceTests  
**Scope:** `src/` fixture files and `test/` test files

---

## Goals

1. Rename fixture and test files from phase-based names to feature-domain names.
2. Extract a shared build helper to eliminate 5 duplicated `beforeAll`/`execSync` blocks.
3. Split the mixed-concern `phase2-more-post.ts` into two single-purpose files.
4. Slim `phase2-known-gaps.ts` — remove fixtures for features that are now fully supported, keep only genuine remaining limitations.

---

## Approach: Incremental (4 passes)

Each pass leaves the test suite green before the next begins.

---

## Pass 1 — Shared Build Output Helper

### New file: `test/helpers/build-output.ts`

Runs `npm run build:dev` once per Jest worker process (lazily cached). All build-touching test files call `getBuildOutput()` instead of duplicating the shell-out logic.

```typescript
import { execSync } from 'child_process';
import * as path from 'path';

let _output: string | null = null;

export function getBuildOutput(): string {
    if (_output !== null) return _output;
    try {
        const result = execSync('npm run build:dev', {
            encoding: 'utf8',
            cwd: path.resolve(__dirname, '../..'),
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        _output = result;
    } catch (e: any) {
        // tspc exits non-zero when warnings are emitted — capture both streams
        _output = (e.stdout ?? '') + (e.stderr ?? '');
    }
    return _output;
}
```

### Files updated (beforeAll replaced):

| File | Change |
|---|---|
| `test/build.test.ts` | Replace inline `execSync` with `getBuildOutput()` |
| `test/build-warnings.test.ts` | Replace `beforeAll` body |
| `test/global-identifiers.test.ts` | Replace `beforeAll` body |
| `test/phase2-known-gaps.test.ts` | Replace `beforeAll` body |
| `test/v086-features.test.ts` | Replace `beforeAll` body |

---

## Pass 2 — Core Fixture File Renames

Two files are misleadingly named as if they contain tests; they are fixtures.

| Old name | New name |
|---|---|
| `src/functionTests.ts` | `src/function-fixtures.ts` |
| `src/classTests.ts` | `src/class-fixtures.ts` |

### Test files updated:

| Old name | New name | Import path updated |
|---|---|---|
| `test/function.test.ts` | `test/function-fixtures.test.ts` | `@src/function-fixtures` |
| `test/class.test.ts` | `test/class-fixtures.test.ts` | `@src/class-fixtures` |

`src/index.ts` (manual smoke runner) also imports from both — update those import paths.

---

## Pass 3 — Phase-named File Renames and Split

### Renames

| Old name | New name | Content description |
|---|---|---|
| `src/phase1-fixtures.ts` | `src/pre-condition-fixtures.ts` | OR, negation, comparison, arithmetic `@pre` variants + ServiceClass |
| `src/phase345-fixtures.ts` | `src/post-condition-fixtures.ts` | `@post` variants, evaluation order, class invariant features |
| `src/phase2-special-expr.ts` | `src/pre-special-expr-fixtures.ts` | Ternary, instanceof, in, void, `this`, short-circuit |
| `src/phase3-missing-features.ts` | `src/alternate-fn-form-fixtures.ts` | Arrow/async/generator fns, constructor contracts, inheritance — no longer "missing" |
| `src/phase2-known-gaps.ts` | `src/known-gaps-fixtures.ts` | Genuine remaining limitations only (see Pass 4) |

### Split: `src/phase2-more-post.ts`

This file contains two unrelated concerns:

- **Lines 1–180** — additional `@post` condition fixtures (post arithmetic, void, empty tags, control flow, re-entrant calls, globals)  
  → Move to `src/post-more-fixtures.ts`

- **Lines 182–387** — global identifier fixtures (`globalObject`, `globalArray`, `globalMath*`, `globalConsole`, etc.)  
  → Move to `src/global-id-fixtures.ts`

### Test file renames

| Old name | New name | Import path updated |
|---|---|---|
| `test/phase1.test.ts` | `test/pre-conditions.test.ts` | `@src/pre-condition-fixtures` |
| `test/phase345.test.ts` | `test/post-conditions.test.ts` | `@src/post-condition-fixtures` |
| `test/phase2-special-expr.test.ts` | `test/pre-special-expr.test.ts` | `@src/pre-special-expr-fixtures` |
| `test/phase2-more-post.test.ts` | `test/post-more.test.ts` | `@src/post-more-fixtures` |
| `test/phase3-missing.test.ts` | `test/alternate-fn-forms.test.ts` | `@src/alternate-fn-form-fixtures` |

`test/global-identifiers.test.ts` tests via build output only (no direct import) — no import change needed, but the source file the build sees is now `global-id-fixtures.ts`.

---

## Pass 4 — Slim `known-gaps-fixtures.ts`

### Remove (now fully supported, duplicates better-named fixtures)

| Fixture | Reason | Better coverage in |
|---|---|---|
| `destructuredPre` | Supported since v0.8.3 | `src/destructured-params.ts` |
| `enumReferencePre` + `Status` enum | Supported since v0.8.6 | `src/v086-features.ts` |
| `moduleConstantPre` + `MAX_LIMIT` | Supported since v0.8.6 | `src/v086-features.ts` |
| `mathGlobalPre` | `Math` now whitelisted | `src/global-id-fixtures.ts` |

### Keep (genuine remaining limitations)

| Fixture | Gap |
|---|---|
| `templateLiteralPre` | Interpolated template literals not supported (L3) |
| `nonPrimitivePost` | Non-primitive return omitted from type map (8.3) |
| `unionTypePre` | Union-typed param — type mismatch not detected (8.4) |
| `MultiLevelAccess` | Multi-level property chain — only root `this` checked (8.5) |
| `unaryOperandPre` | Unary operand — type mismatch not detected (8.6) |
| `compoundNarrowingPre` | Compound conditions — no type narrowing (8.7) |

### Test file update

`test/phase2-known-gaps.test.ts` → `test/known-gaps.test.ts`

Remove the four describe blocks for the deleted fixtures. Remaining six describe blocks stay intact and switch to `getBuildOutput()`.

---

## Files Unchanged

The following files have clear, domain-appropriate names and are not touched:

- `src/error-fixtures.ts`
- `src/release-fixtures.ts`
- `src/param-fixtures.ts`
- `src/manual-assertions.ts`
- `src/interface-features.ts`
- `src/post-result-validation.ts`
- `src/destructured-params.ts`
- `src/class-destruct-test.ts`
- `src/template-literals.ts`
- `src/v086-features.ts`
- `test/errors.test.ts`
- `test/release-build.test.ts`
- `test/param-fixtures.test.ts`
- `test/manual-assertions.test.ts`
- `test/interface-features.test.ts`
- `test/post-result-validation.test.ts`
- `test/destructured-params.test.ts`
- `test/template-literals.test.ts`
- `test/v086-features.test.ts`
- `test/global-identifiers.test.ts`

Note: `test/build.test.ts`, `test/build-warnings.test.ts`, `test/global-identifiers.test.ts`, `test/phase2-known-gaps.test.ts`, and `test/v086-features.test.ts` are updated in Pass 1 to use the shared helper. Their filenames are unchanged unless also renamed in a later pass.

---

## Complete File Inventory After Cleanup

### `src/`

```
src/index.ts                        (manual smoke runner — unchanged)
src/function-fixtures.ts            (was: functionTests.ts)
src/class-fixtures.ts               (was: classTests.ts)
src/pre-condition-fixtures.ts       (was: phase1-fixtures.ts)
src/post-condition-fixtures.ts      (was: phase345-fixtures.ts)
src/pre-special-expr-fixtures.ts    (was: phase2-special-expr.ts)
src/post-more-fixtures.ts           (was: phase2-more-post.ts lines 1–180)
src/global-id-fixtures.ts           (was: phase2-more-post.ts lines 182–387)
src/alternate-fn-form-fixtures.ts   (was: phase3-missing-features.ts)
src/known-gaps-fixtures.ts          (was: phase2-known-gaps.ts, slimmed)
src/error-fixtures.ts
src/release-fixtures.ts
src/param-fixtures.ts
src/manual-assertions.ts
src/interface-features.ts
src/post-result-validation.ts
src/destructured-params.ts
src/class-destruct-test.ts
src/template-literals.ts
src/v086-features.ts
```

### `test/`

```
test/helpers/build-output.ts        (new)
test/function-fixtures.test.ts      (was: function.test.ts)
test/class-fixtures.test.ts         (was: class.test.ts)
test/pre-conditions.test.ts         (was: phase1.test.ts)
test/post-conditions.test.ts        (was: phase345.test.ts)
test/pre-special-expr.test.ts       (was: phase2-special-expr.test.ts)
test/post-more.test.ts              (was: phase2-more-post.test.ts)
test/alternate-fn-forms.test.ts     (was: phase3-missing.test.ts)
test/known-gaps.test.ts             (was: phase2-known-gaps.test.ts, slimmed)
test/errors.test.ts
test/release-build.test.ts
test/param-fixtures.test.ts
test/manual-assertions.test.ts
test/interface-features.test.ts
test/post-result-validation.test.ts
test/destructured-params.test.ts
test/template-literals.test.ts
test/v086-features.test.ts
test/global-identifiers.test.ts
test/build.test.ts
test/build-warnings.test.ts
```

---

## Success Criteria

- `npm test` passes with zero failures after each pass.
- No test cases deleted (only the 4 stale known-gap fixtures).
- No `phase*` names remain in `src/` or `test/`.
- No `functionTests` or `classTests` names remain.
- `getBuildOutput()` is the sole place that calls `build-dev.bat` / `npm run build:dev`.
