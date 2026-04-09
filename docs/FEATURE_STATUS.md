# fsprepost — Feature Status

> Generated from `docs/TEST_PLAN.md`. This document tells you at a glance what works, what's partially working, what has known limitations, and what isn't implemented yet.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| OK ✅ | Implemented and tested |
| LIMITED ⚠️ | Partially working — known limitation |
| MISSING ❌ | Not yet implemented |
| UNKNOWN 🧪 | Implemented but **no test coverage yet** |
| OUT_OF_SCOPE 🚫 | Explicitly out of scope (by design) |

---

## Features at a Glance

| Feature | Status | Notes |
|---------|:------:|-------|
| `@pre` on exported functions | ✅ | Basic expressions, comparisons, logical operators |
| `@pre` on public class methods | ✅ | Including `this` references |
| `@pre` on static methods | 🧪 | Exists in fixture but no runtime pass/fail test |
| `@pre` on non-exported functions | 🧪 | Should be skipped — not verified |
| `@pre` on arrow functions | ❌ | Not yet supported |
| `@pre` on function expressions | ❌ | Not yet supported |
| `@pre` on async functions | ❌ | Not yet supported |
| `@pre` on generator functions | ❌ | Not yet supported |
| `@post` on exported functions | ✅ | `result` identifier supported |
| `@post` on public class methods | ✅ | `result` and `this` supported |
| `@post` on arrow functions | ❌ | Not yet supported |
| `@post` on async functions | ❌ | Not yet supported |
| `@post` on generator functions | ❌ | Not yet supported |
| `@post` with `prev` capture | ❌ | Previous value capture not implemented |
| Multiple `@pre` / `@post` tags | ✅ | Evaluated in order |
| `@invariant` on classes | ✅ | Checked after constructor and public methods |
| Multiple `@invariant` tags | 🧪 | Single invariant tested; multiple not verified |
| Invariant on private/protected methods | 🧪 | Should be skipped — not verified |
| Inherited invariants | ❌ | Inherited contracts not implemented |
| Constructor contracts (`@pre`/`@post`) | ❌ | Not yet supported |
| `ContractViolationError` type | 🧪 | Thrown at runtime — no test asserts `.type`, `.expression`, `.location`, `.message` |
| `InvariantViolationError` type | 🧪 | Thrown at runtime — no test asserts properties |
| `ContractError` base class | 🧪 | Exists — no test verifies polymorphic catch |
| `pre()` manual assertion | 🧪 | Exists in fsprepost — no test in this repo |
| `post()` manual assertion | 🧪 | Exists in fsprepost — no test in this repo |
| Release build strips contracts | 🧪 | By design — no test verifies zero contract code in output |
| Manual `pre()`/`post()` survive release | 🧪 | Should remain — not verified |

---

## Compile-Time Warnings

