// Genuine remaining limitations in axiom contract expressions
// NOTE: 1.23 (destructured params), 9.7 (Math global), 9.9 (enum), 9.10 (module const),
// 8.4 (union type), 8.6 (unary operand), 8.7 (compound narrowing), 2.12/8.3 (non-primitive return)
// are NOW SUPPORTED and have been removed from this file.

// 1.26: Template literal — type mismatch not detected
/**
 * @pre label === `item_${id}`
 */
export function templateLiteralPre(label: number, id: string): boolean {
    return label === Number(`item_${id}`); // always false, but tests template literal parsing
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
