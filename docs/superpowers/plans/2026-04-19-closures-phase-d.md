# Acceptance Test Plan: Closures (#20) — Phase D: Scope Guard

**Library under test:** `@fultslop/axiom` (local build)
**Spec reference:** `docs/superpowers/specs/2026-04-13-closures-design.md`

Justification that each identified edge case is a realistic threat and not a theoretical outlier.

---

| Test ID | Why In-Scope (Not Theoretical) |
|---|---|
| **CL-B2** | Grandchild exclusion is enforced by a deliberate depth limit. A one-off recursion bug in `rewriteNestedFunctions` would silently inject broken contracts into grandchildren with no type safety net. |
| **CL-B6** | Non-exported outer function exclusion is the existing `isPublicTarget` gate. A developer adding `@pre` to an inner fn of a private helper expects silence; accidental injection would alter private semantics. |
| **CL-B8** | The `innerStatementIndex - 1` boundary in `buildCapturedIdentifiers` is a classic off-by-one risk. Preceding constants are a common pattern (config values, computed limits) used directly in contracts. |
| **CL-B9** | Forward declaration exclusion prevents hoisting confusion. `const` in JS/TS is not hoisted, so using a name declared later as "known" would produce a `ReferenceError` at runtime inside the guard. |
| **CL-C1** | Outer parameters are the primary motivation for the entire closures spec (section 1). Without fixing this, every closure contract referencing a captured outer param would be silently dropped. |
| **CL-C4** | Missing `@prev` for closures is the spec's stated behavior (section 4.8). If `filterPostTagsRequiringPrev` is not applied, a `@post` using `prev` would produce a `ReferenceError` in the compiled guard. |
| **CL-C7** | `@invariant` on a closure could plausibly reach class-level injection code if the pattern-matching is not tight. A transformer crash in user code is a severity-1 usability failure. |
| **CL-C8** | Expression-body normalization was a known issue for top-level arrows (resolved in the arrow-functions spec). Rule B closures are the exact same AST shape. Omission is a copy-paste class of defect. |
| **CL-C11** | `transformed.value` signaling is the mechanism that triggers `require` injection. Forgetting to set it in Phase 2 is a silent integration failure: the guard references `ContractViolationError` which is undefined, producing a crash on first contract violation. |
| **CL-C13** | Parameter name shadowing is common in utility closures (`function id(x) {}` inside a fn with param `x`). The merged known-identifier set must not clobber the inner param with the outer's same-named param. |
| **CL-C14** | Destructured `const` bindings are idiomatic TypeScript (object destructuring of options bags). `extractBindingNames` exists precisely to handle this; not exercising it for the captured-identifier path would leave a hidden gap. |
| **CL-C15** | Nested Phase 2 re-invocation would only occur if the rewritten `middle` body were itself passed back through `tryRewriteFunction`, which the spec explicitly prevents. This test confirms the depth bound holds after rewriting. |
| **CL-C18** | `keepContracts` is a file-level directive. Applying it to outer Phase 1 contracts but not inner Phase 2 contracts would produce inconsistent runtime behavior in production builds. |

---

## Implementation Notes

Based on existing conventions in [test/v090-acceptance.test.ts](../../../../test/v090-acceptance.test.ts):

**Target file:** `test/v0a17-closures-acceptance.test.ts`

**Helper:** Reuse the `compileAndRun` pattern — write fixture to `temp-v0a17-closures/`, compile with `tspc`, run with `node`.

**Assertion patterns:**

- Location strings: `expect(result.compiled).toContain('"processItems > sanitise"')` — the transformer emits the location as a string literal in the `ContractViolationError` call.
- Warning detection: capture `tscResult.stderr` / `tscResult.stdout` from the compile step; the transformer writes warnings via `diagnostics` to stderr. Add a `stderr` field to the `compileAndRun` return value if not already present.
- Exclusion assertions (CL-B2, CL-B6, CL-B7, CL-C15): `expect(result.compiled).not.toContain(...)` on the inner expression to confirm no guard was injected.

**Tests requiring warning detection from compile stderr:** CL-B4, CL-B9, CL-C4, CL-C5, CL-C9.
