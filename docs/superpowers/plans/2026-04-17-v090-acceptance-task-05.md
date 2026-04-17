# Task 5: Create ts-jest Regression Fixtures

**Part of:** [v0.9.0 Acceptance Tests Implementation Plan](2026-04-17-v090-acceptance.md)

**Files:**
- Create: `src/v090-acceptance-fixtures.ts`
- Create: `test/v090-acceptance-fixtures.test.ts`

- [ ] **Step 1: Create `src/v090-acceptance-fixtures.ts`**

```typescript
// v0.9.0 Regression Guard Fixtures
// Compiled by ts-jest on every npm test run — fast regression check for
// newly-instrumented forms: exported arrow functions, function expressions, async.

/** @pre x > 0 */
export const arrowWithPreFixture = (x: number): number => x;

/** @post result > 0 */
export const arrowWithPostFixture = (x: number): number => x * 2;

/**
 * @pre x > 0
 * @post result > 1
 */
export const arrowWithBothFixture = (x: number): number => x + 1;

/** @pre x > 0 */
export async function asyncFnWithPreFixture(x: number): Promise<number> {
    return x;
}

/** @post result > 0 */
export async function asyncFnWithPostFixture(x: number): Promise<number> {
    return x * 2;
}

/** @pre x > 0 */
export const asyncArrowFixture = async (x: number): Promise<number> => x;

/** @pre x > 0 */
export const funcExprFixture = function(x: number): number {
    return x;
};
```

- [ ] **Step 2: Create `test/v090-acceptance-fixtures.test.ts`**

```typescript
import {
    arrowWithPreFixture,
    arrowWithPostFixture,
    arrowWithBothFixture,
    asyncFnWithPreFixture,
    asyncFnWithPostFixture,
    asyncArrowFixture,
    funcExprFixture,
} from '@src/v090-acceptance-fixtures';
import { ContractViolationError } from '@fultslop/axiom';

describe('v0.9.0 Regression Guard (ts-jest)', () => {

    describe('Exported arrow with @pre', () => {
        it('throws ContractViolationError on negative input', () => {
            expect(() => arrowWithPreFixture(-1)).toThrow(ContractViolationError);
        });
        it('returns value on valid input', () => {
            expect(arrowWithPreFixture(1)).toBe(1);
        });
    });

    describe('Exported arrow with @post', () => {
        it('returns result and post-guard passes on valid input', () => {
            expect(arrowWithPostFixture(2)).toBe(4);
        });
    });

    describe('Exported arrow with @pre and @post', () => {
        it('throws on pre violation', () => {
            expect(() => arrowWithBothFixture(-1)).toThrow(ContractViolationError);
        });
        it('returns value when both guards pass', () => {
            expect(arrowWithBothFixture(2)).toBe(3);
        });
    });

    describe('Async function with @pre', () => {
        it('rejects with ContractViolationError on negative input', async () => {
            await expect(asyncFnWithPreFixture(-1)).rejects.toThrow(ContractViolationError);
        });
        it('resolves on valid input', async () => {
            await expect(asyncFnWithPreFixture(1)).resolves.toBe(1);
        });
    });

    describe('Async function with @post', () => {
        it('resolves and post-guard passes on valid input', async () => {
            await expect(asyncFnWithPostFixture(2)).resolves.toBe(4);
        });
    });

    describe('Async arrow with @pre', () => {
        it('rejects with ContractViolationError on negative input', async () => {
            await expect(asyncArrowFixture(-1)).rejects.toThrow(ContractViolationError);
        });
        it('resolves on valid input', async () => {
            await expect(asyncArrowFixture(1)).resolves.toBe(1);
        });
    });

    describe('Exported function expression with @pre', () => {
        it('throws ContractViolationError on negative input', () => {
            expect(() => funcExprFixture(-1)).toThrow(ContractViolationError);
        });
        it('returns value on valid input', () => {
            expect(funcExprFixture(1)).toBe(1);
        });
    });
});
```

- [ ] **Step 3: Run the new tests**

```bash
npm test -- v090-acceptance-fixtures
```

Expected: all 12 tests pass.
