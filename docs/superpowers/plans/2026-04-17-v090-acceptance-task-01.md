# Task 1: Fix `test/alternate-fn-forms.test.ts`

**Part of:** [v0.9.0 Acceptance Tests Implementation Plan](2026-04-17-v090-acceptance.md)

**Files:**
- Modify: `test/alternate-fn-forms.test.ts`

- [ ] **Step 1: Run the failing tests to confirm the baseline**

```bash
npm test -- alternate-fn-forms
```

Expected: 2 failures — "should NOT throw on negative value" for arrow (1.12) and funcExpr (1.13).

- [ ] **Step 2: Apply the fixes**

Make these four changes to `test/alternate-fn-forms.test.ts`:

**Change 1** — Add import after the existing imports block (line 9):
```typescript
import { ContractViolationError } from '@fultslop/axiom';
```

**Change 2** — Rename the outer describe (line 11):
```typescript
// Before:
describe('Phase 3: Missing feature tests (not yet in scope)', () => {
// After:
describe('Newly instrumented function forms (v0.9.0)', () => {
```

**Change 3** — Arrow function describe and test (lines 13–18):
```typescript
// Before:
describe('arrow function contracts (1.12)', () => {
    it('should NOT throw on negative value (arrow functions not instrumented)', () => {
        // Arrow functions are not yet supported. The transformer should skip them.
        expect(arrowFnWithPre(-5)).toBe(-5); // should NOT throw
    });
// After:
describe('arrow function contracts (1.12)', () => {
    it('should throw ContractViolationError on negative value (now instrumented)', () => {
        expect(() => arrowFnWithPre(-5)).toThrow(ContractViolationError);
    });
```

**Change 4** — Function expression describe and test (lines 25–29):
```typescript
// Before:
describe('function expression contracts (1.13)', () => {
    it('should NOT throw on negative value (function expressions not instrumented)', () => {
        expect(funcExprWithPre(-5)).toBe(-5); // should NOT throw
    });
// After:
describe('function expression contracts (1.13)', () => {
    it('should throw ContractViolationError on negative value (now instrumented)', () => {
        expect(() => funcExprWithPre(-5)).toThrow(ContractViolationError);
    });
```

- [ ] **Step 3: Run tests and confirm they pass**

```bash
npm test -- alternate-fn-forms
```

Expected: all 16 tests pass, 0 failures.
