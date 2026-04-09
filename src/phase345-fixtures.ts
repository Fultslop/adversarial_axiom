// Test fixtures for Phase 2, 3, 4, 5 items

// 2.4: @post with logical AND
/**
 * @post result >= 0 && result <= 100
 */
export function doAndPost(value: number): number {
    return Math.min(100, Math.max(0, value));
}

// 2.5: @post with logical OR
/**
 * @post result === 0 || result > 10
 */
export function doOrPost(value: number): number {
    if (value > 0 && value <= 10) {
        return 5; // violates post
    }
    return value;
}

// 2.6: @post on void return function
/**
 * @post true
 */
export function doVoidPost(items: number[]): void {
    items.push(1);
}

// 2.15: @post on non-exported function — should be skipped
/**
 * @post result > 0
 */
function nonExportedPost(x: number): number {
    return x - 100; // would violate post if injected
}
export { nonExportedPost };

// 3.3: @pre fails, @post never evaluated
/**
 * @pre x > 0
 * @post result < 0
 */
export function preFailsPostNotEvaluated(x: number): number {
    return x; // positive, so post would fail IF evaluated
}

// 3.4: Multiple @pre + multiple @post
/**
 * @pre a > 0
 * @pre b > 0
 * @post result > 0
 * @post result === a + b
 */
export function multiPrePost(a: number, b: number): number {
    return a + b;
}

// 3.5: Order of evaluation — use a counter observable only via return
let _evalOrder = 0;
export function getEvalOrder(): number { return _evalOrder; }
export function resetEvalOrder(): void { _evalOrder = 0; }

/**
 * @pre (++_evalOrder, true)
 * @post (++_evalOrder, true)
 */
export function orderCheckFn(x: number): number {
    const before = _evalOrder;
    _evalOrder = before + 10;
    return x;
}

// 5.2: @pre with this reference in method
/**
 * @invariant this.threshold > 0
 */
export class ThresholdChecker {
    public threshold: number;

    constructor(threshold: number) {
        this.threshold = threshold;
    }

    /**
     * @pre value <= this.threshold
     */
    public check(value: number): boolean {
        return value <= this.threshold;
    }
}

// 5.5/5.6: Private/protected methods should not be instrumented
/**
 * @invariant this.value >= 0
 */
export class VisibilityTest {
    public value: number;

    constructor(value: number) {
        this.value = value;
    }

    /**
     * @pre x > 0
     */
    private privateMethod(x: number): number {
        // If instrumented, this would throw on negative x
        // But it should NOT be instrumented
        return x;
    }

    /**
     * @pre x > 0
     */
    protected protectedMethod(x: number): number {
        return x;
    }

    // Public wrapper to call protected method from tests (via subclass)
    public callProtected(x: number): number {
        return this.protectedMethod(x);
    }

    // Expose private for testing
    public callPrivate(x: number): number {
        return this.privateMethod(x);
    }
}

// 4.2: Multiple invariants on class
/**
 * @invariant this.min <= this.max
 * @invariant this.count >= 0
 * @invariant this.name !== ""
 */
export class MultiInvariantClass {
    public min: number;
    public max: number;
    public count: number;
    public name: string;

    constructor(min: number, max: number, count: number, name: string) {
        this.min = min;
        this.max = max;
        this.count = count;
        this.name = name;
    }

    public setRange(min: number, max: number): void {
        this.min = min;
        this.max = max;
    }

    public increment(): void {
        this.count++;
    }

    public rename(newName: string): void {
        this.name = newName;
    }
}

// 4.3: Invariant checked after constructor
/**
 * @invariant this.value > 0
 */
export class ConstructorInvariant {
    public value: number;

    constructor(value: number) {
        this.value = value;
        // invariant should be checked here
    }
}

// 4.4: Invariant violated after public method
/**
 * @invariant this.balance >= 0
 */
export class BalanceAccount {
    public balance: number;

    constructor(initial: number) {
        this.balance = initial;
    }

    /**
     * @pre amount >= 0
     */
    public withdraw(amount: number): number {
        this.balance -= amount;
        return this.balance;
    }
}

// 4.5: Invariant NOT checked on private method
/**
 * @invariant this.count <= 10
 */
export class PrivateInvariant {
    public count: number;

    constructor() {
        this.count = 5;
    }

    // This private method could violate invariant but should not be checked
    private setCount(n: number): void {
        this.count = n;
    }

    public setCountPublic(n: number): void {
        this.setCount(n);
        // invariant should NOT be checked here after calling private method
    }

    // Public method that legitimately sets count
    public setValidCount(n: number): void {
        this.count = n;
        // invariant SHOULD be checked here
    }
}

// 4.6: Invariant NOT checked on static method
/**
 * @invariant this.maxVal >= 0
 */
export class StaticInvariant {
    public maxVal: number;

    constructor(maxVal: number) {
        this.maxVal = maxVal;
    }

    // Static methods should not trigger invariant checks
    public static staticDoNothing(): void {
        // no this context, invariant should not be checked
    }

    public static staticReturn(): number {
        return 42;
    }
}
