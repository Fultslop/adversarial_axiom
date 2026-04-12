// Template literal tests for axiom v0.8.5
// Tests both no-substitution and interpolated template literals

// 1. No-substitution template literal (FIXED in v0.8.5)
/**
 * @pre label === `hello`
 */
export function noSubstTemplateLiteralPre(label: string): boolean {
    return label === 'hello';
}

// 2. No-substitution template literal with rejection
/**
 * @pre status === `active`
 */
export function noSubstTemplateReject(status: string): boolean {
    return status === 'active';
}

// 3. Interpolated template literal (should work in both old and new)
/**
 * @pre label === `item_${id}`
 */
export function interpolatedTemplateLiteralPre(label: string, id: number): boolean {
    return label === `item_${id}`;
}

// 4. Mixed: no-substitution in @post
/**
 * @post result === `ok`
 */
export function noSubstTemplateLiteralPost(value: string): string {
    return value;
}

// 5. Complex no-substitution expression
/**
 * @pre type === `admin` || type === `user`
 */
export function multipleNoSubstTemplates(type: string): boolean {
    return type === 'admin' || type === 'user';
}

// 6. Template literal with comparison
/**
 * @pre `prefix_${code}` === expected
 */
export function templateOnLeft(code: number, expected: string): boolean {
    return `prefix_${code}` === expected;
}

// 7. Multiple no-substitution templates in single contract
/**
 * @pre first === `one` && second === `two`
 */
export function multipleTemplatesInOneContract(first: string, second: string): boolean {
    return first === 'one' && second === 'two';
}

// 8. No-substitution template with negation
/**
 * @pre status !== `inactive`
 */
export function templateNegation(status: string): boolean {
    return status !== 'inactive';
}
