# v0.9.0 Implementation Gaps — @fultslop/axiom

Identified by the v0.9.0 acceptance test suite (`test/v090-acceptance.test.ts`).  
Suite results: **26 pass / 4 fail**.  All 4 failures represent unimplemented transformer behaviour.

---

## Gap 1 — JSDoc comment not stripped when a contract is silently dropped (A8, A10)

**Failing tests:** A8, A10  
**Transformer location to fix:** arrow-function / variable-declaration handler

### What the transformer does today

When a `@pre` or `@post` contract on an arrow function references an unknown identifier,
the transformer emits a warning and skips guard injection — but it **leaves the original
JSDoc comment intact** in the compiled output.  The comment text therefore appears in
the emitted JS, even though no runtime guard was generated.

### What the tests require

The compiled JS must not contain any trace of the dropped contract expression.

**A8 — unknown identifier in `@pre` (arrow function)**

```typescript
// Input
/** @pre unknownVar > 0 */
export const arrowWithUnknownId = (x: number): number => x;

// Current compiled output — FAIL
/** @pre unknownVar > 0 */
const arrowWithUnknownId = (x) => x;   // "unknownVar" still present

// Expected compiled output — PASS
const arrowWithUnknownId = (x) => x;   // comment removed or contract line stripped
```

Assertion: `expect(result.compiled).not.toContain('unknownVar')`

**A10 — `@post` on void-return arrow (should be dropped with warning)**

```typescript
// Input
/** @post result === undefined */
export const arrowVoidWithPost = (msg: string): void => { console.log(msg); };

// Current compiled output — FAIL
/** @post result === undefined */
const arrowVoidWithPost = (msg) => { console.log(msg); };   // expression still present

// Expected compiled output — PASS
const arrowVoidWithPost = (msg) => { console.log(msg); };   // comment removed / contract line stripped
```

Assertion: `expect(result.compiled).not.toContain('result === undefined')`

### Fix guidance

When the transformer decides to **drop** a `@pre` / `@post` clause (unknown identifier,
void return, etc.), it must also remove that clause from the emitted JSDoc node.
If after removal the JSDoc block is empty, the entire JSDoc comment should be dropped.

---

## Gap 2 — `@post` not injected on async functions containing an early `throw` (B8)

**Failing test:** B8  
**Transformer location to fix:** async-function handler / `@post` instrumentation logic

### What the transformer does today

For an async function whose body contains a `throw` statement, the transformer skips
`@post` guard injection entirely, leaving the function unmodified.

### What the tests require

The `@post` guard must be injected regardless of whether the body contains a `throw`.
The guard runs after the async body resolves; a thrown exception rejects the promise
before the guard is reached, so the guard is never evaluated — but **the guard code
must still be present** in the compiled output.

```typescript
// Input
/** @post result > 0 */
export async function asyncWithThrow(x: number): Promise<number> {
    if (x < 0) throw new Error('fail');
    return x;
}

// Current compiled output — FAIL (no @post guard)
async function asyncWithThrow(x) {
    if (x < 0)
        throw new Error('fail');
    return x;
}

// Expected compiled output — PASS
async function asyncWithThrow(x) {
    return (async () => {
        if (x < 0)
            throw new Error('fail');
        return x;
    })().then((__axiom_result__) => {
        if (!(__axiom_result__ > 0))
            throw new ContractViolationError("POST", "result > 0", "asyncWithThrow");
        return __axiom_result__;
    });
}
```

Assertions:
```
expect(result.compiled).toContain('throw new Error')           // early throw preserved
expect(result.compiled).toContain('ContractViolationError("POST"')  // guard injected
```

### Fix guidance

The presence of a `throw` statement inside an async function body should not suppress
`@post` instrumentation.  The transformer should wrap the full body in the async IIFE
pattern (already used for normal async `@post` in B2/B7) unconditionally.

---

## Gap 3 — `@post` not dropped for `Promise<void>` return type (B3)

**Failing test:** B3  
**Transformer location to fix:** async-function handler / void-return detection

### What the transformer does today

For an async function declared `Promise<void>`, a `@post` guard is not injected
(correct) but the JSDoc comment containing the contract expression is preserved
in the compiled output (incorrect — same root cause as Gap 1).

### What the tests require

When the transformer drops a `@post` because the resolved type is `void`, the
contract expression must not appear in the emitted JS.

```typescript
// Input
/** @post result === undefined */
export async function asyncVoidWithPost(msg: string): Promise<void> {
    console.log(msg);
}

// Current compiled output — FAIL
/** @post result === undefined */
async function asyncVoidWithPost(msg) {
    console.log(msg);
}

// Expected compiled output — PASS
async function asyncVoidWithPost(msg) {
    console.log(msg);
}
```

Assertion: `expect(result.compiled).not.toContain('result === undefined')`

### Fix guidance

Same as Gap 1: when a `@post` is dropped due to void return type (sync or async),
strip that clause from the JSDoc node in the emitted output.

---

## Summary table

| ID | Test | Root cause | Scope |
|----|------|------------|-------|
| G1 | A8   | Dropped contract clause not stripped from JSDoc comment (arrow, `@pre`, unknown id) | Arrow/variable-declaration handler |
| G1 | A10  | Dropped contract clause not stripped from JSDoc comment (arrow, `@post`, void return) | Arrow/variable-declaration handler |
| G2 | B8   | `@post` guard not injected on async function when body contains `throw` | Async-function `@post` handler |
| G3 | B3   | Dropped contract clause not stripped from JSDoc comment (async, `@post`, `Promise<void>`) | Async-function handler |

Gaps G1 and G3 share the same fix: the JSDoc stripping logic must be applied whenever
a contract clause is dropped, regardless of the reason.

---

## How to verify once fixed

```bash
# Run only the v0.9.0 acceptance suite
npm test -- v090-acceptance.test

# Expected: 30 passed, 0 failed
```

Individual test IDs to watch: **A8, A10, B3, B8**.
