# Acceptance Test Plan: Class Inheritance Contracts — Phase C: Implicit Edge Case Discovery

**Library under test:** `@fultslop/axiom` (local build)
**Spec reference:** Class Inheritance Contracts acceptance scenarios 7, 8, 9, 10, 11, 12
**Test infrastructure:** `compileAndRun` helper (single-file); `compileAndRunMulti` helper (two source files); `ts.transpileModule` API (transpileModule mode)

Silent failure points identified by logic analysis of the spec.

---

| Test ID | Name | Category | Input Description | Expected Outcome | Risk Justification |
|---|---|---|---|---|---|
| **CI-C1** | Param name mismatch — rename mode: contract fires with new name | Implicit Edge Case | Animal: `/** @pre amount > 0 */` on `feed(amount)`; Dog: `feed(qty: number)` (different name); default rename mode | `dog.feed(-1)` throws `ContractViolationError`; `compilationOutput` contains a warning about rename from `amount` to `qty` | Renamed-but-active contract: if renaming silently fails, the guard is lost with no indication. |
| **CI-C2** | Param name mismatch — ignore mode: contract skipped | Implicit Edge Case | Same setup as CI-C1 + transformer option `interfaceParamMismatch: 'ignore'` configured | `dog.feed(-1)` does **not** throw; `compilationOutput` contains a warning that contract was skipped | Ignore mode must actively suppress the guard, not silently apply it with the wrong name. |
| **CI-C3** | Cross-file base class: contracts propagate across files | Implicit Edge Case | `Animal` exported from `animal.ts` with `/** @pre amount > 0 */`; `Dog extends Animal` in `dog.ts` (separate file, imports Animal) | `new Dog().feed(-1)` throws `ContractViolationError`; compilation succeeds | Cross-file requires TypeChecker resolution. This is the most common real-world usage pattern. |
| **CI-C4** | `transpileModule` mode: no crash; Dog's own contracts fire | Implicit Edge Case | Dog has its own `/** @pre amount > 0 */` on `feed`; transformer invoked via `ts.transpileModule` (no Program/TypeChecker) | No crash or exception during transform; compiled output contains `ContractViolationError("PRE"`; `compilationOutput` contains "no TypeChecker available" or similar | Without a TypeChecker, inherited contracts cannot be resolved. The transformer must degrade gracefully rather than throw. |
| **CI-C5** | Non-goal: constructor `@pre` NOT inherited by subclass | Implicit Edge Case | `Animal` constructor has `/** @pre id > 0 */`; `Dog extends Animal` | `new Dog(-1)` does **not** throw; no `ContractViolationError` in runner output | Spec §12 explicitly excludes constructor contract inheritance. Accidental injection would break all `new` calls. |
| **CI-C6** | Non-goal: grandparent contracts NOT applied to grandchild | Implicit Edge Case | `Animal.feed` has `/** @pre amount > 0 */`; `Dog extends Animal` (inherits); `Cat extends Dog` with `feed` override but no annotation | `new Cat().feed(-1)` does **not** throw | Spec §12 limits propagation to the direct parent only. Grandparent injection would double-apply guards through transitive chains. |