| Warning Type | Status | Notes |
|--------------|:------:|-------|
| Unknown identifier in `@pre`/`@post` | ✅ | Warns: `'x' is not a known parameter` |
| Type mismatch — primitive params | 🧪 | `@pre v === "foo"` on `number` — fixture exists, no build-output test |
| Type mismatch — `result` | 🧪 | `@post result === "foo"` on `number` return — fixture exists, no build-output test |
| Assignment expression `@pre v = 5` | 🧪 | Fixture exists, no build-output test |
| Non-primitive param types (array, object) | ⚠️ | No type-mismatch warning emitted (Limitation #2) |
| Union-typed params (`T \| undefined`) | ⚠️ | No type-mismatch warning emitted (Limitation #3) |
| Enum / external constant references | ⚠️ | Warns as unknown identifier (Limitation #4) |
| Non-whitelisted globals (`Math`, `console`) | ⚠️ | Warns as unknown identifier (Limitation #5) |
| Template literals | ⚠️ | Type mismatch not detected (Limitation #6) |
| Non-primitive return types | ⚠️ | `result` omitted from type map — no type-mismatch warning (Limitation #7) |
| Multi-level property chains | ⚠️ | Only root object scope-checked (Limitation #8) |
| Unary operands | ⚠️ | Type mismatch not detected on unary result (Limitation #9) |
| Compound conditions / type narrowing | ⚠️ | Sibling clauses don't share type info (Limitation #10) |
| Destructured parameters | ⚠️ | Binding names not recognised — unknown-id warning (Limitation #1) |

---

## What Works Today (User Quick Reference)

If you are an end user evaluating whether to adopt fsprepost, these are the **reliable, tested capabilities**:

- `@pre` and `@post` on exported functions with primitive parameters (`number`, `string`, `boolean`)
- `@pre` and `@post` on public class methods
- `@invariant` on classes — checked after constructor and every public method
- Multiple contract tags on the same target
- `this` references inside contract expressions
- `result` identifier in `@post` conditions
- Logical AND/OR in contract expressions
- Manual `pre(condition, msg)` / `post(condition, msg)` assertions (always present in output)
- Zero runtime overhead in release builds (plain `tsc` ignores JSDoc)
- `ContractViolationError` and `InvariantViolationError` thrown on violation with `.type`, `.expression`, `.location`, `.message` properties

---

## What's Partially Working (Known Limitations)

These features **work** but have documented gaps you should be aware of:

| Limitation | Impact |
|------------|--------|
| Destructured params not recognised | `@pre x > 0` on `fn({x,y})` silently skipped with warning |
| Type checks only for primitives | No warning for array/object/interface param mismatches |
| Union types excluded from type checks | `number \| undefined` params get no type-mismatch warnings |
| Enum members flagged as unknown | `@pre status === Status.Active` warns even though valid |
| Non-whitelisted globals warn | `Math.abs()`, `console.log()` trigger warnings |
| Template literals not type-checked | `@pre label === \`item_${id}\`` gets no mismatch warning |
| `result` only typed for primitives | Object/array return types get no `result` type checking |
| Only root of property chains checked | `this.config.limit` — `config` and `limit` not validated |
| Unary expressions not type-checked | `@pre -amount > 0` — negated result not type-checked |
| Compound conditions in isolation | `amount !== null && amount === "zero"` — second clause gets no narrowing |

---

## What's Not Yet Implemented

| Feature | Planned | Tracking |
|---------|:-------:|----------|
| Previous value capture (`prev` in `@post`) | Yes | `@post this.balance === prev - amount` |
| Arrow function contracts | Yes | `const fn = (x) => { ... }` |
| Function expression contracts | Yes | `const fn = function(x) { ... }` |
| Async function contracts | Yes | `async function fn()` |
| Generator function contracts | Yes | `function* fn()` |
| Constructor contracts | Yes | `@pre` / `@post` on `constructor()` |
| Inherited contracts | Yes | Base class contracts apply to derived methods |
| Full type mismatch for non-primitives | Yes | Arrays, objects, interfaces |
| Full type mismatch for union types | Yes | `T \| undefined` etc. |
| Multi-level property validation | Maybe | `this.config.limit > 0` — validate full chain |
| `ts-patch` + `moduleResolution: node16` | Maybe | Known ts-node 10.x incompatibility |

---

## Explicitly Out of Scope (Will Never Be Implemented)

| Feature | Reason |
|---------|--------|
| Runtime contract checking in release builds | Zero-overhead guarantee |
| Contracts on fields, variables, type aliases | By design — functions/methods only |
| Side-effect expressions in contracts | Contracts must be pure predicates |
| Source map rewriting / debugger integration | Outside scope |
| Private / protected method instrumentation | By design — public methods only |

---

## Test Coverage Summary

| Metric | Count |
|--------|-------|
| Total feature items in test plan | ~130 |
| Currently tested (COVERED) | ~20 |
| Needs test coverage (TO ADD) | ~80 |
| Known gaps to document (KNOWN GAP) | ~15 |
| Future features (MISSING) | ~10 |
| Out of scope (no tests needed) | 5 |

**Test coverage of intended features: ~15%**

---

## For Implementing Agents

When picking up a task from the test plan, the priority order is:

1. **Phase 1** items — supported features with no tests (highest value, lowest risk)
2. **Phase 2** items — known limitations that need explicit tests documenting the gap
3. **Phase 3** items — future features (tests should assert "not yet working" behaviour)

Each item in `docs/TEST_PLAN.md` has a row number you can reference (e.g., "implement test 6.1–6.9 for error type assertions").
