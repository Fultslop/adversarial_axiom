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

// ========================================
// NEW: GLOBAL_IDENTIFIERS comprehensive tests
// Testing all newly added global identifiers
// ========================================

// Built-in constructors — should NOT warn
/**
 * @pre typeof(obj) === 'object' || obj instanceof Object
 */
export function globalObject(obj: any): boolean {
    return typeof(obj) === 'object' || obj instanceof Object;
}

/**
 * @pre arr instanceof Array
 */
export function globalArray(arr: any): boolean {
    return arr instanceof Array;
}

/**
 * @pre typeof(str) === 'string' || str instanceof String
 */
export function globalString(str: any): boolean {
    return typeof(str) === 'string' || str instanceof String;
}

/**
 * @pre typeof(num) === 'number' || num instanceof Number
 */
export function globalNumber(num: any): boolean {
    return typeof(num) === 'number' || num instanceof Number;
}

/**
 * @pre typeof(flag) === 'boolean' || flag instanceof Boolean
 */
export function globalBoolean(flag: any): boolean {
    return typeof(flag) === 'boolean' || flag instanceof Boolean;
}

/**
 * @pre typeof(sym) === 'symbol' || sym instanceof Symbol
 */
export function globalSymbol(sym: any): boolean {
    return typeof(sym) === 'symbol' || sym instanceof Symbol;
}

/**
 * @pre typeof(big) === 'bigint' || big instanceof BigInt
 */
export function globalBigInt(big: any): boolean {
    return typeof(big) === 'bigint' || big instanceof BigInt;
}

// Math namespace — should NOT warn
/**
 * @pre x >= 0 && Math.abs(x) < 1000000
 */
export function globalMathRange(x: number): boolean {
    return x >= 0 && Math.abs(x) < 1000000;
}

/**
 * @pre Math.floor(x) === x
 */
export function globalMathFloor(x: number): boolean {
    return Math.floor(x) === x;
}

/**
 * @pre Math.ceil(x) === x
 */
export function globalMathCeil(x: number): boolean {
    return Math.ceil(x) === x;
}

// JSON namespace — should NOT warn
/**
 * @pre JSON.stringify(obj).length > 0
 */
export function globalJsonStringify(obj: object): boolean {
    return JSON.stringify(obj).length > 0;
}

/**
 * @pre JSON.parse(str) !== null
 */
export function globalJsonParse(str: string): boolean {
    return JSON.parse(str) !== null;
}

// Date constructor — should NOT warn
/**
 * @pre date instanceof Date
 */
export function globalDate(date: any): boolean {
    return date instanceof Date;
}

// RegExp constructor — should NOT warn
/**
 * @pre pattern instanceof RegExp
 */
export function globalRegExp(pattern: any): boolean {
    return pattern instanceof RegExp;
}

// Error constructor — should NOT warn
/**
 * @pre err instanceof Error
 */
export function globalError(err: any): boolean {
    return err instanceof Error;
}

// Promise constructor — should NOT warn
/**
 * @pre promise instanceof Promise
 */
export function globalPromise(promise: any): boolean {
    return promise instanceof Promise;
}

// Utility functions — should NOT warn
/**
 * @pre parseInt(str, 10) === parseInt(str, 10)
 */
export function globalParseInt(str: string): boolean {
    return parseInt(str, 10) === parseInt(str, 10);
}

/**
 * @pre parseFloat(str) === parseFloat(str)
 */
export function globalParseFloat(str: string): boolean {
    return parseFloat(str) === parseFloat(str);
}

/**
 * @pre isNaN(val) === false
 */
export function globalIsNaN(val: number): boolean {
    return isNaN(val) === false;
}

/**
 * @pre isFinite(val) === true
 */
export function globalIsFinite(val: number): boolean {
    return isFinite(val) === true;
}

/**
 * @pre encodeURIComponent(str).length > 0
 */
export function globalEncodeURIComponent(str: string): boolean {
    return encodeURIComponent(str).length > 0;
}

/**
 * @pre decodeURIComponent(str) === decodeURIComponent(str)
 */
export function globalDecodeURIComponent(str: string): boolean {
    return decodeURIComponent(str) === decodeURIComponent(str);
}

// console — should NOT warn (useful in dev contracts)
/**
 * @pre console !== undefined
 */
export function globalConsole(): boolean {
    return console !== undefined;
}

// globalThis — should NOT warn
/**
 * @pre globalThis.Object === Object
 */
export function globalThisObject(): boolean {
    return globalThis.Object === Object;
}

// arguments — should NOT warn (in non-arrow functions)
/**
 * @pre arguments.length > 0
 */
export function globalArguments(): boolean {
    return arguments.length > 0;
}

// Multiple globals in single contract — should NOT warn
/**
 * @pre typeof(x) === 'number' && !isNaN(x) && isFinite(x) && Math.abs(x) < 1000
 */
export function multipleGlobals(x: number): boolean {
    return typeof(x) === 'number' && !isNaN(x) && isFinite(x) && Math.abs(x) < 1000;
}

// Complex expression with globals — should NOT warn
/**
 * @post result instanceof Array && result.length >= 0
 */
export function complexGlobalResult(x: number): number[] {
    return [x, x * 2, x * 3];
}
