// Genuine remaining limitations in axiom contract expressions
// NOTE: 1.23 (destructured params), 9.7 (Math global), 9.9 (enum), 9.10 (module const)
// are NOW SUPPORTED and have been removed from this file.

// 1.26: Template literal — type mismatch not detected
/**
 * @pre label === `item_${id}`
 */
export function templateLiteralPre(label: number, id: string): boolean {
    return label === Number(`item_${id}`); // always false, but tests template literal parsing
}

// 2.12 / 8.3: Non-primitive return type — result omitted from type map
/**
 * @post result === "ok"
 */
export function nonPrimitivePost(): Record<string, unknown> {
    return { status: 'ok' };
}

// 8.4: Union-typed param — type mismatch not detected
/**
 * @pre amount === "zero"
 */
export function unionTypePre(amount: number | undefined): number {
    return amount ?? 0;
}

// 8.5: Multi-level property chain — only root checked
/**
 * @pre this.config.limit > 0
 */
export class MultiLevelAccess {
    public config: { limit: number };

    constructor(limit: number) {
        this.config = { limit };
    }

    public check(): number {
        return this.config.limit;
    }
}

// 8.6: Unary operand — type mismatch not detected
/**
 * @pre -amount > 0
 */
export function unaryOperandPre(amount: string): number {
    return Number(amount);
}

// 8.7: Compound conditions — type narrowing not considered
/**
 * @pre amount !== undefined && amount === "zero"
 */
export function compoundNarrowingPre(amount: number | undefined): number {
    return amount ?? 0;
}
