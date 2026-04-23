# Acceptance Test Plan: Class Inheritance Contracts — Phase A: Happy Path Validation

**Library under test:** `@fultslop/axiom` (local build)
**Spec reference:** Class Inheritance Contracts acceptance scenarios 1–6, 12
**Test infrastructure:** `compileAndRun` helper — writes fixture to disk, compiles with `tspc`+transformer, optionally executes with `node`

Minimum tests to prove the primary inheritance contract of the spec is met.

---

| Test ID | Name | Category | Input Description | Expected Outcome | Risk Justification |
|---|---|---|---|---|---|
| **CI-A1** | `@pre` propagates from base to subclass — violation | Basic | `Animal.feed` has `/** @pre amount > 0 */`; `Dog extends Animal` overrides `feed` with no annotation | `new Dog().feed(-1)` throws `ContractViolationError`; compiled Dog output contains `ContractViolationError("PRE"` | Core happy path. If @pre does not propagate at all, all inheritance scenarios are broken. |
| **CI-A2** | `@pre` propagates — valid call passes | Basic | Same setup as CI-A1 | `new Dog().feed(5)` does **not** throw | Guards the false-positive path: the contract must not fire on valid input. |
| **CI-A3** | `@post` propagates from base to subclass | Basic | `Animal.feed` has `/** @post this.energy > 0 */` with `this.energy = -1` body; `Dog.feed` also sets `this.energy = -1` | `new Dog().feed(1)` throws `ContractViolationError` | @post follows a different injection code path from @pre; must be tested independently. |
| **CI-A4** | `@invariant` propagates from base to subclass | Basic | `Animal` class has `/** @invariant this.energy >= 0 */`; `Dog.feed()` sets `this.energy = -5` | `new Dog().feed()` throws `InvariantViolationError` | `InvariantViolationError` is a distinct error type on a separate injection path. |
| **CI-A5** | Additive merge: `dog.feed(5)` passes both guards | Basic | `Animal` has `/** @pre amount > 0 */`; `Dog` also has `/** @pre amount < 1000 */`; call with `5` | Does not throw; compile-time output contains a merge warning | The common valid path through a merged contract must not be accidentally blocked. |
| **CI-A6** | No injection for method not overriding contracted base | Basic | `Animal.feed` has `/** @pre amount > 0 */`; `Dog.bark()` exists only on Dog with no base counterpart | `dog.bark()` does not throw; `dog.feed(-1)` throws exactly once (no duplication) | Ensures the transformer does not inject contracts onto un-related Dog methods. |
