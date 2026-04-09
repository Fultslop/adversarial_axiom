# fsprepost Acceptance Test Plan

This document outlines the complete test strategy for the `fsprepost` TypeScript contract transformer. It categorises tests into three groups:

| Category | Meaning |
|---|---|
| **COVERED** | A test already exists in `src/functionTests.ts` or `src/classTests.ts`. |
| **TO ADD** | A supported feature that currently has **no** test. |
| **KNOWN GAP** | A documented limitation — the test should verify the expected warning/failure behaviour, not that the feature works. |
| **MISSING** | A feature listed as "not yet in scope" — a test would fail today. These are future roadmap items. |

---

## 1. `@pre` Conditions on Functions

| # | Feature | Status | Notes / Test to Add |
|---|---------|--------|---------------------|
| 1.1 | Simple boolean parameter `@pre a` | COVERED | `stringTestFn` (pass & fail) |
| 1.2 | Numeric comparison `@pre amount > 0` | COVERED | `withdraw`, `doNumberRange` |
| 1.3 | Multiple `@pre` tags on one function | COVERED | `doAnd`, `callAdd` |
| 1.4 | Array element access `@pre amount.includes(3)` | COVERED | `doArrFn` |
| 1.5 | Method call on parameter `@pre map.get('foo')` | COVERED | `doMapExistFn` (pass & fail) |
| 1.6 | `typeof` expression `@pre typeof(value) === 'string'` | COVERED | `doTypeOfFn` (pass & fail) |
| 1.7 | Callback/producer in pre `@pre produce().length > 0` | COVERED | `doProduceFn` (pass & fail) |
| 1.8 | Optional chaining `@pre obj?.value > 0` | COVERED | `doOptionalFn` |
| 1.9 | **Unknown identifier in `@pre`** — should produce compile warning | COVERED | `shouldWarnVDoesNotExistsDuringBuild` (v not a param) |
| 1.10 | **Type mismatch in `@pre`** — `@pre v === "foo"` on `number` param | TO ADD | `shouldWarnVNotCorrectType` exists but has no runtime/Jest assertion that the warning is emitted. Add a test in `test/` that runs `build:dev` and asserts the specific warning. |
| 1.11 | Assignment expression disguised as predicate `@pre v = 5` | TO ADD | `shouldWarnAssignmentDuringBuild` exists — add a build-output test to assert warning. |
| 1.12 | `@pre` on exported arrow function | MISSING | Arrow functions are not yet supported. Test should assert that no guards are injected. |
| 1.13 | `@pre` on exported function expression | MISSING | Function expressions are not yet supported. Test should assert no guards injected. |
| 1.14 | `@pre` on async function | MISSING | Async functions are not yet supported. Test should document current behaviour. |
| 1.15 | `@pre` on generator function | MISSING | Generators are not yet supported. |
| 1.16 | `@pre` referencing `this` in a function (non-method) | TO ADD | No test covers `this` usage outside a class context. |
| 1.17 | Logical AND in `@pre` with short-circuit | TO ADD | `doAnd` covers basic AND. Add test for short-circuit: `@pre false && unknownVar` should not evaluate `unknownVar`. |
| 1.18 | Logical OR in `@pre` | TO ADD | No test for `@pre a \|\| b`. |
| 1.19 | Negation `@pre !flag` | TO ADD | No test covering unary `!`. |
| 1.20 | Comparison operators (`>=`, `<=`, `===`, `!==`, `<`, `>`) | PARTIAL | `>`, `===` covered. Add explicit tests for `>=`, `<=`, `!==`, `<`. |
| 1.21 | Arithmetic expressions in `@pre` `@pre a + b > 10` | TO ADD | No test. |
| 1.22 | Ternary expression in `@pre` `@pre cond ? a > 0 : b > 0` | TO ADD | No test. |
| 1.23 | `@pre` with destructured parameter `@pre x > 0` on `fn({x,y})` | KNOWN GAP | Limitation #1. Test should assert unknown-identifier warning is emitted and no guard is injected. |
| 1.24 | `@pre` with enum reference `@pre status === Status.Active` | KNOWN GAP | Limitation #4. Test should assert unknown-identifier warning. |
| 1.25 | `@pre` with global object `@pre Math.abs(delta) < 1` | KNOWN GAP | Limitation #5. Test should assert unknown-identifier warning for `Math`. |
| 1.26 | `@pre` with template literal `@pre label === \`item_${id}\`` | KNOWN GAP | Limitation #6. Test should assert type mismatch is NOT detected. |
| 1.27 | `@pre` on non-exported function | TO ADD | Verify transformer skips non-exported functions (no guards injected). |
| 1.28 | `@pre` with `instanceof` check | TO ADD | `@pre obj instanceof Foo`. |
| 1.29 | `@pre` with `in` operator | TO ADD | `@pre 'key' in obj`. |
| 1.30 | `@pre` with `void` operator | TO ADD | `@pre void 0`. |
| 1.31 | `@pre` on static class method | COVERED | `Foo.doStaticFn` — but no runtime test exists. Add pass/fail test. |

