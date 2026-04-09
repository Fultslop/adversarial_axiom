// Test fixtures for error type assertions (Phase 6)

// 6.1-6.6: ContractViolationError properties on pre violation
/**
 * @pre amount > 0
 */
export function errorPreAmount(amount: number): number {
    return amount;
}

/**
 * @pre name.length > 0
 */
export function errorPreName(name: string): string {
    return name;
}

// 6.2/6.3: ContractViolationError.type for post
/**
 * @post result > 0
 */
export function errorPostResult(x: number): number {
    return x; // negative x → post violation
}

// 6.4/6.5: expression and location
/**
 * @pre x < 100
 */
export function errorLocation(x: number): number {
    return x;
}

/**
 * @invariant this.value >= 0
 */
export class ErrorInvariantClass {
    public value: number;

    constructor(value: number) {
        this.value = value;
    }

    /**
     * @pre amount >= 0
     */
    public deduct(amount: number): number {
        this.value -= amount;
        return this.value;
    }
}
