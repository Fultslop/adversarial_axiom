# Task 2: Fix `test/destructured-params.test.ts`

**Part of:** [v0.9.0 Acceptance Tests Implementation Plan](2026-04-17-v090-acceptance.md)

**Files:**
- Modify: `test/destructured-params.test.ts`

- [ ] **Step 1: Run the failing test to confirm the baseline**

```bash
npm test -- destructured-params
```

Expected: 1 failure — "should NOT have contract injected (known limitation)" in "Arrow function with destructuring".

- [ ] **Step 2: Apply the fix**

In `test/destructured-params.test.ts`, find the `describe('Arrow function with destructuring')` block and replace the test:

```typescript
// Before:
it('should NOT have contract injected (known limitation)', () => {
    // This should NOT throw because no contract was injected
    expect(() => arrowDestruct({ x: 0, y: 3 })).not.toThrow();
});
// After:
it('should throw ContractViolationError when x is 0 (now instrumented)', () => {
    expect(() => arrowDestruct({ x: 0, y: 3 })).toThrow(ContractViolationError);
});
```

`ContractViolationError` is already imported at line 23 — no import change needed.

- [ ] **Step 3: Run tests and confirm they pass**

```bash
npm test -- destructured-params
```

Expected: all tests pass, 0 failures.
