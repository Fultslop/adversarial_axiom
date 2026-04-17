# Task 9: Add Section C — `keepContracts` Logic Tests

**Part of:** [v0.9.0 Acceptance Tests Implementation Plan](2026-04-17-v090-acceptance.md)

**Prerequisite:** Task 8 (section B must exist)

**Files:**
- Modify: `test/v090-acceptance.test.ts` (replace `// ── Sections C, D` comment with section C + updated comment).

- [ ] **Step 1: Add section C inside the outer describe**

```typescript
    // ==========================================
    // C. keepContracts Logic
    // ==========================================
    describe('keepContracts', () => {

        it('C1: should inject require(@fultslop/axiom) when contracts are present', () => {
            const fixture = `
/**
 * @pre x > 0
 * @post result > 0
 */
export function keepContractsTest(x: number): number {
    return x * 2;
}
`;
            const result = compileAndRun(fixture, 'keepContractsTest');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain("require('@fultslop/axiom')");
        });

        it('C2: file-level "keepContracts post" on Line 1 keeps @post, strips @pre', () => {
            const fixture = `// @axiom keepContracts post
/**
 * @pre x > 0
 * @post result > 0
 */
export function fileOverridePost(x: number): number {
    return x * 2;
}
`;
            const result = compileAndRun(fixture, 'fileOverridePost');
            expect(result.success).toBe(true);
            const preCount  = (result.compiled.match(/ContractViolationError\("PRE"/g)  ?? []).length;
            const postCount = (result.compiled.match(/ContractViolationError\("POST"/g) ?? []).length;
            expect(preCount).toBe(0);
            expect(postCount).toBeGreaterThanOrEqual(1);
        });

        it('C3: file-level override on Line 2+ is ignored — both guards active', () => {
            const fixture = `
// @axiom keepContracts post  (on line 2 — must be ignored)
/**
 * @pre x > 0
 * @post result > 0
 */
export function fileOverrideIgnored(x: number): number {
    return x * 2;
}
`;
            const result = compileAndRun(fixture, 'fileOverrideIgnored');
            expect(result.success).toBe(true);
            const preCount  = (result.compiled.match(/ContractViolationError\("PRE"/g)  ?? []).length;
            const postCount = (result.compiled.match(/ContractViolationError\("POST"/g) ?? []).length;
            expect(preCount).toBeGreaterThanOrEqual(1);
            expect(postCount).toBeGreaterThanOrEqual(1);
        });

        it('C4: "keepContracts true" keeps both @pre and @post', () => {
            const fixture = `// @axiom keepContracts true
/**
 * @pre x > 0
 * @post result > 0
 */
export function keepContractsTrue(x: number): number {
    return x * 2;
}
`;
            const result = compileAndRun(fixture, 'keepContractsTrue');
            expect(result.success).toBe(true);
            const preCount  = (result.compiled.match(/ContractViolationError\("PRE"/g)  ?? []).length;
            const postCount = (result.compiled.match(/ContractViolationError\("POST"/g) ?? []).length;
            expect(preCount).toBeGreaterThanOrEqual(1);
            expect(postCount).toBeGreaterThanOrEqual(1);
        });

        it('C5: "keepContracts all" keeps both @pre and @post (same as true)', () => {
            const fixture = `// @axiom keepContracts all
/**
 * @pre x > 0
 * @post result > 0
 */
export function keepContractsAll(x: number): number {
    return x * 2;
}
`;
            const result = compileAndRun(fixture, 'keepContractsAll');
            expect(result.success).toBe(true);
            const preCount  = (result.compiled.match(/ContractViolationError\("PRE"/g)  ?? []).length;
            const postCount = (result.compiled.match(/ContractViolationError\("POST"/g) ?? []).length;
            expect(preCount).toBeGreaterThanOrEqual(1);
            expect(postCount).toBeGreaterThanOrEqual(1);
        });

        it('C6: "keepContracts pre" keeps @pre only, strips @post', () => {
            const fixture = `// @axiom keepContracts pre
/**
 * @pre x > 0
 * @post result > 0
 */
export function keepContractsPre(x: number): number {
    return x * 2;
}
`;
            const result = compileAndRun(fixture, 'keepContractsPre');
            expect(result.success).toBe(true);
            const preCount  = (result.compiled.match(/ContractViolationError\("PRE"/g)  ?? []).length;
            const postCount = (result.compiled.match(/ContractViolationError\("POST"/g) ?? []).length;
            expect(preCount).toBeGreaterThanOrEqual(1);
            expect(postCount).toBe(0);
        });

        it('C7: "keepContracts invariant" keeps @invariant only, strips @pre/@post', () => {
            const fixture = `// @axiom keepContracts invariant
/**
 * @invariant this.value > 0
 */
export class KeepInvariantOnly {
    public value: number;
    constructor(value: number) { this.value = value; }
    /** @pre x > 0 */
    public add(x: number): number {
        this.value += x;
        return this.value;
    }
}
`;
            const result = compileAndRun(fixture, 'KeepInvariantOnly');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain('InvariantViolationError');
            const preCount = (result.compiled.match(/ContractViolationError\("PRE"/g) ?? []).length;
            expect(preCount).toBe(0);
        });
    });

    // ── Section D added in Task 10 ────────────────────────────────────────────
```

- [ ] **Step 2: Run section C tests**

```bash
npm test -- v090-acceptance
```

Expected: all section A + B + C tests pass.
