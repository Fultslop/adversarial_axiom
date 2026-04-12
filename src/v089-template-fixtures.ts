// Test fixtures for v0.8.9 template literal fixes
// Verifying that interpolated templates and sibling contracts work

// Test 1: Interpolated template with sibling contract
/**
 * @pre label === `item_${id}`
 * @pre count > 0
 */
export function interpolatedWithSibling(label: string, id: number, count: number): boolean {
    return label === `item_${id}` && count > 0;
}

// Test 2: No-substitution template with sibling contract  
/**
 * @pre label === `hello`
 * @pre count > 0
 */
export function noSubstWithSibling(label: string, count: number): boolean {
    return label === 'hello' && count > 0;
}

// Test 3: Type mismatch - backtick vs number (should warn)
/**
 * @pre count === `hello`
 */
export function typeMismatchBacktickNumber(count: number): boolean {
    return String(count) === 'hello';
}

// Test 4: No false warning - backtick vs string (should NOT warn)
/**
 * @pre label === `hello`
 */
export function noFalseWarningBacktickString(label: string): boolean {
    return label === 'hello';
}
