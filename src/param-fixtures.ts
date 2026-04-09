// Test fixtures for default/rest/optional parameters (Phase 15.7-15.9)

// 15.7: Default parameters
/**
 * @pre x > 0
 */
export function withDefault(x: number = 10): number {
    return x;
}

// 15.8: Rest parameters
/**
 * @pre args.length > 0
 */
export function withRest(...args: number[]): number {
    return args.reduce((a, b) => a + b, 0);
}

// 15.9: Optional parameters
/**
 * @pre x !== undefined
 */
export function withOptional(x?: number): number {
    return x ?? 0;
}
