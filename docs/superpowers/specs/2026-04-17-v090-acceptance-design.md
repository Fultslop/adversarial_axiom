# v0.9.0 Acceptance Test Plan — Design Spec

## Overview

`@fultslop/axiom@0.9.0-alpha.10` adds contract injection for exported arrow functions,
function expressions, and async functions. Six existing tests now have wrong expectations
(they tested that features were *not* implemented; they now are). This spec covers:

1. Fixing those six regression failures across four existing test suites.
2. Creating `test/v090-acceptance.test.ts` — full-program mode acceptance tests
   (compile via `tsc` + execute compiled output).
3. Creating `src/v090-acceptance-fixtures.ts` — ts-jest regression guard fixtures
   compiled inline on every `npm test` run.

---

## Files Changed / Created

| Action | File | Reason |
|---|---|---|
| Modify | `test/alternate-fn-forms.test.ts` | Flip 2 expectations; rename describe block |
| Modify | `test/destructured-params.test.ts` | Flip 1 expectation |
| Modify | `test/template-literals.test.ts` | Flip 2 expectations |
| Modify | `test/v086-features.test.ts` | Flip 1 expectation |
| Create | `test/v090-acceptance.test.ts` | Full-program acceptance tests |
| Create | `src/v090-acceptance-fixtures.ts` | ts-jest regression fixtures |

---

## Part 1 — Regression Fixes (4 existing suites)

These tests were written when features were explicitly "not in scope". The transformer
now handles them correctly; the test expectations are wrong.

### `test/alternate-fn-forms.test.ts`

- Rename outer describe: `"Phase 3: Missing feature tests (not yet in scope)"`
  → `"Newly instrumented function forms (v0.9.0)"`
- **1.12 arrow:** `expect(arrowFnWithPre(-5)).toBe(-5)` (no throw)
  → `expect(() => arrowFnWithPre(-5)).toThrow(ContractViolationError)`
- **1.13 funcExpr:** same flip for `funcExprWithPre(-5)`
- All other tests in the file remain unchanged (async already expected to throw;
  generator, constructor, inherited contracts were correct).

### `test/destructured-params.test.ts`

- **Arrow function with destructuring:**
  `expect(() => arrowDestruct({ x: 0, y: 3 })).not.toThrow()`
  → `expect(() => arrowDestruct({ x: 0, y: 3 })).toThrow(ContractViolationError)`
- Update description: `"should NOT have contract injected (known limitation)"`
  → `"should throw ContractViolationError when x is 0 (now instrumented)"`

### `test/template-literals.test.ts`

Two tests that expected no injection for interpolated templates must be flipped.
Interpolated template literals in contracts (`\`item_${id}\``) are now supported —
the validator traverses child nodes and all referenced identifiers are known params.

- **Test: "should NOT have contract injected (known limitation)" (interpolated pre):**
  `expect(() => interpolatedTemplateLiteralPre(-5, 'item_-5')).not.toThrow()`
  → `expect(() => interpolatedTemplateLiteralPre(-5, 'item_-5')).toThrow(ContractViolationError)`
- **Test: "should NOT have contract injected (known limitation)" (template on left):**
  Flip equivalent: now throws on violation.
- Update both descriptions to remove "known limitation".

### `test/v086-features.test.ts`

- **"Interpolated template literals (control - still not supported)":**
  Flip `not.toThrow()` → `toThrow(ContractViolationError)`.
  Update description: remove "control - still not supported".

---

## Part 2 — `test/v090-acceptance.test.ts`

### Infrastructure

The file is created from scratch. Core helper:

```typescript
function compileAndRun(
    fixture: string,
    testName: string,
    testCall?: string
): { output: string; compiled: string; exitCode: number; success: boolean }
```

**`testCall`** is the JS expression evaluated in the runner, e.g. `"arrowWithPre(-1)"`.
Supports both sync and async calls via `await` in an async runner wrapper.
When `testCall` is `undefined`, the runner step is **skipped entirely** — `output` is `''`,
`exitCode` is `0`, and only `compiled` is meaningful. This avoids crashing on class
fixtures (e.g. `RegressionClass`, `AsyncClass`) that cannot be called as bare functions.
Tests marked `—` in the runtime column do not provide `testCall`.

