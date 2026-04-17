# Task 3: Fix `test/template-literals.test.ts`

**Part of:** [v0.9.0 Acceptance Tests Implementation Plan](2026-04-17-v090-acceptance.md)

**Files:**
- Modify: `test/template-literals.test.ts`

- [ ] **Step 1: Run the failing tests to confirm the baseline**

```bash
npm test -- template-literals
```

Expected: 2 failures — "should NOT have contract injected (known limitation)" in both "Interpolated template literals" and "Template literal on left side".

- [ ] **Step 2: Apply the fixes**

`ContractViolationError` is already imported. Make these changes:

**Change 1** — "Interpolated template literals" describe block (around line 54–61):
```typescript
// Before:
describe('Interpolated template literals', () => {
    // NOTE: Interpolated template literals (${var}) are NOT supported yet
    // v0.8.5 only fixed no-substitution template literals
    it('should NOT have contract injected (known limitation)', () => {
        // No contract injected, so this won't throw
        expect(() => interpolatedTemplateLiteralPre('item_5', 3)).not.toThrow();
    });
});
// After:
describe('Interpolated template literals', () => {
    it('should throw ContractViolationError when pre is violated (now supported)', () => {
        expect(() => interpolatedTemplateLiteralPre('item_5', 3)).toThrow(ContractViolationError);
    });
});
```

**Change 2** — "Template literal on left side" describe block (around line 87–91):
```typescript
// Before:
describe('Template literal on left side', () => {
    // NOTE: Interpolated templates on left side also not supported
    it('should NOT have contract injected (known limitation)', () => {
        expect(() => templateOnLeft(42, 'wrong')).not.toThrow();
    });
});
// After:
describe('Template literal on left side', () => {
    it('should throw ContractViolationError when pre is violated (now supported)', () => {
        expect(() => templateOnLeft(42, 'wrong')).toThrow(ContractViolationError);
    });
});
```

- [ ] **Step 3: Run tests and confirm they pass**

```bash
npm test -- template-literals
```

Expected: all tests pass, 0 failures.
