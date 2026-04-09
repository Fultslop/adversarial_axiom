// fsprepost 1.1.2 — @post result type validation fixtures

// Feature 1: @post result without return type annotation
// Should NOT inject @post and should emit warning: "no return type is declared"
/**
 * @post result === 42
 */
export function noReturnTypeAnnotation(x: number) {
    return x;
}

// Feature 2: @post result with void return type
// Should drop @post and warn: return type is 'void'
/**
 * @post result === undefined
 */
export function voidReturnPost(x: number): void {
    console.log(x);
}

// Feature 3: @post result with never return type
// Should drop @post and warn: return type is 'never'
/**
 * @post result === 0
 */
export function neverReturnPost(x: number): never {
    console.log(x); // Use x to avoid unused warning
    throw new Error('always throws');
}

// Feature 4: @post without result still works on void functions
// @pre should still be injected on void functions
/**
 * @pre x > 0
 * @post console.log('side effect')
 */
export function voidFunctionWithPre(x: number): void {
    console.log('executed with', x);
}

// Feature 5: @post result with valid return type is unaffected
// Should inject @post check normally with no warnings
/**
 * @post result >= 0
 */
export function validReturnPost(x: number): number {
    return Math.abs(x);
}

// Feature 5b: Additional valid case with string return type
/**
 * @post result.length > 0
 */
export function validStringReturnPost(x: string): string {
    return x.toUpperCase();
}

// Feature 5c: Additional valid case with boolean return type
/**
 * @post result === true
 */
export function validBooleanReturnPost(x: number): boolean {
    return x > 0;
}
