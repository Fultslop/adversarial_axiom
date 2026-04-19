# Acceptance Test Plan: Closures (#20) — Phase A: Happy Path Validation

**Library under test:** `@fultslop/axiom` (local build)
**Spec reference:** `docs/superpowers/specs/2026-04-13-closures-design.md`
**Test infrastructure:** `compileAndRun` helper — writes fixture to disk, compiles with `tspc`+transformer, optionally executes with `node`

Minimum tests to prove the primary contract of the spec is met.

---

| Test ID | Name | Category | Input Description | Expected Outcome | Risk Justification |
|---|---|---|---|---|---|
| **CL-A1** | Named inner function — `@pre` injected | Basic | Outer exported fn contains a named inner `FunctionDeclaration` with `/** @pre item.length > 0 */` | Compiled output contains `ContractViolationError("PRE"`, location string `"processItems > sanitise"`. Calling `sanitise('')` throws. | Core happy path for Rule A (section 4.3). Without this the entire feature is broken. |
| **CL-A2** | Named inner function — `@post` with `result` injected | Basic | Inner `FunctionDeclaration` with explicit return type and `/** @post result.length > 0 */` | `ContractViolationError("POST"` present in output; whitespace-only string triggers violation at runtime. | Verifies Phase 1 (outer) does not interfere with Phase 2 `result` capture on inner. |
| **CL-A3** | `const` arrow in outer body — `@pre` injected | Basic | Outer exported fn; body contains `/** @pre x > 0 */ const add = (x: number): number => base + x;` | `ContractViolationError("PRE"` in output; location is `"makeAdder > add"`. Calling `add(-1)` throws. | Core happy path for Rule B (section 4.3). |
| **CL-A4** | `const` function expression in outer body — `@pre` injected | Basic | Same as CL-A3 but initializer is `function(n: number): number { return n * n; }` | `ContractViolationError("PRE"` present; location is `"outer > square"`. | Confirms Rule B applies to both arrow and function-expression initializers. |
| **CL-A5** | Returned arrow function — `@pre` injected | Basic | Outer fn returns `(x: number): number => base + x;` preceded by `/** @pre x > 0 */` on the `return` statement | `ContractViolationError("PRE"` in output; location is `"makeAdder > (anonymous)"`. Returned fn called with `-1` throws. | Core happy path for Rule C (section 4.3). |
| **CL-A6** | Both outer and inner contracts — both independently injected | Basic | Outer fn has `/** @pre items.length > 0 */`; inner named fn has `/** @pre item.length > 0 */` | Two separate `ContractViolationError("PRE"` guards in output — one for outer, one for inner. Outer triggers on empty array; inner triggers on empty string. | Verifies two-phase structure: Phase 1 and Phase 2 produce additive, non-interfering output. |
| **CL-A7** | Inner function in class method body — `@pre` injected | Basic | `class Processor { public process(items: string[]): string[] { /** @pre item.length > 0 */ function sanitise(...) } }` | `ContractViolationError("PRE"` present; location is `"Processor.process > sanitise"`. | Class methods delegate to `tryRewriteFunction` — confirms Phase 2 fires for method bodies automatically (section 4.2). |
| **CL-A8** | `require('@fultslop/axiom')` injected when inner has contracts | Basic | File with only an outer exported fn (no outer tags) and a tagged inner named fn | Compiled output contains `require("@fultslop/axiom")` exactly once. | Import deduplication must survive the two-phase rewrite. Missing import → runtime crash. |
| **CL-A9** | No injection and no `require` for untagged inner function | Basic | Outer exported fn contains an inner `FunctionDeclaration` with no JSDoc | Compiled output does not contain `ContractViolationError`; no `require("@fultslop/axiom")`. | Proves Phase 2 short-circuits cleanly when there are no tags — no unnecessary AST mutations. |
