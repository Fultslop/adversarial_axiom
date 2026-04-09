// Phase 2: Additional @post condition fixtures

// 2.13: @post with arithmetic
/**
 * @post result === a + b
 */
export function postArithmetic(a: number, b: number): number {
    return a + b;
}

// 2.8: @post with result on void function — result is undefined
/**
 * @post result === undefined
 */
export function postVoidResult(items: number[]): void {
    items.push(1);
}

// 15.1: Empty @pre tag (edge case — transformer should handle gracefully)
/**
 * @pre
 */
export function emptyPre(x: number): number {
    return x;
}

// 15.1: Empty @post tag
/**
 * @post
 */
export function emptyPost(x: number): number {
    return x;
}

// 15.3: Deeply nested property access
/**
 * @pre config.settings.limit > 0
 */
export function deepNested(config: { settings: { limit: number } }): number {
    return config.settings.limit;
}

// 9.5: result in @pre context — should be undefined or warn
/**
 * @pre result === undefined
 */
export function resultInPre(x: number): number {
    return x + 1;
}

// 10.3: if/else with @post
/**
 * @post result >= 0
 */
export function ifElsePost(x: number): number {
    if (x > 0) {
        return x;
    } else {
        return -x;
    }
}

// 10.4: Multiple return statements with @post
/**
 * @post result > 0
 */
export function multiReturnPost(x: number): number {
    if (x > 10) return x;
    if (x > 5) return x + 1;
    if (x > 0) return x + 2;
    return 1;
}

// 10.5: Function with throw and @post
/**
 * @post result > 0
 */
export function throwAndPost(x: number): number {
    if (x < 0) {
        throw new Error('negative');
    }
    return x + 1;
}

// 10.6: try/catch with @post
/**
 * @post result >= 0
 */
export function tryCatchPost(): number {
    try {
        return JSON.parse('invalid');
    } catch {
        return 0;
    }
}

// 10.7: Early return with @post
/**
 * @post result > 0
 */
export function earlyReturnPost(x: number): number {
    if (x <= 0) return 1;
    const y = x * 2;
    return y;
}

// 10.8: Class method with multiple return paths
/**
 * @invariant this.count >= 0
 */
export class MultiReturnClass {
    public count: number;

    constructor(count: number) {
        this.count = count;
    }

    /**
     * @post result >= 0
     */
    public compute(x: number): number {
        if (x > 10) return x;
        if (x > 0) return this.count + x;
        return this.count;
    }
}

// 10.10: Arrow function inside body — outer function has contract
/**
 * @pre x > 0
 * @post result > 0
 */
export function arrowInsideBody(x: number): number {
    const fn = (n: number) => n * 2; // arrow function — should NOT be instrumented
    return fn(x);
}

// 15.10: Re-entrant contract calls
/**
 * @pre x > 0
 */
export function reentrantA(x: number): number {
    if (x > 1) {
        return reentrantB(x - 1);
    }
    return 1;
}

/**
 * @pre x > 0
 */
export function reentrantB(x: number): number {
    if (x > 1) {
        return reentrantA(x - 1);
    }
    return 1;
}

// 9.6: Whitelisted globals — these should NOT produce warnings
/**
 * @pre x !== undefined
 */
export function globalUndefined(x: number): boolean {
    return x !== undefined;
}

/**
 * @pre x === x
 */
export function globalNaN(x: number): boolean {
    return !Number.isNaN(x); // NaN comparison
}

/**
 * @pre x < globalThis.Infinity
 */
export function globalInfinity(x: number): boolean {
    return x < Infinity;
}
