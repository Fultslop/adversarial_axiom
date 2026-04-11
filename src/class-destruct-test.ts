// Test class invariants with destructured params

/**
 * @invariant this.value > 0
 */
export class ClassInvariantDestruct {
    public value: number;

    constructor(value: number) {
        this.value = value;
    }

    /**
     * @pre delta > 0
     */
    public add({ delta }: { delta: number }): number {
        this.value += delta;
        return this.value;
    }
}

/**
 * @pre amount > 0
 * @post result > 0
 */
export class ClassMethodDestruct {
    private balance: number;

    constructor(initial: number) {
        this.balance = initial;
    }

    public deposit({ amount }: { amount: number }): number {
        this.balance += amount;
        return this.balance;
    }
}
