# Acceptance Test Plan: Closures (#20) — Phase B: Documented Boundary Testing

**Library under test:** `@fultslop/axiom` (local build)
**Spec reference:** `docs/superpowers/specs/2026-04-13-closures-design.md`
**Test infrastructure:** `compileAndRun` helper — writes fixture to disk, compiles with `tspc`+transformer, optionally executes with `node`

Explicit structural limits stated in the spec.

---

| Test ID | Name | Category | Input Description | Expected Outcome | Risk Justification |
|---|---|---|---|---|---|
| **CL-B1** | One level deep — supported | Boundary | Outer exported fn → direct inner fn with `@pre`. Inner fn has no nested children. | `@pre` injected on inner fn. | Confirms the "exactly one level" bound from section 3 is correctly the *minimum* supported depth. |
| **CL-B2** | Two levels deep — grandchild NOT rewritten | Boundary | Outer fn → `function middle()` → `/** @pre x > 0 */ function inner(x: number)`. Middle has no tags. | No `ContractViolationError` in output for `inner`. Warning emitted for `inner` (via #13). Phase 2 does not recurse into `middle`'s body. | Boundary at n=2 per section 3 and 4.1. Accidental recursion would silently inject broken contracts. |
| **CL-B3** | Named inner function — `@post` `result` with return type (boundary: type present) | Boundary | Inner fn has explicit return type `: string`; `@post result.length > 0` | `@post` injected. | n-1 of the "no return type" guard. Validates the guard only fires on the missing-type path. |
| **CL-B4** | Named inner function — `@post` `result` without return type (n+1: type absent) | Boundary | Inner fn has **no** return type; `@post result.length > 0` | Warning emitted with location `"outer > inner"`; `@post` NOT injected. Compiled output does not contain `result.length > 0`. | Confirms `filterPostTagsWithResult` fires correctly for nested nodes. |
| **CL-B5** | Multiple nested functions at same depth — all rewritten | Boundary | Outer fn body contains two separate named inner fns, both tagged with `@pre` | Both fns have guards injected. Location strings are distinct (`outer > fn1`, `outer > fn2`). | Tests that the `rewriteNestedFunctions` loop processes all siblings, not just the first. |
| **CL-B6** | Non-exported outer function — inner fn NOT rewritten | Boundary | A **non-exported** outer fn contains `/** @pre x > 0 */ function inner(x: number)` | No `ContractViolationError` in output. Warning (if #13 is active) targets the outer non-exported fn, not the inner. | Boundary at visibility gate. Phase 2 never fires because `visitNode` never dispatches a non-exported outer fn. |
| **CL-B7** | IIFE — NOT rewritten, `@pre` present | Boundary | Outer fn body: `(/** @pre x > 0 */ (x: number) => x)(-1);` | No `ContractViolationError` injected. #13 warning emitted. | Section 3 explicitly excludes IIFEs. The AST shape (callee of `CallExpression`) must not match Rules A/B/C. |
| **CL-B8** | Captured identifier from immediately preceding `const` | Boundary | Outer fn body: `const MAX = 100;` then `/** @pre x <= MAX */ function check(x: number)` | `@pre x <= MAX` injected; `MAX` not treated as unknown; no spurious warning. `check(200)` throws. | Boundary for `buildCapturedIdentifiers` index scan up to `innerStatementIndex - 1` (section 4.7). |
| **CL-B9** | Identifier declared *after* inner fn not captured | Boundary | Outer fn body: `/** @pre x < LATER */ function check(x: number)`; `const LATER = 10;` declared on the next line | `LATER` treated as unknown identifier; tag dropped with warning. | `buildCapturedIdentifiers` only scans indices `0..innerStatementIndex-1` — forward declarations must not be included. |
