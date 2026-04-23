# Acceptance Test Plan: Class Inheritance Contracts — Phase D: Scope Guard

**Library under test:** `@fultslop/axiom` (local build)

For every Phase C edge case, this phase justifies why it is a **realistic threat** to this library and not a theoretical outlier.

---

| Test ID | Edge Case | Scope Justification |
|---|---|---|
| **CI-C1** | Param name mismatch — rename mode | Subclasses routinely use different parameter names than their base class (e.g., a base `process(input)` overridden as `process(data)`). If the transformer silently drops the contract on mismatch, the guard disappears without warning. This is a first-class production risk. |
| **CI-C2** | Param name mismatch — ignore mode | The `interfaceParamMismatch: 'ignore'` option is a documented configuration value. A misconfiguration or library update could activate this path unexpectedly. If `ignore` silently applies the wrong-named contract instead of skipping it, it throws on valid calls. |
| **CI-C3** | Cross-file base class | In any non-trivial TypeScript project, base classes live in separate files. Single-file inheritance is a test convenience; cross-file is the real-world norm. Contract propagation depends on the TypeChecker resolving declarations across file boundaries — a separate code path from same-file analysis. |
| **CI-C4** | `transpileModule` mode | Many Jest configurations use `ts-jest` with `isolatedModules: true`, which forces `transpileModule` and makes no `Program` or `TypeChecker` available. If the transformer throws in this mode, it breaks the entire test suite for projects using that configuration. Graceful degradation is critical. |
| **CI-C5** | Constructor `@pre` not inherited | Constructors have distinct semantics: they initialize state rather than operating on it. If constructor contracts were accidentally inherited, every `new DogClass(badArg)` call would throw, potentially including calls to `super()` inside the subclass. The risk is subtle and could surface as confusing runtime errors. |
| **CI-C6** | Grandparent contracts not on grandchild | Transitive contract inheritance would cause exponential growth in injected guards across deep hierarchies and would violate the "direct parent only" invariant documented in the spec. This is a genuine code-generation correctness risk that would be difficult to debug at runtime. |
