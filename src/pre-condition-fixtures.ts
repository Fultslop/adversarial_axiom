// Test fixtures for Phase 1 items

// 1.10: Type mismatch — @pre v === "foo" on number param (warning expected)
// This fixture already exists as shouldWarnVNotCorrectType in functionTests.ts
// We'll add build-output verification in test/build-warnings.test.ts

// 1.11: Assignment expression — @pre v = 5 (warning expected)
// This fixture already exists as shouldWarnAssignmentDuringBuild in functionTests.ts

// 1.17: Logical OR in @pre
/**
 * @pre a > 0 || b > 0
 */
export function doOrPre(a: number, b: number): boolean {
    return a > 0 || b > 0;
}

// 1.19: Negation @pre !flag
/**
 * @pre !disabled
 */
export function doNegationPre(disabled: boolean): string {
    void disabled; // used in @pre contract
    return 'enabled';
}

// 1.20: Comparison operators (>=, <=, !==, <)
/**
 * @pre a >= 0
 * @pre b <= 100
 * @pre a !== b
 * @pre a < 1000
 */
export function doComparisonPre(a: number, b: number): number {
    return a + b;
}

// 1.21: Arithmetic expressions in @pre
/**
 * @pre a + b > 10
 */
export function doArithmeticPre(a: number, b: number): number {
    return a + b;
}

// 1.27: @pre on non-exported function — should be skipped
/**
 * @pre x > 0
 */
function nonExportedWithPre(x: number): number {
    return x * 2;
}

// Re-export to allow calling from tests (but transformer should NOT have injected guards)
export { nonExportedWithPre };

// 1.31: Static method @pre pass/fail — add to existing Foo via new class
/**
 * @invariant this.limit >= 0
 */
export class ServiceClass {
    public limit: number;

    constructor(limit: number) {
        this.limit = limit;
    }

    /**
     * @pre x > 0
     */
    public static staticWithPre(x: number): number {
        return x * 2;
    }

    /**
     * @pre x <= this.limit
     */
    public instanceWithThis(x: number): number {
        return x;
    }

    /**
     * @post result >= 0
     */
    public static staticWithPost(x: number): number {
        return Math.abs(x);
    }
}

// 8.4: Union-typed param — now warns on type mismatch (0.88+)
/**
 * @pre amount === "zero"
 */
export function unionTypePre(amount: number | undefined): number {
    return amount ?? 0;
}

// 8.6: Unary operand — now warns on type mismatch (0.88+)
/**
 * @pre -amount > 0
 */
export function unaryOperandPre(amount: string): number {
    return Number(amount);
}

// 8.7: Compound conditions — now warns on type narrowing (0.88+)
/**
 * @pre amount !== undefined && amount === "zero"
 */
export function compoundNarrowingPre(amount: number | undefined): number {
    return amount ?? 0;
}
