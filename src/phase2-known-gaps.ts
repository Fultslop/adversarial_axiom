// Phase 2: Known limitation gap tests — these assert the WARNINGS, not functionality
// These are items 1.23, 1.24, 1.25, 1.26, 2.12, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 9.7, 9.9

// 1.23: Destructured parameter — binding names not recognised
/**
 * @pre x > 0
 */
export function destructuredPre({ x, y }: { x: number; y: number }): number {
    return x + y;
}

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

// 9.7: Non-whitelisted global Math — warns
/**
 * @pre Math.abs(delta) < 100
 */
export function mathGlobalPre(delta: number): number {
    return Math.abs(delta);
}

// 9.9: Enum reference — warns as unknown identifier
export enum Status { Active, Inactive }

/**
 * @pre status === Status.Active
 */
export function enumReferencePre(status: Status): boolean {
    return status === Status.Active;
}

// 9.10: Module-level constant — warns as unknown identifier
// Exported so TS doesn't complain about unused variable
export const MAX_LIMIT = 100;

/**
 * @pre x < MAX_LIMIT
 */
export function moduleConstantPre(x: number): number {
    return x;
}