---

## 2. `@post` Conditions on Functions

| # | Feature | Status | Notes / Test to Add |
|---|---------|--------|---------------------|
| 2.1 | `result` reference in `@post` | COVERED | `sub` (post references `this.count`), `doProduceFn` |
| 2.2 | `@post` that passes | COVERED | `doProduceFn`, `doLoopFn` |
| 2.3 | `@post` that fails | COVERED | `doProducePostFailFn` |
| 2.4 | `@post` with logical AND | TO ADD | `@post result >= 0 && result < 100`. |
| 2.5 | `@post` with logical OR | TO ADD | No test. |
| 2.6 | `@post` on void return function | TO ADD | `@post` on a function returning `void` — should still be valid (no `result` comparison needed). |
| 2.7 | **Type mismatch on `result`** — `@post result === "foo"` on `number` return | TO ADD | `shouldWarnResultNotCorrectType` exists but has no build-output test asserting the warning. |
| 2.8 | **`result` not defined** — `@post result === x + 1` on void function | TO ADD | `shouldWarnResultTypeMissing` exists — verify warning or behaviour. |
| 2.9 | `@post` on exported arrow function | MISSING | Arrow functions not supported. |
| 2.10 | `@post` on async function | MISSING | Async functions not supported. |
| 2.11 | `@post` on generator function | MISSING | Generators not supported. |
| 2.12 | `@post` with `result` on non-primitive return type | KNOWN GAP | Limitation #7. `result` omitted from type map for object/array returns. Test should assert no type-mismatch warning. |
| 2.13 | `@post` with destructured return | TO ADD | No test covers destructuring in post context. |
| 2.14 | `@post` with arithmetic `@post result === a + b` | TO ADD | No test. |
| 2.15 | `@post` on non-exported function | TO ADD | Verify transformer skips non-exported functions. |
| 2.16 | `@post` with `prev` capture (previous value) | MISSING | Previous capture not yet in scope. |

---

## 3. `@pre` + `@post` Combined

| # | Feature | Status | Notes / Test to Add |
|---|---------|--------|---------------------|
| 3.1 | Both `@pre` and `@post` on same function | COVERED | `doProduceFn`, `doProducePostFailFn` |
| 3.2 | `@pre` passes, `@post` fails | COVERED | `doProducePostFailFn` |
| 3.3 | `@pre` fails, `@post` never evaluated | TO ADD | Assert that post is NOT evaluated when pre fails. Add explicit test. |
| 3.4 | Multiple `@pre` + multiple `@post` on same function | TO ADD | No test with 2+ pres and 2+ posts. |
| 3.5 | Order of evaluation — pres in order, then body, then posts in order | TO ADD | Verify execution order with side-effect-free counters. |

---

## 4. Class `@invariant`

