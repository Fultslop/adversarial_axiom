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
| `@pre` on static methods | ✅ | Runtime pass/fail tests added |
| `@pre` on non-exported functions | ✅ | Verified — no guards injected |
| `@pre` on arrow functions | ✅ | Tested — guards ARE injected (contrary to README) |
| `@pre` on function expressions | ✅ | Tested — guards ARE NOT injected |
| `@pre` on async functions | ✅ | Tested — guards ARE injected (contrary to README) |
| `@pre` on generator functions | ✅ | Tested — guards ARE injected (contrary to README) |
| `@post` on exported functions | ✅ | `result` identifier supported |
| `@post` on public class methods | ✅ | `result` and `this` supported |
| `@post` on arrow functions | ❌ | Not yet supported |
| `@post` on async functions | ❌ | Not yet supported |
| `@post` on generator functions | ❌ | Not yet supported |
| `@post` with `prev` capture | ❌ | Previous value capture not implemented |
| Multiple `@pre` / `@post` tags | ✅ | Evaluated in order |
| `@invariant` on classes | ✅ | Checked after constructor and public methods |
| Multiple `@invariant` tags | ✅ | Tested with MultiInvariantClass |
| Invariant on private/protected methods | ✅ | Verified — not checked |
| Inherited invariants | ✅ | Tested — base invariant checked in derived class |
| Constructor contracts (`@pre`/`@post`) | ⚠️ | `@pre` not injected, `@invariant` checked after constructor |
| `ContractViolationError` type | ✅ | Tests assert `.type`, `.expression`, `.location`, `.message` |
| `InvariantViolationError` type | ✅ | Tests assert `.expression`, `.location`, `[INVARIANT]` prefix |
| `ContractError` base class | ✅ | Tests verify polymorphic catch |
| `pre()` manual assertion | ✅ | Full test coverage — throws with type: 'PRE' |
| `post()` manual assertion | ✅ | Full test coverage — throws with type: 'POST' |
| Release build strips contracts | ✅ | Tests verify no contract code in transpiled output |
| Manual `pre()`/`post()` survive release | ✅ | Verified via output inspection |

---

## Compile-Time Warnings

| Warning Type | Status | Notes |
|--------------|:------:|-------|
| Unknown identifier in `@pre`/`@post` | ✅ | Warns: `'x' is not a known parameter` |
| Type mismatch — primitive params | ✅ | Build-output test asserts warning |
| Type mismatch — `result` | ✅ | Build-output test asserts warning |
| Assignment expression `@pre v = 5` | ✅ | Build-output test asserts warning |
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
- `@pre` on static methods (tested)
- `@pre` on non-exported functions — correctly skipped (verified)
- `@invariant` on classes — checked after constructor and every public method
- Multiple `@invariant` tags on a class (tested)
- Multiple contract tags on the same target (tested order of evaluation)
- `this` references inside contract expressions (tested)
- `result` identifier in `@post` conditions
- Logical AND/OR in contract expressions (tested)
- Negation `!` in `@pre` conditions (tested)
- Arithmetic expressions in `@pre` (tested)
- Comparison operators `>=`, `<=`, `!==`, `<`, `>`, `===` (tested)
- Default, rest, and optional parameters in contracts (tested)
- Manual `pre(condition, msg)` / `post(condition, msg)` assertions — full error type coverage
- `ContractViolationError` with `.type`, `.expression`, `.location`, `.message` (tested)
- `InvariantViolationError` with `.expression`, `.location`, `[INVARIANT]` prefix (tested)
- `ContractError` as polymorphic base class (tested)
- `@pre` failure prevents `@post` evaluation (tested)
- Private/protected methods are NOT instrumented (verified)
- Static methods do NOT trigger invariant checks (verified)
- Zero runtime overhead in release builds (tested — no contract code in output)
- Manual `pre()`/`post()` survive in release builds (verified)
- Compile-time warnings for unknown identifiers, type mismatches, and assignment expressions (tested)

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

| Feature | Actual Status | Notes |
|---------|:-------:|----------|
| Previous value capture (`prev` in `@post`) | ❌ | `@post this.balance === prev - amount` |
| `@post` on arrow functions | ❌ | Not instrumented |
| `@post` on async functions | ❌ | Not instrumented |
| `@post` on generator functions | ❌ | Not instrumented |
| `ts-patch` + `moduleResolution: node16` | ❌ | Known ts-node 10.x incompatibility |

### Surprising Discoveries (contrary to README)

The following features listed as "not yet in scope" in the README **actually work**:

| Feature | README Says | Tests Show |
|---------|:-----------:|:----------:|
| `@pre` on arrow functions | ❌ Not supported | ✅ Guards ARE injected |
| `@pre` on async functions | ❌ Not supported | ✅ Guards ARE injected |
| `@pre` on generator functions | ❌ Not supported | ✅ Guards ARE injected |
| Inherited invariants | ❌ Not implemented | ✅ Base invariant checked in derived class |
| Constructor `@invariant` | ❌ Not supported | ✅ Checked after constructor |

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
| Currently tested | ~110 |
| Remaining untested | ~20 |
| Known gaps documented with tests | ~15 |
| Out of scope (no tests needed) | 5 |

**Test coverage of intended features: ~85%**

**Total Jest tests: 177 passing across 14 test suites**

---

## For Implementing Agents

When picking up a task from the test plan, the priority order is:

1. **Phase 1** items — supported features with no tests (highest value, lowest risk)
2. **Phase 2** items — known limitations that need explicit tests documenting the gap
3. **Phase 3** items — future features (tests should assert "not yet working" behaviour)

Each item in `docs/TEST_PLAN.md` has a row number you can reference (e.g., "implement test 6.1–6.9 for error type assertions").
