// Phase 2: Ternary, instanceof, in, void operator, this in function, AND short-circuit

// 1.22: Ternary expression in @pre
/**
 * @pre cond ? a > 0 : b > 0
 */
export function ternaryPre(cond: boolean, a: number, b: number): number {
    return cond ? a : b;
}

// 1.28: @pre with instanceof check
export class BaseClass {}
export class DerivedClass extends BaseClass {}

/**
 * @pre obj instanceof BaseClass
 */
export function instanceofPre(obj: object): boolean {
    return obj instanceof BaseClass;
}

// 1.29: @pre with in operator
/**
 * @pre 'key' in obj
 */
export function inOperatorPre(obj: Record<string, unknown>): boolean {
    return 'key' in obj;
}

// 1.30: @pre with void operator
/**
 * @pre void 0 === undefined
 */
export function voidOperatorPre(x: number): number {
    return x;
}

// 1.16: @pre referencing this in a non-method function
// In a standalone function, 'this' refers to the global context (or undefined in strict mode)
// This tests how the transformer handles it
/**
 * @pre typeof this === 'undefined'
 */
export function thisInFunction(): boolean {
    return true;
}

// 1.17 (short-circuit): Logical AND — second operand should not be evaluated if first is false
// This is tested by ensuring an invalid identifier in the second clause doesn't cause a runtime error
// when the first clause is false.

/**
 * @pre false && unknownId
 */
export function shortCircuitFalse(x: number): number {
    return x;
}

/**
 * @pre true && x > 0
 */
export function shortCircuitTrue(x: number): number {
    return x;
}