**Three infrastructure fixes** from the deleted file:
1. `cwd` for `npx tsc`: project root (not `testDir`, which has no `node_modules`).
2. Runner written to `outDir` (not `srcDir`), so `require('./${testName}')` resolves
   to the compiled output file in the same directory.
3. Runner template uses `async function main() { ... }; main()` to handle both
   sync and async functions uniformly.

**Runner template:**
```javascript
const { ${testName} } = require('./${testName}');
async function main() {
    try {
        const result = await (${testCall || `${testName}()`});
        console.log('RESULT:', JSON.stringify(result));
    } catch (e) {
        console.log('ERROR:', e.constructor.name, e.message);
    }
}
main().catch(e => { console.log('FATAL:', e.message); process.exit(1); });
```

**tsconfig** written to `testDir`, uses absolute path to transformer from `node_modules`.

### Test Groups

#### A. Arrow & Function Expressions (A1–A12)

| ID | Fixture | Compiled-output check | Runtime check |
|---|---|---|---|
| A1 | Arrow `@pre x > 0` | `ContractViolationError("PRE"` present; location `"arrowWithPre"` | call(-1) → ERROR: ContractViolationError; call(1) → RESULT: 1 |
| A2 | Arrow `@post result > 0` | `ContractViolationError("POST"` present | call(2) → RESULT: 4 |
| A3 | Arrow `@pre x > 0` + `@post result > 1` | Both PRE and POST guards present | call(-1) → pre violation; call(1) → RESULT: 2 |
| A4 | Expression-body arrow `@post result > 0` | Compiled has `return` and `result` (block-body normalised) | call(2) → RESULT: 4 |
| A5 | Named funcExpr `add`, exported as `namedFuncExpr`, `@pre x > 0` | Location string is `"namedFuncExpr"`, NOT `"add"` | — |
| A7 | Arrow `({ x, y })` `@pre x > 0` | success === true | call({x:0,y:3}) → ERROR |
| A8 | Arrow `@pre unknownVar > 0` | Compiled does NOT contain `unknownVar` (guard silently skipped) | success === true (no crash) |
| A9 | Arrow two `@pre` tags | At least 2 `ContractViolationError("PRE"` matches | — |
| A10 | Arrow `: void` + `@post` | `result === undefined` NOT in compiled (post dropped for void) | success === true |
| A11 | Arrow ternary body `@post result >= 0` | `ContractViolationError` present | — |
| A12 | Function expression `@pre` + `@post` | Both PRE and POST guards present | — |

#### B. Async Functions (B1–B9)

| ID | Fixture | Compiled-output check | Runtime check |
|---|---|---|---|
| B1 | `async function` `@pre x > 0` | PRE guard present before async body | call(-1) → rejects with ContractViolationError |
| B2 | `async function` `@post result > 0` | `await (async () => { ... })()` wraps body; POST guard after | call(2) → RESULT: 4 |
| B3 | `async function Promise<void>` `@post` | `@post` dropped (no `result` to check) | success === true |
| B4 | `async function` `@prev { x }` `@post result === prev.x + 1` | `const prev = ({ x })` present before body; `prev.x + 1` in POST guard | call(5) → RESULT: 6 |
| B5 | Async arrow `@pre` + `@post` | Both guards present | call(-1) → rejects |
| B6 | Async funcExpr `@pre` | PRE guard present | call(-1) → rejects |
| B7 | `async function` two `@post` | At least 2 POST guards | — |
| B8 | `async function` throws in body `@post` | Compiled has both `throw new Error` and `ContractViolationError` (post guard after body) | — |
| B9 | Async class method (no explicit `@prev`) with `@post this.count === prev.count + 1` | `const prev = ({ ...this })` injected synchronously before `await`; POST guard checks `this.count === prev.count + 1` | — |