| # | Feature | Status | Notes / Test to Add |
|---|---------|--------|---------------------|
| 4.1 | Single invariant on class `@invariant this.max > this.min` | COVERED | `Foo` class |
| 4.2 | Multiple invariants on class | TO ADD | No test with 2+ `@invariant` tags. |
| 4.3 | Invariant checked after constructor | TO ADD | `Foo` constructor but no explicit test that invariant failure in constructor throws. |
| 4.4 | Invariant checked after public method | TO ADD | `Foo.updateMinMax` can violate invariant — add explicit test. |
| 4.5 | Invariant NOT checked on private methods | TO ADD | Add class with private method that violates invariant — assert no throw. |
| 4.6 | Invariant NOT checked on static methods | TO ADD | Add static method that would violate invariant — assert no throw. |
| 4.7 | Invariant with `this` property access | COVERED | `this.max > this.min` |
| 4.8 | Inheritance — invariant on base class, method on derived class | MISSING | Inherited contracts not yet in scope. Test should document current behaviour. |
| 4.9 | Inheritance — derived class adds its own invariants | MISSING | Inherited contracts not yet in scope. |
| 4.10 | Invariant on class with no public methods (only constructor) | TO ADD | Verify invariant checked after constructor only. |
| 4.11 | Invariant expression referencing method call `@invariant this.validate()` | TO ADD | No test. |
| 4.12 | Invariant violation produces `InvariantViolationError` | TO ADD | No test asserts the specific error type and its properties (`expression`, `location`). |
| 4.13 | Invariant with multi-level property chain `@invariant this.config.limit > 0` | KNOWN GAP | Limitation #8. Only root `this` is scope-checked. Test should document. |

---

## 5. Class Method Contracts (`@pre` / `@post` on methods)

| # | Feature | Status | Notes / Test to Add |
|---|---------|--------|---------------------|
| 5.1 | `@pre` on public method | COVERED | `Foo.callFoo`, `Foo.callAdd` |
| 5.2 | `@pre` with `this` reference `@pre amount <= this.balance` | TO ADD | No test uses `this.prop` in a pre condition. |
| 5.3 | `@post` on public method with `result` | COVERED | `Foo.sub` |
| 5.4 | `@post` referencing `this` state `@post this.count === prev - a` | MISSING | Previous capture (`prev`) not yet supported. |
| 5.5 | `@pre` on private method — should be skipped | TO ADD | Verify transformer does not instrument private methods. |
| 5.6 | `@pre` on protected method — should be skipped | TO ADD | Verify transformer does not instrument protected methods. |
| 5.7 | `@pre` on static method | COVERED | `Foo.doStaticFn` — but no runtime pass/fail test. |
| 5.8 | Constructor contracts `@pre` / `@post` | MISSING | Constructor contracts not yet in scope. Test should document current behaviour. |
| 5.9 | Method with `@pre` referencing another method's param (scope leak) | TO ADD | No test for scope isolation between methods. |
| 5.10 | Method override in subclass with different contract | MISSING | Inherited contracts not yet in scope. |

---

## 6. Error Types & Error Hierarchy

| # | Feature | Status | Notes / Test to Add |
|---|---------|--------|---------------------|
| 6.1 | `ContractViolationError` thrown on pre violation | TO ADD | No test asserts `instanceof ContractViolationError`. |
| 6.2 | `ContractViolationError.type === 'PRE'` | TO ADD | No test asserts `.type`. |
| 6.3 | `ContractViolationError.type === 'POST'` | TO ADD | No test asserts `.type` for post. |
| 6.4 | `ContractViolationError.expression` | TO ADD | No test asserts `.expression` contains the violated condition. |
| 6.5 | `ContractViolationError.location` | TO ADD | No test asserts `.location` is `'FunctionName'` or `'ClassName.methodName'`. |
| 6.6 | `ContractViolationError.message` format `[PRE] Contract violated at ...` | TO ADD | No test asserts message format. |
| 6.7 | `InvariantViolationError` thrown on invariant violation | TO ADD | No test asserts `instanceof InvariantViolationError`. |
| 6.8 | `InvariantViolationError` has `.expression` and `.location` | TO ADD | No test. |
| 6.9 | `ContractError` is base class — catch both variants | TO ADD | No test uses `instanceof ContractError` to catch both. |
| 6.10 | Error stack trace points to source location | TO ADD | Verify `.stack` includes meaningful location. |

