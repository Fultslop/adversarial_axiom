// Phase 3: Missing feature tests — these document current "not working" behaviour

// 1.12: @pre on exported arrow function — NOT instrumented
/**
 * @pre x > 0
 */
export const arrowFnWithPre = (x: number): number => x;

// 1.13: @pre on exported function expression — NOT instrumented
/**
 * @pre x > 0
 */
export const funcExprWithPre = function(x: number): number {
    return x;
};

// 1.14: @pre on async function — NOT instrumented
/**
 * @pre x > 0
 */
export async function asyncFnWithPre(x: number): Promise<number> {
    return x;
}

// 1.15: @pre on generator function — NOT instrumented
/**
 * @pre x > 0
 */
export function* generatorFnWithPre(x: number): Generator<number> {
    yield x;
}

// 5.8: Constructor contracts — NOT instrumented
/**
 * @invariant this.value > 0
 */
export class ConstructorContracts {
    public value: number;

    /**
     * @pre value > 0
     * @post this.value > 0
     */
    constructor(value: number) {
        this.value = value;
    }
}

// 4.8/4.9/5.10: Inherited contracts — NOT instrumented
/**
 * @invariant this.baseValue >= 0
 */
export class BaseContract {
    public baseValue: number;

    constructor(value: number) {
        this.baseValue = value;
    }

    /**
     * @pre x > 0
     */
    public baseMethod(x: number): number {
        return x;
    }
}

/**
 * @invariant this.derivedValue >= 0
 */
export class DerivedContract extends BaseContract {
    public derivedValue: number;

    constructor(base: number, derived: number) {
        super(base);
        this.derivedValue = derived;
    }

    /**
     * @pre y > 0
     */
    public derivedMethod(y: number): number {
        return y;
    }

    // Override base method — should NOT inherit base class contract
    /**
     * @pre x > 10
     */
    public override baseMethod(x: number): number {
        return x * 2;
    }
}