**Note on B4:** The previously-deleted acceptance test used `@prev const old = x` / `@post result === old + 1`. This syntax is incorrect. The correct syntax per README is `@prev { x }` (capture expression) and `@post result === prev.x + 1` (using `prev` identifier).

#### C. `keepContracts` Logic (C1–C7)

| ID | Fixture line 1 | Function contracts | Expected compiled output |
|---|---|---|---|
| C1 | *(none)* | `@pre` + `@post` | `require('@fultslop/axiom')` present |
| C2 | `// @axiom keepContracts post` | `@pre` + `@post` | POST guard present, PRE guard absent |
| C3 | *(override on line 2+, not line 1)* | `@pre` + `@post` | Both guards present (line 2+ ignored) |
| C4 | `// @axiom keepContracts true` | `@pre` + `@post` | Both PRE and POST guards present |
| C5 | `// @axiom keepContracts all` | `@pre` + `@post` | Both PRE and POST guards present (same as C4) |
| C6 | `// @axiom keepContracts pre` | `@pre` + `@post` | PRE guard present, POST guard absent |
| C7 | `// @axiom keepContracts invariant` | Class `@invariant` + method `@pre` | `InvariantViolationError` present, no PRE/POST guards |

#### D. Regression (D1–D3)

| ID | Fixture | Check |
|---|---|---|
| D1 | `@pre produce().length > 0` + `@post result === ... || result < 0` | `ContractViolationError` present |
| D2 | Class `@invariant this.value > 0` + method `@pre x > 0` | Both `ContractViolationError` and `InvariantViolationError` present |
| D3 | `@prev { x }` + `@post result === prev.x + 1` on *sync* function | `const prev = ({ x })` before body; `prev.x + 1` in POST guard; call(5) → RESULT: 6 |

---

## Part 3 — `src/v090-acceptance-fixtures.ts`

Compiled inline by ts-jest (no separate tsc invocation). Acts as a fast regression guard:
if the transformer breaks arrow/async/funcExpr support in a future version, `npm test` fails
immediately.

Fixtures to include:

```typescript
// A: Arrow functions — compiled and run by ts-jest
/** @pre x > 0 */
export const arrowWithPreFixture = (x: number): number => x;

/** @post result > 0 */
export const arrowWithPostFixture = (x: number): number => x * 2;

/** @pre x > 0 @post result > 1 */
export const arrowWithBothFixture = (x: number): number => x + 1;

// B: Async
/** @pre x > 0 */
export async function asyncFnWithPreFixture(x: number): Promise<number> { return x; }

/** @post result > 0 */
export async function asyncFnWithPostFixture(x: number): Promise<number> { return x * 2; }

// Async arrow
/** @pre x > 0 */
export const asyncArrowFixture = async (x: number): Promise<number> => x;

// Function expression
/** @pre x > 0 */
export const funcExprFixture = function(x: number): number { return x; };
```

Companion test file: `test/v090-acceptance-fixtures.test.ts` (ts-jest, same pattern as other fixture tests).

Runtime assertions:
- `arrowWithPreFixture(-1)` → throws `ContractViolationError`
- `arrowWithPreFixture(1)` → returns `1`
- `arrowWithPostFixture(2)` → returns `4`
- `arrowWithBothFixture(-1)` → throws `ContractViolationError`
- `asyncFnWithPreFixture(-1)` → rejects with `ContractViolationError`
- `asyncFnWithPreFixture(1)` → resolves to `1`
- `asyncArrowFixture(-1)` → rejects with `ContractViolationError`
- `funcExprFixture(-1)` → throws `ContractViolationError`

---

## Open Questions

None. All ambiguities resolved during brainstorming:
- `require('@fultslop/axiom')` (not `contracts` subpath) — confirmed from compiled output.
- `@prev` syntax: `@prev <expression>` where `prev` is the identifier in `@post`.
- Class methods default to `{ ...this }` when `@post` references `prev` with no `@prev` tag.
- Non-exported / class-field arrows: out of scope, no tests.
- All five `keepContracts` variants required.
- `@prev` on sync functions: D3 test case added.
