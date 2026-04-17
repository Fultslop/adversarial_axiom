# Task 10: Add Section D — Regression Tests

**Part of:** [v0.9.0 Acceptance Tests Implementation Plan](2026-04-17-v090-acceptance.md)

**Prerequisite:** Task 9 (section C must exist)

**Files:**
- Modify: `test/v090-acceptance.test.ts` (replace `// ── Section D` comment with section D).

- [ ] **Step 1: Add section D inside the outer describe**

```typescript
    // ==========================================
    // D. Regression Tests
    // ==========================================
    describe('Regression Tests', () => {

        it('D1: existing sync @post pattern still works', () => {
            const fixture = `
/**
 * @pre produce().length > 0
 * @post result === produce().length || result < 0
 */
export function regressionProduceFn(produce: () => number[]): number {
    const x = produce();
    return x.length % 2 === 0 ? x.length : -1;
}
`;
            const result = compileAndRun(fixture, 'regressionProduceFn');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain('ContractViolationError');
        });

        it('D2: existing class invariant pattern still works', () => {
            const fixture = `
/**
 * @invariant this.value > 0
 */
export class RegressionClass {
    public value: number;
    constructor(value: number) { this.value = value; }
    /** @pre x > 0 */
    public add(x: number): number {
        this.value += x;
        return this.value;
    }
}
`;
            const result = compileAndRun(fixture, 'RegressionClass');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain('ContractViolationError');
            expect(result.compiled).toContain('InvariantViolationError');
        });

        it('D3: @prev on synchronous function captures state before body', () => {
            const fixture = `
/**
 * @prev { x }
 * @post result === prev.x + 1
 */
export function syncWithPrev(x: number): number {
    return x + 1;
}
`;
            const result = compileAndRun(fixture, 'syncWithPrev');
            expect(result.success).toBe(true);
            // Prev captured before body
            expect(result.compiled).toContain('{ x }');
            // Post guard uses prev.x
            expect(result.compiled).toContain('prev.x + 1');

            const valid = compileAndRun(fixture, 'syncWithPrev', 'syncWithPrev(5)');
            expect(valid.output).toContain('RESULT: 6');
        });
    });
```

- [ ] **Step 2: Run the complete acceptance suite**

```bash
npm test -- v090-acceptance
```

Expected: all 24 acceptance tests pass (A1–A12 minus A6, B1–B9, C1–C7, D1–D3).

- [ ] **Step 3: Run the full test suite**

```bash
npm test
```

Expected: 0 failures across all suites. Confirm that the previously failing 6 tests (Tasks 1–4) and all new tests (Tasks 5–10) are green.
