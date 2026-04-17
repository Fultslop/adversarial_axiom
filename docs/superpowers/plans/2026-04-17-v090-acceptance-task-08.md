# Task 8: Add Section B — Async Function Tests

**Part of:** [v0.9.0 Acceptance Tests Implementation Plan](2026-04-17-v090-acceptance.md)

**Prerequisite:** Task 7 (section A must exist)

**Files:**
- Modify: `test/v090-acceptance.test.ts` (replace the `// ── Sections B, C, D` comment with section B + updated comment).

- [ ] **Step 1: Add section B inside the outer describe**

```typescript
    // ==========================================
    // B. Async Functions
    // ==========================================
    describe('Async Functions', () => {

        it('B1: should inject @pre guard synchronously before async body', () => {
            const fixture = `
/** @pre x > 0 */
export async function asyncWithPre(x: number): Promise<number> {
    return x;
}
`;
            const result = compileAndRun(fixture, 'asyncWithPre');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain('ContractViolationError("PRE"');

            const violation = compileAndRun(fixture, 'asyncWithPre', 'asyncWithPre(-1)');
            expect(violation.output).toContain('ERROR: ContractViolationError');
        });

        it('B2: should check resolved value (not Promise object) for @post', () => {
            const fixture = `
/** @post result > 0 */
export async function asyncWithPost(x: number): Promise<number> {
    return x * 2;
}
`;
            const result = compileAndRun(fixture, 'asyncWithPost');
            expect(result.success).toBe(true);
            // Async post wraps body in an immediately-invoked async function
            expect(result.compiled).toContain('async ()');
            expect(result.compiled).toContain('ContractViolationError("POST"');

            const valid = compileAndRun(fixture, 'asyncWithPost', 'asyncWithPost(2)');
            expect(valid.output).toContain('RESULT: 4');
        });

        it('B3: should drop @post with warning for Promise<void>', () => {
            const fixture = `
/** @post result === undefined */
export async function asyncVoidWithPost(msg: string): Promise<void> {
    console.log(msg);
}
`;
            const result = compileAndRun(fixture, 'asyncVoidWithPost');
            expect(result.success).toBe(true);
            expect(result.compiled).not.toContain('result === undefined');
        });

        it('B4: should capture @prev synchronously before async body', () => {
            const fixture = `
/**
 * @prev { x }
 * @post result === prev.x + 1
 */
export async function asyncWithPrev(x: number): Promise<number> {
    return x + 1;
}
`;
            const result = compileAndRun(fixture, 'asyncWithPrev');
            expect(result.success).toBe(true);
            // prev capture must appear before the async body wrapper
            expect(result.compiled).toContain('{ x }');
            expect(result.compiled).toContain('prev.x + 1');

            const valid = compileAndRun(fixture, 'asyncWithPrev', 'asyncWithPrev(5)');
            expect(valid.output).toContain('RESULT: 6');
        });

        it('B5: should handle async arrow function with @pre and @post', () => {
            const fixture = `
/**
 * @pre x > 0
 * @post result > 0
 */
export const asyncArrow = async (x: number): Promise<number> => x;
`;
            const result = compileAndRun(fixture, 'asyncArrow');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain('ContractViolationError("PRE"');
            expect(result.compiled).toContain('ContractViolationError("POST"');

            const violation = compileAndRun(fixture, 'asyncArrow', 'asyncArrow(-1)');
            expect(violation.output).toContain('ERROR: ContractViolationError');
        });

        it('B6: should handle async function expression with @pre', () => {
            const fixture = `
/** @pre x > 0 */
export const asyncFuncExpr = async function(x: number): Promise<number> {
    return x;
};
`;
            const result = compileAndRun(fixture, 'asyncFuncExpr');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain('ContractViolationError("PRE"');

            const violation = compileAndRun(fixture, 'asyncFuncExpr', 'asyncFuncExpr(-1)');
            expect(violation.output).toContain('ERROR: ContractViolationError');
        });

        it('B7: should handle multiple @post on async function', () => {
            const fixture = `
/**
 * @post result > 0
 * @post result % 2 === 0
 */
export async function asyncWithMultiplePost(x: number): Promise<number> {
    return x * 2;
}
`;
            const result = compileAndRun(fixture, 'asyncWithMultiplePost');
            expect(result.success).toBe(true);
            const postCount = (result.compiled.match(/ContractViolationError\("POST"/g) ?? []).length;
            expect(postCount).toBeGreaterThanOrEqual(2);
        });

        it('B8: should not evaluate @post when async body throws', () => {
            const fixture = `
/** @post result > 0 */
export async function asyncWithThrow(x: number): Promise<number> {
    if (x < 0) throw new Error('fail');
    return x;
}
`;
            const result = compileAndRun(fixture, 'asyncWithThrow');
            expect(result.success).toBe(true);
            // Both throw paths present in compiled output
            expect(result.compiled).toContain('throw new Error');
            expect(result.compiled).toContain('ContractViolationError("POST"');
        });

        it('B9: async class method uses default @prev (shallow clone of this)', () => {
            const fixture = `
export class AsyncClass {
    public count: number = 0;
    /** @post this.count === prev.count + 1 */
    async increment(): Promise<number> {
        this.count++;
        return this.count;
    }
}
`;
            const result = compileAndRun(fixture, 'AsyncClass');
            expect(result.success).toBe(true);
            // Default prev capture for methods is a shallow clone of this
            expect(result.compiled).toContain('{ ...this }');
            // Post guard references prev.count
            expect(result.compiled).toContain('prev.count');
        });
    });

    // ── Sections C, D added in Tasks 9–10 ────────────────────────────────────
```

- [ ] **Step 2: Run section B tests**

```bash
npm test -- v090-acceptance
```

Expected: all section A + B tests pass.