---

## 7. Manual Assertion Functions (`pre()` / `post()`)

| # | Feature | Status | Notes / Test to Add |
|---|---------|--------|---------------------|
| 7.1 | `pre(condition, message)` throws `ContractViolationError` | TO ADD | No test calls `pre()` directly. |
| 7.2 | `post(condition, message)` throws `ContractViolationError` | TO ADD | No test calls `post()` directly. |
| 7.3 | `pre()` error has `type: 'PRE'` | TO ADD | No test. |
| 7.4 | `post()` error has `type: 'POST'` | TO ADD | No test. |
| 7.5 | Custom message in error | TO ADD | Pass custom message to `pre()` and assert it appears. |
| 7.6 | `pre()` / `post()` are NOT stripped in release build | TO ADD | Build with `npm run build` and assert `pre`/`post` calls remain in output. |
| 7.7 | `pre()` with destructured values | TO ADD | Test `pre(x > 0)` inside function with `fn({x,y})`. |

---

## 8. Type Mismatch Detection (Compile-Time Warnings)

| # | Feature | Status | Notes / Test to Add |
|---|---------|--------|---------------------|
| 8.1 | Number param vs string literal `@pre v === "foo"` on `number` | TO ADD | `shouldWarnVNotCorrectType` exists — add build-output assertion. |
| 8.2 | Result type mismatch `@post result === "foo"` on `number` return | TO ADD | `shouldWarnResultNotCorrectType` exists — add build-output assertion. |
| 8.3 | Non-primitive param type — no warning emitted | KNOWN GAP | Limitation #2. `@pre items === 42` on `string[]` param emits no warning. Test should assert this. |
| 8.4 | Union-typed param — no warning emitted | KNOWN GAP | Limitation #3. `@pre amount === "zero"` on `number \| undefined` emits no warning. Test should assert this. |
| 8.5 | Multi-level property chain — only root checked | KNOWN GAP | Limitation #8. Test should assert intermediate properties not validated. |
| 8.6 | Unary operand — type mismatch not detected | KNOWN GAP | Limitation #9. `@pre -amount > 0` on `string` amount — test should assert no warning. |
| 8.7 | Compound conditions — type narrowing not considered | KNOWN GAP | Limitation #10. `@pre amount !== null && amount === "zero"` — test should assert no warning on second clause. |
| 8.8 | Template literal — type mismatch not detected | KNOWN GAP | Limitation #6. Test should assert no warning. |
| 8.9 | Valid type match — no warning | TO ADD | Positive test: `@pre v === 5` on `number` should produce zero warnings. |

---

## 9. Scope & Identifier Resolution

| # | Feature | Status | Notes / Test to Add |
|---|---------|--------|---------------------|
| 9.1 | Parameter name recognised | COVERED | Multiple tests use parameter names. |
| 9.2 | `this` in method context | TO ADD | Partially covered by invariant tests. Add explicit method `@pre` with `this`. |
| 9.3 | Unknown identifier warning | COVERED | `shouldWarnVDoesNotExistsDuringBuild` |
| 9.4 | `result` in post context | COVERED | `sub`, `doProduceFn` |
| 9.5 | `result` in pre context — should warn or be undefined | TO ADD | `@pre result > 0` before result exists — verify behaviour. |
| 9.6 | Whitelisted globals: `undefined`, `NaN`, `Infinity`, `globalThis`, `arguments` | TO ADD | No test verifies these are accepted without warning. |
| 9.7 | Non-whitelisted global `Math` — warns | KNOWN GAP | Limitation #5. Test should assert warning. |
| 9.8 | Non-whitelisted global `console` — warns | TO ADD | `@pre console.log('x')` — should warn. |
| 9.9 | Enum member reference — warns | KNOWN GAP | Limitation #4. Test should assert warning. |
| 9.10 | Module-level constant reference — warns | TO ADD | `@pre MAX_VALUE > 0` where `MAX_VALUE` is module constant. |

