# Task 4: Fix `test/v086-features.test.ts`

**Part of:** [v0.9.0 Acceptance Tests Implementation Plan](2026-04-17-v090-acceptance.md)

**Files:**
- Modify: `test/v086-features.test.ts`

- [ ] **Step 1: Run the failing test to confirm the baseline**

```bash
npm test -- v086-features
```

Expected: 1 failure — "should NOT have contract injected (known limitation)" in "Interpolated template literals (control - still not supported)".

- [ ] **Step 2: Apply the fixes**

`ContractViolationError` is already imported. Make these two changes to the describe block at the bottom of the file (around line 128–133):

**Change 1** — Rename the describe:
```typescript
// Before:
describe('Interpolated template literals (control - still not supported)', () => {
// After:
describe('Interpolated template literals (now supported)', () => {
```

**Change 2** — Flip the test:
```typescript
// Before:
it('should NOT have contract injected (known limitation)', () => {
    // This won't throw because interpolated templates aren't supported yet
    expect(() => interpolatedTemplateControl('wrong_value', 5)).not.toThrow();
});
// After:
it('should throw ContractViolationError when pre is violated (now supported)', () => {
    expect(() => interpolatedTemplateControl('wrong_value', 5)).toThrow(ContractViolationError);
});
```

- [ ] **Step 3: Run tests and confirm all pass**

```bash
npm test -- v086-features
```

Expected: all tests pass, 0 failures.

- [ ] **Step 4: Run the full suite to confirm no regressions**

```bash
npm test
```

Expected: 0 failures (previously 6 across 4 suites — all now fixed).
