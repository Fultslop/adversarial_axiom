# Task 7: Add Section A — Arrow & Function Expression Tests

**Part of:** [v0.9.0 Acceptance Tests Implementation Plan](2026-04-17-v090-acceptance.md)

**Prerequisite:** Task 6 (infrastructure file must exist)

**Files:**
- Modify: `test/v090-acceptance.test.ts` (append inside the outer describe, before the closing `}`).

Replace the comment `// ── Sections added in Tasks 7–10 ────` with the block below, keeping the comment for the remaining sections:

- [ ] **Step 1: Add section A inside the outer describe**

```typescript
    // ==========================================
    // A. Arrow & Function Expressions
    // ==========================================
    describe('Arrow & Function Expressions', () => {

        it('A1: should inject @pre guard on exported arrow (location = variable name)', () => {
            const fixture = `
/** @pre x > 0 */
export const arrowWithPre = (x: number): number => x;
`;
            const result = compileAndRun(fixture, 'arrowWithPre');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain('ContractViolationError("PRE"');
            expect(result.compiled).toContain('"arrowWithPre"');

            const violation = compileAndRun(fixture, 'arrowWithPre', 'arrowWithPre(-1)');
            expect(violation.output).toContain('ERROR: ContractViolationError');

            const valid = compileAndRun(fixture, 'arrowWithPre', 'arrowWithPre(1)');
            expect(valid.output).toContain('RESULT: 1');
        });

        it('A2: should inject @post guard on exported arrow', () => {
            const fixture = `
/** @post result > 0 */
export const arrowWithPost = (x: number): number => x * 2;
`;
            const result = compileAndRun(fixture, 'arrowWithPost');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain('ContractViolationError("POST"');

            const valid = compileAndRun(fixture, 'arrowWithPost', 'arrowWithPost(2)');
            expect(valid.output).toContain('RESULT: 4');
        });

        it('A3: should inject both @pre and @post on arrow function', () => {
            const fixture = `
/**
 * @pre x > 0
 * @post result > 1
 */
export const arrowWithPreAndPost = (x: number): number => x + 1;
`;
            const result = compileAndRun(fixture, 'arrowWithPreAndPost');
            expect(result.success).toBe(true);
            const preCount  = (result.compiled.match(/ContractViolationError\("PRE"/g)  ?? []).length;
            const postCount = (result.compiled.match(/ContractViolationError\("POST"/g) ?? []).length;
            expect(preCount).toBeGreaterThanOrEqual(1);
            expect(postCount).toBeGreaterThanOrEqual(1);

            const violation = compileAndRun(fixture, 'arrowWithPreAndPost', 'arrowWithPreAndPost(-1)');
            expect(violation.output).toContain('ERROR: ContractViolationError');

            const valid = compileAndRun(fixture, 'arrowWithPreAndPost', 'arrowWithPreAndPost(1)');
            expect(valid.output).toContain('RESULT: 2');
        });

        it('A4: should normalise expression body to block body for @post result capture', () => {
            const fixture = `
/** @post result > 0 */
export const expressionBodyArrow = (x: number): number => x * 2;
`;
            const result = compileAndRun(fixture, 'expressionBodyArrow');
            expect(result.success).toBe(true);
            // Block-body normalisation: compiled must have an explicit return statement
            expect(result.compiled).toContain('return');
            // result variable must be captured (not bare expression body)
            expect(result.compiled).toContain('ContractViolationError("POST"');
        });

        it('A5: should use variable name as location for named function expression', () => {
            const fixture = `
/** @pre x > 0 */
export const namedFuncExpr = function add(x: number): number {
    return x + 1;
};
`;
            const result = compileAndRun(fixture, 'namedFuncExpr');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain('"namedFuncExpr"');
            expect(result.compiled).not.toContain('"add"');
        });

        it('A7: should handle arrow with destructured params', () => {
            const fixture = `
/** @pre x > 0 */
export const arrowWithDestruct = ({ x, y }: { x: number; y: number }): number => x + y;
`;
            const result = compileAndRun(fixture, 'arrowWithDestruct');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain('ContractViolationError("PRE"');

            const violation = compileAndRun(fixture, 'arrowWithDestruct', 'arrowWithDestruct({ x: 0, y: 3 })');
            expect(violation.output).toContain('ERROR: ContractViolationError');
        });

        it('A8: should warn and skip guard for unknown identifier in contract', () => {
            const fixture = `
/** @pre unknownVar > 0 */
export const arrowWithUnknownId = (x: number): number => x;
`;
            const result = compileAndRun(fixture, 'arrowWithUnknownId');
            expect(result.success).toBe(true);
            expect(result.compiled).not.toContain('unknownVar');
        });

        it('A9: should inject multiple @pre guards', () => {
            const fixture = `
/**
 * @pre a > 0
 * @pre b > 0
 */
export const arrowWithMultiplePre = (a: number, b: number): number => a + b;
`;
            const result = compileAndRun(fixture, 'arrowWithMultiplePre');
            expect(result.success).toBe(true);
            const preCount = (result.compiled.match(/ContractViolationError\("PRE"/g) ?? []).length;
            expect(preCount).toBeGreaterThanOrEqual(2);
        });

        it('A10: should drop @post with warning for void-return arrow', () => {
            const fixture = `
/** @post result === undefined */
export const arrowVoidWithPost = (msg: string): void => { console.log(msg); };
`;
            const result = compileAndRun(fixture, 'arrowVoidWithPost');
            expect(result.success).toBe(true);
            expect(result.compiled).not.toContain('result === undefined');
        });

        it('A11: should handle ternary expression body', () => {
            const fixture = `
/** @post result >= 0 */
export const arrowWithTernary = (x: number): number => x > 0 ? x * 2 : 0;
`;
            const result = compileAndRun(fixture, 'arrowWithTernary');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain('ContractViolationError("POST"');
        });

        it('A12: should handle function expression with @pre and @post', () => {
            const fixture = `
/**
 * @pre x > 0
 * @post result > 0
 */
export const funcExprWithContracts = function(x: number): number {
    return x * 2;
};
`;
            const result = compileAndRun(fixture, 'funcExprWithContracts');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain('ContractViolationError("PRE"');
            expect(result.compiled).toContain('ContractViolationError("POST"');
        });
    });

    // ── Sections B, C, D added in Tasks 8–10 ────────────────────────────────
```

- [ ] **Step 2: Run section A tests**

```bash
npm test -- v090-acceptance
```

Expected: all section A tests pass (0 failures in section A).