---

## 10. Control Flow Coverage

| # | Feature | Status | Notes / Test to Add |
|---|---------|--------|---------------------|
| 10.1 | Function with `for...of` loop and `@post` | COVERED | `doLoopFn` |
| 10.2 | Function with `switch` and `@post` | COVERED | `doSwitchFn` |
| 10.3 | Function with `if/else` and `@post` | TO ADD | No explicit test. |
| 10.4 | Function with multiple `return` statements and `@post` | TO ADD | Post must be checked on every exit path. |
| 10.5 | Function with `throw` and `@post` | TO ADD | Does post get checked before throw? Test should verify. |
| 10.6 | Function with `try/catch` and `@post` | TO ADD | Post checked after catch block. |
| 10.7 | Function with early `return` and `@post` | TO ADD | Post checked on early return path. |
| 10.8 | Class method with multiple return paths | TO ADD | Each path should trigger invariant check. |
| 10.9 | Function with nested loops | TO ADD | No test. |
| 10.10 | Arrow function inside body with contract on outer function | TO ADD | Verify transformer handles nested arrow functions correctly (doesn't double-instrument). |

---

## 11. Release Build (No Contract Code)

| # | Feature | Status | Notes / Test to Add |
|---|---------|--------|---------------------|
| 11.1 | `npm run build` produces output without `ContractViolationError` references | TO ADD | Add test that compiles with `tsc` and greps output for contract-related identifiers. |
| 11.2 | `npm run build` produces output without `InvariantViolationError` references | TO ADD | Same as 11.1. |
| 11.3 | `npm run build` produces output without `#checkInvariants` method | TO ADD | Verify invariant injection method is stripped. |
| 11.4 | `npm run build` produces output without `pre`/`post` injected guards | TO ADD | Verify no `__pre_guard`/`__post_guard` code in output. |
| 11.5 | Manual `pre()`/`post()` calls ARE present in release output | TO ADD | These are runtime functions — they should NOT be stripped. |
| 11.6 | Release build output is functionally equivalent (same return values) | TO ADD | Run release-built code and assert same results as dev build. |

---

## 12. Build & Transformer Warnings

| # | Feature | Status | Notes / Test to Add |
|---|---------|--------|---------------------|
| 12.1 | Exactly 5 warnings on current codebase | COVERED | `build.test.ts` |
| 12.2 | Warning message format `[fsprepost] Contract validation warning` | COVERED | `build.test.ts` |
| 12.3 | Warning for unknown identifier | TO ADD | Assert specific warning text mentions the identifier name. |
| 12.4 | Warning for type mismatch | TO ADD | Assert specific warning text mentions the mismatch. |
| 12.5 | Warning for assignment expression `@pre v = 5` | TO ADD | Assert warning mentions assignment. |
| 12.6 | Zero warnings on clean contract code | TO ADD | Compile a clean file with valid contracts — assert zero warnings. |
| 12.7 | Warning count changes when test fixtures change | TO ADD | Ensure `build.test.ts` warning count is not brittle — consider regex-based matching instead of exact count. |

---

## 13. Not Yet In Scope (Future Features — Tests Will Fail Today)

These features are explicitly listed in the README as not yet implemented. Tests for these should be written as **documenting current behaviour** (i.e., the test asserts that the feature does NOT work yet), not as acceptance tests.

| # | Feature | Test Strategy |
|---|---------|---------------|
| 13.1 | Previous capture (`@post this.balance === prev - amount`) | Test should assert that `prev` is treated as unknown identifier or no guard is injected. |
| 13.2 | Arrow functions and function expressions | Test should assert no guards are injected. |
| 13.3 | `async` functions and generators | Test should assert no guards are injected or document current error. |
| 13.4 | Constructor contracts | Test should assert no pre/post guards on constructor. |
| 13.5 | Inherited contracts | Test should assert derived class methods do not inherit base class contracts. |
| 13.6 | `ts-patch` integration with `type: raw` loader under TypeScript 6 + `moduleResolution: node16` | Test should document known incompatibility. |

---

## 14. Outside Scope (Hard Design Constraints — No Tests Needed)

These are explicitly out of scope per the README. No tests should be written for these, but a brief note in documentation is useful:

| # | Feature | Reason |
|---|---------|--------|
| 14.1 | Runtime contract checking in release builds | Zero-overhead guarantee is a hard constraint. |
| 14.2 | Contracts on non-function nodes (fields, variables, type aliases) | By design. |
| 14.3 | Side-effect expressions in contract expressions | Expected to be pure predicates. |
| 14.4 | Source map rewriting or debugger integration | Explicitly outside scope. |
| 14.5 | Private / protected method instrumentation | Explicitly outside scope. |

---

## 15. Edge Cases & Stress Tests

| # | Feature | Status | Notes / Test to Add |
|---|---------|--------|---------------------|
| 15.1 | Empty `@pre` or `@post` tag (no expression) | TO ADD | Verify behaviour — should warn or be no-op. |
| 15.2 | `@pre` / `@post` with very long expression | TO ADD | No stress test. |
| 15.3 | `@pre` / `@post` with deeply nested property access `@pre a.b.c.d.e > 0` | TO ADD | Limitation #8 applies — only root checked. |
| 15.4 | Multiple classes with invariants in same file | TO ADD | No test for invariant isolation between classes. |
| 15.5 | Class with both `@invariant` and method-level `@pre`/`@post` | COVERED | `Foo` has both — but no test verifies order (pre → body → post → invariant). |
| 15.6 | Execution order: `@pre` → body → `@post` → `@invariant` | TO ADD | No test verifies this ordering explicitly. |
| 15.7 | Contract on function with default parameters | TO ADD | `function f(a: number = 10)` — verify `@pre a > 0` works. |
| 15.8 | Contract on function with rest parameters | TO ADD | `function f(...args: number[])` — verify `@pre args.length > 0`. |
| 15.9 | Contract on function with optional parameters | TO ADD | `function f(a?: number)` — verify `@pre a !== undefined`. |
| 15.10 | Re-entrant contract calls (function A with `@pre` calls function B with `@pre`) | TO ADD | No test for nested guard execution. |

---

## Implementation Priority

### Phase 1: Fill Coverage Gaps in Supported Features
Items: 1.10, 1.11, 1.17, 1.18, 1.19, 1.20, 1.21, 1.27, 1.31, 2.4, 2.5, 2.6, 2.7, 2.8, 2.15, 3.3, 3.4, 3.5, 4.2, 4.3, 4.4, 4.5, 4.6, 4.10, 4.12, 5.2, 5.5, 5.6, 5.7, 6.1–6.9, 7.1–7.7, 8.1, 8.2, 8.9, 9.2, 9.5, 9.6, 9.8, 9.10, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 11.1–11.6, 12.3, 12.4, 12.5, 12.6, 15.1, 15.5, 15.6, 15.7, 15.8, 15.9, 15.10

### Phase 2: Document Known Gaps with Explicit Tests
Items: 1.23, 1.24, 1.25, 1.26, 2.12, 4.13, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 9.7, 9.9

### Phase 3: Future Feature Tests (Assert "Not Yet Working")
Items: 1.12, 1.13, 1.14, 1.15, 2.9, 2.10, 2.11, 2.16, 4.8, 4.9, 5.4, 5.8, 5.10, 13.1–13.6
