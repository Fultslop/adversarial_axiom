# Acceptance Test Plan: Class Inheritance Contracts — Phase B: Documented Boundary Testing

**Library under test:** `@fultslop/axiom` (local build)
**Spec reference:** Class Inheritance Contracts acceptance scenarios 4, 5, 9
**Test infrastructure:** `compileAndRun` helper — writes fixture to disk, compiles with `tspc`+transformer, optionally executes with `node`

Explicit structural limits stated in the spec, tested at the exact boundary, n−1, and n+1.

---

| Test ID | Name | Category | Input Description | Expected Outcome | Risk Justification |
|---|---|---|---|---|---|
| **CI-B1** | Additive merge: `amount = -1` violates Animal `@pre` | Boundary | Animal: `/** @pre amount > 0 */`; Dog: `/** @pre amount < 1000 */`; call: `feed(-1)` | Throws `ContractViolationError` | Exact n−1 of Animal's lower bound. Confirms Animal's guard is active in the merged set. |
| **CI-B2** | Additive merge: `amount = 0` (exact lower boundary) | Boundary | Same additive merge setup; call: `feed(0)` | Throws `ContractViolationError` (0 is not `> 0`) | Zero-value is a classic off-by-one failure in `>` vs `>=` guards. |
| **CI-B3** | Additive merge: `amount = 1` (minimum valid) | Boundary | Same setup; call: `feed(1)` | Does **not** throw | n+1 of the lower boundary. Confirms `> 0` not `>= 0` is enforced. |
| **CI-B4** | Additive merge: `amount = 2000` violates Dog `@pre` | Boundary | Same setup; call: `feed(2000)` | Throws `ContractViolationError` | Dog's upper bound from spec §4: `amount < 1000`, so 2000 must throw. |
| **CI-B5** | Additive merge: `amount = 999` (maximum valid) | Boundary | Same setup; call: `feed(999)` | Does **not** throw | n−1 of Dog's upper boundary (`< 1000`). Confirms the guard is exactly `< 1000`. |
| **CI-B6** | Additive merge: compile-time warning emitted | Boundary | Same additive merge setup (compile only, no run) | `compilationOutput` contains a merge warning | Spec §4 requires a merge warning at compile time. Missing warning = silent injection failure. |
| **CI-B7** | Three-way merge: `amount = 42` violates Dog `@pre !== 42` | Boundary | IAnimal: `/** @pre amount > 0 */`; Animal: `/** @pre amount < 500 */`; Dog: `/** @pre amount !== 42 */`; call: `feed(42)` | Throws `ContractViolationError` | Tests all three sources co-exist; `42` is valid for both IAnimal and Animal but violates Dog. |
| **CI-B8** | Three-way merge: `amount = 501` violates Animal `@pre` | Boundary | Same three-way setup; call: `feed(501)` | Throws `ContractViolationError` | 501 violates Animal's `< 500` boundary; confirms Animal's guard survives the three-way merge. |
| **CI-B9** | Parameter count mismatch: base contracts skipped | Boundary | Animal: `/** @pre a > 0 */` on `feed(a: number, b: number)`; Dog: `feed(a: number)` (1 param); call: `feed(-1)` | Does **not** throw; `compilationOutput` contains "base class contracts skipped" | Spec §9 explicitly skips base contracts when param counts differ. Injecting them would reference undefined params. |
